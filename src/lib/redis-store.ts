/**
 * Redis-backed persistent store for Earth Engine MCP
 * Replaces in-memory storage with Redis for persistence across server restarts
 */

import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Types
export interface CompositeData {
  tileUrl?: string;
  metadata?: any;
  datasetId?: string;
  region?: string;
  dateRange?: { start: string; end: string };
  bands?: string[];
  visParams?: any;
  created: string;
  type: 'composite' | 'classification' | 'model' | 'analysis';
}

export interface MapSessionData {
  id: string;
  input: string;
  tileUrl: string;
  created: string;
  region: string;
  layers: Array<{
    name: string;
    tileUrl: string;
    visParams: any;
  }>;
  metadata: any;
}

// Redis client singleton
let redisClient: RedisClientType | null = null;
let isConnected = false;

// Fallback in-memory store (used when Redis is unavailable)
const memoryStore = {
  composites: new Map<string, CompositeData>(),
  mapSessions: new Map<string, MapSessionData>()
};

/**
 * Initialize Redis connection
 */
export async function initRedis(): Promise<void> {
  if (redisClient && isConnected) {
    return; // Already connected
  }

  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.warn('[RedisStore] No REDIS_URL found, using in-memory fallback');
    return;
  }

  try {
    console.log('[RedisStore] Connecting to Redis...');
    
    redisClient = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 10000,
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.error('[RedisStore] Max reconnection attempts reached');
            return false;
          }
          return Math.min(retries * 500, 3000);
        }
      }
    });

    // Error handling
    redisClient.on('error', (err) => {
      console.error('[RedisStore] Redis error:', err.message);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('[RedisStore] Connected to Redis');
      isConnected = true;
    });

    redisClient.on('ready', () => {
      console.log('[RedisStore] Redis client ready');
      isConnected = true;
    });

    redisClient.on('reconnecting', () => {
      console.log('[RedisStore] Reconnecting to Redis...');
    });

    await redisClient.connect();
    
    // Test the connection
    await redisClient.ping();
    console.log('[RedisStore] Redis connection successful');
    
  } catch (error: any) {
    console.error('[RedisStore] Failed to connect to Redis:', error.message);
    console.log('[RedisStore] Falling back to in-memory store');
    redisClient = null;
    isConnected = false;
  }
}

/**
 * Get TTL from environment or use default (24 hours)
 */
function getTTL(): number {
  return parseInt(process.env.REDIS_TTL || '86400', 10);
}

/**
 * Store composite data
 */
export async function addComposite(key: string, data: any): Promise<void> {
  const compositeData: CompositeData = {
    ...data,
    created: new Date().toISOString(),
    type: data.type || 'composite'
  };

  // Always store in memory as fallback
  memoryStore.composites.set(key, compositeData);

  if (redisClient && isConnected) {
    try {
      const ttl = getTTL();
      await redisClient.setEx(
        `composite:${key}`,
        ttl,
        JSON.stringify(compositeData)
      );
      console.log(`[RedisStore] Stored composite ${key} with TTL ${ttl}s`);
    } catch (error: any) {
      console.error(`[RedisStore] Failed to store composite ${key}:`, error.message);
    }
  }
}

/**
 * Get composite data
 */
export async function getComposite(key: string): Promise<CompositeData | null> {
  // Try Redis first
  if (redisClient && isConnected) {
    try {
      const data = await redisClient.get(`composite:${key}`);
      if (data) {
        console.log(`[RedisStore] Retrieved composite ${key} from Redis`);
        return JSON.parse(data);
      }
    } catch (error: any) {
      console.error(`[RedisStore] Failed to get composite ${key}:`, error.message);
    }
  }

  // Fallback to memory store
  const memData = memoryStore.composites.get(key);
  if (memData) {
    console.log(`[RedisStore] Retrieved composite ${key} from memory`);
    return memData;
  }

  return null;
}

/**
 * Get all composite keys
 */
export async function getAllCompositeKeys(): Promise<string[]> {
  const keys = new Set<string>();

  // Get keys from Redis
  if (redisClient && isConnected) {
    try {
      const redisKeys = await redisClient.keys('composite:*');
      redisKeys.forEach(k => keys.add(k.replace('composite:', '')));
    } catch (error: any) {
      console.error('[RedisStore] Failed to get composite keys:', error.message);
    }
  }

  // Add keys from memory store
  memoryStore.composites.forEach((_, key) => keys.add(key));

  return Array.from(keys);
}

