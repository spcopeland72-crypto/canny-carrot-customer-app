/**
 * Local Storage Adapter - Offline-First Storage (Customer App)
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  CUSTOMER_REWARDS: 'canny_carrot:customer_rewards',
  REWARDS: 'canny_carrot:rewards', // Business rewards (read-only)
  CAMPAIGNS: 'canny_carrot:campaigns', // Business campaigns (read-only)
  SYNC_QUEUE: 'canny_carrot:sync_queue',
  SYNC_STATUS: 'canny_carrot:sync_status',
  DEVICE_ID: 'canny_carrot:device_id',
  /** Customer UUID from API (primary id). Do not use email/device as customer id. */
  CUSTOMER_UUID: 'canny_carrot:customer_uuid',
} as const;

const DB_NAME = 'CannyCarrotCustomerDB';
const DB_VERSION = 1;

let db: IDBDatabase | null = null;

export const getDeviceId = async (): Promise<string> => {
  if (Platform.OS === 'web') {
    let deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
    }
    return deviceId;
  }
  // Native: Use AsyncStorage
  try {
    let deviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!deviceId) {
      deviceId = `device-native-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
    }
    return deviceId;
  } catch (error) {
    // Fallback if AsyncStorage fails
    return `device-native-${Date.now()}`;
  }
};

/** Customer UUID from API. Primary id; used for sync / by-id. */
export const getCustomerId = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(STORAGE_KEYS.CUSTOMER_UUID);
    }
    return await AsyncStorage.getItem(STORAGE_KEYS.CUSTOMER_UUID);
  } catch {
    return null;
  }
};

export const setCustomerId = async (uuid: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(STORAGE_KEYS.CUSTOMER_UUID, uuid);
    } else {
      await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMER_UUID, uuid);
    }
  } catch (e) {
    console.warn('setCustomerId failed:', e);
  }
};

export const clearCustomerId = async (): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(STORAGE_KEYS.CUSTOMER_UUID);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.CUSTOMER_UUID);
    }
  } catch (e) {
    console.warn('clearCustomerId failed:', e);
  }
};

const initIndexedDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (Platform.OS !== 'web' || typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      if (!database.objectStoreNames.contains('customerRewards')) {
        database.createObjectStore('customerRewards', { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains('rewards')) {
        database.createObjectStore('rewards', { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains('campaigns')) {
        database.createObjectStore('campaigns', { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains('syncQueue')) {
        database.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

const getDB = async (): Promise<IDBDatabase> => {
  if (db) return db;
  if (Platform.OS === 'web' && typeof indexedDB !== 'undefined') {
    try {
      db = await initIndexedDB();
      return db;
    } catch (error) {
      console.warn('IndexedDB initialization failed, using localStorage:', error);
    }
  }
  throw new Error('IndexedDB not available');
};

const idbOperations = {
  get: async <T>(storeName: string, key: string): Promise<T | null> => {
    try {
      const database = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = database.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn(`IDB GET failed for ${storeName}/${key}:`, error);
      return null;
    }
  },

  set: async <T>(storeName: string, key: string, value: T): Promise<void> => {
    try {
      const database = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = database.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put({ id: key, ...value });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn(`IDB SET failed for ${storeName}/${key}:`, error);
      throw error;
    }
  },

  getAll: async <T>(storeName: string): Promise<T[]> => {
    try {
      const database = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = database.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn(`IDB GETALL failed for ${storeName}:`, error);
      return [];
    }
  },

  delete: async (storeName: string, key: string): Promise<void> => {
    try {
      const database = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = database.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn(`IDB DELETE failed for ${storeName}/${key}:`, error);
      throw error;
    }
  },
};

const localStorageOperations = {
  get: async <T>(key: string): Promise<T | null> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage === 'undefined') return null;
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } else {
        // Native: Use AsyncStorage
        const item = await AsyncStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      }
    } catch (error) {
      console.warn(`Storage GET failed for ${key}:`, error);
      return null;
    }
  },

  set: async <T>(key: string, value: T): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, JSON.stringify(value));
        }
      } else {
        // Native: Use AsyncStorage
        await AsyncStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.warn(`Storage SET failed for ${key}:`, error);
    }
  },

  delete: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
        }
      } else {
        // Native: Use AsyncStorage
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Storage DELETE failed for ${key}:`, error);
    }
  },

  getAllKeys: async (): Promise<string[]> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage === 'undefined') return [];
        return Object.keys(localStorage);
      } else {
        // Native: Use AsyncStorage
        return await AsyncStorage.getAllKeys();
      }
    } catch (error) {
      console.warn(`Storage GETALLKEYS failed:`, error);
      return [];
    }
  },
};

