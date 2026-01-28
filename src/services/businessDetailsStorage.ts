/**
 * Business details storage and pull.
 * When customer data is pulled from Redis, we also pull basic business data for any
 * businesses the customer has captured IDs for: logo, address, website, socials,
 * contact (phone, email, whatsapp), other rewards and campaigns.
 */

import { storage } from './localStorage';
import { fetchBusinessDetails } from './businessApi';
import type { BusinessDetails } from '../types/businessDetails';

const BUSINESS_DETAILS_KEY = 'canny_carrot_business_details';

export type BusinessDetailsMap = Record<string, BusinessDetails>;

export async function getBusinessDetailsMap(): Promise<BusinessDetailsMap> {
  const raw = await storage.get<BusinessDetailsMap>(BUSINESS_DETAILS_KEY);
  return raw && typeof raw === 'object' ? raw : {};
}

export async function setBusinessDetailsMap(map: BusinessDetailsMap): Promise<void> {
  await storage.set(BUSINESS_DETAILS_KEY, map);
}

export async function getBusinessDetails(businessId: string): Promise<BusinessDetails | null> {
  const map = await getBusinessDetailsMap();
  return map[businessId] ?? null;
}

/**
 * Fetch business details for each given businessId and merge into stored map.
 * Call when customer data is pulled (e.g. login hydrate) for businesses the customer
 * has rewards/campaigns with.
 */
export async function pullBusinessDetailsForCustomer(
  businessIds: string[]
): Promise<{ pulled: number; errors: string[] }> {
  const ids = [...new Set(businessIds)].filter((id) => id && id !== 'default');
  const errors: string[] = [];
  let pulled = 0;
  const map = await getBusinessDetailsMap();

  for (const id of ids) {
    try {
      const details = await fetchBusinessDetails(id);
      if (details) {
        map[id] = details;
        pulled++;
      }
    } catch (e) {
      errors.push(e instanceof Error ? e.message : `Failed to fetch business ${id}`);
    }
  }

  if (pulled > 0 || Object.keys(map).length > 0) {
    await setBusinessDetailsMap(map);
  }
  return { pulled, errors };
}

/** Clear stored business details (e.g. on logout). */
export async function clearBusinessDetails(): Promise<void> {
  await storage.delete(BUSINESS_DETAILS_KEY);
}
