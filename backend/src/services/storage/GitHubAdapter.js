import fs from "fs/promises";
import StorageInterface from "./StorageInterface.js";

const API_VERSION = "2022-11-28";

function encodeRepoPath(repoPath) {
  return repoPath
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function normalizePath(value) {
  return String(value || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

class GitHubAdapter extends StorageInterface {
  constructor(options = {}) {
    super();

    this.token = options.token || process.env.GITHUB_TOKEN;
    this.owner = options.owner || process.env.GITHUB_OWNER;
    this.repo = options.repo || process.env.GITHUB_REPO;
    this.branch = options.branch || process.env.GITHUB_BRANCH || "main";
    this.basePath = normalizePath(options.basePath || process.env.GITHUB_BASE_PATH || "uploads");
    this.committerName =
      options.committerName || process.env.GITHUB_COMMITTER_NAME || "Media Storage Bot";
    this.committerEmail =
      options.committerEmail || process.env.GITHUB_COMMITTER_EMAIL || "media-storage@example.com";

    if (!this.token || !this.owner || !this.repo) {
      throw new Error(
        "GitHub adapter requires GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO",
      );
    }
  }

  repoPath(relativePath) {
    const cleanPath = normalizePath(relativePath);
    return [this.basePath, cleanPath].filter(Boolean).join("/");
  }

  contentUrl(repoPath) {
    return `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${encodeRepoPath(repoPath)}`;
  }

  async request(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": API_VERSION,
        "User-Agent": "awt-media-management-system",
        ...(options.headers || {}),
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const message = await response.text().catch(() => response.statusText);
      throw new Error(`GitHub storage request failed (${response.status}): ${message}`);
    }

    return response;
  }

  async getMetadata(relativePathOrRepoPath, isRepoPath = false) {
    const repoPath = isRepoPath
      ? normalizePath(relativePathOrRepoPath)
      : this.repoPath(relativePathOrRepoPath);
    const response = await this.request(
      `${this.contentUrl(repoPath)}?ref=${encodeURIComponent(this.branch)}`,
    );
    if (!response) return null;
    return response.json();
  }

  async upload(file, options = {}) {
    const folder = options.folder || "misc";
    const filename =
      options.filename ||
      `${Date.now()}-${String(file.originalname || "file").replace(/\s+/g, "-")}`;
    const relativePath = [folder, filename].filter(Boolean).join("/");

    const result = await this.uploadFile(file.path, relativePath, {
      mimetype: file.mimetype,
      message: `Upload ${relativePath}`,
    });

    if (!options.keepLocal) {
      await fs.unlink(file.path).catch(() => {});
    }

    return {
      ...result,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  async uploadFile(localPath, remotePath, options = {}) {
    const normalizedPath = normalizePath(remotePath);
    const repoPath = this.repoPath(normalizedPath);
    const fileBuffer = await fs.readFile(localPath);
    const existing = await this.getMetadata(repoPath, true);

    const body = {
      message: options.message || `Upload ${normalizedPath}`,
      content: fileBuffer.toString("base64"),
      branch: this.branch,
      committer: {
        name: this.committerName,
        email: this.committerEmail,
      },
    };

    if (existing?.sha) {
      body.sha = existing.sha;
    }

    await this.request(this.contentUrl(repoPath), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const stats = await fs.stat(localPath);
    return {
      path: normalizedPath,
      url: this.getUrl(normalizedPath),
      size: stats.size,
      mimetype: options.mimetype,
    };
  }

  async delete(relativePath) {
    const normalizedPath = normalizePath(relativePath);
    const repoPath = this.repoPath(normalizedPath);
    const existing = await this.getMetadata(repoPath, true);

    if (!existing?.sha) {
      return false;
    }

    await this.request(this.contentUrl(repoPath), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Delete ${normalizedPath}`,
        sha: existing.sha,
        branch: this.branch,
        committer: {
          name: this.committerName,
          email: this.committerEmail,
        },
      }),
    });

    return true;
  }

  async listFiles(repoPath) {
    const metadata = await this.getMetadata(repoPath, true);
    if (!metadata) return [];
    if (!Array.isArray(metadata)) return metadata.type === "file" ? [metadata.path] : [];

    const files = [];
    for (const item of metadata) {
      if (item.type === "file") {
        files.push(item.path);
      } else if (item.type === "dir") {
        files.push(...(await this.listFiles(item.path)));
      }
    }
    return files;
  }

  async deletePrefix(prefix) {
    const normalizedPrefix = normalizePath(prefix);
    const repoPrefix = this.repoPath(normalizedPrefix);
    const files = await this.listFiles(repoPrefix);

    for (const filePath of files) {
      const relativePath = this.basePath && filePath.startsWith(`${this.basePath}/`)
        ? filePath.slice(this.basePath.length + 1)
        : filePath;
      await this.delete(relativePath);
    }

    return true;
  }

  getUrl(relativePath) {
    const repoPath = this.repoPath(relativePath);
    return `https://github.com/${this.owner}/${this.repo}/blob/${this.branch}/${repoPath}`;
  }

  async read(relativePath) {
    const repoPath = this.repoPath(relativePath);
    const response = await this.request(
      `${this.contentUrl(repoPath)}?ref=${encodeURIComponent(this.branch)}`,
      { headers: { Accept: "application/vnd.github.raw+json" } },
    );

    if (!response) {
      const error = new Error(`GitHub storage file not found: ${relativePath}`);
      error.code = "ENOENT";
      throw error;
    }

    return Buffer.from(await response.arrayBuffer());
  }

  async serve(relativePath, res) {
    const content = await this.read(relativePath);
    res.setHeader("Content-Length", content.length);
    res.end(content);
  }

  async exists(relativePath) {
    return Boolean(await this.getMetadata(relativePath));
  }
}

export default GitHubAdapter;
