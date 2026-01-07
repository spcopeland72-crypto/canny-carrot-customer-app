/**
 * Data Access Layer - Customer App
 * 
 * Provides unified API for reading/writing customer rewards
 * Pulls business rewards and campaigns (read-only)
 */

import { storage } from './localStorage';
import { queueOperation, addSyncMetadata, markDirty } from './syncManager';
import type { CustomerReward } from '../utils/dataStorage';
import type { SyncableEntity } from '../types/sync';

const KEYS = {
  CUSTOMER_REWARD: 'customerReward:',
  REWARD: 'reward:',
  CAMPAIGN: 'campaign:',
};

/**
 * Customer Reward Operations
 */
export const customerRewardData = {
  /**
   * Get all customer rewards
   */
  getAll: async (customerId?: string): Promise<(CustomerReward & SyncableEntity)[]> => {
    const allRewards = await storage.getAll<CustomerReward & SyncableEntity>(KEYS.CUSTOMER_REWARD);
    // Filter by customerId if provided
    if (customerId) {
      return allRewards.filter((r: any) => r.customerId === customerId);
    }
    return allRewards;
  },

  /**
   * Get single customer reward
   */
  get: async (rewardId: string): Promise<(CustomerReward & SyncableEntity) | null> => {
    return await storage.get<CustomerReward & SyncableEntity>(`${KEYS.CUSTOMER_REWARD}${rewardId}`);
  },

  /**
   * Create or update customer reward (offline-first)
   */
  save: async (reward: CustomerReward, customerId: string): Promise<void> => {
    const existing = await customerRewardData.get(reward.id);
    const entity = existing
      ? markDirty({ ...existing, ...reward, customerId })
      : await addSyncMetadata({ ...reward, customerId }, true);

    await storage.set(`${KEYS.CUSTOMER_REWARD}${reward.id}`, entity);
    await queueOperation('update', 'customerReward', reward.id, entity);
  },

  /**
   * Delete customer reward (offline-first)
   */
  delete: async (rewardId: string): Promise<void> => {
    await storage.delete(`${KEYS.CUSTOMER_REWARD}${rewardId}`);
    await queueOperation('delete', 'customerReward', rewardId);
  },
};

/**
 * Business Reward Operations (Read-Only)
 */
export const businessRewardData = {
  /**
   * Get all business rewards (from Redis, cached locally)
   */
  getAll: async (): Promise<any[]> => {
    return await storage.getAll<any>(KEYS.REWARD);
  },

  /**
   * Get single business reward
   */
  get: async (rewardId: string): Promise<any | null> => {
    return await storage.get<any>(`${KEYS.REWARD}${rewardId}`);
  },
};

/**
 * Campaign Operations (Read-Only)
 */
export const campaignData = {
  /**
   * Get all campaigns (from Redis, cached locally)
   */
  getAll: async (): Promise<any[]> => {
    return await storage.getAll<any>(KEYS.CAMPAIGN);
  },

  /**
   * Get single campaign
   */
  get: async (campaignId: string): Promise<any | null> => {
    return await storage.get<any>(`${KEYS.CAMPAIGN}${campaignId}`);
  },
};

/**
 * Helper to strip sync metadata
 */
export const stripSyncMetadata = <T extends SyncableEntity>(entity: T): Omit<T, '_sync'> => {
  const { _sync, ...rest } = entity;
  return rest;
};

export const getEntitiesWithoutSync = <T extends SyncableEntity>(
  entities: T[]
): Omit<T, '_sync'>[] => {
  return entities.map(stripSyncMetadata);
};



