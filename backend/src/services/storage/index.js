import LocalAdapter from './LocalAdapter.js';

const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local';

let storageAdapter = null;

const adapters = {
  local: LocalAdapter,
};

export function getStorageAdapter() {
  if (!storageAdapter) {
    const AdapterClass = adapters[STORAGE_TYPE];
    if (!AdapterClass) {
      throw new Error(`Unknown storage type: ${STORAGE_TYPE}`);
    }
    storageAdapter = new AdapterClass();
  }
  return storageAdapter;
}

export function setStorageAdapter(adapter) {
  storageAdapter = adapter;
}

export default { getStorageAdapter, setStorageAdapter };
