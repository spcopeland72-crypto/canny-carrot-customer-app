/**
 * Shared QR Code Utilities
 * 
 * This module provides consistent QR code generation and parsing
 * for reward codes, campaign codes, and business codes.
 * 
 * Formats:
 * - Reward: REWARD:{businessId}:{businessName}:{id}:{name}:{requirement}:{rewardType}:{products}:{pinCode}
 * - Company: COMPANY:{number}:{name}
 * - Campaign: CAMPAIGN:{id}:{name}:{description}
 * - Campaign item: CAMPAIGN_ITEM:{businessId}:{businessName}:{campaignName}:{itemType}:{itemName}:{startDate}:{endDate}
 */

export interface ParsedRewardQR {
  businessId?: string;
  businessName?: string;
  id: string;
  name: string;
  requirement: number;
  rewardType: string;
  products: string[];
  pinCode?: string;
}

export interface ParsedCompanyQR {
  number: string;
  name: string;
}

export interface ParsedCampaignQR {
  id: string;
  name: string;
  description: string;
  businessId?: string;
  businessName?: string;
  components?: string[]; // Campaign components/requirements
  pointsRequired?: number; // Points required to complete campaign
  pointsPerScan?: number; // Points awarded per scan
}

export interface ParsedCampaignItemQR {
  businessId: string;
  businessName?: string;
  campaignId: string;
  campaignName: string;
  itemType: string;
  itemName: string;
  startDate: string;
  endDate: string;
}

export type ParsedQR = 
  | { type: 'reward'; data: ParsedRewardQR }
  | { type: 'company'; data: ParsedCompanyQR }
  | { type: 'campaign'; data: ParsedCampaignQR }
  | { type: 'campaign_item'; data: ParsedCampaignItemQR }
  | { type: 'unknown'; data: null };

/**
 * Generate QR code for a reward
 * Format: REWARD:{id}:{name}:{requirement}:{rewardType}:{products}
 */
export const generateRewardQRCode = (
  id: string,
  name: string,
  requirement: number,
  rewardType: 'free_product' | 'discount' | 'other',
  products?: string[]
): string => {
  const productsValue = products && products.length > 0
    ? products.join(',')
    : '';
  return `REWARD:${id}:${name}:${requirement}:${rewardType}:${productsValue}`;
};

/**
 * Generate QR code for a company/business
 * Format: COMPANY:{number}:{name}
 * Number should be 7 digits (0000001-1000000)
 */
export const generateCompanyQRCode = (
  businessNumber: string | number,
  name: string
): string => {
  // Ensure number is 7 digits
  const numberStr = typeof businessNumber === 'number'
    ? businessNumber.toString().padStart(7, '0')
    : businessNumber.padStart(7, '0');
  return `COMPANY:${numberStr}:${name}`;
};

/**
 * Generate QR code for a campaign
 * Format: CAMPAIGN:{id}:{name}:{description}
 */
export const generateCampaignQRCode = (
  id: string,
  name: string,
  description: string = ''
): string => {
  return `CAMPAIGN:${id}:${name}:${description}`;
};

/**
 * Parse QR code - handles REWARD, COMPANY, and CAMPAIGN formats
 */
