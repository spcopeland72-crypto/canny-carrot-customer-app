import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import {Colors} from '../constants/Colors';
import BottomNavigation from './BottomNavigation';

interface TermsConditionsPageProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onBack?: () => void;
  onScanPress?: () => void;
}

const TermsConditionsPage: React.FC<TermsConditionsPageProps> = ({
  currentScreen,
  onNavigate,
  onBack,
  onScanPress,
}) => {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      onNavigate('More');
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
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        {onBack && <View style={styles.backButtonSpacer} />}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.lastUpdated}>
            Last updated: {new Date().toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>

          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.paragraph}>
            These Terms and Conditions ("Terms") govern your membership and use of the Canny Carrot mobile application and services ("Service"). By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these Terms, you may not access the Service.
          </Text>

          <Text style={styles.sectionTitle}>2. Membership</Text>
          <Text style={styles.paragraph}>
            2.1. To become a member, you must be at least 18 years old and provide accurate, current, and complete information during registration.
          </Text>
          <Text style={styles.paragraph}>
            2.2. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
          </Text>
          <Text style={styles.paragraph}>
            2.3. We reserve the right to suspend or terminate your membership if you breach these Terms or engage in fraudulent activity.
          </Text>

          <Text style={styles.sectionTitle}>3. Rewards Programme</Text>
          <Text style={styles.paragraph}>
            3.1. Rewards are earned through qualifying purchases and activities as specified in our Rewards Programme terms.
          </Text>
          <Text style={styles.paragraph}>
            3.2. Rewards have no cash value and cannot be transferred, sold, or exchanged for cash except as expressly permitted.
          </Text>
          <Text style={styles.paragraph}>
            3.3. We reserve the right to modify, suspend, or discontinue the Rewards Programme at any time with reasonable notice.
          </Text>

          <Text style={styles.sectionTitle}>4. Use of Service</Text>
          <Text style={styles.paragraph}>
            4.1. You agree to use the Service only for lawful purposes and in accordance with these Terms.
          </Text>
          <Text style={styles.paragraph}>
            4.2. You must not:
          </Text>
          <Text style={styles.listItem}>
            • Use the Service in any way that violates applicable laws or regulations
          </Text>
          <Text style={styles.listItem}>
            • Attempt to gain unauthorised access to the Service or related systems
          </Text>
          <Text style={styles.listItem}>
            • Interfere with or disrupt the Service or servers
          </Text>
          <Text style={styles.listItem}>
            • Use automated systems to access the Service without permission
          </Text>

          <Text style={styles.sectionTitle}>5. Intellectual Property</Text>
          <Text style={styles.paragraph}>
            5.1. All content, features, and functionality of the Service are owned by Canny Carrot and are protected by UK and international copyright, trademark, and other intellectual property laws.
          </Text>
          <Text style={styles.paragraph}>
            5.2. You may not reproduce, distribute, modify, or create derivative works from any content without our express written permission.
          </Text>

          <Text style={styles.sectionTitle}>6. Privacy</Text>
          <Text style={styles.paragraph}>
            Your use of the Service is also governed by our Privacy Policy, which can be found in the app. By using the Service, you consent to the collection and use of your information as described in the Privacy Policy.
          </Text>

          <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            7.1. To the maximum extent permitted by UK law, Canny Carrot shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.
          </Text>
          <Text style={styles.paragraph}>
            7.2. Our total liability to you for any claims arising from the Service shall not exceed the amount you paid to us in the 12 months preceding the claim.
          </Text>

          <Text style={styles.sectionTitle}>8. Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We reserve the right to modify these Terms at any time. Material changes will be notified through the Service. Your continued use of the Service after such changes constitutes acceptance of the new Terms.
          </Text>

          <Text style={styles.sectionTitle}>9. Governing Law</Text>
          <Text style={styles.paragraph}>
            These Terms are governed by and construed in accordance with the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.
          </Text>

          <Text style={styles.sectionTitle}>10. Contact Information</Text>
          <Text style={styles.paragraph}>
            If you have any questions about these Terms, please contact us through the Contact Customer Care option in the app.
          </Text>
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
  content: {
    padding: 20,
  },
  lastUpdated: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 22,
    marginBottom: 12,
  },
  listItem: {
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 22,
    marginBottom: 8,
    marginLeft: 16,
  },
});

export default TermsConditionsPage;

