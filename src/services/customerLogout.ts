/**
 * Customer Logout / Sync Service
 *
 * Syncs customer data to Redis via PUT /customers/:id/sync when local is newer.
 * CODEX: Newest overwrites oldest. If Redis is newer than local, we download (update local from server) and do NOT upload.
 * Uses customer **UUID** (not email or device id). Resolve by email if UUID unknown.
 */

import { getCustomerRecordForSync } from './customerRecord';
import { getCustomerId, setCustomerId } from './localStorage';
import { getByEmail, getById, sync as apiSync } from './customerApi';
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
    selectedProducts: Array.isArray(r.selectedProducts) ? r.selectedProducts : undefined,
    selectedActions: Array.isArray(r.selectedActions) ? r.selectedActions : undefined,
  };
}

function toCampaignItem(c: CustomerCampaignProgress): Record<string, unknown> {
  return {
    id: c.campaignId,
    tokenKind: 'campaign',
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
    selectedProducts: Array.isArray(c.selectedProducts) ? c.selectedProducts : undefined,
    selectedActions: Array.isArray(c.selectedActions) ? c.selectedActions : undefined,
    collectedItems: Array.isArray(c.collectedItems) ? c.collectedItems : undefined,
  };
}

/**
 * Build sync body { ...account, rewards } from CustomerRecord only.
 * Single store: all rewards live in the record; no second store to merge.
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

  const transactionLog = (record.transactionLog ?? []).slice(-300);

  return {
    id: customerUuid,
    email: (profile.email ?? '').trim().toLowerCase() || undefined,
    firstName,
    lastName,
    phone: profile.phone ?? undefined,
    dateOfBirth: profile.dateOfBirth ?? undefined,
    addressLine1: profile.addressLine1 ?? undefined,
    addressLine2: profile.addressLine2 ?? undefined,
    city: profile.city ?? undefined,
    postcode: profile.postcode ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    preferences: profile.preferences,
    totalStamps: record.stats.totalScans,
    totalRedemptions:
      record.stats.totalRewardsRedeemed + record.stats.totalCampaignsRedeemed,
    rewards,
    transactionLog: transactionLog.length > 0 ? transactionLog : undefined,
  };
}

/**
 * Perform sync — timestamp decides. Only upload if local is newer than Redis.
 * If Redis is newer, do not PUT (never overwrite newer with older).
 * Used for Click Sync and Logout.
 * When recordForSync is provided (e.g. on logout), use it so the body includes the latest log (e.g. EVENT:LOGOUT).
 */
export const performCustomerFullSync = async (recordForSync?: CustomerRecord | null): Promise<{
  success: boolean;
  errors: string[];
}> => {
  const errors: string[] = [];

  try {
    const record = recordForSync ?? (await getCustomerRecordForSync());
    if (!record) {
      return { success: false, errors: ['No customer record found'] };
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
      return { success: true, errors: [] };
    }

    // Definitive: data only flows when local timestamp is strictly newer than server. Only upload when local > server.
    const serverRecord = await getById(customerUuid);
    const localUpdatedAt = (record.updatedAt ?? '').trim();
    const serverUpdatedAt = (serverRecord?.updatedAt ?? '').trim();

    if (localUpdatedAt === '' || serverUpdatedAt === '') {
      // Cannot apply rule — do not upload. Log error; do not invent fallback.
      const msg = 'Cannot compare timestamps: local or server updatedAt missing. Not uploading.';
      console.error('[CUSTOMER SYNC]', msg, { localUpdatedAt: localUpdatedAt || '(missing)', serverUpdatedAt: serverUpdatedAt || '(missing)' });
      return { success: false, errors: [msg] };
    }

    if (serverUpdatedAt >= localUpdatedAt) {
      // Server newer or same — do not upload. Rule: never overwrite when we're not strictly newer.
      return { success: true, errors: [] };
    }

    // localUpdatedAt > serverUpdatedAt — upload. Single store = customerRecord.
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
