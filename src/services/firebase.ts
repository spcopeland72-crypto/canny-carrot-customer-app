/**
 * Firebase Cloud Messaging Configuration
 * For Push Notifications in Canny Carrot Customer App
 */

import { Platform } from 'react-native';

// Firebase Web Config (for Expo/Web)
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'canny-carrot.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'canny-carrot',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'canny-carrot.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_SENDER_ID',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || 'YOUR_APP_ID',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-XXXXXXXX',
};

// FCM Token storage key
const FCM_TOKEN_KEY = 'canny-carrot-fcm-token';

/**
 * Push Notification Service
 * Handles FCM registration and notification handling
 */
export class PushNotificationService {
  private static instance: PushNotificationService;
  private fcmToken: string | null = null;
  private notificationListeners: Array<(notification: any) => void> = [];

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Initialize push notifications
   * Call this on app startup
   */
  async initialize(): Promise<string | null> {
    try {
      // For Expo, we use expo-notifications
      // This is a placeholder - actual implementation uses expo-notifications
      
      if (Platform.OS === 'web') {
        return this.initializeWeb();
      } else {
        return this.initializeMobile();
      }
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return null;
    }
  }

  /**
   * Initialize for web (Firebase Web SDK)
   */
  private async initializeWeb(): Promise<string | null> {
    try {
      // Check if browser supports notifications
      if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return null;
      }

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }

      // In production, you would initialize Firebase and get token:
      // const messaging = getMessaging(firebaseApp);
      // const token = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' });
      
      // For now, generate a placeholder token
      this.fcmToken = `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('Web push notifications initialized');
      return this.fcmToken;
    } catch (error) {
      console.error('Web push initialization error:', error);
      return null;
    }
  }

  /**
   * Initialize for mobile (Expo Notifications)
   */
  private async initializeMobile(): Promise<string | null> {
    try {
      // This is where you would use expo-notifications:
      // import * as Notifications from 'expo-notifications';
      // const { status } = await Notifications.requestPermissionsAsync();
      // const token = await Notifications.getExpoPushTokenAsync();
      
      // For now, generate a placeholder token
      this.fcmToken = `mobile-${Platform.OS}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('Mobile push notifications initialized');
      return this.fcmToken;
    } catch (error) {
      console.error('Mobile push initialization error:', error);
      return null;
    }
  }

  /**
   * Get the current FCM token
   */
  getToken(): string | null {
    return this.fcmToken;
  }

  /**
   * Register token with backend
   */
  async registerWithBackend(memberId: string, apiBaseUrl: string): Promise<boolean> {
    if (!this.fcmToken) {
      console.log('No FCM token available');
      return false;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/notifications/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberId,
          token: this.fcmToken,
          platform: Platform.OS,
        }),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Failed to register FCM token with backend:', error);
      return false;
    }
  }

  /**
   * Add notification listener
   */
  addNotificationListener(callback: (notification: any) => void): () => void {
    this.notificationListeners.push(callback);
    
    // Return cleanup function
    return () => {
      this.notificationListeners = this.notificationListeners.filter(
        listener => listener !== callback
      );
    };
  }

  /**
   * Handle incoming notification
   */
  handleNotification(notification: any) {
    console.log('Received notification:', notification);
    
    // Notify all listeners
    this.notificationListeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Notification listener error:', error);
      }
    });
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'web') {
      if (!('Notification' in window)) {
        return false;
      }
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } else {
      // For mobile, this would use expo-notifications
      // const { status } = await Notifications.requestPermissionsAsync();
      // return status === 'granted';
      return true;
    }
  }

  /**
   * Show local notification (for testing)
   */
  async showLocalNotification(title: string, body: string, data?: any) {
    if (Platform.OS === 'web') {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/assets/icon.png',
          badge: '/assets/badge.png',
          data,
        });
      }
    } else {
      // For mobile, this would use expo-notifications
      // await Notifications.scheduleNotificationAsync({
      //   content: { title, body, data },
      //   trigger: null, // Immediate
      // });
      console.log('Local notification:', { title, body, data });
    }
  }
}

// Export singleton instance
export const pushNotifications = PushNotificationService.getInstance();

/**
 * Notification Types for Canny Carrot
 */
export type NotificationType = 
  | 'stamp_earned'
  | 'reward_ready'
  | 'reward_redeemed'
  | 'campaign_alert'
  | 'geofence_nearby'
  | 'achievement_unlocked'
  | 'leaderboard_update'
  | 'referral_success'
  | 'system';

export interface CannyCarrotNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: {
    businessId?: string;
    businessName?: string;
    rewardId?: string;
    rewardName?: string;
    campaignId?: string;
    achievementId?: string;
    deepLink?: string;
  };
  timestamp: string;
  read: boolean;
}

/**
 * Notification Handler Hooks
 */
export const useNotifications = () => {
  const showStampEarned = (businessName: string, stampCount: number, stampsToReward: number) => {
    pushNotifications.showLocalNotification(
      '🎉 Stamp Earned!',
      `You got a stamp at ${businessName}! ${stampsToReward > 0 ? `${stampsToReward} more to go!` : 'Reward ready!'}`
    );
  };

  const showRewardReady = (businessName: string, rewardName: string) => {
    pushNotifications.showLocalNotification(
      '🎁 Reward Ready!',
      `Claim your ${rewardName} at ${businessName}!`
    );
  };

  const showNearbyBusiness = (businessName: string, distance: string) => {
    pushNotifications.showLocalNotification(
      `📍 ${businessName} is nearby!`,
      `You're ${distance} away. Pop in for a stamp!`
    );
  };

  const showAchievementUnlocked = (achievementName: string, points: number) => {
    pushNotifications.showLocalNotification(
      '🏆 Achievement Unlocked!',
      `You earned "${achievementName}" (+${points} points)`
    );
  };

  return {
    showStampEarned,
    showRewardReady,
    showNearbyBusiness,
    showAchievementUnlocked,
  };
};

export default pushNotifications;




















