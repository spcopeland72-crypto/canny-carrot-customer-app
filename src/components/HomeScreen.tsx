import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Image,
  Linking,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import {Colors} from '../constants/Colors';
import {getTimeBasedGreeting} from '../utils/timeGreeting';
import Constants from 'expo-constants';
import CampaignProgressCircle from './CampaignProgressCircle';
import BottomNavigation from './BottomNavigation';
// FindMoreRewardsModal removed - now using FindMoreRewardsPage
import ScanModal from './ScanModal';
import HelpModal from './HelpModal';
import NotificationsModal from './NotificationsModal';
import PinEntryModal from './PinEntryModal';
import RedeemModal from './RedeemModal';
import CongratulationsModal from './CongratulationsModal';
import RewardQRCodeModal from './RewardQRCodeModal';
import AccountModal from './AccountModal';
import {redeemReward} from '../services/customerRecord';
import {loadRewards, saveRewards} from '../utils/dataStorage';
import {indexInList} from '../utils/campaignStampUtils';

// Import images at module level
// Path from src/components/ to assets/ is ../../assets/
let logoImage;

try {
  logoImage = require('../../assets/logo.png');
  console.log('Logo loaded from assets');
} catch (e) {
  console.log('Logo not found in assets:', e);
  try {
    logoImage = require('../../Images/NEW Logo With Outline.png');
    console.log('Logo loaded from Images folder');
  } catch (e2) {
    console.log('Logo not found anywhere:', e2);
  }
}

// Banner image disabled - using green background instead
let bannerImage: any = null;

// Note: online-black.png will be loaded in component to prevent module-level crashes

// Load Google Maps image for More Goodies section from Images folder
let googleMapsImage;
try {
  // Try google-maps.png from Images folder first
  googleMapsImage = require('../../Images/google-maps.png');
} catch (e) {
  try {
    // Try Screenshot_20251125-214945.jpg (full Google Maps with dog grooming businesses)
    googleMapsImage = require('../../Images/Screenshot_20251125-214945.jpg');
  } catch (e2) {
    try {
      // Try Screenshot_20251125-214955.jpg as fallback
      googleMapsImage = require('../../Images/Screenshot_20251125-214955.jpg');
    } catch (e3) {
      try {
        // Try assets folder as fallback
        googleMapsImage = require('../../assets/google-maps.jpg');
      } catch (e4) {
        try {
          googleMapsImage = require('../../Images/screen.png');
        } catch (e5) {
          // Image not found - will use placeholder
          googleMapsImage = null;
        }
      }
    }
  }
}

// Load Featured Campaigns image for More Goodies section card 2
let featuredCampaignsImage;
try {
  featuredCampaignsImage = require('../../Images/featured campaigns.png');
} catch (e) {
  // Image not found - will use placeholder
  featuredCampaignsImage = null;
}

// Load Shop Online image for Features section card 1
let shopOnlineImage;
try {
  shopOnlineImage = require('../../Images/shop-online.png');
} catch (e) {
  // Image not found - will use placeholder
  shopOnlineImage = null;
}

// Load calvin.png image for Features section card 2
let calvinImage;
try {
  calvinImage = require('../../Images/calvin.png');
} catch (e) {
  // Image not found - will use placeholder
  calvinImage = null;
}

// Load review.png image for Features section card 3
let reviewImage;
try {
  reviewImage = require('../../Images/review.png');
} catch (e) {
  // Image not found - will use placeholder
  reviewImage = null;
}

// Load earn.png image for Features section card 4
let earnImage;
try {
  earnImage = require('../../Images/earn.png');
} catch (e) {
  // Image not found - will use placeholder
  earnImage = null;
}

// Load competition.png image for CTA section
let competitionImage;
try {
  competitionImage = require('../../Images/competition.png');
} catch (e) {
  // Image not found - will use placeholder
  competitionImage = null;
}

// Load rotating images for Featured Gold Members card (More Goodies card 3)
const goldMemberImages = [
  require('../../Images/blackwells.png'),
  require('../../Images/bluecorn-bakers.png'),
  require('../../Images/daisy-chain.png'),
  require('../../Images/cosmetics.png'),
  require('../../Images/green-florist.png'),
];

// Load campaigns image for card 4
let campaignsImage;
try {
  campaignsImage = require('../../Images/campaigns.png');
} catch (e) {
  campaignsImage = null;
}

// Load social media icons from Images folder - using static imports for Metro bundler
// Load CC icon for banner logo
let ccIconImage: any = null;
try {
  // Try to load cc-icon, but don't fail if it doesn't exist
  ccIconImage = require('../../assets/cc-icon-no-background.png');
} catch (e) {
  // Icon not found - will use placeholder
  ccIconImage = null;
}

