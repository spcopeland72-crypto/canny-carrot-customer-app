// Local storage for customer rewards - saves to /tmp/rewards.json
// Uses Node.js fs when available, AsyncStorage for React Native, falls back to localStorage for web

// Safe environment detection - wrapped to prevent any execution errors
let isWeb = false;
let isNode = false;
let isReactNative = false;
let AsyncStorage: any = null;

try {
  isWeb = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
} catch (e) {
  // Ignore errors
}

try {
  isNode = typeof process !== 'undefined' && 
           process.versions && 
           process.versions.node && 
           typeof require !== 'undefined';
} catch (e) {
  // Ignore errors
}

try {
  // Check if we're in React Native environment
  isReactNative = typeof require !== 'undefined';
  if (isReactNative && !isWeb && !isNode) {
    try {
      AsyncStorage = require('@react-native-async-storage/async-storage').default;
      console.log('✅ AsyncStorage loaded for React Native');
    } catch (e) {
      console.warn('AsyncStorage not available:', e);
    }
  }
} catch (e) {
  // Ignore errors
}

// Rewards file path
const REWARDS_FILE_PATH = '/tmp/rewards.json';

// Dynamically import fs only in Node environment - lazy load to prevent web errors
let fs: any = null;
let fsLoadAttempted = false;
const loadFs = () => {
  if (fs) return fs;
  if (fsLoadAttempted) return null;
  // For web, never try to load fs
  if (!isNode) {
    return null;
  }
  if (isNode) {
    try {
      fsLoadAttempted = true;
      // Only try to require fs in Node environment
      // Check if require exists first and fs is available (Node.js only, not React Native)
      if (typeof require === 'function' && typeof process !== 'undefined' && process.versions && process.versions.node) {
        try {
          fs = require('fs');
        } catch (e) {
          // fs not available (React Native environment)
        }
      }
    } catch (e) {
      console.warn('fs module not available:', e);
      return null;
    }
  }
  return fs;
};

// Customer Reward interface - matches company rewards format + points earned
export interface CustomerReward {
  id: string;
  name: string;
  count: number; // Current progress (e.g., 1 of 4 purchases)
  total: number; // Total needed to complete (e.g., 4 purchases)
  icon: string;
  businessLogo?: string; // Business logo/icon from QR code
  type?: 'product' | 'action';
  requirement: number; // Number of purchases/actions needed
  pointsPerPurchase?: number; // Points allocated per purchase/action (default: 1)
  rewardType?: 'free_product' | 'discount' | 'other';
  selectedProducts?: string[];
  selectedActions?: string[];
  qrCode?: string; // QR code value
  pointsEarned: number; // Total points earned for this reward (customer-specific)
  pinCode?: string; // PIN code for redemption (from QR code)
  businessId?: string; // Business/member ID
  businessName?: string; // Business/member name
  createdAt?: string; // When reward was first scanned (for sorting)
  lastScannedAt?: string; // Track last scan time
  isEarned?: boolean; // Whether reward has been earned (points requirement met)
  /** For campaigns: which products/actions collected (for modal labels and duplicate detection) */
  collectedItems?: { itemType: string; itemName: string }[];
}

