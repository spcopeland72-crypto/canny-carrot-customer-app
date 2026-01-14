/**
 * Customer Logout Service
 * 
 * Performs full replacement sync of customer data to Redis on logout
 */

import { getCustomerRecord } from './customerRecord';
import { getDeviceId } from './localStorage';
import type { CustomerRecord } from '../types/customer';

const API_BASE_URL = 'https://api.cannycarrot.com';

/**
 * Perform full replacement sync - makes Redis identical to local customer record
 */
export const performCustomerFullSync = async (): Promise<{
  success: boolean;
  errors: string[];
}> => {
  const errors: string[] = [];

  try {
    console.log('🔄 [CUSTOMER LOGOUT] Starting full replacement sync...');
    console.log('🔄 [CUSTOMER LOGOUT] This will replace all customer data in Redis with local data');

    // Get customer record from local storage
    const customerRecord = await getCustomerRecord();
    const customerId = await getDeviceId();

    if (!customerRecord || !customerId) {
      throw new Error('No customer record or customer ID found');
    }

    // Write entire customer record to Redis
    console.log(`📤 [CUSTOMER LOGOUT] Writing customer record to Redis (${customerId})...`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerRecord),
      });

      if (response.ok) {
        console.log('✅ [CUSTOMER LOGOUT] Customer record written to Redis');
      } else {
        const errorText = await response.text();
        console.error(`❌ [CUSTOMER LOGOUT] Failed to write customer record: ${response.status} ${errorText.substring(0, 200)}`);
        errors.push('Failed to sync customer record');
      }
    } catch (error: any) {
      console.error('❌ [CUSTOMER LOGOUT] Error writing customer record:', error.message || error);
      errors.push('Failed to sync customer record');
    }

    // Update business records with customer progress
    // For each reward/campaign the customer has progress on, update the business's reward/campaign record
    const allRewards = [
      ...customerRecord.activeRewards,
      ...customerRecord.earnedRewards,
      ...customerRecord.redeemedRewards,
    ];

    const allCampaigns = [
      ...customerRecord.activeCampaigns,
      ...customerRecord.earnedCampaigns,
      ...customerRecord.redeemedCampaigns,
    ];

    // Update reward progress in business records
    for (const rewardProgress of allRewards) {
      if (rewardProgress.businessId) {
        try {
          // Update the reward's customerProgress field in Redis
          const rewardResponse = await fetch(`${API_BASE_URL}/api/v1/rewards/${rewardProgress.rewardId}`, {
            method: 'GET',
          });

          if (rewardResponse.ok) {
            const rewardData = await rewardResponse.json();
            if (rewardData.success && rewardData.data) {
              const reward = rewardData.data;
              
              // Update customerProgress
              const updatedReward = {
                ...reward,
                customerProgress: {
                  ...(reward.customerProgress || {}),
                  [customerId]: rewardProgress.pointsEarned || 0,
                },
              };

              // Write updated reward back
              const updateResponse = await fetch(`${API_BASE_URL}/api/v1/rewards/${rewardProgress.rewardId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedReward),
              });

              if (updateResponse.ok) {
                console.log(`  ✅ Updated reward ${rewardProgress.rewardId} with customer progress`);
              } else {
                console.warn(`  ⚠️ Failed to update reward ${rewardProgress.rewardId}`);
              }
            }
          }
        } catch (error: any) {
          console.error(`  ❌ Error updating reward ${rewardProgress.rewardId}:`, error.message || error);
        }
      }
    }

    // Update campaign progress in business records
    for (const campaignProgress of allCampaigns) {
      if (campaignProgress.businessId) {
        try {
          // Update the campaign's customerProgress field in Redis
          const campaignResponse = await fetch(`${API_BASE_URL}/api/v1/campaigns/${campaignProgress.campaignId}`, {
            method: 'GET',
          });

          if (campaignResponse.ok) {
            const campaignData = await campaignResponse.json();
            if (campaignData.success && campaignData.data) {
              const campaign = campaignData.data;
              
              // Update customerProgress
              const updatedCampaign = {
                ...campaign,
                customerProgress: {
                  ...(campaign.customerProgress || {}),
                  [customerId]: campaignProgress.pointsEarned || 0,
                },
              };

              // Write updated campaign back
              const updateResponse = await fetch(`${API_BASE_URL}/api/v1/campaigns/${campaignProgress.campaignId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedCampaign),
              });

              if (updateResponse.ok) {
                console.log(`  ✅ Updated campaign ${campaignProgress.campaignId} with customer progress`);
              } else {
                console.warn(`  ⚠️ Failed to update campaign ${campaignProgress.campaignId}`);
              }
            }
          }
        } catch (error: any) {
          console.error(`  ❌ Error updating campaign ${campaignProgress.campaignId}:`, error.message || error);
        }
      }
    }

    console.log('\n✅ [CUSTOMER LOGOUT] Full replacement sync completed');
    console.log(`   Customer record: ${errors.length === 0 ? '✅' : '❌'}`);

    return {
      success: errors.length === 0,
      errors,
    };
  } catch (error: any) {
    console.error('❌ [CUSTOMER LOGOUT] Full replacement sync error:', error);
    errors.push(error.message || 'Unknown sync error');
    return {
      success: false,
      errors,
    };
  }
};



