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
import CircularProgress from './CircularProgress';
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

// Import images at module level
// Path from src/components/ to assets/ is ../../assets/
let logoImage;
let bannerImage;

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

try {
  bannerImage = require('../../assets/banner.png');
  console.log('Banner loaded from assets');
} catch (e) {
  console.log('Banner not found in assets:', e);
  try {
    bannerImage = require('../../Images/Banner 1.png');
    console.log('Banner loaded from Images folder');
  } catch (e2) {
    console.log('Banner not found anywhere:', e2);
  }
}

// Load Blackwells logo using same pattern as banner/logo
let blackwellsLogo;
try {
  blackwellsLogo = require('../../assets/blackwells.png');
} catch (e) {
  try {
    blackwellsLogo = require('../../Images/blackwells.png');
  } catch (e2) {
    // Logo not found - will use emoji fallback
    blackwellsLogo = null;
  }
}

// Load Bluecorn Bakery logo for circle 2
let bluecornLogo;
try {
  bluecornLogo = require('../../assets/bluecorn-bakers.png');
} catch (e) {
  try {
    bluecornLogo = require('../../Images/bluecorn-bakers.png');
  } catch (e2) {
    // Logo not found - will use emoji fallback
    bluecornLogo = null;
  }
}

// Load logo for circle 3 (Sandwiches & Salads) - The Green Florist
let sandwichLogo;
try {
  sandwichLogo = require('../../assets/green-florist.png');
} catch (e) {
  try {
    sandwichLogo = require('../../Images/green-florist.png');
  } catch (e2) {
    // Logo not found - will use emoji fallback
    sandwichLogo = null;
  }
}

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

