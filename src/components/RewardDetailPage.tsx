import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {Colors} from '../constants/Colors';
import PageTemplate from './PageTemplate';
import CircularProgress from './CircularProgress';

interface RewardDetailPageProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  rewardTitle?: string;
  rewardId?: string;
  count?: number;
  total?: number;
  onBack?: () => void;
  onScanPress?: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width || 375;

// Reward data mapping
interface RewardData {
  id: string;
  title: string;
  count: number;
  total: number;
  icon: string;
  image?: any;
  description: string;
  rewardDescription: string;
  overlayColor?: string;
  hasOnline?: boolean;
}

// Load company logos
let blackwellsLogo;
let bluecornLogo;
let sandwichLogo;
let daisyChainImage;
let onlineBlackIcon;

try {
  blackwellsLogo = require('../../assets/blackwells.png');
} catch (e) {
  try {
    blackwellsLogo = require('../../Images/blackwells.png');
  } catch (e2) {
    blackwellsLogo = null;
  }
}

try {
  bluecornLogo = require('../../assets/bluecorn-bakers.png');
} catch (e) {
  try {
    bluecornLogo = require('../../Images/bluecorn-bakers.png');
  } catch (e2) {
    bluecornLogo = null;
  }
}

try {
  sandwichLogo = require('../../assets/green-florist.png');
} catch (e) {
  try {
    sandwichLogo = require('../../Images/green-florist.png');
  } catch (e2) {
    sandwichLogo = null;
  }
}

try {
  daisyChainImage = require('../../Images/daisy-chain.png');
} catch (e) {
  daisyChainImage = null;
}

try {
  onlineBlackIcon = require('../../Images/online-black.png');
} catch (e) {
  onlineBlackIcon = null;
}

// Get reward data based on title or ID
const getRewardData = (title?: string, id?: string): RewardData => {
  // Default data matching HomeScreen
  const defaultData: RewardData = {
    id: id || '1',
    title: title || 'Blackwells Butchers',
    count: 8,
    total: 10,
    icon: '🥐',
    description:
      'Collect stamps with every purchase at this amazing local business.',
    rewardDescription:
      'Complete your card to unlock an exclusive reward! Keep collecting to see what you can earn.',
  };

  if (title === 'Blackwells Butchers' || id === '1') {
    return {
      ...defaultData,
      id: '1',
      title: 'Blackwells Butchers',
      count: 8,
      total: 10,
      image: blackwellsLogo,
      overlayColor: '#000000',
      description:
        'Visit Blackwells Butchers and collect stamps with every purchase. Quality meats and friendly service await!',
      rewardDescription:
        'Complete your card and receive a special discount on your next purchase or a free item!',
    };
  }

  if (title === 'Bluecorn Bakers' || id === '2') {
    return {
      ...defaultData,
      id: '2',
      title: 'Bluecorn Bakers',
      count: 7,
      total: 10,
      image: bluecornLogo,
      overlayColor: '#87CEEB',
      description:
        'Fresh baked goods daily! Collect stamps every time you visit Bluecorn Bakers.',
      rewardDescription:
        'Complete your card to get a free pastry or special discount on your next bakery order!',
    };
  }

  if (title === 'The Green Florist' || id === '3') {
    return {
      ...defaultData,
      id: '3',
      title: 'The Green Florist',
      count: 9,
      total: 10,
      image: sandwichLogo,
      overlayColor: '#1B5E20',
      hasOnline: true,
      description:
        'Beautiful flowers and arrangements. Shop in-store or online to collect stamps.',
      rewardDescription:
        'Complete your card to receive a discount on your next floral arrangement or a free bouquet!',
    };
  }

  if (title === 'Sweet Treats' || id === '4') {
    return {
      ...defaultData,
      id: '4',
      title: 'Sweet Treats',
      count: 9,
      total: 10,
      icon: '🍩',
      image: daisyChainImage,
      description:
        'Indulge in delicious sweet treats and collect stamps with every visit.',
      rewardDescription:
        'Complete your card to get a free dessert or special discount!',
    };
  }

  if (title === 'Hot Meals' || id === '5') {
    return {
      ...defaultData,
      id: '5',
      title: 'Hot Meals',
      count: 6,
      total: 10,
      icon: '🍲',
      description:
        'Warm, comforting meals. Collect stamps with every hot meal purchase.',
      rewardDescription:
        'Complete your card for a free hot meal or significant discount!',
    };
  }

  if (title === 'Breakfast' || id === '6') {
    return {
      ...defaultData,
      id: '6',
      title: 'Breakfast',
      count: 5,
      total: 10,
      icon: '🥞',
      description:
        'Start your day right! Collect stamps with every breakfast purchase.',
      rewardDescription:
        'Complete your card to enjoy a free breakfast or special morning discount!',
    };
  }

  return defaultData;
};

