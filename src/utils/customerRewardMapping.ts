import type { CustomerReward } from '../types/customerReward';
import type { CustomerRecord, CustomerRewardProgress, CustomerCampaignProgress } from '../types/customer';

/**
 * Flatten customer record reward/campaign arrays to UI shape. Single store = customerRecord; this is the read view.
 */
export function recordToFlatRewards(record: CustomerRecord): CustomerReward[] {
  const now = new Date().toISOString();
  const out: CustomerReward[] = [];
  for (const r of [...record.activeRewards, ...record.earnedRewards, ...record.redeemedRewards]) {
    out.push({
      id: r.rewardId,
      name: r.rewardName,
      count: r.pointsEarned,
      total: r.pointsRequired,
      icon: '🎁',
      requirement: r.pointsRequired,
      pointsEarned: r.pointsEarned,
      rewardType: r.rewardType ?? 'other',
      businessId: r.businessId,
      businessName: r.businessName,
      qrCode: r.qrCode,
      isEarned: r.status === 'earned' || r.status === 'redeemed',
    });
  }
  for (const c of [...record.activeCampaigns, ...record.earnedCampaigns, ...record.redeemedCampaigns]) {
    out.push({
      id: `campaign-${c.campaignId}`,
      name: c.campaignName,
      count: c.pointsEarned,
      total: c.pointsRequired,
      icon: '🥐',
      requirement: c.pointsRequired,
      pointsEarned: c.pointsEarned,
      businessId: c.businessId,
      businessName: c.businessName,
      qrCode: c.qrCode,
      startDate: c.startDate,
      endDate: c.endDate,
      isEarned: c.status === 'earned' || c.status === 'redeemed',
      selectedProducts: c.selectedProducts,
      selectedActions: c.selectedActions,
      collectedItems: c.collectedItems,
    });
  }
  return out;
}

/**
 * Replace record's reward/campaign arrays from flat UI list. Single store write path.
 */
export function flatRewardsToRecord(record: CustomerRecord, flat: CustomerReward[]): CustomerRecord {
  const now = new Date().toISOString();
  const activeRewards: CustomerRewardProgress[] = [];
  const earnedRewards: CustomerRewardProgress[] = [];
  const redeemedRewards: CustomerRewardProgress[] = [];
  const activeCampaigns: CustomerCampaignProgress[] = [];
  const earnedCampaigns: CustomerCampaignProgress[] = [];
  const redeemedCampaigns: CustomerCampaignProgress[] = [];

  for (const r of flat) {
    const pointsEarned = r.pointsEarned ?? r.count;
    const pointsRequired = r.requirement ?? r.total;
    const earned = pointsEarned >= pointsRequired;
    const businessId = r.businessId ?? 'default';

    if (r.id.startsWith('campaign-')) {
      const campaignId = r.id.replace(/^campaign-/, '');
      const c: CustomerCampaignProgress = {
        campaignId,
        businessId,
        businessName: r.businessName,
        campaignName: r.name,
        pointsEarned,
        pointsRequired,
        status: earned ? 'earned' : 'active',
        firstScanAt: now,
        lastScanAt: now,
        scanHistory: [],
        startDate: r.startDate,
        endDate: r.endDate,
        qrCode: r.qrCode,
        selectedProducts: Array.isArray(r.selectedProducts) ? r.selectedProducts : undefined,
        selectedActions: Array.isArray(r.selectedActions) ? r.selectedActions : undefined,
        collectedItems: Array.isArray(r.collectedItems) ? r.collectedItems : undefined,
      };
      if (earned) earnedCampaigns.push(c);
      else activeCampaigns.push(c);
    } else {
      const prog: CustomerRewardProgress = {
        rewardId: r.id,
        businessId,
        businessName: r.businessName,
        rewardName: r.name,
        pointsEarned,
        pointsRequired,
        status: earned ? 'earned' : 'active',
        firstScanAt: now,
        lastScanAt: now,
        scanHistory: [],
        rewardType: (r.rewardType as 'free_product' | 'discount' | 'other') ?? 'other',
        qrCode: r.qrCode,
      };
      if (earned) earnedRewards.push(prog);
      else activeRewards.push(prog);
    }
  }

  const businessesVisited = [...new Set(flat.map((r) => r.businessId).filter(Boolean))] as string[];
  return {
    ...record,
    updatedAt: now,
    activeRewards,
    earnedRewards,
    redeemedRewards,
    activeCampaigns,
    earnedCampaigns,
    redeemedCampaigns,
    stats: {
      ...record.stats,
      businessesVisited: [...new Set([...record.stats.businessesVisited, ...businessesVisited])],
    },
  };
}

/**
 * Map API record.rewards (unknown[]) to CustomerReward[] for local storage.
 * Used after login (hydrate) and sign-in.
 */
export function mapApiRewardsToLocal(items: unknown[]): CustomerReward[] {
  return items.map((r: Record<string, unknown>) => {
    const id = (r?.id ?? '').toString();
    const total = typeof r?.total === 'number' ? r.total : (r?.requirement as number) ?? 1;
    const count = typeof r?.count === 'number' ? r.count : (r?.pointsEarned as number) ?? 0;
    const isCampaign = id.startsWith('campaign-');
    return {
      id,
      name: (r?.name ?? 'Reward').toString(),
      count,
      total,
      icon: isCampaign ? '🥐' : '🎁',
      requirement: total,
      pointsEarned: typeof r?.pointsEarned === 'number' ? r.pointsEarned : count,
      pointsPerPurchase: (r?.pointsPerPurchase as number) ?? 1,
      rewardType: ((r?.rewardType as string) ?? 'other') as 'free_product' | 'discount' | 'other',
      businessId: r?.businessId as string | undefined,
      businessName: r?.businessName as string | undefined,
      selectedProducts: Array.isArray(r?.selectedProducts) ? (r.selectedProducts as string[]) : undefined,
      selectedActions: Array.isArray(r?.selectedActions) ? (r.selectedActions as string[]) : undefined,
      qrCode: r?.qrCode as string | undefined,
      pinCode: r?.pinCode as string | undefined,
      startDate: r?.startDate as string | undefined,
      endDate: r?.endDate as string | undefined,
      isEarned: count >= total,
      collectedItems: Array.isArray(r?.collectedItems) ? (r.collectedItems as { itemType: string; itemName: string }[]) : undefined,
      createdAt: r?.createdAt as string | undefined,
      lastScannedAt: r?.lastScannedAt as string | undefined,
    };
  });
}
