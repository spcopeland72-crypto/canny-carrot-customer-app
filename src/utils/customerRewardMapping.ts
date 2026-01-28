import type { CustomerReward } from './dataStorage';

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
