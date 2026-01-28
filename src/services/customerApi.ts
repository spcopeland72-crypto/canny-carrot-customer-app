/**
 * Customer API — UUID-based customer record (canny-carrot-api).
 * Use customer UUID for all operations; resolve by email when needed.
 * See API_AND_CUSTOMER_APP_SCOPE (canny-carrot-api docs).
 */

import { Platform } from 'react-native';

const getApiBaseUrl = (): string => {
  if (Platform.OS === 'web' && !__DEV__) return 'https://api.cannycarrot.com';
  return process.env.EXPO_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, '') || 'http://localhost:3001';
};

const base = (): string => getApiBaseUrl().replace(/\/$/, '');

export interface CustomerApiRecord {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
  preferences?: { notifications?: boolean; marketing?: boolean };
  totalStamps?: number;
  totalRedemptions?: number;
  rewards?: unknown[];
  [k: string]: unknown;
}

/** GET /customers/by-email/:email — resolve by email, return full record (account + rewards). */
export async function getByEmail(email: string): Promise<CustomerApiRecord | null> {
  const e = (email || '').trim().toLowerCase();
  if (!e) return null;
  try {
    const res = await fetch(
      `${base()}/api/v1/customers/by-email/${encodeURIComponent(e)}`
    );
    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.data ?? json;
    return data && typeof data === 'object' ? (data as CustomerApiRecord) : null;
  } catch {
    return null;
  }
}

/** GET /customers/:id — fetch full record by customer UUID. */
export async function getById(id: string): Promise<CustomerApiRecord | null> {
  if (!id) return null;
  try {
    const res = await fetch(
      `${base()}/api/v1/customers/${encodeURIComponent(id)}`
    );
    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.data ?? json;
    return data && typeof data === 'object' ? (data as CustomerApiRecord) : null;
  } catch {
    return null;
  }
}

/** PUT /customers/:id/sync — full replace. Body: { ...account, rewards }. Returns stored record. */
export async function sync(
  id: string,
  body: { [k: string]: unknown }
): Promise<{ success: boolean; data?: CustomerApiRecord; error?: string }> {
  if (!id || !body || typeof body !== 'object') {
    return { success: false, error: 'id and body required' };
  }
  try {
    const res = await fetch(`${base()}/api/v1/customers/${encodeURIComponent(id)}/sync`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        error: (json?.error || json?.detail || `HTTP ${res.status}`) as string,
      };
    }
    const data = json?.data ?? json;
    return {
      success: true,
      data: data && typeof data === 'object' ? (data as CustomerApiRecord) : undefined,
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Network error',
    };
  }
}