const facebookIcon = require('../../Images/facebook.png');
const instagramIcon = require('../../Images/instagram.png');
const tiktokIcon = require('../../Images/tiktok.png');
const xIcon = require('../../Images/x.png');
const linkedinIcon = require('../../Images/linkedin.png');

// Load online-black.png for circle 3
const onlineBlackIcon = require('../../Images/online-black.png');

const getScreenWidth = () => {
  try {
    return Dimensions.get('window').width || 375; // Default to iPhone width
  } catch {
    return 375;
  }
};

const SCREEN_WIDTH = getScreenWidth();
const CARD_WIDTH = SCREEN_WIDTH * 0.25;
const RECTANGULAR_CARD_WIDTH = SCREEN_WIDTH * 0.7;

interface RewardCard {
  id: string;
  title: string;
  count: number;
  total: number; // Total needed to complete
  icon: string; // Icon name or emoji for now
  image?: any; // Optional image source for logo/image
  isEarned?: boolean; // Whether reward has been earned (points requirement met)
  pinCode?: string; // PIN code for redemption
  qrCode?: string; // QR code value for display
  businessName?: string;
  businessId?: string;
  /** Fallback labels (collected + "Remaining") when campaign fetch fails. */
  circleLabels?: string[];
  stampedIndices?: number[];
}

interface GoodieCard {
  id: string;
  title: string;
  image: string; // Placeholder for image
}

interface FeatureCard {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
}

