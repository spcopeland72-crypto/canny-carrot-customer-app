/**
 * Sync Manager - Customer App
 * 
 * Handles syncing customer rewards and pulling business rewards/campaigns
 */

import { redis, isOnline, isRedisAvailable } from './redis';
import { storage, syncQueue, syncStatus, getDeviceId } from './localStorage';
import type { SyncOperation, SyncStatus, ConflictResolution, SyncMetadata } from '../types/sync';

const SYNC_INTERVAL = 30000;
const MAX_RETRIES = 3;

let syncInterval: NodeJS.Timeout | null = null;
let isSyncing = false;

export const addSyncMetadata = async <T extends { id: string }>(
  entity: T,
  isDirty: boolean = false
): Promise<T & { _sync: SyncMetadata }> => {
  const now = new Date().toISOString();
  const deviceId = await getDeviceId();
  return {
    ...entity,
    _sync: {
      version: (entity as any)._sync?.version || 0,
      lastModified: now,
      deviceId,
      isDirty,
      createdAt: (entity as any)._sync?.createdAt || now,
    },
  };
};

export const markDirty = <T extends { _sync: SyncMetadata }>(entity: T): T => {
  return {
    ...entity,
    _sync: {
      ...entity._sync,
      version: entity._sync.version + 1,
      lastModified: new Date().toISOString(),
      isDirty: true,
    },
  };
};

export const markSynced = <T extends { _sync: SyncMetadata }>(entity: T): T => {
  return {
    ...entity,
    _sync: {
      ...entity._sync,
      isDirty: false,
    },
  };
};

const resolveConflict = (
  local: any,
  redis: any
): ConflictResolution => {
  const localVersion = local._sync?.version || 0;
  const redisVersion = redis._sync?.version || 0;
  const localTime = new Date(local._sync?.lastModified || 0).getTime();
  const redisTime = new Date(redis._sync?.lastModified || 0).getTime();

  if (localVersion === redisVersion) {
    if (localTime >= redisTime) {
      return { resolved: true, localWins: true, redisWins: false, merged: false };
    } else {
      return { resolved: true, localWins: false, redisWins: true, merged: false };
    }
  }

  if (localVersion > redisVersion) {
    return { resolved: true, localWins: true, redisWins: false, merged: false };
  } else {
    return { resolved: true, localWins: false, redisWins: true, merged: false };
  }
};

