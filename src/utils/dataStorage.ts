/**
 * Rewards read/write — single store: customerRecord.
 * loadRewards = flatten record to UI list. saveRewards = apply flat list to record, save.
 */
export type { CustomerReward } from '../types/customerReward';

import { getCustomerRecord, saveCustomerRecord } from '../services/customerRecord';
import { recordToFlatRewards, flatRewardsToRecord } from './customerRewardMapping';
import type { CustomerReward } from '../types/customerReward';

/** Single store: customerRecord. Read = flatten record to UI list. */
export const loadRewards = async (): Promise<CustomerReward[]> => {
  const record = await getCustomerRecord();
  return recordToFlatRewards(record);
};

/** Single store: customerRecord. Write = apply flat list to record, save. */
export const saveRewards = async (rewards: CustomerReward[]): Promise<void> => {
  const record = await getCustomerRecord();
  const updated = flatRewardsToRecord(record, rewards);
  await saveCustomerRecord(updated);
};

