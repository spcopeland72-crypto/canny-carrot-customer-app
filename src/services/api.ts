/**
 * Canny Carrot API Service
 * Connects Customer App to Redis-backed API
 */

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Types
export interface Member {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  preferences: {
    notifications: boolean;
    marketing: boolean;
  };
  totalStamps: number;
  totalRedemptions: number;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  address: {
    line1: string;
    city: string;
    postcode: string;
  };
  category: string;
  distance?: number; // km from user
}

export interface Reward {
  id: string;
  businessId: string;
  name: string;
  description: string;
  stampsRequired: number;
  type: 'product' | 'discount' | 'freebie' | 'experience';
  value?: number;
  isActive: boolean;
}

export interface LoyaltyCard {
  businessId: string;
  businessName: string;
  businessLogo?: string;
  currentStamps: number;
  rewards: Reward[];
  nextReward?: Reward;
  stampsToNextReward?: number;
  totalVisits: number;
  lastVisit?: string;
}

export interface LeaderboardEntry {
  rank: number;
  memberId: string;
  firstName: string;
  lastName: string;
  totalStamps: number;
  totalRedemptions: number;
  badges: string[];
}

// API Response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Helper for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// ============================================
// MEMBER (CUSTOMER) ENDPOINTS
// ============================================

export const memberApi = {
  // Register a new member
  async register(memberData: {
    email: string;
    phone?: string;
    firstName: string;
    lastName?: string;
    preferences?: {
      notifications: boolean;
      marketing: boolean;
    };
  }): Promise<ApiResponse<Member>> {
    return apiCall<Member>('/members', {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  },

  // Get member profile
  async getProfile(memberId: string): Promise<ApiResponse<Member>> {
    return apiCall<Member>(`/members/${memberId}`);
  },

  // Update member profile
  async updateProfile(memberId: string, updates: Partial<Member>): Promise<ApiResponse<Member>> {
    return apiCall<Member>(`/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Get member's stamps at a specific business
  async getStamps(memberId: string, businessId: string): Promise<ApiResponse<{
    stampCount: number;
    availableRewards: Reward[];
    nextReward: Reward | null;
    stampsUntilNextReward: number | null;
  }>> {
    return apiCall(`/stamps/check?memberId=${memberId}&businessId=${businessId}`);
  },

  // Get all loyalty cards for a member
  async getLoyaltyCards(memberId: string): Promise<ApiResponse<LoyaltyCard[]>> {
    return apiCall<LoyaltyCard[]>(`/members/${memberId}/cards`);
  },
};

// ============================================
// BUSINESS DISCOVERY ENDPOINTS
// ============================================

export const discoveryApi = {
  // Find nearby businesses with rewards programs
  async findNearby(location?: {
    lat: number;
    lng: number;
  }, category?: string): Promise<ApiResponse<Business[]>> {
    const params = new URLSearchParams();
    if (location) {
      params.append('lat', location.lat.toString());
      params.append('lng', location.lng.toString());
    }
    if (category) {
      params.append('category', category);
    }
    return apiCall<Business[]>(`/businesses?${params}`);
  },

  // Search businesses by name
  async search(query: string): Promise<ApiResponse<Business[]>> {
    return apiCall<Business[]>(`/businesses?search=${encodeURIComponent(query)}`);
  },

  // Get business details
  async getBusinessDetails(businessId: string): Promise<ApiResponse<Business & {
    rewards: Reward[];
    openNow?: boolean;
  }>> {
    return apiCall(`/businesses/${businessId}`);
  },

  // Get businesses by category
  async getByCategory(category: string): Promise<ApiResponse<Business[]>> {
    return apiCall<Business[]>(`/businesses?category=${category}`);
  },

  // Get featured/promoted businesses
  async getFeatured(): Promise<ApiResponse<Business[]>> {
    return apiCall<Business[]>('/businesses?featured=true');
  },
};

// ============================================
// STAMP & REWARD ENDPOINTS
// ============================================

export const rewardsApi = {
  // Earn a stamp (customer shows QR to business)
  async earnStamp(memberId: string, businessId: string, qrCode?: string): Promise<ApiResponse<{
    newStampCount: number;
    rewardEarned: boolean;
    reward?: Reward;
    message: string;
  }>> {
    return apiCall('/stamps', {
      method: 'POST',
      body: JSON.stringify({
        memberId,
        businessId,
        method: qrCode ? 'qr' : 'manual',
      }),
    });
  },

  // Redeem a reward
  async redeemReward(memberId: string, businessId: string, rewardId: string): Promise<ApiResponse<{
    success: boolean;
    redemptionCode: string;
    reward: Reward;
    newStampCount: number;
  }>> {
    return apiCall('/stamps/redeem', {
      method: 'POST',
      body: JSON.stringify({
        memberId,
        businessId,
        rewardId,
      }),
    });
  },

  // Get available rewards at a business
  async getAvailableRewards(businessId: string): Promise<ApiResponse<Reward[]>> {
    return apiCall<Reward[]>(`/rewards?businessId=${businessId}&active=true`);
  },

  // Get reward history for member
  async getRedemptionHistory(memberId: string): Promise<ApiResponse<any[]>> {
    return apiCall(`/members/${memberId}/redemptions`);
  },
};

// ============================================
// GAMIFICATION ENDPOINTS
// ============================================

export const gamificationApi = {
  // Get leaderboard
  async getLeaderboard(type: 'stamps' | 'redemptions' | 'referrals' = 'stamps', limit: number = 10): Promise<ApiResponse<LeaderboardEntry[]>> {
    return apiCall<LeaderboardEntry[]>(`/gamification/leaderboard?type=${type}&limit=${limit}`);
  },

  // Get member's achievements
  async getAchievements(memberId: string): Promise<ApiResponse<{
    earned: string[];
    available: string[];
    progress: Record<string, number>;
  }>> {
    return apiCall(`/gamification/achievements/${memberId}`);
  },

  // Get member's rank
  async getMemberRank(memberId: string): Promise<ApiResponse<{
    rank: number;
    totalMembers: number;
    percentile: number;
    stats: {
      totalStamps: number;
      totalRedemptions: number;
      referrals: number;
    };
  }>> {
    return apiCall(`/gamification/rank/${memberId}`);
  },

  // Log social share (for influencer tracking)
  async logSocialShare(memberId: string, platform: string, businessId?: string): Promise<ApiResponse<{
    points: number;
    newShareCount: number;
  }>> {
    return apiCall('/gamification/social-share', {
      method: 'POST',
      body: JSON.stringify({
        memberId,
        platform,
        businessId,
      }),
    });
  },

  // Get referral code
  async getReferralCode(memberId: string): Promise<ApiResponse<{
    code: string;
    totalReferrals: number;
    pendingRewards: number;
  }>> {
    return apiCall(`/gamification/referral/${memberId}`);
  },

  // Submit referral
  async submitReferral(referralCode: string, newMemberId: string): Promise<ApiResponse<{
    success: boolean;
    reward: any;
  }>> {
    return apiCall('/gamification/referral', {
      method: 'POST',
      body: JSON.stringify({
        referralCode,
        newMemberId,
      }),
    });
  },
};

// ============================================
// QR CODE UTILITIES
// ============================================

export const qrUtils = {
  // Generate QR code data for customer to show businesses
  generateCustomerQR(memberId: string): string {
    const data = {
      type: 'customer',
      memberId,
      timestamp: Date.now(),
      version: '1',
    };
    return `CANNY:${btoa(JSON.stringify(data))}`;
  },

  // Parse QR code from business
  parseBusinessQR(qrData: string): {
    valid: boolean;
    businessId?: string;
    rewardId?: string;
    action?: string;
  } {
    try {
      if (qrData.startsWith('CANNY:')) {
        const decoded = JSON.parse(atob(qrData.replace('CANNY:', '')));
        return {
          valid: true,
          businessId: decoded.businessId,
          rewardId: decoded.rewardId,
          action: decoded.type,
        };
      }
      return { valid: false };
    } catch {
      return { valid: false };
    }
  },
};

// ============================================
// NOTIFICATIONS
// ============================================

export const notificationApi = {
  // Register device for push notifications
  async registerDevice(memberId: string, token: string, platform: 'ios' | 'android' | 'web'): Promise<ApiResponse<void>> {
    return apiCall('/notifications/register', {
      method: 'POST',
      body: JSON.stringify({
        memberId,
        token,
        platform,
      }),
    });
  },

  // Update notification preferences
  async updatePreferences(memberId: string, preferences: {
    push: boolean;
    email: boolean;
    sms: boolean;
    marketing: boolean;
  }): Promise<ApiResponse<void>> {
    return apiCall(`/notifications/preferences/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  },

  // Get notification history
  async getHistory(memberId: string): Promise<ApiResponse<any[]>> {
    return apiCall(`/notifications/history/${memberId}`);
  },
};

export default {
  member: memberApi,
  discovery: discoveryApi,
  rewards: rewardsApi,
  gamification: gamificationApi,
  qr: qrUtils,
  notifications: notificationApi,
};




















