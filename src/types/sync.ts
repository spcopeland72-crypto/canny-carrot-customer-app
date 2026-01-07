/**
 * Sync Metadata Types (Customer App)
 */

export interface SyncMetadata {
  version: number;
  lastModified: string;
  deviceId: string;
  isDirty: boolean;
  createdAt: string;
}

export interface SyncableEntity {
  id: string;
  _sync: SyncMetadata;
}

export type SyncOperationType = 'create' | 'update' | 'delete';

export interface SyncOperation {
  id: string;
  type: SyncOperationType;
  entityType: string;
  entityId: string;
  data?: any;
  timestamp: number;
  retries?: number;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: number | null;
  pendingOperations: number;
  isSyncing: boolean;
  lastError: string | null;
}

export interface ConflictResolution {
  resolved: boolean;
  localWins: boolean;
  redisWins: boolean;
  merged: boolean;
}

















