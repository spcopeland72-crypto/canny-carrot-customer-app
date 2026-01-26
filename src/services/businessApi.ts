/**
 * Business API – fetch business by ID (e.g. from QR code businessId).
 * Used to resolve business name for rewards/campaigns so customers can reference
 * the business (socials, website, promotions, address, etc.).
 */

import { Platform } from 'react-native';

const getApiBaseUrl = (): string => {
  if (Platform.OS === 'web' && !__DEV__) return 'https://api.cannycarrot.com';
  return process.env.EXPO_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, '') || 'http://localhost:3001';
};

export async function fetchBusinessById(id: string): Promise<{ name?: string } | null> {
  if (!id || id === 'default') return null;
  try {
    const base = getApiBaseUrl().replace(/\/$/, '');
    const res = await fetch(`${base}/api/v1/businesses/${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.data ?? json;
    return data && typeof data === 'object' ? { name: data.name } : null;
  } catch {
    return null;
  }
}

/** Fetch campaign selectedProducts + selectedActions for labels (campaign modal). */
export async function fetchCampaignProductsActions(
  businessId: string,
  campaignName: string
): Promise<{ products: string[]; actions: string[] } | null> {
  if (!businessId || businessId === 'default') return null;
  try {
    const base = getApiBaseUrl().replace(/\/$/, '');
    const res = await fetch(
      `${base}/api/v1/campaigns?businessId=${encodeURIComponent(businessId)}`
    );
    if (!res.ok) return null;
    const json = await res.json();
    const list = json?.data ?? [];
    if (!Array.isArray(list)) return null;
    const name = (campaignName || '').trim();
    const campaign = list.find(
      (c: { name?: string }) => (c.name || '').trim() === name
    );
    if (!campaign) return null;
    return {
      products: Array.isArray(campaign.selectedProducts) ? campaign.selectedProducts : [],
      actions: Array.isArray(campaign.selectedActions) ? campaign.selectedActions : [],
    };
  } catch {
    return null;
  }
}
