/**
 * Customer Record Types for Redis
 * 
 * Complete customer data structure stored in Redis
 * Key format: customer:{customerId}
 */

// ============================================
// CUSTOMER PROFILE (Signup Information)
// ============================================

export interface CustomerProfile {
  id: string;                    // Unique device/customer ID
  name?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  postcode?: string;
  preferences?: {
    notifications: boolean;
    emailMarketing: boolean;
    smsMarketing: boolean;
  };
  createdAt: string;             // When customer first signed up/scanned
  updatedAt: string;
}

// ============================================
// REWARD STATUS TRACKING
// ============================================

export type RewardProgressStatus = 'active' | 'earned' | 'redeemed' | 'expired';

/**
 * Individual reward progress for a customer
 */
export interface CustomerRewardProgress {
  rewardId: string;
  businessId: string;
  businessName?: string;
  rewardName: string;
  
  // Progress tracking
  pointsEarned: number;          // Current points accumulated
  pointsRequired: number;        // Points needed to earn reward
  
  // Status
  status: RewardProgressStatus;  // active, earned, redeemed, expired
  
  // Timestamps
  firstScanAt: string;           // When customer first scanned this reward
  lastScanAt: string;            // Most recent scan
  earnedAt?: string;             // When points requirement was met
  redeemedAt?: string;           // When reward was claimed
  expiresAt?: string;            // When reward expires (if applicable)
  
  // Scan history
  scanHistory: {
    timestamp: string;
    pointsAwarded: number;
    location?: string;
  }[];
  
  // Reward details (cached from business)
  rewardType?: 'free_product' | 'discount' | 'other';
  rewardDescription?: string;
  qrCode?: string;
  /** Products/actions from QR (stamp-card labels). Persisted in core store; used for circle labels and stamp pins. */
  selectedProducts?: string[];
  selectedActions?: string[];
}

/**
 * Individual campaign progress for a customer
 */
export interface CustomerCampaignProgress {
  campaignId: string;
  businessId: string;
  businessName?: string;
  campaignName: string;
  
  // Progress tracking
  pointsEarned: number;
  pointsRequired: number;
  
  // Status
  status: RewardProgressStatus;
  
  // Timestamps
  firstScanAt: string;
  lastScanAt: string;
  earnedAt?: string;
  redeemedAt?: string;
  expiresAt?: string;
  
  // Scan history
  scanHistory: {
    timestamp: string;
    pointsAwarded: number;
  }[];
  
  // Campaign details (cached)
  campaignDescription?: string;
  startDate?: string;
  endDate?: string;
  qrCode?: string;
  /** Products/actions to collect (from campaign definition). */
  selectedProducts?: string[];
  selectedActions?: string[];
  /** Products/actions customer has scanned — earned out of total. */
  collectedItems?: { itemType: string; itemName: string }[];
}

// ============================================
// TRANSACTION LOG (date:time:ACTION + data)
// ============================================

export type TransactionAction = 'SCAN' | 'EDIT' | 'ACTION';

/** One log entry: date:time:ACTION with structured data. */
export interface TransactionLogEntry {
  timestamp: string; // ISO
  action: TransactionAction;
  /** SCAN: what was scanned (reward/campaign/campaign_item). EDIT: what was changed. ACTION: what action (e.g. redeem). */
  data: Record<string, unknown>;
}

const TRANSACTION_LOG_MAX = 300;

/** Append entry and keep last N. Mutates record.transactionLog. */
export function appendTransactionLog(record: CustomerRecord, entry: TransactionLogEntry): void {
  if (!record.transactionLog) record.transactionLog = [];
  record.transactionLog.push(entry);
  if (record.transactionLog.length > TRANSACTION_LOG_MAX) {
    record.transactionLog = record.transactionLog.slice(-TRANSACTION_LOG_MAX);
  }
}

// ============================================
// COMPLETE CUSTOMER RECORD
// ============================================

/**
 * Complete Customer Record stored in Redis
 * Key format: customer:{customerId}
 */
export interface CustomerRecord {
  // Customer signup/profile information
  profile: CustomerProfile;
  
  // Active rewards (still earning points, not yet completed)
  activeRewards: CustomerRewardProgress[];
  
  // Previous rewards earned (completed but not yet redeemed)
  earnedRewards: CustomerRewardProgress[];
  
  // Previous rewards redeemed (claimed)
  redeemedRewards: CustomerRewardProgress[];
  
  // Active campaigns
  activeCampaigns: CustomerCampaignProgress[];
  
  // Earned campaigns
  earnedCampaigns: CustomerCampaignProgress[];
  
  // Redeemed campaigns
  redeemedCampaigns: CustomerCampaignProgress[];
  
  // Summary stats
  stats: {
    totalScans: number;
    totalRewardsEarned: number;
    totalRewardsRedeemed: number;
    totalCampaignsEarned: number;
    totalCampaignsRedeemed: number;
    businessesVisited: string[];  // List of business IDs
  };

  /** Log of transactions: SCAN (what was scanned), EDIT (what was changed), ACTION (e.g. redeem). Capped at 300. */
  transactionLog?: TransactionLogEntry[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create an empty customer record
 */
export const createEmptyCustomerRecord = (customerId: string): CustomerRecord => {
  const now = new Date().toISOString();
  return {
    profile: {
      id: customerId,
      createdAt: now,
      updatedAt: now,
    },
    activeRewards: [],
    earnedRewards: [],
    redeemedRewards: [],
    activeCampaigns: [],
    earnedCampaigns: [],
    redeemedCampaigns: [],
    stats: {
      totalScans: 0,
      totalRewardsEarned: 0,
      totalRewardsRedeemed: 0,
      totalCampaignsEarned: 0,
      totalCampaignsRedeemed: 0,
      businessesVisited: [],
    },
    transactionLog: [],
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Move reward between status arrays based on new status
 */
export const updateRewardStatus = (
  record: CustomerRecord,
  rewardId: string,
  newStatus: RewardProgressStatus
): CustomerRecord => {
  const now = new Date().toISOString();
  
  // Find the reward in any array
  let reward: CustomerRewardProgress | undefined;
  let sourceArray: 'activeRewards' | 'earnedRewards' | 'redeemedRewards' | undefined;
  
  for (const key of ['activeRewards', 'earnedRewards', 'redeemedRewards'] as const) {
    const found = record[key].find(r => r.rewardId === rewardId);
    if (found) {
      reward = found;
      sourceArray = key;
      break;
    }
  }
  
  if (!reward || !sourceArray) return record;
  
  // Remove from source array
  record[sourceArray] = record[sourceArray].filter(r => r.rewardId !== rewardId);
  
  // Update status and timestamp
  reward.status = newStatus;
  if (newStatus === 'earned') {
    reward.earnedAt = now;
    record.earnedRewards.push(reward);
    record.stats.totalRewardsEarned++;
  } else if (newStatus === 'redeemed') {
    reward.redeemedAt = now;
    record.redeemedRewards.push(reward);
    record.stats.totalRewardsRedeemed++;
  } else if (newStatus === 'active') {
    record.activeRewards.push(reward);
  }
  
  record.updatedAt = now;
  return record;
};









