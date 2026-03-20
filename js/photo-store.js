/* ══════════════════════════════════════════════════════
   Photo Store — IndexedDB-backed photo storage
   Moves photo blobs out of localStorage to avoid the ~5 MB limit.
   ══════════════════════════════════════════════════════ */

import { PieLabStorage } from './storage.js';

const PieLabPhotos = (() => {
  const DB_NAME = 'pielab-photos';
  const DB_VERSION = 1;
  const STORE_NAME = 'photos';

  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return dbPromise;
  }

  /**
   * Save photos for a journal entry.
   * @param {string} entryId
   * @param {string[]} photoDataUrls - array of data-URL strings
   */
  async function savePhotos(entryId, photoDataUrls) {
    if (!photoDataUrls || !photoDataUrls.length) return;
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(photoDataUrls, entryId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Get photos for a journal entry.
   * @param {string} entryId
   * @returns {Promise<string[]>} array of data-URL strings, or []
   */
  async function getPhotos(entryId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(entryId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete photos for a journal entry.
   * @param {string} entryId
   */
  async function deletePhotos(entryId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(entryId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Delete all photos (used by Delete All Data).
   */
  async function deleteAll() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Get all photos keyed by entry ID (used for backup export).
   * @returns {Promise<Object>} { entryId: [dataUrls], ... }
   */
  async function getAllPhotos() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const result = {};
      const cursor = store.openCursor();
      cursor.onsuccess = (e) => {
        const c = e.target.result;
        if (c) {
          result[c.key] = c.value;
          c.continue();
        } else {
          resolve(result);
        }
      };
      cursor.onerror = () => reject(cursor.error);
    });
  }

  /**
   * Import photos from a backup object.
   * @param {Object} photosMap - { entryId: [dataUrls], ... }
   */
  async function importPhotos(photosMap) {
    if (!photosMap || typeof photosMap !== 'object') return;
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const [entryId, dataUrls] of Object.entries(photosMap)) {
        if (Array.isArray(dataUrls) && dataUrls.length) {
          store.put(dataUrls, entryId);
        }
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Get total IndexedDB photo storage size in bytes (approximate).
   */
  async function getStorageSize() {
    const all = await getAllPhotos();
    let bytes = 0;
    for (const dataUrls of Object.values(all)) {
      for (const url of dataUrls) {
        bytes += url.length * 2; // UTF-16
      }
    }
    return bytes;
  }

  /**
   * Migrate photos from localStorage entries into IndexedDB.
   * Strips photo data from localStorage entries after migration.
   */
  async function migrateFromLocalStorage() {
    const MIGRATE_KEY = 'pielab-photos-migrated';
    if (localStorage.getItem(MIGRATE_KEY)) return;

    const raw = PieLabStorage.get('pielab-journal');
    if (!raw) {
      localStorage.setItem(MIGRATE_KEY, '1');
      return;
    }

    let entries;
    try {
      entries = JSON.parse(raw);
    } catch {
      return;
    }
    if (!Array.isArray(entries)) return;

    let migrated = false;
    for (const entry of entries) {
      const photos =
        entry.photos && entry.photos.length ? entry.photos : entry.photo ? [entry.photo] : [];
      if (photos.length && entry.id) {
        await savePhotos(entry.id, photos);
        // Mark how many photos this entry has (for display without loading)
        entry.photoCount = photos.length;
        entry.photos = [];
        entry.photo = null;
        migrated = true;
      }
    }

    if (migrated) {
      try {
        await PieLabStorage.set('pielab-journal', entries);
      } catch {
        // If save fails, photos are still in IndexedDB — safe to continue
      }
    }

    localStorage.setItem(MIGRATE_KEY, '1');
  }

  return {
    savePhotos,
    getPhotos,
    deletePhotos,
    deleteAll,
    getAllPhotos,
    importPhotos,
    getStorageSize,
    migrateFromLocalStorage,
  };
})();

export { PieLabPhotos };
