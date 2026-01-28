/**
 * Authentication Service for Customer App
 * Same contract as business app: login (email + password), logout, getStoredAuth, isAuthenticated.
 * Uses POST /api/v1/auth/customer/login. Deployed with business.cannycarrot.com / customer.cannycarrot.com.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const getApiBaseUrl = (): string => {
  if (Platform.OS === 'web' && !__DEV__) return 'https://api.cannycarrot.com';
  return process.env.EXPO_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, '') || 'http://localhost:3001';
};

const API_BASE_URL = getApiBaseUrl().replace(/\/$/, '');

export interface CustomerAuth {
  customerId: string;
  email: string;
  token: string;
  isAuthenticated: boolean;
  createdAt: string;
}

const AUTH_STORAGE_KEY = 'customer_auth';

/**
 * Login with email and password. Calls POST /auth/customer/login.
 */
export const loginCustomer = async (
  email: string,
  password: string
): Promise<CustomerAuth | null> => {
  const emailTrim = (email ?? '').trim().toLowerCase();
  if (!emailTrim || !password) return null;

  const res = await fetch(`${API_BASE_URL}/api/v1/auth/customer/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailTrim, password }),
  });

  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j?.error as string) || `Login failed (${res.status})`);
  }

  const json = await res.json();
  const data = json?.data ?? json;
  if (!data?.token || !data?.customerId) return null;

  const auth: CustomerAuth = {
    customerId: data.customerId,
    email: (data.email ?? emailTrim).toLowerCase(),
    token: data.token,
    isAuthenticated: true,
    createdAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  return auth;
};

/**
 * Logout: sync, clear auth and customer data. Same pattern as business.
 */
export const logoutCustomer = async (): Promise<void> => {
  try {
    const { performCustomerFullSync } = await import('./customerLogout');
    const { clearCustomerId, storage } = await import('./localStorage');
    const { clearBusinessDetails } = await import('./businessDetailsStorage');
    await performCustomerFullSync();
    await clearCustomerId();
    await storage.delete('customerRecord');
    await clearBusinessDetails();
  } catch (e) {
    console.warn('[authService] Logout sync/clear error:', e);
  }
  await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
};

/**
 * Get stored customer auth. Returns null if not logged in.
 */
export const getStoredAuth = async (): Promise<CustomerAuth | null> => {
  try {
    const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const a = JSON.parse(raw) as CustomerAuth;
    return a?.isAuthenticated && a?.customerId ? a : null;
  } catch {
    return null;
  }
};

/**
 * Check if user is authenticated (has valid stored auth).
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const a = await getStoredAuth();
  return a?.isAuthenticated === true;
};