const RewardDetailPage: React.FC<RewardDetailPageProps> = ({
  currentScreen,
  onNavigate,
  rewardTitle = 'Reward Details',
  rewardId,
  count,
  total,
  onBack,
  onScanPress,
}) => {
  const [rewardData, setRewardData] = useState<RewardData>(
    getRewardData(rewardTitle, rewardId),
  );

  // Update reward data if props change
  useEffect(() => {
    const data = getRewardData(rewardTitle, rewardId);
    if (count !== undefined) {
      data.count = count;
    }
    if (total !== undefined) {
      data.total = total;
    }
    setRewardData(data);
  }, [rewardTitle, rewardId, count, total]);

  // count represents stamps remaining, not collected
  const stampsCollected = rewardData.total - rewardData.count;
  const progress = (stampsCollected / rewardData.total) * 100;
  const progressColor = Colors.secondary;
  const stampsRemaining = rewardData.count;
  const [onlineImageError, setOnlineImageError] = useState(false);

  return (
    <PageTemplate
      title={rewardData.title}
      currentScreen={currentScreen}
      onNavigate={onNavigate}
      onBack={onBack}
      showBanner={false}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Company Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.progressContainer}>
              {/* Online indicator for The Green Florist */}
              {rewardData.id === '3' && onlineBlackIcon && !onlineImageError && (
                <View style={styles.onlineImageContainer}>
                  <Image
                    source={onlineBlackIcon}
                    style={styles.onlineImage}
                    resizeMode="contain"
                    onError={() => {
                      setOnlineImageError(true);
                    }}
                  />
                </View>
              )}
              <CircularProgress
                size={180}
                strokeWidth={10}
                progress={progress}
                color={progressColor}
                backgroundColor={Colors.neutral[200]}
              />
              <View
                style={[
                  styles.logoOverlay,
                  rewardData.overlayColor
                    ? {backgroundColor: rewardData.overlayColor}
                    : {},
                ]}>
                {rewardData.image ? (
                  <Image
                    source={rewardData.image}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.logoIcon}>{rewardData.icon}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Progress Text */}
          <View style={styles.progressTextSection}>
            <Text style={styles.progressTitle}>Progress to Reward</Text>
            <Text style={styles.progressCount}>
              {stampsCollected} of {rewardData.total} stamps collected
            </Text>
            <Text style={styles.progressSubtext}>
              {stampsRemaining} more {stampsRemaining === 1 ? 'stamp' : 'stamps'}{' '}
              needed
            </Text>
          </View>

          {/* Reward Description Card */}
          <View style={styles.rewardCard}>
            <Text style={styles.rewardCardTitle}>Your Reward</Text>
            <Text style={styles.rewardCardDescription}>
              {rewardData.rewardDescription}
            </Text>
          </View>

          {/* Company Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionText}>{rewardData.description}</Text>
          </View>

          {/* Ways to Collect Stamps */}
          <View style={styles.collectSection}>
            <Text style={styles.sectionTitle}>Ways to Collect Stamps</Text>

            {/* Scan QR Code */}
            <TouchableOpacity
              style={styles.collectCard}
              onPress={() => {
                if (onScanPress) {
                  onScanPress();
                } else {
                  onNavigate('Scan');
                }
              }}>
              <View style={styles.collectIconContainer}>
                <Text style={styles.collectIcon}>📱</Text>
              </View>
              <View style={styles.collectContent}>
                <Text style={styles.collectTitle}>Scan QR Code</Text>
                <Text style={styles.collectDescription}>
                  Visit the store and scan the QR code at checkout
                </Text>
              </View>
            </TouchableOpacity>

            {/* Shop Online (if available) */}
            {(rewardData.hasOnline || rewardData.id === '3') && (
              <TouchableOpacity
                style={styles.collectCard}
                onPress={() => onNavigate('ShopOnline')}>
                <View style={styles.collectIconContainer}>
                  <Text style={styles.collectIcon}>🛒</Text>
                </View>
                <View style={styles.collectContent}>
                  <Text style={styles.collectTitle}>Shop Online</Text>
                  <Text style={styles.collectDescription}>
                    Make a purchase online to automatically collect a stamp
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Write a Review */}
            <TouchableOpacity
              style={styles.collectCard}
              onPress={() => onNavigate('WriteReview')}>
              <View style={styles.collectIconContainer}>
                <Text style={styles.collectIcon}>⭐</Text>
              </View>
              <View style={styles.collectContent}>
                <Text style={styles.collectTitle}>Write a Review</Text>
                <Text style={styles.collectDescription}>
                  Leave a review and earn bonus stamps
                </Text>
              </View>
            </TouchableOpacity>

            {/* Visit Store */}
            <TouchableOpacity
              style={styles.collectCard}
              onPress={() => onNavigate('FindShop')}>
              <View style={styles.collectIconContainer}>
                <Text style={styles.collectIcon}>📍</Text>
              </View>
              <View style={styles.collectContent}>
                <Text style={styles.collectTitle}>Visit the Store</Text>
                <Text style={styles.collectDescription}>
                  Find the store location and visit in person
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </PageTemplate>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  progressContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineImageContainer: {
    position: 'absolute',
    top: -10,
    left: -10,
    zIndex: 5,
  },
  onlineImage: {
    width: 50,
    height: 50,
  },
  logoOverlay: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  logoIcon: {
    fontSize: 60,
  },
  progressTextSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  progressCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.secondary,
    marginBottom: 4,
  },
  progressSubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  rewardCard: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  rewardCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.background,
    marginBottom: 8,
  },
  rewardCardDescription: {
    fontSize: 14,
    color: Colors.background,
    lineHeight: 20,
  },
  descriptionSection: {
    marginBottom: 24,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 20,
    textAlign: 'center',
  },
  collectSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 16,
  },
  collectCard: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  collectIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  collectIcon: {
    fontSize: 24,
  },
  collectContent: {
    flex: 1,
  },
  collectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  collectDescription: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
});

export default RewardDetailPage;