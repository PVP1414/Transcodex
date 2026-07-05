import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import StorageInterface from './StorageInterface.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LocalAdapter extends StorageInterface {
  constructor(basePath = 'uploads') {
    super();
    this.basePath = path.resolve(__dirname, '../../../', basePath);
  }

  async ensureDir(dirPath) {
    const fullPath = path.join(this.basePath, dirPath);
    await fs.mkdir(fullPath, { recursive: true });
    return fullPath;
  }

  async upload(file, options = {}) {
    const { folder = 'misc', filename, keepLocal = false } = options;
    const dirPath = await this.ensureDir(folder);
    const destFilename = filename || `${Date.now()}-${file.originalname}`;
    const destPath = path.join(dirPath, destFilename);

    await fs.copyFile(file.path, destPath);
    if (!keepLocal) {
      await fs.unlink(file.path);
    }

    const relativePath = path.join(folder, destFilename).replace(/\\/g, '/');
    return {
      path: relativePath,
      url: relativePath,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  async uploadFile(localPath, remotePath, options = {}) {
    const normalizedPath = remotePath.replace(/\\/g, '/').replace(/^\/+/, '');
    const destPath = path.join(this.basePath, normalizedPath);
    await fs.mkdir(path.dirname(destPath), { recursive: true });

    if (path.resolve(localPath) !== path.resolve(destPath)) {
      await fs.copyFile(localPath, destPath);
    }

    const stats = await fs.stat(destPath);
    return {
      path: normalizedPath,
      url: this.getUrl(normalizedPath),
      size: stats.size,
      mimetype: options.mimetype,
    };
  }

  async delete(relativePath) {
    const fullPath = path.join(this.basePath, relativePath);
    try {
      await fs.unlink(fullPath);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') return false;
      throw error;
    }
  }

  async deletePrefix(prefix) {
    const fullPath = path.join(this.basePath, prefix);
    await fs.rm(fullPath, { recursive: true, force: true });
    return true;
  }

  getUrl(relativePath) {
    return `/uploads/${relativePath.replace(/\\/g, '/')}`;
  }

  async read(relativePath) {
    const fullPath = path.join(this.basePath, relativePath);
    return fs.readFile(fullPath);
  }

  async serve(relativePath, res) {
    const fullPath = path.join(this.basePath, relativePath);
    res.sendFile(fullPath, { root: path.parse(fullPath).root });
  }

  async exists(relativePath) {
    const fullPath = path.join(this.basePath, relativePath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}

export default LocalAdapter;
