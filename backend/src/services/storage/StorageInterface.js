class StorageInterface {
  async upload(file, options = {}) {
    throw new Error('Method not implemented: upload');
  }

  async uploadFile(localPath, remotePath, options = {}) {
    throw new Error('Method not implemented: uploadFile');
  }

  async delete(path) {
    throw new Error('Method not implemented: delete');
  }

  async deletePrefix(prefix) {
    throw new Error('Method not implemented: deletePrefix');
  }

  getUrl(path) {
    throw new Error('Method not implemented: getUrl');
  }

  async read(path) {
    throw new Error('Method not implemented: read');
  }

  async readText(path) {
    const content = await this.read(path);
    return content.toString('utf-8');
  }

  async serve(path, res) {
    throw new Error('Method not implemented: serve');
  }

  async exists(path) {
    throw new Error('Method not implemented: exists');
  }
}

export default StorageInterface;
