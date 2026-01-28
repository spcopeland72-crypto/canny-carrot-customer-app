/**
 * Business API – fetch business by ID (e.g. from QR code businessId).
 * Used to resolve business name for rewards/campaigns so customers can reference
 * the business (socials, website, promotions, address, etc.).
 */

import { Platform } from 'react-native';
import type { BusinessDetails, BusinessSocials } from '../types/businessDetails';

const getApiBaseUrl = (): string => {
  if (Platform.OS === 'web' && !__DEV__) return 'https://api.cannycarrot.com';
  return process.env.EXPO_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, '') || 'http://localhost:3001';
};

const base = (): string => getApiBaseUrl().replace(/\/$/, '');

export async function fetchBusinessById(id: string): Promise<{ name?: string } | null> {
  if (!id || id === 'default') return null;
  try {
    const res = await fetch(`${base()}/api/v1/businesses/${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.data ?? json;
    return data && typeof data === 'object' ? { name: data.name } : null;
  } catch {
    return null;
  }
}

function toSocials(raw: Record<string, unknown> | undefined): BusinessSocials | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const s: BusinessSocials = {};
  const keys = ['facebook', 'instagram', 'twitter', 'tiktok', 'linkedin'] as const;
  for (const k of keys) {
    const v = raw[k];
    if (v != null && typeof v === 'string' && v.trim()) s[k] = v.trim();
  }
  return Object.keys(s).length > 0 ? s : undefined;
}

function formatAddress(b: Record<string, unknown>): string {
  const p = (b.profile as Record<string, unknown>) || b;
  const parts = [
    (p.addressLine1 as string) || (p.line1 as string),
    (p.addressLine2 as string) || (p.line2 as string),
    (p.city as string),
    (p.postcode as string),
    (p.country as string),
  ].filter(Boolean);
  return parts.join(', ');
}

/** Fetch full business details: logo, address, website, socials, contact, rewards, campaigns. */
export async function fetchBusinessDetails(businessId: string): Promise<BusinessDetails | null> {
  if (!businessId || businessId === 'default') return null;
  try {
    const [businessRes, rewardsRes, campaignsRes] = await Promise.all([
      fetch(`${base()}/api/v1/businesses/${encodeURIComponent(businessId)}`),
      fetch(`${base()}/api/v1/rewards?businessId=${encodeURIComponent(businessId)}`),
      fetch(`${base()}/api/v1/campaigns?businessId=${encodeURIComponent(businessId)}`),
    ]);

    let biz: Record<string, unknown> | null = null;
    if (businessRes.ok) {
      const j = await businessRes.json();
      const d = j?.data ?? j;
      if (d && typeof d === 'object') biz = d as Record<string, unknown>;
    }
    if (!biz) return null;

    const p = (biz.profile as Record<string, unknown>) || biz;
    const socialsRaw = (biz.socialMedia ?? p.socialMedia) as Record<string, unknown> | undefined;
    const socials = toSocials(socialsRaw);

    let rewards: BusinessDetails['rewards'];
    if (rewardsRes.ok) {
      const j = await rewardsRes.json();
      const arr = Array.isArray(j?.data) ? j.data : [];
      rewards = arr.map((r: { id?: string; name?: string; stampsRequired?: number; isActive?: boolean }) => ({
        id: String(r.id ?? ''),
        name: String(r.name ?? ''),
        stampsRequired: r.stampsRequired,
        isActive: r.isActive,
      }));
    } else {
      rewards = [];
    }

    let campaigns: BusinessDetails['campaigns'];
    if (campaignsRes.ok) {
      const j = await campaignsRes.json();
      const arr = Array.isArray(j?.data) ? j.data : [];
      campaigns = arr.map((c: { id?: string; name?: string; status?: string }) => ({
        id: String(c.id ?? ''),
        name: String(c.name ?? ''),
        status: c.status,
      }));
    } else {
      campaigns = [];
    }

    const category = (biz.category ?? p.category ?? biz.businessType ?? (p as { businessType?: string }).businessType) as string | undefined;
    const typeStr = category ? `${String(category)}` : undefined;
    const details: BusinessDetails = {
      id: String(biz.id ?? businessId),
      name: String(biz.name ?? p.name ?? ''),
      logo: (biz.logo ?? p.logo) as string | undefined,
      address: formatAddress(biz) || undefined,
      website: (biz.website ?? p.website) as string | undefined,
      type: typeStr,
      socials: socials && Object.keys(socials).length > 0 ? socials : undefined,
      phone: (biz.phone ?? p.phone) as string | undefined,
      email: (biz.email ?? p.email) as string | undefined,
      whatsapp: (biz.whatsapp ?? (p as { whatsapp?: string }).whatsapp) as string | undefined,
      rewards: rewards.length ? rewards : undefined,
      campaigns: campaigns.length ? campaigns : undefined,
    };
    return details;
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
    const res = await fetch(
      `${base()}/api/v1/campaigns?businessId=${encodeURIComponent(businessId)}`
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
