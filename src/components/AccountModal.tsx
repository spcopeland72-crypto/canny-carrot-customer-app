import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {Colors} from '../constants/Colors';
import {Alert} from 'react-native';
import { logoutCustomer } from '../services/authService';
import { performCustomerFullSync } from '../services/customerLogout';

interface AccountModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
  onLogout?: () => void;
  onSyncSuccess?: () => void | Promise<void>;
  customerName?: string;
  customerEmail?: string;
}

const AccountModal: React.FC<AccountModalProps> = ({
  visible,
  onClose,
  onNavigate,
  onLogout,
  onSyncSuccess,
  customerName = 'Customer',
  customerEmail = '',
}) => {
  const [syncing, setSyncing] = useState(false);

  // Match business CompanyMenuModal: Sync only on Sync click, login, logout.
  const handleSync = async () => {
    try {
      onClose();
      setSyncing(true);
      const syncResult = await performCustomerFullSync();
      if (syncResult.success) {
        await onSyncSuccess?.();
        Alert.alert('Sync', 'Your data has been synced.');
      } else {
        Alert.alert('Sync', (syncResult.errors || []).join('\n') || 'Sync failed.');
      }
    } catch (e) {
      Alert.alert('Sync', e instanceof Error ? e.message : 'Sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = async () => {
    try {
      const result = await logoutCustomer();
      onClose();
      if (result.didLogout && onLogout) {
        onLogout();
      } else if (!result.didLogout && result.error) {
        Alert.alert(
          'Logout deferred',
          'Sync failed. Local data was kept. Try Sync first, then Logout again, or check your connection.'
        );
      }
    } catch (error) {
      console.error('❌ [CUSTOMER LOGOUT] Error logging out:', error);
      Alert.alert('Logout error', (error as Error)?.message ?? 'Could not log out.');
    }
  };

  const handleMenuAction = (action: string) => {
    if (action === 'logout') {
      handleLogout();
    } else if (action === 'sync') {
      handleSync();
    } else {
      onClose();
      onNavigate(action);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}>
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalContainer}
          onPress={(e) => e.stopPropagation()}>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Customer Name */}
            <Text style={styles.customerName} numberOfLines={1}>
              {customerName}
            </Text>

            {/* Email Address */}
            {customerEmail && (
              <Text style={styles.emailText} numberOfLines={1}>
                {customerEmail}
              </Text>
            )}

            <View style={styles.divider} />

            {/* Menu Items */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuAction('Account')}>
              <Text style={styles.menuItemText}>View Account</Text>
              <Text style={styles.menuItemIcon}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuAction('sync')}
              disabled={syncing}>
              <View style={styles.menuItemLeft}>
                {syncing && (
                  <ActivityIndicator size="small" color={Colors.primary} style={styles.syncSpinner} />
                )}
                <Text style={styles.menuItemText}>{syncing ? 'Syncing…' : 'Sync'}</Text>
              </View>
              <Text style={styles.menuItemIcon}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuAction('logout')}>
              <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
              <Text style={styles.menuItemIcon}>→</Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingTop: 60,
    paddingLeft: 16,
  },
  modalContainer: {
    width: 280,
    maxHeight: '80%',
    backgroundColor: Colors.background,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    padding: 20,
  },
  customerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 14,
    color: Colors.neutral[600],
    textAlign: 'center',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.neutral[200],
    marginVertical: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncSpinner: {
    marginRight: 8,
  },
  menuItemText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
  logoutText: {
    color: '#dc3545',
  },
  menuItemIcon: {
    fontSize: 18,
    color: Colors.neutral[400],
  },
});

export default AccountModal;