export const storage = {
  get: async <T>(key: string): Promise<T | null> => {
    if (Platform.OS === 'web' && typeof indexedDB !== 'undefined') {
      try {
        const storeName = key.includes('customer_reward') ? 'customerRewards' : 
                         key.includes('reward') ? 'rewards' :
                         key.includes('campaign') ? 'campaigns' : 'default';
        const result = await idbOperations.get<T>(storeName, key);
        if (result) return result as T;
      } catch (error) {
        // Fall through to localStorage
      }
    }
    return await localStorageOperations.get<T>(key);
  },

  set: async <T>(key: string, value: T): Promise<void> => {
    if (Platform.OS === 'web' && typeof indexedDB !== 'undefined') {
      try {
        const storeName = key.includes('customer_reward') ? 'customerRewards' : 
                         key.includes('reward') ? 'rewards' :
                         key.includes('campaign') ? 'campaigns' : 'default';
        await idbOperations.set(storeName, key, value);
        return;
      } catch (error) {
        // Fall through to localStorage
      }
    }
    await localStorageOperations.set(key, value);
  },

  delete: async (key: string): Promise<void> => {
    if (Platform.OS === 'web' && typeof indexedDB !== 'undefined') {
      try {
        const storeName = key.includes('customer_reward') ? 'customerRewards' : 
                         key.includes('reward') ? 'rewards' :
                         key.includes('campaign') ? 'campaigns' : 'default';
        await idbOperations.delete(storeName, key);
        return;
      } catch (error) {
        // Fall through to localStorage
      }
    }
    await localStorageOperations.delete(key);
  },

  getAll: async <T>(prefix: string): Promise<T[]> => {
    if (Platform.OS === 'web' && typeof indexedDB !== 'undefined') {
      try {
        const storeName = prefix.includes('customer_reward') ? 'customerRewards' : 
                         prefix.includes('reward') ? 'rewards' :
                         prefix.includes('campaign') ? 'campaigns' : 'default';
        const all = await idbOperations.getAll<T>(storeName);
        return all.filter((item: any) => item.id?.startsWith(prefix));
      } catch (error) {
        // Fall through to localStorage
      }
    }
    // Use localStorageOperations for both web and native
    const allKeys = await localStorageOperations.getAllKeys();
    const items: T[] = [];
    for (const key of allKeys) {
      if (key.startsWith(prefix)) {
        const value = await localStorageOperations.get<T>(key);
        if (value) items.push(value);
      }
    }
    return items;
  },
};

export const syncQueue = {
  add: async (operation: {
    type: 'create' | 'update' | 'delete';
    entityType: string;
    entityId: string;
    data?: any;
    timestamp: number;
  }): Promise<void> => {
    const queue = await storage.getAll<any>(STORAGE_KEYS.SYNC_QUEUE);
    queue.push({
      id: `${operation.entityType}:${operation.entityId}:${operation.timestamp}`,
      ...operation,
    });
    await storage.set(STORAGE_KEYS.SYNC_QUEUE, queue);
  },

  getAll: async (): Promise<any[]> => {
    return await storage.getAll<any>(STORAGE_KEYS.SYNC_QUEUE);
  },

  remove: async (operationId: string): Promise<void> => {
    const queue = await storage.getAll<any>(STORAGE_KEYS.SYNC_QUEUE);
    const filtered = queue.filter((op: any) => op.id !== operationId);
    await storage.set(STORAGE_KEYS.SYNC_QUEUE, filtered);
  },

  clear: async (): Promise<void> => {
    await storage.delete(STORAGE_KEYS.SYNC_QUEUE);
  },
};

export const syncStatus = {
  get: async (): Promise<{
    isOnline: boolean;
    lastSyncTime: number | null;
    pendingOperations: number;
  }> => {
    const status = await storage.get<any>(STORAGE_KEYS.SYNC_STATUS);
    const queue = await syncQueue.getAll();
    return {
      isOnline: status?.isOnline ?? false,
      lastSyncTime: status?.lastSyncTime ?? null,
      pendingOperations: queue.length,
    };
  },

  update: async (updates: {
    isOnline?: boolean;
    lastSyncTime?: number;
  }): Promise<void> => {
    const current = await storage.get<any>(STORAGE_KEYS.SYNC_STATUS) || {};
    await storage.set(STORAGE_KEYS.SYNC_STATUS, {
      ...current,
      ...updates,
    });
  },
};



