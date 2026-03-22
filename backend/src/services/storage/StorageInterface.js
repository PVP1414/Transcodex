class StorageInterface {
  async upload(file, options = {}) {
    throw new Error('Method not implemented: upload');
  }

  async delete(path) {
    throw new Error('Method not implemented: delete');
  }

  getUrl(path) {
    throw new Error('Method not implemented: getUrl');
  }

  async serve(path, res) {
    throw new Error('Method not implemented: serve');
  }

  async exists(path) {
    throw new Error('Method not implemented: exists');
  }
}

export default StorageInterface;
