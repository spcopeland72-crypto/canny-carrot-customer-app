/**
 * Customer Record Service
 * 
 * Manages the complete customer record in local storage and Redis
 * Handles rewards, campaigns, earned/redeemed status tracking
 */

import { storage } from './localStorage';
import { queueOperation } from './syncManager';
import { getDeviceId } from './localStorage';
import type { 
  CustomerRecord, 
  CustomerRewardProgress, 
  CustomerCampaignProgress,
  CustomerProfile,
  RewardProgressStatus,
} from '../types/customer';
import { createEmptyCustomerRecord } from '../types/customer';

const CUSTOMER_RECORD_KEY = 'customerRecord';

/**
 * Get the current customer's record
 */
export const getCustomerRecord = async (): Promise<CustomerRecord> => {
  const customerId = await getDeviceId();
  const record = await storage.get<CustomerRecord>(CUSTOMER_RECORD_KEY);
  
  if (record) {
    return record;
  }
  
  // Create new record if none exists
  const newRecord = createEmptyCustomerRecord(customerId);
  await storage.set(CUSTOMER_RECORD_KEY, newRecord);
  return newRecord;
};

/**
 * Save the customer record locally and queue for sync.
 * Use only for profile updates, redeem, or other actions that trigger sync (click, select, sync, logout).
 */
export const saveCustomerRecord = async (record: CustomerRecord): Promise<void> => {
  record.updatedAt = new Date().toISOString();
  await storage.set(CUSTOMER_RECORD_KEY, record);
  
  const customerId = record.profile?.id;
  if (customerId) {
    await queueOperation('update', 'customer', customerId, record);
  }
};

/**
 * Save the customer record locally only — no queue, no sync.
 * Use for scan updates (reward/campaign QR). Offline-first: scan works without network;
 * sync happens only on explicit Sync, logout, or other allowed actions.
 */
export const saveCustomerRecordLocalOnly = async (record: CustomerRecord): Promise<void> => {
  record.updatedAt = new Date().toISOString();
  await storage.set(CUSTOMER_RECORD_KEY, record);
};

/**
 * Update customer profile
 */