/**
 * Add map session
 */
export async function addMapSession(id: string, session: MapSessionData): Promise<void> {
  // Always store in memory
  memoryStore.mapSessions.set(id, session);

  if (redisClient && isConnected) {
    try {
      const ttl = getTTL();
      await redisClient.setEx(
        `map:${id}`,
        ttl,
        JSON.stringify(session)
      );
      console.log(`[RedisStore] Stored map session ${id} with TTL ${ttl}s`);
    } catch (error: any) {
      console.error(`[RedisStore] Failed to store map session ${id}:`, error.message);
    }
  }
}

/**
 * Get map session
 */
export async function getMapSession(id: string): Promise<MapSessionData | null> {
  // Try Redis first
  if (redisClient && isConnected) {
    try {
      const data = await redisClient.get(`map:${id}`);
      if (data) {
        console.log(`[RedisStore] Retrieved map session ${id} from Redis`);
        return JSON.parse(data);
      }
    } catch (error: any) {
      console.error(`[RedisStore] Failed to get map session ${id}:`, error.message);
    }
  }

  // Fallback to memory store
  const memData = memoryStore.mapSessions.get(id);
  if (memData) {
    console.log(`[RedisStore] Retrieved map session ${id} from memory`);
    return memData;
  }

  return null;
}

/**
 * Get all map sessions
 */
export async function getAllMapSessions(): Promise<MapSessionData[]> {
  const sessions: MapSessionData[] = [];

  // Get from Redis
  if (redisClient && isConnected) {
    try {
      const keys = await redisClient.keys('map:*');
      for (const key of keys) {
        const data = await redisClient.get(key);
        if (data) {
          sessions.push(JSON.parse(data));
        }
      }
    } catch (error: any) {
      console.error('[RedisStore] Failed to get map sessions:', error.message);
    }
  }

  // Add from memory store (avoiding duplicates)
  const redisIds = new Set(sessions.map(s => s.id));
  memoryStore.mapSessions.forEach((session) => {
    if (!redisIds.has(session.id)) {
      sessions.push(session);
    }
  });

  return sessions;
}

/**
 * Clean up old entries (manual cleanup)
 */
export async function cleanup(): Promise<void> {
  if (!redisClient || !isConnected) {
    // Clean memory store (remove entries older than TTL)
    const ttl = getTTL() * 1000; // Convert to milliseconds
    const now = Date.now();
    
    memoryStore.composites.forEach((data, key) => {
      const created = new Date(data.created).getTime();
      if (now - created > ttl) {
        memoryStore.composites.delete(key);
        console.log(`[RedisStore] Cleaned up expired composite ${key} from memory`);
      }
    });

    memoryStore.mapSessions.forEach((data, key) => {
      const created = new Date(data.created).getTime();
      if (now - created > ttl) {
        memoryStore.mapSessions.delete(key);
        console.log(`[RedisStore] Cleaned up expired map session ${key} from memory`);
      }
    });
  }
  // Redis handles TTL automatically
}

/**
 * Get store statistics
 */
export async function getStats(): Promise<{
  isRedisConnected: boolean;
  compositeCount: number;
  mapSessionCount: number;
  memoryCompositeCount: number;
  memoryMapSessionCount: number;
}> {
  let compositeCount = 0;
  let mapSessionCount = 0;

  if (redisClient && isConnected) {
    try {
      const compositeKeys = await redisClient.keys('composite:*');
      const mapKeys = await redisClient.keys('map:*');
      compositeCount = compositeKeys.length;
      mapSessionCount = mapKeys.length;
    } catch (error) {
      console.error('[RedisStore] Failed to get stats:', error);
    }
  }

  return {
    isRedisConnected: isConnected,
    compositeCount,
    mapSessionCount,
    memoryCompositeCount: memoryStore.composites.size,
    memoryMapSessionCount: memoryStore.mapSessions.size
  };
}

/**
 * Close Redis connection (for cleanup)
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isConnected = false;
    console.log('[RedisStore] Redis connection closed');
  }
}

// Initialize Redis on module load
initRedis().catch(console.error);

// Export for compatibility with existing code
export default {
  addComposite,
  getComposite,
  getAllCompositeKeys,
  addMapSession,
  getMapSession,
  getAllMapSessions,
  cleanup,
  getStats,
  initRedis,
  closeRedis
};