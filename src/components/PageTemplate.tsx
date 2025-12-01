import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {Colors} from '../constants/Colors';
import BottomNavigation from './BottomNavigation';

interface PageTemplateProps {
  title: string;
  currentScreen: string;
  onNavigate: (screen: string) => void;
  children: React.ReactNode;
  showBanner?: boolean;
  bannerColor?: string;
  onScanPress?: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
}

// Load banner image
let bannerImage = null;
try {
  bannerImage = require('../../assets/banner.png');
} catch (e) {
  try {
    bannerImage = require('../../Images/Banner 1.png');
  } catch (e2) {
    bannerImage = null;
  }
}

const SCREEN_WIDTH = Dimensions.get('window').width || 375;

// Generate random color for banner
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

const PageTemplate: React.FC<PageTemplateProps> = ({
  title,
  currentScreen,
  onNavigate,
  children,
  showBanner = true,
  bannerColor,
  onScanPress,
  showBackButton = true,
  onBack,
}) => {
  const headerColor = bannerColor || getRandomBannerColor();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      onNavigate('Home');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={headerColor} />

      {/* Random Color Banner Header */}
      <View style={[styles.headerBanner, {backgroundColor: headerColor}]}>
        {showBackButton && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>{title}</Text>
        {showBackButton && <View style={styles.backButtonSpacer} />}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Banner Image - same dimensions as homepage */}
        {showBanner && bannerImage && (
          <View style={styles.bannerSection}>
            <Image
              source={bannerImage}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Page Content */}
        {children}
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
    color: Colors.background, // White text
  },
  backButtonSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.background, // White text
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  bannerSection: {
    marginBottom: 24,
    width: '100%',
  },
  bannerImage: {
    width: '100%',
    height: 171, // Same as homepage banner
  },
});

export default PageTemplate;

