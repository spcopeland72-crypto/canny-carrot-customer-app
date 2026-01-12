import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {Colors} from '../constants/Colors';
import {performCustomerFullSync} from '../services/customerLogout';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AccountModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
  onLogout?: () => void;
  customerName?: string;
  customerEmail?: string;
}

const AccountModal: React.FC<AccountModalProps> = ({
  visible,
  onClose,
  onNavigate,
  onLogout,
  customerName = 'Customer',
  customerEmail = '',
}) => {
  const handleLogout = async () => {
    try {
      onClose();
      console.log('🔄 [CUSTOMER LOGOUT] Starting logout with full sync...');
      
      // Perform full replacement sync
      const syncResult = await performCustomerFullSync();
      
      if (syncResult.success) {
        console.log('✅ [CUSTOMER LOGOUT] Full replacement sync completed successfully');
      } else {
        console.warn('⚠️ [CUSTOMER LOGOUT] Some data failed to sync:', syncResult.errors);
        // Continue with logout even if sync fails
      }
      
      // Clear local storage (customer record will be recreated on next login)
      await AsyncStorage.removeItem('customerRecord');
      console.log('✅ [CUSTOMER LOGOUT] Logged out successfully');
      
      // Call parent logout handler
      if (onLogout) {
        onLogout();
      }
    } catch (error) {
      console.error('❌ [CUSTOMER LOGOUT] Error logging out:', error);
    }
  };

  const handleMenuAction = (action: string) => {
    onClose();
    if (action === 'logout') {
      handleLogout();
    } else {
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

