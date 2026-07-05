import LocalAdapter from "./LocalAdapter.js";
import R2Adapter from "./R2Adapter.js";
import GitHubAdapter from "./GitHubAdapter.js";

const STORAGE_TYPE = process.env.STORAGE_TYPE || "local";

let storageAdapter = null;

const adapters = {
  local: LocalAdapter,
  s3: R2Adapter,
  r2: R2Adapter,
  github: GitHubAdapter,
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