export const saveRewards = async (rewards: CustomerReward[]): Promise<void> => {
  try {
    // Try AsyncStorage first for React Native
    if (AsyncStorage) {
      try {
        await AsyncStorage.setItem('canny_carrot_customer_rewards', JSON.stringify(rewards));
        console.log(`✅ Customer rewards saved to AsyncStorage (${rewards.length} rewards)`);
        return; // Success, exit early
      } catch (asyncError) {
        console.error('Error saving to AsyncStorage:', asyncError);
        // Continue to fallback
      }
    }
    
    const fileSystem = loadFs();
    if (isNode && fileSystem) {
      // Ensure /tmp directory exists
      const tmpDir = '/tmp';
      try {
        if (!fileSystem.existsSync(tmpDir)) {
          fileSystem.mkdirSync(tmpDir, { recursive: true });
        }
        
        // Write rewards to file
        if (fileSystem.promises && fileSystem.promises.writeFile) {
          await fileSystem.promises.writeFile(
            REWARDS_FILE_PATH,
            JSON.stringify(rewards, null, 2),
            'utf8'
          );
        } else {
          fileSystem.writeFileSync(
            REWARDS_FILE_PATH,
            JSON.stringify(rewards, null, 2),
            'utf8'
          );
        }
        console.log(`✅ Customer rewards saved to ${REWARDS_FILE_PATH} (${rewards.length} rewards)`);
        return; // Success, exit early
      } catch (fileError) {
        console.error('Error writing rewards to file system:', fileError);
        // Fallback to localStorage
        if (isWeb) {
          localStorage.setItem('canny_carrot_customer_rewards', JSON.stringify(rewards));
          console.log('Rewards saved to localStorage (fallback)');
          return;
        }
      }
    } else if (isWeb) {
      // Fallback to localStorage for web
      localStorage.setItem('canny_carrot_customer_rewards', JSON.stringify(rewards));
      console.log('Rewards saved to localStorage (web environment)');
      return; // Success, exit early
    }
    
    // If we get here, no storage method worked
    console.error('⚠️ No storage method available for saving rewards');
  } catch (error) {
    console.error('Error saving rewards:', error);
    // Final fallback to localStorage if available
    if (isWeb) {
      try {
        localStorage.setItem('canny_carrot_customer_rewards', JSON.stringify(rewards));
        console.log('Rewards saved to localStorage (error fallback)');
      } catch (localError) {
        console.error('Error saving to localStorage fallback:', localError);
      }
    }
  }
};

export const loadRewards = async (): Promise<CustomerReward[]> => {
  try {
    // Try AsyncStorage first for React Native
    if (AsyncStorage) {
      try {
        const stored = await AsyncStorage.getItem('canny_carrot_customer_rewards');
        if (stored) {
          const rewards = JSON.parse(stored);
          console.log(`✅ Customer rewards loaded from AsyncStorage (${rewards.length} rewards)`);
          return Array.isArray(rewards) ? rewards : [];
        } else {
          console.log('ℹ️ No rewards found in AsyncStorage, returning empty array');
          return [];
        }
      } catch (asyncError) {
        console.error('Error loading from AsyncStorage:', asyncError);
        // Continue to fallback
      }
    }
    
    const fileSystem = loadFs();
    if (isNode && fileSystem) {
      // Try to read from /tmp/rewards.json
      try {
        if (fileSystem.existsSync(REWARDS_FILE_PATH)) {
          let fileContent: string;
          if (fileSystem.promises && fileSystem.promises.readFile) {
            fileContent = await fileSystem.promises.readFile(REWARDS_FILE_PATH, 'utf8');
          } else {
            fileContent = fileSystem.readFileSync(REWARDS_FILE_PATH, 'utf8');
          }
          const rewards = JSON.parse(fileContent);
          console.log(`✅ Customer rewards loaded from ${REWARDS_FILE_PATH} (${rewards.length} rewards)`);
          return Array.isArray(rewards) ? rewards : [];
        } else {
          console.log(`ℹ️ Rewards file not found at ${REWARDS_FILE_PATH}, returning empty array`);
          return [];
        }
      } catch (fileError) {
        console.error('Error reading rewards from file system:', fileError);
        // Fallback to localStorage
        if (isWeb) {
          try {
            const stored = localStorage.getItem('canny_carrot_customer_rewards');
            if (stored) {
              const parsed = JSON.parse(stored);
              return Array.isArray(parsed) ? parsed : [];
            }
          } catch (e) {
            // Ignore localStorage errors
          }
        }
      }
    } else if (isWeb) {
      // Fallback to localStorage for web
      try {
        const stored = localStorage.getItem('canny_carrot_customer_rewards');
        if (stored) {
          const rewards = JSON.parse(stored);
          console.log(`Rewards loaded from localStorage (${rewards.length} rewards)`);
          return Array.isArray(rewards) ? rewards : [];
        }
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  } catch (error) {
    console.error('Error loading rewards:', error);
    // Final fallback to localStorage if available
    if (isWeb) {
      try {
        const stored = localStorage.getItem('canny_carrot_customer_rewards');
        if (stored) {
          const parsed = JSON.parse(stored);
          return Array.isArray(parsed) ? parsed : [];
        }
      } catch (localError) {
        console.error('Error loading from localStorage fallback:', localError);
      }
    }
  }
  return [];
};