const syncEntityToRedis = async (
  operation: SyncOperation
): Promise<boolean> => {
  try {
    const { entityType, entityId, type, data } = operation;

    if (type === 'delete') {
      if (entityType == null || entityId == null) {
        console.warn('[SyncManager] Skipping delete op with missing entityType/entityId');
        return true; // treat as no-op so we remove from queue
      }
      const key = `${entityType}:${entityId}`;
      await redis.del(key);
      return true;
    }

    if (data == null || entityType == null || entityId == null) {
      console.warn('[SyncManager] Skipping update op with missing entityType, entityId, or data');
      return true;
    }

    const entity = await addSyncMetadata(data, false);
    const key = `${entityType}:${entityId}`;
    const value = JSON.stringify(entity);
    
    await redis.set(key, value);

    // For customer rewards, add to customer's reward set AND update business's customer scan record
    if (entityType === 'customerReward' && data.customerId) {
      // Add to customer's reward set
      await redis.sadd(`customer:${data.customerId}:rewards`, entityId);
      
      // Also update the business's customer scan record
      // Extract businessId from rewardId if it contains business info, or use a default
      // The business needs to know which customers scanned their rewards
      const businessId = data.businessId || 'default';
      
      // Update business's customer scan tracking
      const businessScanKey = `business:${businessId}:customerScans:${data.customerId}:${entityId}`;
      await redis.set(businessScanKey, JSON.stringify({
        customerId: data.customerId,
        rewardId: entityId,
        rewardName: data.name,
        pointsEarned: data.pointsEarned || data.count || 0,
        pointsRequired: data.requirement || data.total || 0,
        rewardEarned: (data.pointsEarned || data.count || 0) >= (data.requirement || data.total || 0),
        rewardRedeemed: false,
        lastScanAt: data.lastScannedAt || new Date().toISOString(),
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      
      // Add customer to business's customer set
      await redis.sadd(`business:${businessId}:customers`, data.customerId);
      
      console.log(`[SyncManager] Updated business ${businessId} customer scan record for customer ${data.customerId}`);
    }

    return true;
  } catch (error) {
    console.error(`Failed to sync ${operation.entityType}:${operation.entityId} to Redis:`, error);
    return false;
  }
};

const syncEntityFromRedis = async (
  entityType: string,
  entityId: string
): Promise<boolean> => {
  try {
    const key = `${entityType}:${entityId}`;
    const redisValue = await redis.get(key);
    
    if (!redisValue) {
      return false;
    }

    const redisEntity = JSON.parse(redisValue);
    const localKey = `${entityType}:${entityId}`;
    const localEntity = await storage.get(localKey);

    if (!localEntity) {
      await storage.set(localKey, redisEntity);
      return true;
    }

    const resolution = resolveConflict(localEntity, redisEntity);
    
    if (resolution.redisWins) {
      await storage.set(localKey, redisEntity);
    } else if (resolution.localWins && localEntity._sync?.isDirty) {
      await syncEntityToRedis({
        id: `${entityType}:${entityId}:${Date.now()}`,
        type: 'update',
        entityType,
        entityId,
        data: localEntity,
        timestamp: Date.now(),
      });
    }

    return true;
  } catch (error) {
    console.error(`Failed to sync ${entityType}:${entityId} from Redis:`, error);
    return false;
  }
};

const processSyncQueue = async (): Promise<number> => {
  const queue = await syncQueue.getAll();
  if (queue.length === 0) return 0;

  let synced = 0;
  const failed: SyncOperation[] = [];

  for (const operation of queue) {
    const { entityType, entityId, type, data } = operation;
    const valid = type === 'delete'
      ? entityType != null && entityId != null
      : entityType != null && entityId != null && data != null;
    if (!valid) {
      await syncQueue.remove(operation.id);
      continue;
    }
    const success = await syncEntityToRedis(operation);
    
    if (success) {
      await syncQueue.remove(operation.id);
      synced++;
    } else {
      operation.retries = (operation.retries || 0) + 1;
      
      if (operation.retries < MAX_RETRIES) {
        failed.push(operation);
      } else {
        console.error(`Max retries reached for ${operation.entityType}:${operation.entityId}`);
        await syncQueue.remove(operation.id);
      }
    }
  }

  for (const operation of failed) {
    await syncQueue.add(operation);
  }

  return synced;
};

// Pull business rewards and campaigns (read-only for customers)
const pullBusinessData = async (businessIds: string[]): Promise<number> => {
  let pulled = 0;

  try {
    for (const businessId of businessIds) {
      // Pull rewards
      const rewardIds = await redis.smembers(`business:${businessId}:rewards`);
      for (const rewardId of rewardIds) {
        await syncEntityFromRedis('reward', rewardId);
        pulled++;
      }

      // Pull campaigns
      const campaignIds = await redis.smembers(`business:${businessId}:campaigns`);
      for (const campaignId of campaignIds) {
        await syncEntityFromRedis('campaign', campaignId);
        pulled++;
      }
    }
  } catch (error) {
    console.error('Failed to pull business data from Redis:', error);
  }

  return pulled;
};

export const performSync = async (customerId?: string, businessIds?: string[]): Promise<{
  pushed: number;
  pulled: number;
  errors: string[];
}> => {
  if (isSyncing) {
    return { pushed: 0, pulled: 0, errors: ['Sync already in progress'] };
  }

  const redisAvailable = await isRedisAvailable();
  if (!isOnline() || !redisAvailable) {
    await syncStatus.update({ isOnline: false });
    return { pushed: 0, pulled: 0, errors: ['Offline or Redis unavailable'] };
  }

  isSyncing = true;
  await syncStatus.update({ isOnline: true });

  const errors: string[] = [];
  let pushed = 0;
  let pulled = 0;

  try {
    pushed = await processSyncQueue();

    // Pull customer rewards if customerId provided
    if (customerId) {
      const rewardIds = await redis.smembers(`customer:${customerId}:rewards`);
      for (const rewardId of rewardIds) {
        await syncEntityFromRedis('customerReward', rewardId);
        pulled++;
      }
    }

    // Pull business data if businessIds provided
    if (businessIds && businessIds.length > 0) {
      const businessPulled = await pullBusinessData(businessIds);
      pulled += businessPulled;
    }

    await syncStatus.update({ lastSyncTime: Date.now() });
  } catch (error: any) {
    errors.push(error.message || 'Unknown sync error');
    console.error('Sync error:', error);
  } finally {
    isSyncing = false;
  }

  return { pushed, pulled, errors };
};

export const startAutoSync = (customerId?: string, businessIds?: string[]): void => {
  if (syncInterval) {
    clearInterval(syncInterval);
  }

  performSync(customerId, businessIds);

  syncInterval = setInterval(() => {
    performSync(customerId, businessIds);
  }, SYNC_INTERVAL);
};

export const stopAutoSync = (): void => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
};

export const getSyncStatus = async (): Promise<SyncStatus> => {
  const status = await syncStatus.get();
  return {
    ...status,
    isSyncing,
    lastError: null,
  };
};

export const queueOperation = async (
  type: 'create' | 'update' | 'delete',
  entityType: string,
  entityId: string,
  data?: any
): Promise<void> => {
  if (entityType == null || entityId == null) {
    console.warn('[SyncManager] queueOperation skipped: missing entityType or entityId');
    return;
  }
  if (type !== 'delete' && data == null) {
    console.warn('[SyncManager] queueOperation skipped: update/create requires data');
    return;
  }
  await syncQueue.add({
    type,
    entityType,
    entityId,
    data,
    timestamp: Date.now(),
  });

  // Try immediate sync if online (fire and forget)
  if (isOnline()) {
    isRedisAvailable().then(redisAvailable => {
      if (redisAvailable) {
        performSync();
      }
    }).catch(() => {
      // Ignore errors, sync will retry later
    });
  }
};