// Load daisy-chain.png image for Rewards section circle 4
// Temporarily disabled to prevent blank screen
let daisyChainImage = null;
/*
try {
  daisyChainImage = require('../../assets/daisy-chain.png');
} catch (e) {
  try {
    daisyChainImage = require('../../Images/daisy-chain.png');
  } catch (e2) {
    // Image not found - will use emoji fallback
    daisyChainImage = null;
  }
}
*/

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
  businessName?: string; // Business name
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
  rewards?: Array<{
    id: string;
    name: string;
    count: number;
    total: number;
    icon: string;
    pointsEarned?: number;
    isEarned?: boolean;
    pinCode?: string;
  }>;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  currentScreen = 'Home',
  onNavigate = () => {},
  onScanPress = () => {},
  rewards: propsRewards = [],
}) => {
  const [userName] = useState('Simon'); // This would come from user context
  const [logoError, setLogoError] = useState(false);
  const [bannerError, setBannerError] = useState(false);
  
  // Ticker animation - Exact CodePen implementation
  // CSS: padding-left: 100% pushes content off-screen right
  // CSS: padding-right: 100% adds space after text  
  // CSS: translate3d(-100%, 0, 0) animates by -100% of element width
  // Text is duplicated for seamless loop
  
  const tickerText = "Canny Carrot welcomes our newest Silver Member Powder Butterfly and our latest Gold Member Blackwells Butchers";
  const screenWidth = Dimensions.get('window').width || 375;
  const tickerAnimation = useRef(new Animated.Value(0)).current;
  const [tickerWidth, setTickerWidth] = useState(0);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  
  // Start animation when width is measured
  const startTickerAnimation = (width: number) => {
    if (animationRef.current) {
      animationRef.current.stop();
    }
    tickerAnimation.setValue(0);
    const duration = 30000; // 30 seconds as per CodePen
    // useNativeDriver doesn't work on web, use false for web platform
    animationRef.current = Animated.loop(
      Animated.timing(tickerAnimation, {
        toValue: 1,
        duration: duration,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      })
    );
    animationRef.current.start();
  };
  
  // Start animation when width is available
  useEffect(() => {
    if (tickerWidth > 0) {
      startTickerAnimation(tickerWidth);
    }
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
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
  useEffect(() => {
    setOnlineBlackImage(onlineBlackIcon);
  }, []);

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
  console.log('[HomeScreen] Props rewards received:', propsRewards.length, 'rewards');
  if (propsRewards.length > 0) {
    console.log('[HomeScreen] Reward IDs:', propsRewards.map(r => ({ id: r.id, name: r.name, createdAt: r.createdAt })));
  }
  
  const sortedRewards = propsRewards.length > 0
    ? [...propsRewards].sort((a, b) => {
        // Sort by createdAt (newest first), then by id as fallback
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (bTime !== aTime) return bTime - aTime; // Newest first
        return b.id.localeCompare(a.id); // Fallback: sort by id descending
      })
    : [];
  
  console.log('[HomeScreen] Sorted rewards:', sortedRewards.length, 'rewards');
  
  const rewardCards: RewardCard[] = sortedRewards.length > 0
    ? sortedRewards.map(reward => ({
        id: reward.id,
        title: reward.name,
        count: reward.count, // Current progress (e.g., 1 of 4)
        total: reward.total, // Total needed (e.g., 4)
        icon: reward.icon || '🎁',
        image: reward.businessLogo ? { uri: reward.businessLogo } : undefined, // Use business logo if available
        isEarned: reward.isEarned || false,
        pinCode: reward.pinCode,
        qrCode: reward.qrCode, // Include QR code for display
        businessName: reward.businessName, // Business name
      }))
    : [
        // Default sample data if no rewards loaded
        {id: '1', title: 'Blackwells Butchers', count: 8, total: 10, icon: '🥐', image: blackwellsLogo},
        {id: '2', title: 'Bluecorn Bakers', count: 7, total: 10, icon: '☕', image: bluecornLogo},
        {id: '3', title: 'The Green Florist', count: 9, total: 10, icon: '🥪', image: sandwichLogo},
        {id: '4', title: 'Sweet Treats', count: 9, total: 10, icon: '🍩', image: daisyChainImage},
        {id: '5', title: 'Hot Meals', count: 6, total: 10, icon: '🍲'},
        {id: '6', title: 'Breakfast', count: 5, total: 10, icon: '🥞'},
      ];
  
  console.log('[HomeScreen] Final reward cards:', rewardCards.length, 'cards');

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
      icon: '🛍️',
    },
    {
      id: '2',
      title: 'Ask Carrie\nCarrot 🥕',
      subtitle: 'AI Support 24/7',
      icon: '💬',
    },
    {
      id: '3',
      title: 'Write a Review for More Rewards',
      subtitle: 'Nearest shop',
      icon: '📍',
    },
    {
      id: '4',
      title: 'Refer and Earn',
      subtitle: 'Treat someone',
      icon: '🎁',
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
                  <View style={styles.bannerLogoPlaceholder}>
                    <Text style={styles.bannerLogoText}>Logo</Text>
                  </View>
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
                        ? [0, -tickerWidth] // Move by full measured width
                        : [0, -(screenWidth * 3)], // Fallback: move by 3x screen width
                    }),
                  },
                ],
              },
            ]}
            onLayout={(event) => {
              const { width } = event.nativeEvent.layout;
              console.log('[Ticker] Measured width:', width, 'Screen width:', screenWidth);
              console.log('[Ticker] Text length:', tickerText.length);
              if (width > 0 && tickerWidth !== width) {
                setTickerWidth(width);
                console.log('[Ticker] Animation will move from 0 to', -width);
              }
            }}
          >
            <Text style={styles.tickerItem} numberOfLines={1} ellipsizeMode="clip">{tickerText}</Text>
            <Text style={styles.tickerItem} numberOfLines={1} ellipsizeMode="clip">{tickerText}</Text>
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
              const progress = ((card.total - card.count) / card.total) * 100;
              // All circles use orange
              const progressColor = Colors.secondary;
              const isEarned = card.isEarned || false;
              
              // Handler for reward card click
              // If earned, show Redeem modal for redemption; otherwise show QR code
              const handleRewardPress = () => {
                if (isEarned) {
                  // Reward is earned - open Redeem modal for redemption
                  setSelectedRewardForRedemption(card);
                  setRedeemModalVisible(true);
                } else {
                  // Reward not yet earned - show QR code
                  setSelectedRewardForQR(card);
                  setRewardQRModalVisible(true);
                }
              };
              
              return (
                <TouchableOpacity
                  key={card.id}
                  style={styles.rewardCard}
                  onPress={handleRewardPress}>
                  {/* Business name at top */}
                  {card.businessName && (
                    <Text style={styles.rewardBusinessName}>{card.businessName}</Text>
                  )}
                  {/* Reward name below business name */}
                  <Text style={styles.rewardTitle}>{card.title}</Text>
                  <View style={styles.rewardProgressContainer}>
                    {/* Online-black.png image at top left corner of circle 3 */}
                    {card.id === '3' && onlineBlackImage && !onlineImageError ? (
                      <View style={styles.onlineImageContainer}>
                        <Image
                          source={onlineBlackImage}
                          style={styles.onlineImage}
                          resizeMode="contain"
                          onError={() => {
                            console.log('Online-black image failed to load');
                            setOnlineImageError(true);
                          }}
                        />
                      </View>
                    ) : null}
                    <CircularProgress
                      key={`progress-${card.id}`}
                      size={80}
                      strokeWidth={6}
                      progress={progress}
                      color={progressColor}
                      backgroundColor={Colors.neutral[200]}
                    />
                    <View style={[
                      styles.rewardIconOverlay,
                      card.id === '2' && styles.rewardIconOverlayBlue,
                      card.id === '3' && styles.rewardIconOverlayGreen
                    ]}>
                      {card.id === '1' && blackwellsLogo ? (
                        <Image
                          source={blackwellsLogo}
                          style={styles.rewardImage}
                          resizeMode="contain"
                          onError={() => {
                            console.log('Blackwells logo failed to load, using emoji');
                          }}
                        />
                      ) : card.id === '2' && bluecornLogo ? (
                        <Image
                          source={bluecornLogo}
                          style={styles.rewardImage}
                          resizeMode="contain"
                          onError={() => {
                            console.log('Bluecorn logo failed to load, using emoji');
                          }}
                        />
                      ) : card.id === '3' && sandwichLogo ? (
                        <Image
                          source={sandwichLogo}
                          style={styles.rewardImage}
                          resizeMode="contain"
                          onError={() => {
                            console.log('Sandwich logo failed to load, using emoji');
                          }}
                        />
                      ) : card.id === '4' && daisyChainImage ? (
                        <Image
                          source={daisyChainImage}
                          style={styles.rewardImage}
                          resizeMode="contain"
                          onError={() => {
                            console.log('Daisy chain image failed to load, using emoji');
                          }}
                        />
                      ) : (
                        <Text style={styles.rewardIcon}>{card.icon}</Text>
                      )}
                      {/* Redemption badge overlay when reward is earned */}
                      {isEarned && (
                        <TouchableOpacity
                          style={styles.redeemBadgeOverlay}
                          onPress={(e) => {
                            e.stopPropagation();
                            // Badge click opens Redeem modal for redemption
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
                  </View>
                  {/* Points count below icon - e.g., "4 out of 5" */}
                  <Text style={styles.rewardCount}>
                    {card.count} out of {card.total}
                  </Text>
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
                    onNavigate('FindMoreRewards');
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
                console.log(`✅ Reward ${selectedRewardForRedemption!.id} redeemed and reset to 0 points`);
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
          setCongratulationsModalVisible(false);
          setSelectedRewardForRedemption(null);
          setCongratulationsContext('earned');
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
        onClose={() => setRewardQRModalVisible(false)}
        onNavigate={onNavigate}
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
    height: 171, // Reduced by 5% from 180
  },
  banner: {
    backgroundColor: Colors.secondary, // Orange background
    paddingHorizontal: 20,
    paddingVertical: 17, // Reduced by 5% from 18
    minHeight: 128, // Reduced by 5% from 135
    justifyContent: 'center',
    width: '100%',
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  // Ticker styles - Exact CodePen CSS conversion
  tickerWrap: {
    width: '100%',
    overflow: 'hidden',
    height: 32,
    backgroundColor: Colors.neutral[50],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.neutral[200],
    paddingLeft: Dimensions.get('window').width, // padding-left: 100% (pushes ticker element off-screen right)
    marginBottom: 24,
  },
  ticker: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    paddingRight: Dimensions.get('window').width, // padding-right: 100% (adds space after text for seamless loop)
    // Ensure content doesn't get clipped
    minWidth: '100%',
  },
  tickerItem: {
    paddingHorizontal: 16,
    fontSize: 12,
    color: Colors.text.primary,
    includeFontPadding: false,
    flexShrink: 0,
    // Ensure full text renders - no constraints
    minWidth: undefined,
    maxWidth: undefined,
  },
  bannerTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 28, // Reduced by 5% from 29
    fontWeight: 'bold',
    color: Colors.background,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 21, // Reduced by 5% from 22
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
    width: 103, // Reduced by 5% from 108
    height: 103, // Reduced by 5% from 108
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerLogoPlaceholder: {
    width: 103, // Reduced by 5% from 108
    height: 103, // Reduced by 5% from 108
    borderRadius: 51, // Reduced by 5% from 54
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
    fontWeight: '500',
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 2,
  },
  rewardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
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
  rewardIconOverlay: {
    position: 'absolute',
    width: 68, // Smaller than 80 to show the progress ring around it
    height: 68,
    borderRadius: 34,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardIconOverlayBlue: {
    backgroundColor: '#87CEEB', // Sky blue to match Bluecorn Bakery logo
  },
  rewardIconOverlayGreen: {
    backgroundColor: '#1B5E20', // Dark green to match The Green Florist logo
  },
  rewardIcon: {
    fontSize: 32,
  },
  rewardImage: {
    width: 60,
    height: 60,
  },
  rewardCount: {
    fontSize: 11,
    color: Colors.text.secondary,
    textAlign: 'center',
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