export const updateCustomerProfile = async (
  updates: Partial<CustomerProfile>
): Promise<CustomerRecord> => {
  const record = await getCustomerRecord();
  record.profile = {
    ...record.profile,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await saveCustomerRecord(record);
  return record;
};

/**
 * Record a reward scan - updates or creates reward progress
 */
export const recordRewardScan = async (
  rewardId: string,
  rewardName: string,
  pointsAwarded: number,
  pointsRequired: number,
  businessId: string = 'default',
  businessName?: string,
  rewardType?: 'free_product' | 'discount' | 'other',
  qrCode?: string
): Promise<{ record: CustomerRecord; rewardProgress: CustomerRewardProgress; isNewlyEarned: boolean }> => {
  const now = new Date().toISOString();
  const record = await getCustomerRecord();
  
  // Update stats
  record.stats.totalScans++;
  if (!record.stats.businessesVisited.includes(businessId)) {
    record.stats.businessesVisited.push(businessId);
  }
  
  // Find existing reward progress in any array
  let existingReward: CustomerRewardProgress | undefined;
  let sourceArray: 'activeRewards' | 'earnedRewards' | 'redeemedRewards' | undefined;
  
  for (const key of ['activeRewards', 'earnedRewards', 'redeemedRewards'] as const) {
    const found = record[key].find(r => r.rewardId === rewardId);
    if (found) {
      existingReward = found;
      sourceArray = key;
      break;
    }
  }
  
  let rewardProgress: CustomerRewardProgress;
  let isNewlyEarned = false;
  
  if (existingReward && sourceArray) {
    // Update existing reward
    rewardProgress = existingReward;
    rewardProgress.pointsEarned += pointsAwarded;
    rewardProgress.lastScanAt = now;
    rewardProgress.scanHistory.push({
      timestamp: now,
      pointsAwarded,
    });
    
    // Check if now earned
    if (rewardProgress.status === 'active' && 
        rewardProgress.pointsEarned >= rewardProgress.pointsRequired) {
      // Move from active to earned
      record.activeRewards = record.activeRewards.filter(r => r.rewardId !== rewardId);
      rewardProgress.status = 'earned';
      rewardProgress.earnedAt = now;
      record.earnedRewards.push(rewardProgress);
      record.stats.totalRewardsEarned++;
      isNewlyEarned = true;
    }
  } else {
    // Create new reward progress
    rewardProgress = {
      rewardId,
      businessId,
      businessName,
      rewardName,
      pointsEarned: pointsAwarded,
      pointsRequired,
      status: 'active',
      firstScanAt: now,
      lastScanAt: now,
      scanHistory: [{
        timestamp: now,
        pointsAwarded,
      }],
      rewardType,
      qrCode,
    };
    
    // Check if immediately earned
    if (rewardProgress.pointsEarned >= rewardProgress.pointsRequired) {
      rewardProgress.status = 'earned';
      rewardProgress.earnedAt = now;
      record.earnedRewards.push(rewardProgress);
      record.stats.totalRewardsEarned++;
      isNewlyEarned = true;
    } else {
      record.activeRewards.push(rewardProgress);
    }
  }
  
  await saveCustomerRecordLocalOnly(record);
  
  return { record, rewardProgress, isNewlyEarned };
};

/**
 * Record a campaign scan
 */
export const recordCampaignScan = async (
  campaignId: string,
  campaignName: string,
  pointsAwarded: number,
  pointsRequired: number,
  businessId: string = 'default',
  businessName?: string,
  qrCode?: string
): Promise<{ record: CustomerRecord; campaignProgress: CustomerCampaignProgress; isNewlyEarned: boolean }> => {
  const now = new Date().toISOString();
  const record = await getCustomerRecord();
  
  // Update stats
  record.stats.totalScans++;
  if (!record.stats.businessesVisited.includes(businessId)) {
    record.stats.businessesVisited.push(businessId);
  }
  
  // Find existing campaign progress
  let existingCampaign: CustomerCampaignProgress | undefined;
  let sourceArray: 'activeCampaigns' | 'earnedCampaigns' | 'redeemedCampaigns' | undefined;
  
  for (const key of ['activeCampaigns', 'earnedCampaigns', 'redeemedCampaigns'] as const) {
    const found = record[key].find(c => c.campaignId === campaignId);
    if (found) {
      existingCampaign = found;
      sourceArray = key;
      break;
    }
  }
  
  let campaignProgress: CustomerCampaignProgress;
  let isNewlyEarned = false;
  
  if (existingCampaign && sourceArray) {
    campaignProgress = existingCampaign;
    campaignProgress.pointsEarned += pointsAwarded;
    campaignProgress.lastScanAt = now;
    campaignProgress.scanHistory.push({
      timestamp: now,
      pointsAwarded,
    });
    
    if (campaignProgress.status === 'active' && 
        campaignProgress.pointsEarned >= campaignProgress.pointsRequired) {
      record.activeCampaigns = record.activeCampaigns.filter(c => c.campaignId !== campaignId);
      campaignProgress.status = 'earned';
      campaignProgress.earnedAt = now;
      record.earnedCampaigns.push(campaignProgress);
      record.stats.totalCampaignsEarned++;
      isNewlyEarned = true;
    }
  } else {
    campaignProgress = {
      campaignId,
      businessId,
      businessName,
      campaignName,
      pointsEarned: pointsAwarded,
      pointsRequired,
      status: 'active',
      firstScanAt: now,
      lastScanAt: now,
      scanHistory: [{
        timestamp: now,
        pointsAwarded,
      }],
      qrCode,
    };
    
    if (campaignProgress.pointsEarned >= campaignProgress.pointsRequired) {
      campaignProgress.status = 'earned';
      campaignProgress.earnedAt = now;
      record.earnedCampaigns.push(campaignProgress);
      record.stats.totalCampaignsEarned++;
      isNewlyEarned = true;
    } else {
      record.activeCampaigns.push(campaignProgress);
    }
  }
  
  await saveCustomerRecordLocalOnly(record);
  
  return { record, campaignProgress, isNewlyEarned };
};

/**
 * Redeem an earned reward
 * Moves reward from earnedRewards to redeemedRewards (retained in history)
 * Creates a new active reward entry to start earning again
 */
export const redeemReward = async (rewardId: string): Promise<CustomerRewardProgress | null> => {
  const now = new Date().toISOString();
  const record = await getCustomerRecord();
  
  // Find reward in earnedRewards
  const rewardIndex = record.earnedRewards.findIndex(r => r.rewardId === rewardId);
  if (rewardIndex === -1) {
    console.warn(`Reward ${rewardId} not found in earned rewards`);
    return null;
  }
  
  // Move from earned to redeemed (retained in customer repo history)
  const reward = record.earnedRewards[rewardIndex];
  record.earnedRewards.splice(rewardIndex, 1);
  
  reward.status = 'redeemed';
  reward.redeemedAt = now;
  record.redeemedRewards.push(reward); // Retained in redeemedRewards for history
  record.stats.totalRewardsRedeemed++;
  
  // Create a new active reward entry to start earning cycle again
  // This allows the customer to earn the same reward again while keeping redemption history
  const newActiveReward: CustomerRewardProgress = {
    rewardId: reward.rewardId,
    businessId: reward.businessId || '',
    businessName: reward.businessName,
    rewardName: reward.rewardName,
    pointsEarned: 0, // Start fresh at 0 points
    pointsRequired: reward.pointsRequired, // Keep same requirement
    status: 'active',
    firstScanAt: '', // Will be set on first scan
    lastScanAt: '', // Will be set on first scan
    scanHistory: [],
    rewardType: reward.rewardType,
    qrCode: reward.qrCode, // Keep QR code for scanning
  };
  
  record.activeRewards.push(newActiveReward);
  
  await saveCustomerRecord(record);
  
  // Queue specific redemption sync
  await queueOperation('update', 'customerRewardRedemption', rewardId, {
    customerId: record.profile.id,
    rewardId,
    businessId: reward.businessId,
    redeemedAt: now,
  });
  
  console.log(`✅ Reward ${rewardId} redeemed and new active reward created (points reset to 0)`);
  
  return reward; // Return the redeemed reward (now in redeemedRewards)
};

/**
 * Redeem an earned campaign
 */
export const redeemCampaign = async (campaignId: string): Promise<CustomerCampaignProgress | null> => {
  const now = new Date().toISOString();
  const record = await getCustomerRecord();
  
  const campaignIndex = record.earnedCampaigns.findIndex(c => c.campaignId === campaignId);
  if (campaignIndex === -1) {
    console.warn(`Campaign ${campaignId} not found in earned campaigns`);
    return null;
  }
  
  const campaign = record.earnedCampaigns[campaignIndex];
  record.earnedCampaigns.splice(campaignIndex, 1);
  
  campaign.status = 'redeemed';
  campaign.redeemedAt = now;
  record.redeemedCampaigns.push(campaign);
  record.stats.totalCampaignsRedeemed++;
  
  await saveCustomerRecord(record);
  
  await queueOperation('update', 'customerCampaignRedemption', campaignId, {
    customerId: record.profile.id,
    campaignId,
    businessId: campaign.businessId,
    redeemedAt: now,
  });
  
  return campaign;
};

/**
 * Get all active rewards (still earning points)
 */
export const getActiveRewards = async (): Promise<CustomerRewardProgress[]> => {
  const record = await getCustomerRecord();
  return record.activeRewards;
};

/**
 * Get all earned rewards (ready to redeem)
 */
export const getEarnedRewards = async (): Promise<CustomerRewardProgress[]> => {
  const record = await getCustomerRecord();
  return record.earnedRewards;
};

/**
 * Get all redeemed rewards (history)
 */
export const getRedeemedRewards = async (): Promise<CustomerRewardProgress[]> => {
  const record = await getCustomerRecord();
  return record.redeemedRewards;
};

/**
 * Get customer stats
 */
export const getCustomerStats = async (): Promise<CustomerRecord['stats']> => {
  const record = await getCustomerRecord();
  return record.stats;
};

/**
 * Get reward progress by ID (searches all arrays)
 */
export const getRewardProgress = async (rewardId: string): Promise<CustomerRewardProgress | null> => {
  const record = await getCustomerRecord();
  
  for (const key of ['activeRewards', 'earnedRewards', 'redeemedRewards'] as const) {
    const found = record[key].find(r => r.rewardId === rewardId);
    if (found) return found;
  }
  
  return null;
};









