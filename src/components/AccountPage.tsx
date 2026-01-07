import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {Colors} from '../constants/Colors';
import BottomNavigation from './BottomNavigation';
import {getCustomerRecord} from '../services/customerRecord';

interface AccountPageProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onBack?: () => void;
  onScanPress?: () => void;
}

const AccountPage: React.FC<AccountPageProps> = ({
  currentScreen,
  onNavigate,
  onBack,
  onScanPress,
}) => {
  const [customerName, setCustomerName] = useState('Loading...');
  const [customerEmail, setCustomerEmail] = useState('Loading...');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load customer account details
  useEffect(() => {
    const loadAccountDetails = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        
        // Retry logic for reliability
        let retries = 3;
        let record = null;
        
        while (retries > 0 && !record) {
          try {
            record = await getCustomerRecord();
            if (record && record.profile) {
              break;
            }
          } catch (error) {
            console.warn(`Account load attempt ${4 - retries} failed:`, error);
            retries--;
            if (retries > 0) {
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        }
        
        if (record && record.profile) {
          const fullName = record.profile.firstName && record.profile.lastName
            ? `${record.profile.firstName} ${record.profile.lastName}`
            : record.profile.firstName || record.profile.lastName || 'User';
          setCustomerName(fullName);
          setCustomerEmail(record.profile.email || 'No email set');
        } else {
          // Fallback to device-based name if no profile
          setCustomerName('User');
          setCustomerEmail('No email set');
        }
      } catch (error) {
        console.error('Error loading account details:', error);
        setLoadError('Failed to load account details');
        setCustomerName('User');
        setCustomerEmail('No email set');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAccountDetails();
  }, []);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      onNavigate('More');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#90EE90" />

      {/* Light Green Header Banner */}
      <View style={styles.headerBanner}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarIcon}>👤</Text>
            </View>
          </View>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading account...</Text>
            </View>
          ) : (
            <>
              <TextInput
                style={styles.nameInput}
                value={customerName}
                editable={true}
                placeholder="Name"
                placeholderTextColor={Colors.primary}
                onChangeText={setCustomerName}
              />
              <TextInput
                style={styles.emailInput}
                value={customerEmail}
                editable={true}
                placeholder="Email"
                placeholderTextColor={Colors.text.secondary}
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={setCustomerEmail}
              />
              {loadError && (
                <Text style={styles.errorText}>{loadError}</Text>
              )}
            </>
          )}
        </View>

        {/* Account Options List */}
        <View style={styles.optionsList}>
          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => onNavigate('Personal details')}>
            <View style={[styles.optionIconContainer, {backgroundColor: '#4CAF50'}]}>
              <Text style={styles.optionIcon}>👤</Text>
            </View>
            <TextInput
              style={styles.optionText}
              value="Personal details"
              editable={false}
            />
            <Text style={styles.optionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => onNavigate('Communication preferences')}>
            <View style={[styles.optionIconContainer, {backgroundColor: '#FF7A18'}]}>
              <View style={styles.speechBubbleIcon}>
                <View style={styles.speechBubbleLines}>
                  <View style={styles.speechLine} />
                  <View style={styles.speechLine} />
                  <View style={styles.speechLine} />
                </View>
              </View>
            </View>
            <TextInput
              style={styles.optionText}
              value="Communication preferences"
              editable={false}
            />
            <Text style={styles.optionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => onNavigate('ManageAccount')}>
            <View style={[styles.optionIconContainer, {backgroundColor: '#FF7A18'}]}>
              <View style={styles.clockIcon}>
                <View style={styles.clockCircle} />
                <View style={styles.clockHand} />
              </View>
            </View>
            <TextInput
              style={styles.optionText}
              value="Manage my Account"
              editable={false}
            />
            <Text style={styles.optionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => onNavigate('Delete your account')}>
            <View style={[styles.optionIconContainer, {backgroundColor: '#A3A3A3'}]}>
              <View style={styles.warningIcon}>
                <Text style={styles.warningExclamation}>!</Text>
              </View>
            </View>
            <TextInput
              style={styles.optionText}
              value="Delete your account"
              editable={false}
            />
            <Text style={styles.optionArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Log Out Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={() => {}}>
          <Text style={styles.logoutIcon}>←</Text>
          <TextInput
            style={styles.logoutText}
            value="LOG OUT"
            editable={false}
          />
        </TouchableOpacity>

        {/* Version Information */}
        <TextInput
          style={styles.versionText}
          value="Version 4.30.0 (7218)"
          editable={false}
        />
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation currentScreen={currentScreen} onNavigate={onNavigate} onScanPress={onScanPress} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBanner: {
    backgroundColor: '#90EE90', // Light green
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backArrow: {
    fontSize: 24,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: Colors.background,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.background,
    borderWidth: 3,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarIcon: {
    fontSize: 60,
    color: Colors.primary,
  },
  nameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    width: '100%',
  },
  emailInput: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    width: '100%',
  },
  optionsList: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderRadius: 8,
  },
  greenBox: {
    backgroundColor: '#4CAF50', // Green
  },
  orangeBox: {
    backgroundColor: '#FF7A18', // Orange
  },
  greyBox: {
    backgroundColor: '#A3A3A3', // Grey
  },
  optionIcon: {
    fontSize: 26,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    paddingVertical: 4,
  },
  optionArrow: {
    fontSize: 20,
    color: Colors.text.secondary,
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral[200],
    borderRadius: 8,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 24,
  },
  logoutIcon: {
    fontSize: 20,
    color: Colors.primary,
    marginRight: 8,
    fontWeight: 'bold',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 1,
  },
  versionText: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    paddingVertical: 4,
  },
  speechBubbleIcon: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: Colors.background,
    borderRadius: 4,
    padding: 2,
    justifyContent: 'center',
  },
  speechBubbleLines: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  speechLine: {
    height: 2,
    width: 12,
    backgroundColor: Colors.background,
    marginBottom: 2,
    borderRadius: 1,
  },
  clockIcon: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: Colors.background,
    borderRadius: 12,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clockCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.background,
  },
  clockHand: {
    position: 'absolute',
    width: 2,
    height: 8,
    backgroundColor: Colors.background,
    top: 4,
    left: 11,
  },
  warningIcon: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: Colors.background,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{rotate: '45deg'}],
  },
  warningExclamation: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.background,
    transform: [{rotate: '-45deg'}],
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    color: '#FF6B35',
    textAlign: 'center',
  },
});

export default AccountPage;