interface HomeScreenProps {
  currentScreen?: string;
  onNavigate?: (screen: string) => void;
  onScanPress?: () => void;
  onViewBusinessPage?: (businessName: string, businessId?: string) => void;
  rewards?: Array<{
    id: string;
    name: string;
    count: number;
    total: number;
    icon: string;
    pointsEarned?: number;
    isEarned?: boolean;
    pinCode?: string;
    createdAt?: string;
    collectedItems?: { itemType: string; itemName: string }[];
    businessLogo?: string;
    qrCode?: string;
    businessName?: string;
    businessId?: string;
    selectedProducts?: string[];
    selectedActions?: string[];
  }>;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  currentScreen = 'Home',
  onNavigate = () => {},
  onScanPress = () => {},
  onViewBusinessPage,
  rewards: propsRewards = [],
}) => {
  const [userName] = useState('Simon'); // This would come from user context
  const [logoError, setLogoError] = useState(false);
  const [bannerError, setBannerError] = useState(false);
  
  // EXACT CodePen - single string with seamless wrap
  // CodePen uses two ticker__item but effect is one continuous string
  const tickerText = "Canny Carrot welcomes our newest Silver Member Powder Butterfly and our latest Gold Member Blackwells Butchers";
  const screenWidth = Dimensions.get('window').width || 375;
  const tickerAnimation = useRef(new Animated.Value(0)).current;
  const [tickerWidth, setTickerWidth] = useState(0);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  
  // Continuous scroll - no restart, no reset, just continues infinitely
  useEffect(() => {
    if (tickerWidth > 0 && !animationRef.current) {
      // Create continuous animation that never resets
      const startContinuousAnimation = () => {
        // Cycle 3: 2?0 (reset to 0 after reaching 2)
        const currentValue = tickerAnimation._value || 0;
        let targetValue;
        
        if (currentValue >= 2) {
          // Cycle 3: Reset to 0
          tickerAnimation.setValue(0);
          targetValue = 1;
        } else {
          // Continue incrementing: 0?1, 1?2
          targetValue = currentValue + 1;
        }
        
        animationRef.current = Animated.timing(tickerAnimation, {
          toValue: targetValue,
          duration: 30000, // Speed of animation
          easing: Easing.linear,
          useNativeDriver: Platform.OS !== 'web',
        });
        
        animationRef.current.start((finished) => {
          if (finished) {
            // Continue: 0?1?2?0?1?2...
            animationRef.current = null;
            startContinuousAnimation();
          }
        });
      };
      
      startContinuousAnimation();
    }
  }, [tickerWidth]);
  // FindMoreRewardsModal removed - now navigating to FindMoreRewardsPage
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [hasUnreadNotifications] = useState(true); // This would come from user context/API
  const [onlineImageError, setOnlineImageError] = useState(false);
  const [onlineBlackImage, setOnlineBlackImage] = useState<any>(null);
  const [socialIcons, setSocialIcons] = useState<{
    facebook?: any;
    instagram?: any;
    tiktok?: any;
    x?: any;
    linkedin?: any;
  }>({});

  // Set social media icons from module-level variables
  useEffect(() => {
    setSocialIcons({
      facebook: facebookIcon,
      instagram: instagramIcon,
      tiktok: tiktokIcon,
      x: xIcon,
      linkedin: linkedinIcon,
    });
  }, []);
  const [currentGoldMemberImageIndex, setCurrentGoldMemberImageIndex] = useState(0);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [redeemModalVisible, setRedeemModalVisible] = useState(false);
  const [congratulationsModalVisible, setCongratulationsModalVisible] = useState(false);
  const [selectedRewardForRedemption, setSelectedRewardForRedemption] = useState<RewardCard | null>(null);
  const [congratulationsContext, setCongratulationsContext] = useState<'earned' | 'redeemed'>('earned');
  const [rewardQRModalVisible, setRewardQRModalVisible] = useState(false);
  const [selectedRewardForQR, setSelectedRewardForQR] = useState<RewardCard | null>(null);
  const greeting = getTimeBasedGreeting();

  // Set online-black.png from module-level variable
  // Rotate Featured Gold Members images every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentGoldMemberImageIndex((prevIndex) => 
        (prevIndex + 1) % goldMemberImages.length
      );
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // Set social media icons from module-level variables
  useEffect(() => {
    setSocialIcons({
      facebook: facebookIcon,
      instagram: instagramIcon,
      tiktok: tiktokIcon,
      x: xIcon,
      linkedin: linkedinIcon,
    });
  }, []);

  // Convert loaded rewards to RewardCard format, or use default sample data
  // Sort by newest first (most recently created/scanned appears first)
  const sortedRewards = propsRewards.length > 0
    ? [...propsRewards].sort((a, b) => {
        // Sort by createdAt (newest first), then by id as fallback
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (bTime !== aTime) return bTime - aTime; // Newest first
        return b.id.localeCompare(a.id); // Fallback: sort by id descending
      })
    : [];

  const rewardCards: RewardCard[] = sortedRewards.length > 0
    ? sortedRewards.map(reward => {
        const total = reward.total || 0;
        const products = reward.selectedProducts || [];
        const actions = reward.selectedActions || [];
        const fromQr = [...products, ...actions].slice(0, total);
        const circleLabels = total > 0 && fromQr.length >= total ? fromQr : undefined;
        const collected = reward.collectedItems || [];
        const stampedIndices: number[] = [];
        for (const c of collected) {
          if (c.itemType === 'product') {
            const i = indexInList(products, c.itemName);
            if (i >= 0) stampedIndices.push(i);
          } else {
            const i = indexInList(actions, c.itemName);
            if (i >= 0) stampedIndices.push(products.length + i);
          }
        }
        let businessId = reward.businessId;
        if (!businessId && reward.id.startsWith('campaign-')) {
          const parts = reward.id.slice(9).split('-');
          if (parts.length >= 2) businessId = parts[0];
        }
        /* Business name/id: same for campaigns and rewards — identical data, same render */
        const businessName = (reward.businessName ?? '').trim() || undefined;
        return {
          id: reward.id,
          title: reward.name,
          count: reward.count,
          total: reward.total,
          icon: reward.icon || '🎁',
          image: reward.businessLogo ? { uri: reward.businessLogo } : undefined,
          isEarned: reward.isEarned || false,
          pinCode: reward.pinCode,
          qrCode: reward.qrCode,
          businessName,
          businessId: businessId || reward.businessId,
          circleLabels,
          stampedIndices: stampedIndices.length > 0 ? stampedIndices : undefined,
        };
      })
    : [];

  const goodieCards: GoodieCard[] = [
    {id: '1', title: 'Find More Rewards', image: ''},
    {id: '2', title: 'Featured Campaigns', image: ''},
    {id: '3', title: 'Featured Gold Members', image: ''},
    {id: '4', title: 'NEW Campaigns!', image: ''},
  ];

  const featureCards: FeatureCard[] = [
    {
      id: '1',
      title: 'Rewards When You Shop Online',
      subtitle: 'Get started',
      icon: '???',
    },
    {
      id: '2',
      title: 'Ask Carrie\nCarrot ??',
      subtitle: 'AI Support 24/7',
      icon: '??',
    },
    {
      id: '3',
      title: 'Write a Review for More Rewards',
      subtitle: 'Nearest shop',
      icon: '??',
    },
    {
      id: '4',
      title: 'Refer and Earn',
      subtitle: 'Treat someone',
      icon: '??',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {/* Logo */}
          <TouchableOpacity
            style={styles.logoContainer}
            onPress={() => setAccountModalVisible(true)}
            activeOpacity={0.7}>
            {logoImage && !logoError ? (
              <Image
                source={logoImage}
                style={styles.logo}
                resizeMode="contain"
                onError={() => {
                  console.log('Logo image failed to load');
                  setLogoError(true);
                }}
              />
            ) : (
              <Text style={styles.logoText}>CC</Text>
            )}
          </TouchableOpacity>
          
          {/* Time-based greeting */}
          <Text style={styles.greeting}>
            {greeting}, {userName} <Text style={styles.versionText}> v{Constants.expoConfig?.version || '1.0.0'}</Text>
          </Text>
          
          {/* Right icons */}
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={[styles.iconButton, {marginRight: 12}]}
              onPress={() => setHelpModalVisible(true)}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>?</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setNotificationsModalVisible(true)}>
              <View style={styles.bellIconContainer}>
                {/* Bell handle/loop at top */}
                <View style={styles.bellHandle} />
                {/* Bell body - rounded shape, wider at bottom */}
                <View style={styles.bellBody}>
                  {/* Bottom horizontal band */}
                  <View style={styles.bellBottomBand} />
                </View>
                {/* Clapper/opening at very bottom */}
                <View style={styles.bellClapper} />
                {/* Red dot indicator for unread notifications */}
                {hasUnreadNotifications && (
                  <View style={styles.notificationDot} />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Marketing Banner Section */}
        <View style={styles.bannerSection}>
          {bannerImage && !bannerError ? (
            <Image
              source={bannerImage}
              style={styles.bannerImage}
              resizeMode="cover"
              onError={() => {
                console.log('Banner image failed to load');
                setBannerError(true);
              }}
            />
          ) : (
            <View style={styles.banner}>
              <View style={styles.bannerContent}>
                <View style={styles.bannerTextContainer}>
                  <Text style={styles.bannerTitle}>Canny Carrot</Text>
                  <Text style={styles.bannerSubtitle}>Rewards</Text>
                  {/* Social Media Icons */}
                  <View style={styles.socialIconsContainer}>
                    {socialIcons.facebook && (
                      <TouchableOpacity
                        style={[styles.socialIcon, {marginRight: 7}]}
                        onPress={() => Linking.openURL('https://www.facebook.com/CannyCarrotRewards')}>
                        <Image
                          source={socialIcons.facebook}
                          style={styles.socialIconImage}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    )}
                    {socialIcons.instagram && (
                      <TouchableOpacity
                        style={[styles.socialIcon, {marginRight: 7}]}
                        onPress={() => Linking.openURL('https://www.instagram.com/cannycarrotrewards')}>
                        <Image
                          source={socialIcons.instagram}
                          style={styles.socialIconImage}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    )}
                    {socialIcons.tiktok && (
                      <TouchableOpacity
                        style={[styles.socialIcon, {marginRight: 7}]}
                        onPress={() => Linking.openURL('https://www.tiktok.com/@cannycarrotrewards')}>
                        <Image
                          source={socialIcons.tiktok}
                          style={styles.socialIconImage}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    )}
                    {socialIcons.x && (
                      <TouchableOpacity
                        style={[styles.socialIcon, {marginRight: 7}]}
                        onPress={() => Linking.openURL('https://twitter.com/CannyCarrotRew')}>
                        <Image
                          source={socialIcons.x}
                          style={styles.socialIconImage}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    )}
                    {socialIcons.linkedin && (
                      <TouchableOpacity
                        style={styles.socialIcon}
                        onPress={() => Linking.openURL('https://www.linkedin.com/company/canny-carrot-rewards')}>
                        <Image
                          source={socialIcons.linkedin}
                          style={styles.socialIconImage}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <View style={styles.bannerLogoContainer}>
                  {ccIconImage ? (
                    <Image
                      source={ccIconImage}
                      style={styles.bannerLogoImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.bannerLogoPlaceholder}>
                      <Text style={styles.bannerLogoText}>Logo</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}
          {/* Social Media Icons for banner with image */}
          {bannerImage && !bannerError && (
            <View style={styles.bannerSocialIconsOverlay}>
              <View style={styles.socialIconsContainer}>
                {socialIcons.facebook && (
                  <TouchableOpacity
                    style={[styles.socialIcon, {marginRight: 7}]}
                    onPress={() => Linking.openURL('https://www.facebook.com/CannyCarrotRewards')}>
                    <Image
                      source={socialIcons.facebook}
                      style={styles.socialIconImage}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                )}
                {socialIcons.instagram && (
                  <TouchableOpacity
                    style={[styles.socialIcon, {marginRight: 7}]}
                    onPress={() => Linking.openURL('https://www.instagram.com/cannycarrotrewards')}>
                    <Image
                      source={socialIcons.instagram}
                      style={styles.socialIconImage}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                )}
                {socialIcons.tiktok && (
                  <TouchableOpacity
                    style={[styles.socialIcon, {marginRight: 7}]}
                    onPress={() => Linking.openURL('https://www.tiktok.com/@cannycarrotrewards')}>
                    <Image
                      source={socialIcons.tiktok}
                      style={styles.socialIconImage}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                )}
                {socialIcons.x && (
                  <TouchableOpacity
                    style={[styles.socialIcon, {marginRight: 7}]}
                    onPress={() => Linking.openURL('https://twitter.com/CannyCarrotRew')}>
                    <Image
                      source={socialIcons.x}
                      style={styles.socialIconImage}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                )}
                {socialIcons.linkedin && (
                  <TouchableOpacity
                    style={styles.socialIcon}
                    onPress={() => Linking.openURL('https://www.linkedin.com/company/canny-carrot-rewards')}>
                    <Image
                      source={socialIcons.linkedin}
                      style={styles.socialIconImage}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Ticker - Exact CodePen implementation - Below banner */}
        {/* Ticker - EXACT CodePen: one string, seamless wrap */}
        <View style={styles.tickerWrap}>
          <Animated.View
            style={[
              styles.ticker,
              {
                transform: [
                  {
                    translateX: tickerAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: tickerWidth > 0 
                        ? [0, -(tickerWidth + screenWidth)] // Move completely off left border
                        : [0, 0],
                      extrapolate: 'extend', // Continue seamlessly beyond inputRange for continuous scroll
                    }),
                  },
                ],
              },
            ]}
            onLayout={(event) => {
              const { width } = event.nativeEvent.layout;
              // Width = text1 + text2 + padding-right (100%)
              // When animation moves by -100%, first text scrolls off left, second appears from right = seamless
              if (width > 0 && tickerWidth !== width) {
                setTickerWidth(width);
              }
            }}
          >
            <Text style={styles.tickerItem}>{tickerText}</Text>
            <Text style={styles.tickerItem}>{tickerText}</Text>
          </Animated.View>
        </View>

        {/* Rewards Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>REWARDS</Text>
            <TouchableOpacity onPress={() => onNavigate('SeeAllRewards')}>
              <Text style={styles.sectionLink}>SEE ALL</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}>
            {rewardCards.map((card) => {
              const isEarned = card.isEarned || false;
              const total = Math.max(1, card.total || 1);
              const earned = Math.min(card.count || 0, total);
              
              // Handler: same as campaign � if earned, Redeem modal; else QR modal
              const handleRewardPress = () => {
                if (isEarned) {
                  setSelectedRewardForRedemption(card);
                  setRedeemModalVisible(true);
                } else {
                  setSelectedRewardForQR(card);
                  setRewardQRModalVisible(true);
                }
              };
              
              return (
                <TouchableOpacity
                  key={card.id}
                  style={styles.rewardCard}
                  onPress={handleRewardPress}>
                  <View style={styles.rewardTitleWrap}>
                    <Text style={styles.rewardTitle} numberOfLines={1} ellipsizeMode="tail">
                      {card.title}
                    </Text>
                  </View>
                  <View style={styles.rewardProgressContainer}>
                    <CampaignProgressCircle
                      earned={earned}
                      total={total}
                      size={80}
                      circleColor={card.id.startsWith('campaign-') ? '#74A71C' : undefined}
                    />
                    {isEarned && (
                      <TouchableOpacity
                        style={styles.redeemBadgeOverlay}
                        onPress={(e) => {
                          e.stopPropagation();
                          setSelectedRewardForRedemption(card);
                          setRedeemModalVisible(true);
                        }}
                        activeOpacity={0.8}>
                        <View style={styles.redeemBadge}>
                          <Text style={styles.redeemBadgeText}>🎁</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                  {/* Business name: same for campaigns and rewards — one code path */}
                  {card.businessName ? (
                    <Text style={styles.rewardBusinessName} numberOfLines={1}>{card.businessName}</Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* More Goodies Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>More Goodies</Text>
            <TouchableOpacity onPress={() => onNavigate('SeeAllGoodies')}>
              <Text style={styles.sectionLink}>See all</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}>
            {goodieCards.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={styles.goodieCard}
                onPress={() => {
                  if (card.id === '1') {
                    onNavigate('Search');
                  } else if (card.id === '2') {
                    onNavigate('FeaturedCampaigns');
                  } else if (card.id === '3') {
                    onNavigate('Goodie3');
                  } else if (card.id === '4') {
                    onNavigate('Goodie4');
                  }
                }}>
                {card.id === '1' && googleMapsImage ? (
                  <Image
                    source={googleMapsImage}
                    style={styles.goodieImage}
                    resizeMode="cover"
                    onError={() => {
                      console.log('Google Maps image failed to load');
                    }}
                  />
                ) : card.id === '2' && featuredCampaignsImage ? (
                  <Image
                    source={featuredCampaignsImage}
                    style={styles.goodieImage}
                    resizeMode="cover"
                    onError={() => {
                      console.log('Featured Campaigns image failed to load');
                    }}
                  />
                ) : card.id === '3' ? (
                  <View style={styles.rotatingImageContainer}>
                    {goldMemberImages.map((image, index) => (
                      <View
                        key={index}
                        style={[
                          styles.rotatingImage,
                          {
                            opacity: currentGoldMemberImageIndex === index ? 1 : 0,
                            transition: 'opacity 0.8s ease-in-out',
                          },
                        ]}>
                        <Image
                          source={image}
                          style={styles.goodieImage}
                          resizeMode="cover"
                          onError={() => {
                            console.log(`Gold member image ${index} failed to load`);
                          }}
                        />
                      </View>
                    ))}
                  </View>
                ) : card.id === '4' && campaignsImage ? (
                  <Image
                    source={campaignsImage}
                    style={styles.goodieImage}
                    resizeMode="cover"
                    onError={() => {
                      console.log('Campaigns image failed to load');
                    }}
                  />
                ) : (
                  <View style={styles.goodieImagePlaceholder}>
                    <Text style={styles.placeholderText}>Image</Text>
                  </View>
                )}
                {card.id === '4' ? (
                  <View style={styles.goodieTitle}>
                    <Text style={styles.newText}>NEW </Text>
                    <Text style={styles.goodieTitleText}>Campaigns!</Text>
                  </View>
                ) : (
                  <Text style={styles.goodieTitle}>{card.title}</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Features Section - 2x2 Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featuresGrid}>
            {featureCards.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={styles.featureCard}
                onPress={() => {
                  if (card.id === '1') {
                    onNavigate('ShopOnline');
                  } else if (card.id === '2') {
                    onNavigate('Chat');
                  } else if (card.id === '3') {
                    onNavigate('WriteReview');
                  } else if (card.id === '4') {
                    onNavigate('ReferEarn');
                  }
                }}>
                <View style={styles.featureCardTopBorder} />
                <View style={styles.featureCardContent}>
                  <View style={styles.featureCardTop}>
                    {card.id === '1' && shopOnlineImage ? (
                      <Image
                        source={shopOnlineImage}
                        style={styles.featureImage}
                        resizeMode="contain"
                        onError={() => {
                          console.log('Shop Online image failed to load');
                        }}
                      />
                    ) : card.id === '2' && calvinImage ? (
                      <Image
                        source={calvinImage}
                        style={styles.featureImage}
                        resizeMode="contain"
                        onError={() => {
                          console.log('Calvin image failed to load');
                        }}
                      />
                    ) : card.id === '3' && reviewImage ? (
                      <Image
                        source={reviewImage}
                        style={styles.featureImage}
                        resizeMode="contain"
                        onError={() => {
                          console.log('Review image failed to load');
                        }}
                      />
                    ) : card.id === '4' && earnImage ? (
                      <Image
                        source={earnImage}
                        style={styles.featureImage}
                        resizeMode="contain"
                        onError={() => {
                          console.log('Earn image failed to load');
                        }}
                      />
                    ) : (
                      <View style={styles.featureIconContainer}>
                        <Text style={styles.featureIcon}>{card.icon}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.featureCardBottom}>
                    <Text style={styles.featureTitle}>{card.title}</Text>
                    <View style={styles.featureNavButton}>
                      <Text style={styles.featureNavButtonText}>{card.subtitle}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => onNavigate('Competition')}>
            {competitionImage ? (
              <Image
                source={competitionImage}
                style={styles.ctaImage}
                resizeMode="cover"
                onError={() => {
                  console.log('Competition image failed to load');
                }}
              />
            ) : null}
            <View style={styles.ctaTextContainer}>
              <Text style={styles.ctaCompetitionText}>
                enter our Christmas{'\n'}competition
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation
        currentScreen={currentScreen}
        onNavigate={onNavigate}
        onScanPress={() => setScanModalVisible(true)}
      />

      {/* Modals */}
      <ScanModal
        visible={scanModalVisible}
        onClose={() => setScanModalVisible(false)}
        onRewardScanned={async (reward) => {
          // Reload rewards to update UI
          console.log('Reward scanned:', reward);
          // Force reload by navigating away and back to Home
          // This triggers App.tsx to reload rewards from storage
          onNavigate('Search');
          setTimeout(() => {
            onNavigate('Home');
          }, 100);
        }}
        onRewardEarned={(reward) => {
          // Show congratulations modal when reward is earned
          console.log('Reward earned:', reward);
          setSelectedRewardForRedemption({
            id: reward.id,
            title: reward.name,
            pinCode: reward.pinCode,
          });
          setCongratulationsContext('earned');
          setCongratulationsModalVisible(true);
        }}
      />
      <HelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
      />
      <NotificationsModal
        visible={notificationsModalVisible}
        onClose={() => setNotificationsModalVisible(false)}
        hasUnread={hasUnreadNotifications}
      />
      <RedeemModal
        visible={redeemModalVisible}
        onClose={() => {
          setRedeemModalVisible(false);
          setSelectedRewardForRedemption(null);
        }}
        onRedeem={async (enteredPin: string) => {
          try {
            // PIN is already verified in RedeemModal component
            // Redeem the reward in customer record (moves to redeemedRewards)
            const redeemed = await redeemReward(selectedRewardForRedemption!.id);
            
            if (redeemed) {
              // Reset the reward in AsyncStorage to start cycle again (count = 0)
              const allRewards = await loadRewards();
              const rewardIndex = allRewards.findIndex(r => r.id === selectedRewardForRedemption!.id);
              
              if (rewardIndex >= 0) {
                // Reset count to 0, remove isEarned flag, keep other data
                allRewards[rewardIndex] = {
                  ...allRewards[rewardIndex],
                  count: 0,
                  isEarned: false,
                  pointsEarned: 0,
                };
                await saveRewards(allRewards);
                console.log(`? Reward ${selectedRewardForRedemption!.id} redeemed and reset to 0 points`);
              }
              
              // Keep reward info for congratulations message, then show modal
              setRedeemModalVisible(false);
              setCongratulationsContext('redeemed');
              // Don't clear selectedRewardForRedemption yet - needed for congratulations message
              setCongratulationsModalVisible(true);
              
              // Reload rewards to update UI
              // Note: This requires parent component to reload rewards prop
              // For now, the UI will update on next navigation or app refresh
              
              return true;
            } else {
              console.error('Failed to redeem reward');
              return false;
            }
          } catch (error) {
            console.error('Error redeeming reward:', error);
            return false;
          }
        }}
        rewardName={selectedRewardForRedemption?.title || 'Reward'}
        qrCode={selectedRewardForRedemption?.qrCode}
        pinCode={selectedRewardForRedemption?.pinCode}
      />
      <CongratulationsModal
        visible={congratulationsModalVisible}
        onClose={() => {
          const wasRedeemed = congratulationsContext === 'redeemed';
          setCongratulationsModalVisible(false);
          setSelectedRewardForRedemption(null);
          setCongratulationsContext('earned');
          if (wasRedeemed) {
            onNavigate('Search');
            setTimeout(() => onNavigate('Home'), 100);
          }
        }}
        message={congratulationsContext === 'redeemed'
          ? `Congratulations you have redeemed your reward`
          : undefined}
        rewardName={selectedRewardForRedemption?.title}
      />
      
      {/* Reward QR Code Modal */}
      <RewardQRCodeModal
        visible={rewardQRModalVisible}
        rewardName={selectedRewardForQR?.title || ''}
        qrValue={selectedRewardForQR?.qrCode || ''}
        count={selectedRewardForQR?.count || 0}
        total={selectedRewardForQR?.total || 0}
        businessName={selectedRewardForQR?.businessName}
        businessId={selectedRewardForQR?.businessId}
        circleLabels={selectedRewardForQR?.circleLabels}
        stampedIndices={selectedRewardForQR?.stampedIndices}
        onClose={() => setRewardQRModalVisible(false)}
        onNavigate={onNavigate}
        onViewBusinessPage={onViewBusinessPage}
      />
      
      {/* Account Modal */}
      <AccountModal
        visible={accountModalVisible}
        onClose={() => setAccountModalVisible(false)}
        onNavigate={onNavigate}
        onLogout={() => {
          // Navigate to login screen or reset app state
          onNavigate('Login');
        }}
        customerName={userName}
        customerEmail=""
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    width: 50,
    height: 50,
  },
  logoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.background,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.primary,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.text.secondary,
    opacity: 0.7,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  bellIconContainer: {
    width: 28,
    height: 28,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 2,
  },
  bellHandle: {
    width: 8,
    height: 5,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: Colors.primary,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    marginBottom: -1,
  },
  bellBody: {
    width: 20,
    height: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 10,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    borderBottomWidth: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  bellBottomBand: {
    position: 'absolute',
    bottom: -2,
    width: 24,
    height: 3,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 2,
    backgroundColor: Colors.background,
  },
  bellClapper: {
    width: 6,
    height: 4,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: Colors.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    marginTop: -1,
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF0000',
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  bannerSection: {
    marginBottom: 0,
    width: '100%',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: 171,
  },
  banner: {
    backgroundColor: '#F69300', // Orange background - same as business app but different color
    paddingHorizontal: 20,
    paddingVertical: 17,
    minHeight: 128,
    justifyContent: 'center',
    width: '100%',
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  // Ticker styles - EXACT CodePen CSS
  tickerWrap: {
    width: '100%',
    overflow: 'hidden',
    height: 45, // Reduced by 30% from 64
    backgroundColor: '#9E8F85', // Changed from black to #9E8F85
    paddingLeft: Dimensions.get('window').width, // CodePen: padding-left: 100%
    marginBottom: 24,
  },
  ticker: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 45, // Reduced by 30% from 64
    lineHeight: 45, // Reduced by 30% from 64
    paddingRight: Dimensions.get('window').width, // CodePen: padding-right: 100%
  },
  tickerItem: {
    paddingHorizontal: 32, // CodePen: 0 2rem
    fontSize: 26, // Reduced by 20% from 32
    color: 'white', // CodePen: color: white
    includeFontPadding: false,
    flexShrink: 0,
  },
  bannerTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.background,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 21,
    fontWeight: '600',
    color: Colors.background,
    marginBottom: 8,
  },
  socialIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  socialIcon: {
    width: 27,
    height: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialIconImage: {
    width: 27,
    height: 27,
    // No tintColor - display images in their original colors
  },
  bannerSocialIconsOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  bannerLogoContainer: {
    width: 103,
    height: 103,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerLogoImage: {
    width: 103,
    height: 103,
    resizeMode: 'contain',
  },
  bannerLogoPlaceholder: {
    width: 103,
    height: 103,
    borderRadius: 51,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.neutral[300],
  },
  bannerLogoText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  sectionLink: {
    fontSize: 16,
    color: Colors.background,
    fontWeight: 'bold',
    backgroundColor: Colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  carouselContent: {
    paddingRight: 16,
  },
  rewardCard: {
    width: CARD_WIDTH,
    alignItems: 'center',
    marginRight: 12,
    // Make it touchable
  },
  rewardBusinessName: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 2,
  },
  rewardTitleWrap: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  rewardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    width: '100%',
  },
  rewardProgressContainer: {
    position: 'relative',
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineImageContainer: {
    position: 'absolute',
    top: -5, // Position at top left corner of the circle (slightly offset for visibility)
    left: -5,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    zIndex: 5,
  },
  onlineImage: {
    width: 40,
    height: 40,
  },
  redeemDotIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF0000',
    borderWidth: 2,
    borderColor: Colors.background,
    zIndex: 10,
  },
  redeemBadgeOverlay: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 10,
  },
  redeemBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  redeemBadgeText: {
    fontSize: 18,
  },
  goodieCard: {
    width: RECTANGULAR_CARD_WIDTH,
    backgroundColor: Colors.neutral[50],
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
  },
  goodieImagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: Colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  goodieImage: {
    width: '100%',
    height: 150,
    backgroundColor: Colors.neutral[50],
  },
  placeholderText: {
    color: Colors.text.light,
    fontSize: 14,
  },
  goodieTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  goodieTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  newText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary, // Orange color
  },
  rotatingImageContainer: {
    width: '100%',
    height: 150,
    position: 'relative',
    overflow: 'hidden',
  },
  rotatingImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginHorizontal: -6,
  },
  featureCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    aspectRatio: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.neutral[200],
    overflow: 'hidden',
    margin: 6,
  },
  featureCardTopBorder: {
    height: 4,
    backgroundColor: Colors.secondary,
    width: '100%',
  },
  featureCardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  featureCardTop: {
    alignItems: 'flex-end',
  },
  featureCardBottom: {
    alignItems: 'flex-start',
  },
  featureIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 24,
  },
  featureImage: {
    width: 62.5, // 25% larger than 50
    height: 62.5, // 25% larger than 50
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  featureNavButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  featureNavButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.background,
  },
  ctaButton: {
    width: '100%',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.grey,
    backgroundColor: Colors.background,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 120,
  },
  ctaImage: {
    width: '100%',
    height: 72, // 40% smaller than 120 (120 * 0.6 = 72)
    position: 'absolute',
    top: 20,
    left: 0,
  },
  ctaTextContainer: {
    position: 'absolute',
    top: 41, // Half of image height (72/2 = 36) + 15px - 10px (raised by 10px)
    left: 20,
  },
  ctaCompetitionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'left',
  },
  ctaButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  ctaButtonSubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
});

export default HomeScreen;

