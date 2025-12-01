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

interface PrivacyPolicyPageProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onBack?: () => void;
  onScanPress?: () => void;
}

const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
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
            Canny Carrot ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services. Please read this Privacy Policy carefully.
          </Text>

          <Text style={styles.sectionTitle}>2. Information We Collect</Text>
          <Text style={styles.paragraph}>
            2.1. Personal Information: We may collect personal information that you provide to us, including:
          </Text>
          <Text style={styles.listItem}>• Name and contact details (email address, phone number)</Text>
          <Text style={styles.listItem}>• Date of birth</Text>
          <Text style={styles.listItem}>• Postal address</Text>
          <Text style={styles.listItem}>• Payment information (processed securely through third-party providers)</Text>
          <Text style={styles.paragraph}>
            2.2. Usage Data: We automatically collect information about how you use our app, including:
          </Text>
          <Text style={styles.listItem}>• Device information (model, operating system, unique device identifiers)</Text>
          <Text style={styles.listItem}>• Log data (IP address, access times, pages viewed)</Text>
          <Text style={styles.listItem}>• Location data (with your consent)</Text>
          <Text style={styles.listItem}>• App usage patterns and preferences</Text>

          <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            We use the information we collect to:
          </Text>
          <Text style={styles.listItem}>• Provide, maintain, and improve our services</Text>
          <Text style={styles.listItem}>• Process transactions and manage your account</Text>
          <Text style={styles.listItem}>• Send you rewards, offers, and promotional communications (with your consent)</Text>
          <Text style={styles.listItem}>• Respond to your enquiries and provide customer support</Text>
          <Text style={styles.listItem}>• Detect, prevent, and address technical issues and fraud</Text>
          <Text style={styles.listItem}>• Comply with legal obligations</Text>

          <Text style={styles.sectionTitle}>4. Legal Basis for Processing (UK GDPR)</Text>
          <Text style={styles.paragraph}>
            Under UK GDPR, we process your personal data based on:
          </Text>
          <Text style={styles.listItem}>• Consent: When you have given clear consent for specific purposes</Text>
          <Text style={styles.listItem}>• Contract: To perform our contract with you</Text>
          <Text style={styles.listItem}>• Legal obligation: To comply with legal requirements</Text>
          <Text style={styles.listItem}>• Legitimate interests: For our legitimate business interests, balanced against your rights</Text>

          <Text style={styles.sectionTitle}>5. Data Sharing and Disclosure</Text>
          <Text style={styles.paragraph}>
            5.1. We may share your information with:
          </Text>
          <Text style={styles.listItem}>• Service providers who assist us in operating our app and conducting business</Text>
          <Text style={styles.listItem}>• Business partners for rewards and promotional purposes (with your consent)</Text>
          <Text style={styles.listItem}>• Legal authorities when required by law or to protect our rights</Text>
          <Text style={styles.paragraph}>
            5.2. We do not sell your personal information to third parties.
          </Text>

          <Text style={styles.sectionTitle}>6. Data Security</Text>
          <Text style={styles.paragraph}>
            We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
          </Text>

          <Text style={styles.sectionTitle}>7. Data Retention</Text>
          <Text style={styles.paragraph}>
            We retain your personal data only for as long as necessary to fulfil the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
          </Text>

          <Text style={styles.sectionTitle}>8. Your Rights (UK GDPR)</Text>
          <Text style={styles.paragraph}>
            Under UK GDPR, you have the right to:
          </Text>
          <Text style={styles.listItem}>• Access your personal data</Text>
          <Text style={styles.listItem}>• Rectify inaccurate data</Text>
          <Text style={styles.listItem}>• Request erasure of your data</Text>
          <Text style={styles.listItem}>• Restrict processing of your data</Text>
          <Text style={styles.listItem}>• Data portability</Text>
          <Text style={styles.listItem}>• Object to processing</Text>
          <Text style={styles.listItem}>• Withdraw consent at any time</Text>
          <Text style={styles.paragraph}>
            To exercise these rights, please contact us through the Contact Customer Care option in the app.
          </Text>

          <Text style={styles.sectionTitle}>9. Cookies and Tracking Technologies</Text>
          <Text style={styles.paragraph}>
            We use cookies and similar tracking technologies to track activity on our app and store certain information. You can instruct your device to refuse all cookies, but this may limit your ability to use some features of our app.
          </Text>

          <Text style={styles.sectionTitle}>10. Children's Privacy</Text>
          <Text style={styles.paragraph}>
            Our service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
          </Text>

          <Text style={styles.sectionTitle}>11. International Data Transfers</Text>
          <Text style={styles.paragraph}>
            Your information may be transferred to and processed in countries other than the UK. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable data protection laws.
          </Text>

          <Text style={styles.sectionTitle}>12. Changes to This Privacy Policy</Text>
          <Text style={styles.paragraph}>
            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy in the app and updating the "Last updated" date.
          </Text>

          <Text style={styles.sectionTitle}>13. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have any questions about this Privacy Policy or our data practices, please contact us through the Contact Customer Care option in the app or write to us at the address provided in the app.
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

export default PrivacyPolicyPage;

