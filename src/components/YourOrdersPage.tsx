import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Switch,
  Alert,
} from 'react-native';
import {Colors} from '../constants/Colors';
import BottomNavigation from './BottomNavigation';

interface YourOrdersPageProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onBack?: () => void;
  onScanPress?: () => void;
}

const YourOrdersPage: React.FC<YourOrdersPageProps> = ({
  currentScreen,
  onNavigate,
  onBack,
  onScanPress,
}) => {
  const [accountSettings, setAccountSettings] = useState({
    email: 'Copeland_simon@yahoo.co.uk',
    password: '',
    confirmPassword: '',
    twoFactorAuth: false,
    biometricLogin: false,
    notifications: true,
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    dataSharing: true,
    analytics: true,
    marketing: true,
  });

  const handleSubmit = async () => {
    try {
      // IMMEDIATELY save account settings to local customer repository
      const { updateCustomerProfile } = await import('../services/customerRecord');
      
      // Update email if changed
      const updates: any = {};
      if (accountSettings.email) {
        updates.email = accountSettings.email;
      }
      
      // Update preferences
      updates.preferences = {
        notifications: accountSettings.notifications,
        emailMarketing: accountSettings.emailNotifications || accountSettings.marketing,
        smsMarketing: accountSettings.smsNotifications,
      };
      
      await updateCustomerProfile(updates);
      
      console.log('✅ [YourOrdersPage] Account settings saved to local repository');
      
      // Note: Password changes would need separate API call to update auth
      // For now, just save profile changes
      
      Alert.alert('Success', 'Account settings saved successfully');
      
      // Navigate back
      if (onBack) {
        onBack();
      }
    } catch (error) {
      console.error('[YourOrdersPage] Error saving account settings:', error);
      Alert.alert('Error', 'Failed to save account settings. Please try again.');
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      onNavigate('Account');
    }
  };

  // Generate random banner color
  const getRandomBannerColor = (): string => {
    const colors = [
      '#FF6B6B', // Red
      '#4ECDC4', // Teal
      '#45B7D1', // Blue
      '#96CEB4', // Green
      '#FFEAA7', // Yellow
      '#DDA0DD', // Plum
      '#98D8C8', // Mint
      '#F7DC6F', // Gold
      '#BB8FCE', // Purple
      '#85C1E2', // Sky Blue
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const headerColor = getRandomBannerColor();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={headerColor} />

      {/* Header Banner */}
      <View style={[styles.headerBanner, {backgroundColor: headerColor}]}>
        {onBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Manage Account</Text>
        {onBack && <View style={styles.backButtonSpacer} />}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Account Security Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Security</Text>
            
            <View style={styles.formSection}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={accountSettings.email}
                onChangeText={text => setAccountSettings({...accountSettings, email: text})}
                placeholder="Enter email address"
                placeholderTextColor={Colors.text.light}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                value={accountSettings.password}
                onChangeText={text => setAccountSettings({...accountSettings, password: text})}
                placeholder="Enter new password"
                placeholderTextColor={Colors.text.light}
                secureTextEntry
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={accountSettings.confirmPassword}
                onChangeText={text => setAccountSettings({...accountSettings, confirmPassword: text})}
                placeholder="Confirm new password"
                placeholderTextColor={Colors.text.light}
                secureTextEntry
              />
            </View>
          </View>

          {/* Security Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security Options</Text>
            
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Two-Factor Authentication</Text>
              <Switch
                value={accountSettings.twoFactorAuth}
                onValueChange={value => setAccountSettings({...accountSettings, twoFactorAuth: value})}
                trackColor={{false: Colors.neutral[300], true: Colors.secondary}}
                thumbColor={Colors.background}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Biometric Login</Text>
              <Switch
                value={accountSettings.biometricLogin}
                onValueChange={value => setAccountSettings({...accountSettings, biometricLogin: value})}
                trackColor={{false: Colors.neutral[300], true: Colors.secondary}}
                thumbColor={Colors.background}
              />
            </View>
          </View>

          {/* Notification Preferences */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notification Preferences</Text>
            
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Enable Notifications</Text>
              <Switch
                value={accountSettings.notifications}
                onValueChange={value => setAccountSettings({...accountSettings, notifications: value})}
                trackColor={{false: Colors.neutral[300], true: Colors.secondary}}
                thumbColor={Colors.background}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Email Notifications</Text>
              <Switch
                value={accountSettings.emailNotifications}
                onValueChange={value => setAccountSettings({...accountSettings, emailNotifications: value})}
                trackColor={{false: Colors.neutral[300], true: Colors.secondary}}
                thumbColor={Colors.background}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Push Notifications</Text>
              <Switch
                value={accountSettings.pushNotifications}
                onValueChange={value => setAccountSettings({...accountSettings, pushNotifications: value})}
                trackColor={{false: Colors.neutral[300], true: Colors.secondary}}
                thumbColor={Colors.background}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>SMS Notifications</Text>
              <Switch
                value={accountSettings.smsNotifications}
                onValueChange={value => setAccountSettings({...accountSettings, smsNotifications: value})}
                trackColor={{false: Colors.neutral[300], true: Colors.secondary}}
                thumbColor={Colors.background}
              />
            </View>
          </View>

          {/* Privacy & Data */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy & Data</Text>
            
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Data Sharing</Text>
              <Switch
                value={accountSettings.dataSharing}
                onValueChange={value => setAccountSettings({...accountSettings, dataSharing: value})}
                trackColor={{false: Colors.neutral[300], true: Colors.secondary}}
                thumbColor={Colors.background}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Analytics & Usage</Text>
              <Switch
                value={accountSettings.analytics}
                onValueChange={value => setAccountSettings({...accountSettings, analytics: value})}
                trackColor={{false: Colors.neutral[300], true: Colors.secondary}}
                thumbColor={Colors.background}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Marketing Communications</Text>
              <Switch
                value={accountSettings.marketing}
                onValueChange={value => setAccountSettings({...accountSettings, marketing: value})}
                trackColor={{false: Colors.neutral[300], true: Colors.secondary}}
                thumbColor={Colors.background}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation
        currentScreen={currentScreen}
        onNavigate={onNavigate}
        onScanPress={onScanPress}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBanner: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  backArrow: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.background,
  },
  backButtonSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.background,
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  formContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.neutral[100],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: Colors.text.primary,
    flex: 1,
  },
  submitButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.background,
  },
});

export default YourOrdersPage;

