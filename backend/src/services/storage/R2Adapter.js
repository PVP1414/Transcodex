import fs from "fs/promises";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import StorageInterface from "./StorageInterface.js";

class R2Adapter extends StorageInterface {
  constructor(options = {}) {
    super();

    const endpoint = options.endpoint || process.env.R2_ENDPOINT;
    const region = options.region || process.env.R2_REGION || "auto";
    const accessKeyId = options.accessKeyId || process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey =
      options.secretAccessKey || process.env.R2_SECRET_ACCESS_KEY;
    const bucket = options.bucket || process.env.R2_BUCKET;
    const publicUrl = options.publicUrl || process.env.R2_PUBLIC_URL;

    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "R2 adapter requires R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET",
      );
    }

    this.bucket = bucket;
    this.publicUrl = publicUrl;
    this.endpoint = endpoint;

    this.client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: false,
    });
  }

  normalizeKey(relativePath) {
    return String(relativePath || "")
      .replace(/\\/g, "/")
      .replace(/^\/+/, "");
  }

  async upload(file, options = {}) {
    const folder = options.folder || "misc";
    const filename =
      options.filename ||
      `${Date.now()}-${String(file.originalname || "file").replace(/\s+/g, "-")}`;
    const key = [folder, filename].filter(Boolean).join("/");

    const fileBuffer = await fs.readFile(file.path);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: file.mimetype || "application/octet-stream",
      }),
    );

    try {
      if (!options.keepLocal) {
        await fs.unlink(file.path);
      }
    } catch {
      // Ignore cleanup errors for temp uploads.
    }

    return {
      path: key,
      url: this.getUrl(key),
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  async uploadFile(localPath, remotePath, options = {}) {
    const key = this.normalizeKey(remotePath);
    const fileBuffer = await fs.readFile(localPath);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: options.mimetype || "application/octet-stream",
      }),
    );

    const stats = await fs.stat(localPath);
    return {
      path: key,
      url: this.getUrl(key),
      size: stats.size,
      mimetype: options.mimetype,
    };
  }

  async delete(relativePath) {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: this.normalizeKey(relativePath),
        }),
      );
      return true;
    } catch (error) {
      if (error?.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  async deletePrefix(prefix) {
    const normalizedPrefix = this.normalizeKey(prefix).replace(/\/?$/, "/");
    let continuationToken;

    do {
      const list = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: normalizedPrefix,
          ContinuationToken: continuationToken,
        }),
      );

      for (const item of list.Contents || []) {
        if (item.Key) {
          await this.delete(item.Key);
        }
      }

      continuationToken = list.NextContinuationToken;
    } while (continuationToken);

    return true;
  }

  getUrl(relativePath) {
    const key = this.normalizeKey(relativePath);
    if (!key) return "";

    if (this.publicUrl) {
      return `${this.publicUrl.replace(/\/$/, "")}/${key}`;
    }

    return `${this.endpoint.replace(/\/$/, "")}/${this.bucket}/${key}`;
  }

  async serve(relativePath, res) {
    const key = this.normalizeKey(relativePath);
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    if (response.ContentType) {
      res.setHeader("Content-Type", response.ContentType);
    }

    if (response.ContentLength) {
      res.setHeader("Content-Length", response.ContentLength);
    }

    if (response.ETag) {
      res.setHeader("ETag", response.ETag);
    }

    const body = response.Body;
    if (body && typeof body.pipe === "function") {
      body.pipe(res);
      return;
    }

    const chunks = [];
    for await (const chunk of body || []) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    res.end(Buffer.concat(chunks));
  }

  async read(relativePath) {
    const key = this.normalizeKey(relativePath);
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    const chunks = [];
    for await (const chunk of response.Body || []) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  async exists(relativePath) {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: this.normalizeKey(relativePath),
        }),
      );
      return true;
    } catch (error) {
      if (error?.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }
}

export default R2Adapter;
