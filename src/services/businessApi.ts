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