export const parseQRCode = (qrValue: string): ParsedQR => {
  if (!qrValue || typeof qrValue !== 'string') {
    return { type: 'unknown', data: null };
  }
  
  const normalizedQr = qrValue.trim();
  
  // Handle COMPANY QR codes (business QR codes)
  if (normalizedQr.startsWith('COMPANY:')) {
    const parts = normalizedQr.split(':');
    if (parts.length >= 3) {
      return {
        type: 'company',
        data: {
          number: parts[1] || '',
          name: parts.slice(2).join(':') || 'Business',
        },
      };
    }
    return { type: 'unknown', data: null };
  }
  
  // Handle CAMPAIGN_ITEM QR codes (from business app)
  // Format: CAMPAIGN_ITEM:{businessId}:{businessName}:{campaignName}:{itemType}:{itemName}:{startDate}:{endDate}
  if (normalizedQr.startsWith('CAMPAIGN_ITEM:')) {
    const parts = normalizedQr.split(':');
    if (parts.length >= 8) {
      const businessId = (parts[1] || '').trim();
      const businessName = (parts[2] || '').trim() || undefined;
      const campaignName = parts[3] || 'Campaign';
      return {
        type: 'campaign_item',
        data: {
          businessId,
          businessName,
          campaignId: businessId,
          campaignName,
          itemType: parts[4] || 'product',
          itemName: parts[5] || '',
          startDate: parts[6] || '',
          endDate: parts[7] || '',
        },
      };
    }
    if (parts.length >= 7) {
      const businessId = (parts[1] || '').trim();
      const campaignName = parts[2] || 'Campaign';
      return {
        type: 'campaign_item',
        data: {
          businessId,
          campaignId: businessId,
          campaignName,
          itemType: parts[3] || 'product',
          itemName: parts[4] || '',
          startDate: parts[5] || '',
          endDate: parts[6] || '',
        },
      };
    }
    return { type: 'unknown', data: null };
  }
  
  // Handle CAMPAIGN QR codes
  // Format (enhanced): CAMPAIGN:{id}:{name}:{description}:{businessId}:{businessName}:{pointsRequired}:{pointsPerScan}
  // Format (simple): CAMPAIGN:{id}:{name}:{description}
  if (normalizedQr.startsWith('CAMPAIGN:')) {
    const parts = normalizedQr.split(':');
    if (parts.length >= 3) {
      const campaignData: ParsedCampaignQR = {
        id: parts[1] || '',
        name: parts[2] || 'Campaign',
        description: parts[3] || '',
      };

      // Enhanced format with additional fields (parts.length >= 4)
      if (parts.length >= 5) {
        campaignData.businessId = parts[4] || undefined;
      }
      if (parts.length >= 6) {
        campaignData.businessName = parts[5] || undefined;
      }
      if (parts.length >= 7) {
        const pointsRequired = parseInt(parts[6], 10);
        if (!isNaN(pointsRequired)) {
          campaignData.pointsRequired = pointsRequired;
        }
      }
      if (parts.length >= 8) {
        const pointsPerScan = parseInt(parts[7], 10);
        if (!isNaN(pointsPerScan)) {
          campaignData.pointsPerScan = pointsPerScan;
        }
      }
      // Components could be in remaining parts (comma-separated or colon-separated)
      if (parts.length >= 9) {
        const componentsStr = parts.slice(8).join(':');
        if (componentsStr.includes(',')) {
          campaignData.components = componentsStr.split(',').map(c => c.trim()).filter(c => c);
        } else if (componentsStr) {
          campaignData.components = [componentsStr];
        }
      }

      return {
        type: 'campaign',
        data: campaignData,
      };
    }
    return { type: 'unknown', data: null };
  }
  
  // Handle REWARD QR codes
  // Format: REWARD:{businessId}:{businessName}:{id}:{name}:{requirement}:{rewardType}:{products}:{pinCode}
  if (normalizedQr.startsWith('REWARD:')) {
    const withoutPrefix = normalizedQr.substring(7);
    const parts = withoutPrefix.split(':');

    if (parts.length >= 8) {
      const businessId = parts[0] || '';
      const businessName = (parts[1] || '').trim() || undefined;
      const id = parts[2] || 'unknown';
      const pinCode = parts[parts.length - 1] || '';
      const productsStr = parts[parts.length - 2] || '';
      const rewardType = parts[parts.length - 3] || 'free_product';
      const requirement = parseInt(parts[parts.length - 4], 10) || 1;
      const name = parts.slice(3, parts.length - 4).join(':') || 'Unnamed Reward';
      const products = productsStr ? productsStr.split(',').filter(p => p.trim()) : [];

      return {
        type: 'reward',
        data: {
          businessId,
          businessName,
          id,
          name,
          requirement,
          rewardType,
          products,
          pinCode,
        },
      };
    }
    if (parts.length >= 7) {
      const businessId = parts[0] || '';
      const id = parts[1] || 'unknown';
      const pinCode = parts[parts.length - 1] || '';
      const productsStr = parts[parts.length - 2] || '';
      const rewardType = parts[parts.length - 3] || 'free_product';
      const requirement = parseInt(parts[parts.length - 4], 10) || 1;
      const name = parts.slice(2, parts.length - 4).join(':') || 'Unnamed Reward';
      const products = productsStr ? productsStr.split(',').filter(p => p.trim()) : [];

      return {
        type: 'reward',
        data: {
          businessId,
          id,
          name,
          requirement,
          rewardType,
          products,
          pinCode,
        },
      };
    }

    return { type: 'unknown', data: null };
  }
  
  return { type: 'unknown', data: null };
};

/**
 * Check if QR code is valid (starts with known prefix)
 */
export const isValidQRCode = (qrValue: string): boolean => {
  if (!qrValue || typeof qrValue !== 'string') {
    return false;
  }
  const normalized = qrValue.trim();
  return normalized.startsWith('REWARD:') || 
         normalized.startsWith('COMPANY:') || 
         normalized.startsWith('CAMPAIGN:') ||
         normalized.startsWith('CAMPAIGN_ITEM:');
};
