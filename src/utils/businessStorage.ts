// Local storage for member businesses - saves to /tmp/businesses.json
// Uses Node.js fs when available, falls back to localStorage for web

// Safe environment detection - wrapped to prevent any execution errors
let isWeb = false;
let isNode = false;

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

// Businesses file path
const BUSINESSES_FILE_PATH = '/tmp/businesses.json';

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

// Member Business interface
export interface MemberBusiness {
  id: string; // Business ID (from QR code or generated)
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    linkedin?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const saveBusinesses = async (businesses: MemberBusiness[]): Promise<void> => {
  try {
    const fileSystem = loadFs();
    if (isNode && fileSystem) {
      // Ensure /tmp directory exists
      const tmpDir = '/tmp';
      try {
        if (!fileSystem.existsSync(tmpDir)) {
          fileSystem.mkdirSync(tmpDir, { recursive: true });
        }
        
        // Write businesses to file
        if (fileSystem.promises && fileSystem.promises.writeFile) {
          await fileSystem.promises.writeFile(
            BUSINESSES_FILE_PATH,
            JSON.stringify(businesses, null, 2),
            'utf8'
          );
        } else {
          fileSystem.writeFileSync(
            BUSINESSES_FILE_PATH,
            JSON.stringify(businesses, null, 2),
            'utf8'
          );
        }
        console.log(`✅ Member businesses saved to ${BUSINESSES_FILE_PATH} (${businesses.length} businesses)`);
      } catch (fileError) {
        console.error('Error writing businesses to file system:', fileError);
        // Fallback to localStorage
        if (isWeb) {
          localStorage.setItem('canny_carrot_member_businesses', JSON.stringify(businesses));
          console.log('Businesses saved to localStorage (fallback)');
        }
      }
    } else if (isWeb) {
      // Fallback to localStorage for web
      localStorage.setItem('canny_carrot_member_businesses', JSON.stringify(businesses));
      console.log('Businesses saved to localStorage (web environment)');
    }
  } catch (error) {
    console.error('Error saving businesses:', error);
    // Final fallback to localStorage if available
    if (isWeb) {
      try {
        localStorage.setItem('canny_carrot_member_businesses', JSON.stringify(businesses));
        console.log('Businesses saved to localStorage (error fallback)');
      } catch (localError) {
        console.error('Error saving to localStorage fallback:', localError);
      }
    }
  }
};

export const loadBusinesses = async (): Promise<MemberBusiness[]> => {
  try {
    const fileSystem = loadFs();
    if (isNode && fileSystem) {
      // Try to read from /tmp/businesses.json
      try {
        if (fileSystem.existsSync(BUSINESSES_FILE_PATH)) {
          let fileContent: string;
          if (fileSystem.promises && fileSystem.promises.readFile) {
            fileContent = await fileSystem.promises.readFile(BUSINESSES_FILE_PATH, 'utf8');
          } else {
            fileContent = fileSystem.readFileSync(BUSINESSES_FILE_PATH, 'utf8');
          }
          const businesses = JSON.parse(fileContent);
          console.log(`✅ Member businesses loaded from ${BUSINESSES_FILE_PATH} (${businesses.length} businesses)`);
          return Array.isArray(businesses) ? businesses : [];
        } else {
          console.log(`ℹ️ Businesses file not found at ${BUSINESSES_FILE_PATH}, returning empty array`);
          return [];
        }
      } catch (fileError) {
        console.error('Error reading businesses from file system:', fileError);
        // Fallback to localStorage
        if (isWeb) {
          try {
            const stored = localStorage.getItem('canny_carrot_member_businesses');
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
        const stored = localStorage.getItem('canny_carrot_member_businesses');
        if (stored) {
          const businesses = JSON.parse(stored);
          console.log(`Businesses loaded from localStorage (${businesses.length} businesses)`);
          return Array.isArray(businesses) ? businesses : [];
        }
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  } catch (error) {
    console.error('Error loading businesses:', error);
    // Final fallback to localStorage if available
    if (isWeb) {
      try {
        const stored = localStorage.getItem('canny_carrot_member_businesses');
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

/**
 * Add or update a member business
 */
export const addOrUpdateBusiness = async (business: MemberBusiness): Promise<void> => {
  const businesses = await loadBusinesses();
  const existingIndex = businesses.findIndex(b => b.id === business.id);
  
  if (existingIndex >= 0) {
    // Update existing
    businesses[existingIndex] = {
      ...business,
      updatedAt: new Date().toISOString(),
    };
  } else {
    // Add new
    businesses.push(business);
  }
  
  await saveBusinesses(businesses);
};


