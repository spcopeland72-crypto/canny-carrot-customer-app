/**
 * Customer Logout / Sync Service
 *
 * Syncs customer data to Redis via PUT /customers/:id/sync.
 * Uses customer **UUID** (not email or device id). Resolve by email if UUID unknown.
 * One-blob design: only customer record is synced; no reward/campaign progress updates.
 */

import { getCustomerRecord } from './customerRecord';
import { getCustomerId, setCustomerId } from './localStorage';
import { getByEmail, sync as apiSync } from './customerApi';
import type {
  CustomerRecord,
  CustomerRewardProgress,
  CustomerCampaignProgress,
} from '../types/customer';

function toRewardItem(r: CustomerRewardProgress): Record<string, unknown> {
  return {
    id: r.rewardId,
    name: r.rewardName,
    count: r.pointsEarned,
    total: r.pointsRequired,
    pointsEarned: r.pointsEarned,
    requirement: r.pointsRequired,
    businessId: r.businessId,
    businessName: r.businessName,
    rewardType: r.rewardType,
    qrCode: r.qrCode,
  };
}

function toCampaignItem(c: CustomerCampaignProgress): Record<string, unknown> {
  return {
    id: `campaign-${c.campaignId}`,
    name: c.campaignName,
    count: c.pointsEarned,
    total: c.pointsRequired,
    pointsEarned: c.pointsEarned,
    requirement: c.pointsRequired,
    businessId: c.businessId,
    businessName: c.businessName,
    startDate: c.startDate,
    endDate: c.endDate,
    qrCode: c.qrCode,
  };
}

/**
 * Build sync body { ...account, rewards } from CustomerRecord.
 * Uses customer UUID as id; account from profile; rewards = flattened active+earned+redeemed.
 */
function buildSyncBody(record: CustomerRecord, customerUuid: string): Record<string, unknown> {
  const profile = record.profile;
  const name = (profile.name ?? '').trim();
  const parts = name ? name.split(/\s+/) : [];
  const firstName = parts[0] ?? 'Customer';
  const lastName = parts.slice(1).join(' ') || '';

  const rewards: Record<string, unknown>[] = [];
  for (const r of [
    ...record.activeRewards,
    ...record.earnedRewards,
    ...record.redeemedRewards,
  ]) {
    rewards.push(toRewardItem(r));
  }
  for (const c of [
    ...record.activeCampaigns,
    ...record.earnedCampaigns,
    ...record.redeemedCampaigns,
  ]) {
    rewards.push(toCampaignItem(c));
  }

  return {
    id: customerUuid,
    email: (profile.email ?? '').trim().toLowerCase() || undefined,
    firstName,
    lastName,
    phone: profile.phone ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    preferences: profile.preferences,
    totalStamps: record.stats.totalScans,
    totalRedemptions:
      record.stats.totalRewardsRedeemed + record.stats.totalCampaignsRedeemed,
    rewards,
  };
}

/**
 * Perform sync — PUT /customers/:id/sync with local customer record.
 * Uses stored customer UUID; if missing, resolves by profile.email via by-email, then stores UUID.
 */
export const performCustomerFullSync = async (): Promise<{
  success: boolean;
  errors: string[];
}> => {
  const errors: string[] = [];

  try {
    const record = await getCustomerRecord();
    if (!record) {
      throw new Error('No customer record found');
    }

    let customerUuid = await getCustomerId();

    if (!customerUuid && record.profile?.email) {
      const resolved = await getByEmail(record.profile.email);
      if (resolved?.id) {
        customerUuid = resolved.id;
        await setCustomerId(customerUuid);
      }
    }

    if (!customerUuid) {
      throw new Error(
        'No customer UUID. Sign in with email or complete sync first.'
      );
    }

    const body = buildSyncBody(record, customerUuid);
    const result = await apiSync(customerUuid, body);

    if (result.success) {
      console.log(`✅ [CUSTOMER SYNC] Customer record synced (${customerUuid})`);
    } else {
      errors.push(result.error ?? 'Failed to sync customer record');
      console.error(`❌ [CUSTOMER SYNC] ${result.error}`);
    }

    return { success: errors.length === 0, errors };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown sync error';
    errors.push(msg);
    console.error('❌ [CUSTOMER SYNC]', e);
    return { success: false, errors };
  }
};
