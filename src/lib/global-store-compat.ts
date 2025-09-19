/**
 * Backward-compatible wrappers for async global store functions
 * These allow existing synchronous code to continue working
 * while we migrate to async Redis-backed storage
 */

import * as asyncStore from './global-store';

// Cache for synchronous access to recently used items
const syncCache = {
  composites: new Map<string, any>(),
  mapSessions: new Map<string, any>()
};

/**
 * Synchronous wrapper for addComposite
 * Stores in cache immediately, then asynchronously saves to Redis
 */
export function addComposite(key: string, image: any, metadata?: any): void {
  // Store in sync cache immediately
  syncCache.composites.set(key, image);
  asyncStore.globalCompositeStore[key] = image;
  
  if (metadata) {
    asyncStore.globalMetadataStore[key] = metadata;
  }
  
  // Asynchronously save to Redis (fire and forget)
  asyncStore.addComposite(key, image, metadata).catch(error => {
    console.error(`[GlobalStoreCompat] Failed to save composite ${key} to Redis:`, error);
  });
  
  console.log(`[GlobalStoreCompat] Added composite ${key} (sync)`);
}

/**
 * Synchronous wrapper for getComposite
 * Returns from cache if available, otherwise returns null
 */
export function getComposite(key: string): any {
  // Check sync cache first
  if (syncCache.composites.has(key)) {
    return syncCache.composites.get(key);
  }
  
  // Check in-memory store
  if (asyncStore.globalCompositeStore[key]) {
    syncCache.composites.set(key, asyncStore.globalCompositeStore[key]);
    return asyncStore.globalCompositeStore[key];
  }
  
  // If not found, trigger async load for next time
  asyncStore.getComposite(key).then(composite => {
    if (composite) {
      syncCache.composites.set(key, composite);
      asyncStore.globalCompositeStore[key] = composite;
      console.log(`[GlobalStoreCompat] Loaded composite ${key} from Redis for future use`);
    }
  }).catch(error => {
    console.error(`[GlobalStoreCompat] Failed to load composite ${key} from Redis:`, error);
  });
  
  return null;
}

/**
 * Synchronous wrapper for getAllCompositeKeys
 * Returns keys from in-memory store only
 */
export function getAllCompositeKeys(): string[] {
  const memoryKeys = Object.keys(asyncStore.globalCompositeStore);
  
  // Trigger async update for more complete list
  asyncStore.getAllCompositeKeys().then(keys => {
    console.log(`[GlobalStoreCompat] Total keys available: ${keys.length}`);
  }).catch(error => {
    console.error('[GlobalStoreCompat] Failed to get all keys from Redis:', error);
  });
  
  return memoryKeys;
}

/**
 * Synchronous wrapper for addMapSession
 */
export function addMapSession(id: string, session: any): void {
  // Store in sync cache and memory immediately
  syncCache.mapSessions.set(id, session);
  asyncStore.globalMapSessions[id] = session;
  
  // Asynchronously save to Redis
  asyncStore.addMapSession(id, session).catch(error => {
    console.error(`[GlobalStoreCompat] Failed to save map session ${id} to Redis:`, error);
  });
  
  console.log(`[GlobalStoreCompat] Added map session ${id} (sync)`);
}

/**
 * Synchronous wrapper for getMapSession
 */
export function getMapSession(id: string): any {
  // Check sync cache first
  if (syncCache.mapSessions.has(id)) {
    return syncCache.mapSessions.get(id);
  }
  
  // Check in-memory store
  if (asyncStore.globalMapSessions[id]) {
    syncCache.mapSessions.set(id, asyncStore.globalMapSessions[id]);
    return asyncStore.globalMapSessions[id];
  }
  
  // Trigger async load for next time
  asyncStore.getMapSession(id).then(session => {
    if (session) {
      syncCache.mapSessions.set(id, session);
      asyncStore.globalMapSessions[id] = session;
      console.log(`[GlobalStoreCompat] Loaded map session ${id} from Redis for future use`);
    }
  }).catch(error => {
    console.error(`[GlobalStoreCompat] Failed to load map session ${id} from Redis:`, error);
  });
  
  return null;
}

/**
 * Get metadata (synchronous, from memory only)
 */
export function getMetadata(key: string): any {
  return asyncStore.globalMetadataStore[key];
}

/**
 * Export the in-memory stores for direct access
 */
export const globalCompositeStore = asyncStore.globalCompositeStore;
export const globalMetadataStore = asyncStore.globalMetadataStore;
export const globalMapSessions = asyncStore.globalMapSessions;

// Initialize the async store on module load
asyncStore.initStore().then(() => {
  console.log('[GlobalStoreCompat] Async store initialized');
}).catch(error => {
  console.error('[GlobalStoreCompat] Failed to initialize async store:', error);
});

export default {
  addComposite,
  getComposite,
  getAllCompositeKeys,
  addMapSession,
  getMapSession,
  getMetadata,
  globalCompositeStore,
  globalMetadataStore,
  globalMapSessions
};