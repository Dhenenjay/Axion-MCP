/**
 * Global singleton store for Earth Engine data
 * Now uses Redis for persistence across server restarts
 * Falls back to in-memory storage when Redis is unavailable
 * 
 * IMPORTANT: Earth Engine objects are server-side references, not actual data.
 * We store metadata and tile URLs in Redis, not the actual EE objects.
 */

import ee from '@google/earthengine';
import * as redisStore from './redis-store';

// Use Node.js global object to ensure true singleton
declare global {
  var eeStore: {
    composites: Record<string, any>;
    metadata: Record<string, any>;
    results: Record<string, any>;
    mapSessions: Record<string, any>;
    // Add a cache for EE object serialization
    eeCache: Record<string, { type: string; serialized: any; }>;
  };
}

// Initialize global store if it doesn't exist
if (!global.eeStore) {
  global.eeStore = {
    composites: {},
    metadata: {},
    results: {},
    mapSessions: {},
    eeCache: {}
  };
  console.log('[GlobalStore] Initialized new global store');
}

// Export references to the global store
export const globalCompositeStore = global.eeStore.composites;
export const globalMetadataStore = global.eeStore.metadata;
export const globalResultsStore = global.eeStore.results;
export const globalMapSessions = global.eeStore.mapSessions;
export const globalEECache = global.eeStore.eeCache;

// Helper functions
export async function addComposite(key: string, image: any, metadata?: any) {
  // IMPORTANT: Earth Engine objects cannot be directly serialized
  // We store them in memory for the current session
  // And store metadata + tile URLs in Redis for persistence
  
  // Always store in memory for current session
  globalCompositeStore[key] = image;
  
  // Prepare metadata for Redis
  const compositeData = {
    ...metadata,
    eeType: image?.constructor?.name || 'unknown',
    hasNormalizedDifference: typeof image?.normalizedDifference === 'function',
    hasSelect: typeof image?.select === 'function',
    hasBandNames: typeof image?.bandNames === 'function',
    created: new Date().toISOString(),
    type: metadata?.type || 'composite'
  };
  
  // Store metadata
  globalMetadataStore[key] = compositeData;
  
  // Also store in Redis for persistence
  try {
    await redisStore.addComposite(key, compositeData);
    console.log(`[GlobalStore] Added composite ${key} to Redis`);
  } catch (error) {
    console.error(`[GlobalStore] Failed to store in Redis:`, error);
  }
  
  console.log(`[GlobalStore] Added composite: ${key}`);
  console.log(`[GlobalStore] Total composites: ${Object.keys(globalCompositeStore).length}`);
  
  // Detailed verification
  if (image) {
    const checks = {
      select: typeof image.select === 'function',
      normalizedDifference: typeof image.normalizedDifference === 'function',
      clip: typeof image.clip === 'function',
      visualize: typeof image.visualize === 'function'
    };
    console.log(`[GlobalStore] EE methods for ${key}:`, checks);
    
    if (!checks.normalizedDifference) {
      console.warn(`[GlobalStore] WARNING: ${key} lacks normalizedDifference method!`);
    }
  }
}

export async function getComposite(key: string) {
  // First check memory store (current session)
  let composite = globalCompositeStore[key];
  
  if (composite) {
    console.log(`[GlobalStore] Retrieved composite ${key} from memory`);
    return composite;
  }
  
  // If not in memory, check Redis for metadata
  try {
    const redisData = await redisStore.getComposite(key);
    if (redisData) {
      console.log(`[GlobalStore] Found composite ${key} metadata in Redis`);
      console.log(`[GlobalStore] Note: EE object needs to be recreated from metadata`);
      // Store the metadata for reference
      globalMetadataStore[key] = redisData;
      // Return null - the calling code needs to recreate the EE object
      return null;
    }
  } catch (error) {
    console.error(`[GlobalStore] Failed to check Redis:`, error);
  }
  
  console.log(`[GlobalStore] Composite ${key} not found in memory or Redis`);
  const keys = await getAllCompositeKeys();
  console.log(`[GlobalStore] Available keys: ${keys.join(', ')}`);
  
  return null;
}

export async function getAllCompositeKeys() {
  // Get keys from both memory and Redis
  const memoryKeys = Object.keys(globalCompositeStore);
  const redisKeys = await redisStore.getAllCompositeKeys();
  
  // Combine and deduplicate
  const allKeys = new Set([...memoryKeys, ...redisKeys]);
  return Array.from(allKeys);
}

export function getMetadata(key: string) {
  return globalMetadataStore[key];
}

export async function addMapSession(id: string, session: any) {
  // Store in memory
  globalMapSessions[id] = session;
  
  // Store in Redis
  try {
    await redisStore.addMapSession(id, session);
    console.log(`[GlobalStore] Added map session ${id} to Redis`);
  } catch (error) {
    console.error(`[GlobalStore] Failed to store map session in Redis:`, error);
  }
  
  console.log(`[GlobalStore] Added map session: ${id}`);
  console.log(`[GlobalStore] Total map sessions: ${Object.keys(globalMapSessions).length}`);
}

export async function getMapSession(id: string) {
  console.log(`[GlobalStore] Fetching map session: ${id}`);
  
  // Check memory first
  if (globalMapSessions[id]) {
    console.log(`[GlobalStore] Found map session ${id} in memory`);
    return globalMapSessions[id];
  }
  
  // Check Redis
  try {
    const session = await redisStore.getMapSession(id);
    if (session) {
      console.log(`[GlobalStore] Found map session ${id} in Redis`);
      // Cache in memory for this session
      globalMapSessions[id] = session;
      return session;
    }
  } catch (error) {
    console.error(`[GlobalStore] Failed to get map session from Redis:`, error);
  }
  
  console.log(`[GlobalStore] Map session ${id} not found`);
  return null;
}

export async function getAllMapSessions() {
  try {
    const sessions = await redisStore.getAllMapSessions();
    return sessions;
  } catch (error) {
    console.error(`[GlobalStore] Failed to get map sessions from Redis:`, error);
    return globalMapSessions;
  }
}

/**
 * Initialize the store (ensures Redis connection)
 */
export async function initStore() {
  try {
    await redisStore.initRedis();
    const stats = await redisStore.getStats();
    console.log('[GlobalStore] Store initialized with Redis');
    console.log('[GlobalStore] Stats:', stats);
    return true;
  } catch (error) {
    console.error('[GlobalStore] Failed to initialize Redis:', error);
    console.log('[GlobalStore] Using in-memory fallback');
    return false;
  }
}

/**
 * Get store statistics
 */
export async function getStoreStats() {
  const stats = await redisStore.getStats();
  return {
    ...stats,
    memoryStoreKeys: Object.keys(globalCompositeStore).length,
    memoryMapSessions: Object.keys(globalMapSessions).length
  };
}

// Initialize on module load
initStore().catch(console.error);
