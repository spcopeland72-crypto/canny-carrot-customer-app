/**
 * UI / flat reward shape. Single source of truth for display list.
 * Stored only inside CustomerRecord (customerRecord service); loadRewards/saveRewards are derived.
 */
export interface CustomerReward {
  id: string;
  name: string;
  count: number;
  total: number;
  icon: string;
  businessLogo?: string;
  type?: 'product' | 'action';
  requirement: number;
  pointsPerPurchase?: number;
  rewardType?: 'free_product' | 'discount' | 'other';
  selectedProducts?: string[];
  selectedActions?: string[];
  qrCode?: string;
  pointsEarned: number;
  pinCode?: string;
  businessId?: string;
  businessName?: string;
  createdAt?: string;
  lastScannedAt?: string;
  isEarned?: boolean;
  collectedItems?: { itemType: string; itemName: string }[];
  startDate?: string;
  endDate?: string;
}
