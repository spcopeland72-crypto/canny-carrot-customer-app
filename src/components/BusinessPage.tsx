import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Image,
  Linking,
  Dimensions,
} from 'react-native';
import Constants from 'expo-constants';
import {Colors} from '../constants/Colors';
import BottomNavigation from './BottomNavigation';
import CampaignProgressCircle from './CampaignProgressCircle';
import RewardQRCodeModal from './RewardQRCodeModal';
import RedeemModal from './RedeemModal';
import CongratulationsModal from './CongratulationsModal';
import {loadRewards, type CustomerReward} from '../utils/dataStorage';
import {getBusinessDetails} from '../services/businessDetailsStorage';
import {getCustomerRecord} from '../services/customerRecord';
import {getTimeBasedGreeting} from '../utils/timeGreeting';
import {indexInList} from '../utils/campaignStampUtils';
import {redeemReward} from '../services/customerRecord';
import type {BusinessDetails} from '../types/businessDetails';

const tickerText =
  'Canny Carrot welcomes our newest Silver Member Powder Butterfly and our latest Gold Member Blackwells Butchers';
const screenWidth = Dimensions.get('window').width || 375;
const CARD_WIDTH = screenWidth * 0.42;

let logoImage: any = null;
let ccIconImage: any = null;
try {
  logoImage = require('../../assets/logo.png');
} catch {
  try {
    logoImage = require('../../Images/NEW Logo With Outline.png');
  } catch {
    logoImage = null;
  }
}
try {
  ccIconImage = require('../../assets/cc-icon-no-background.png');
} catch {
  ccIconImage = null;
}
let stablesBannerImage: any = null;
try {
  stablesBannerImage = require('../../Images/stables banner.png');
} catch {
  stablesBannerImage = null;
}
const facebookIcon = require('../../Images/facebook.png');
const instagramIcon = require('../../Images/instagram.png');
const tiktokIcon = require('../../Images/tiktok.png');
const xIcon = require('../../Images/x.png');
const linkedinIcon = require('../../Images/linkedin.png');

interface BusinessPageProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onScanPress?: () => void;
  onViewBusinessPage?: (businessName: string, businessId?: string) => void;
  businessName: string;
  businessId?: string;
}

function matchBusiness(r: CustomerReward, name: string, id?: string): boolean {
  const n = (s: string) => (s ?? '').toLowerCase().trim();
  if (id && n(r.businessId ?? '') === n(id)) return true;
  if (name && n(r.businessName ?? '') === n(name)) return true;
  return false;
}

const socialUrl = (platform: string, handle: string): string => {
  const h = (handle || '').trim();
  if (!h) return '';
  const lower = platform.toLowerCase();
  if (lower === 'facebook') return `https://facebook.com/${h.startsWith('http') ? h.replace(/^https?:\/\/(www\.)?facebook\.com\/?/i, '') : h}`;
  if (lower === 'instagram') return `https://instagram.com/${h.startsWith('http') ? h.replace(/^https?:\/\/(www\.)?instagram\.com\/?/i, '') : h}`;
  if (lower === 'twitter' || lower === 'x') return `https://x.com/${h.startsWith('http') ? h.replace(/^https?:\/\/(www\.)?(twitter|x)\.com\/?/i, '') : h}`;
  if (lower === 'tiktok') return `https://tiktok.com/@${h.replace(/^@/, '').replace(/^https?:\/\/.*tiktok\.com\/@?/i, '')}`;
  if (lower === 'linkedin') return h.startsWith('http') ? h : `https://linkedin.com/company/${h}`;
  return h.startsWith('http') ? h : `https://${h}`;
};

function googleMapsUrl(address: string): string {
  const q = encodeURIComponent(address.trim());
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

interface RewardCard {
  id: string;
  title: string;
  count: number;
  total: number;
  icon: string;
  isEarned?: boolean;
  pinCode?: string;
  qrCode?: string;
  businessName?: string;
  businessId?: string;
  circleLabels?: string[];
  stampedIndices?: number[];
}

const BusinessPage: React.FC<BusinessPageProps> = ({
  currentScreen,
  onNavigate,
  onScanPress,
  onViewBusinessPage,
  businessName,
  businessId,
}) => {
  const [userName, setUserName] = useState('there');
  const [details, setDetails] = useState<BusinessDetails | null>(null);
  const [rewards, setRewards] = useState<CustomerReward[]>([]);
  const [rewardQRModalVisible, setRewardQRModalVisible] = useState(false);
  const [redeemModalVisible, setRedeemModalVisible] = useState(false);
  const [congratulationsModalVisible, setCongratulationsModalVisible] = useState(false);
  const [selectedRewardForQR, setSelectedRewardForQR] = useState<RewardCard | null>(null);
  const [selectedRewardForRedemption, setSelectedRewardForRedemption] = useState<RewardCard | null>(null);
  const [justRedeemedName, setJustRedeemedName] = useState<string | null>(null);

  const greeting = getTimeBasedGreeting();

  const loadUser = useCallback(async () => {
    try {
      const record = await getCustomerRecord();
      const full = (record?.profile?.name ?? '').trim();
      const first = full ? full.split(/\s+/)[0] : '';
      setUserName(first || 'there');
    } catch {
      setUserName('there');
    }
  }, []);

  const loadRewardsFiltered = useCallback(async () => {
    const all = await loadRewards();
    const filtered = all.filter((r) => matchBusiness(r, businessName, businessId));
    setRewards(filtered);
  }, [businessName, businessId]);

  const loadDetails = useCallback(async () => {
    if (!businessId) return;
    const d = await getBusinessDetails(businessId);
    setDetails(d ?? null);
  }, [businessId]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);
  useEffect(() => {
    loadRewardsFiltered();
  }, [loadRewardsFiltered, currentScreen]);
  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const d = details;
  const displayName = d?.name || businessName;

  const rewardCards: RewardCard[] = rewards.map((reward) => {
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
    let bid = reward.businessId;
    if (!bid && reward.id.startsWith('campaign-')) {
      const parts = reward.id.slice(9).split('-');
      if (parts.length >= 2) bid = parts[0];
    }
    const businessNameVal = (reward.businessName ?? '').trim() || undefined;
    return {
      id: reward.id,
      title: reward.name,
      count: reward.count ?? 0,
      total: reward.total ?? 0,
      icon: reward.icon || '🎁',
      isEarned: reward.isEarned || false,
      pinCode: reward.pinCode,
      qrCode: reward.qrCode,
      businessName: businessNameVal,
      businessId: bid || reward.businessId,
      circleLabels,
      stampedIndices: stampedIndices.length > 0 ? stampedIndices : undefined,
    };
  });

  const handleRewardPress = (card: RewardCard) => {
    if (card.isEarned) {
      setSelectedRewardForRedemption(card);
      setRedeemModalVisible(true);
    } else {
      setSelectedRewardForQR(card);
      setRewardQRModalVisible(true);
    }
  };

  const handleRedeem = async (enteredPin: string): Promise<boolean> => {
    if (!selectedRewardForRedemption) return false;
    const id = selectedRewardForRedemption.id.startsWith('campaign-')
      ? selectedRewardForRedemption.id.slice(9)
      : selectedRewardForRedemption.id;
    const name = selectedRewardForRedemption.title;
    try {
      const isCampaign = selectedRewardForRedemption.id.startsWith('campaign-');
      if (isCampaign) {
        const { redeemCampaign } = await import('../services/customerRecord');
        await redeemCampaign(id);
      } else {
        await redeemReward(id);
      }
      setRedeemModalVisible(false);
      setSelectedRewardForRedemption(null);
      setJustRedeemedName(name);
      setCongratulationsModalVisible(true);
      await loadRewardsFiltered();
      return true;
    } catch (e) {
      console.error('Redeem error:', e);
      return false;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header – same as Home */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.logoContainer}
            onPress={() => onNavigate('Home')}
            activeOpacity={0.7}>
            {logoImage ? (
              <Image source={logoImage} style={styles.logo} resizeMode="contain" />
            ) : (
              <Text style={styles.logoText}>CC</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.greeting} numberOfLines={1}>
            {greeting}, {userName} <Text style={styles.versionText}>v{Constants.expoConfig?.version || '1.0.0'}</Text>
          </Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={[styles.iconButton, {marginRight: 12}]} onPress={() => onNavigate('FAQs')}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>?</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => onNavigate('Chat')}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>🔔</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Stables banner (View Business); social icons kept */}
        <View style={styles.bannerSection}>
          {stablesBannerImage ? (
            <Image source={stablesBannerImage} style={styles.stablesBannerImage} resizeMode="cover" />
          ) : (
            <View style={styles.bannerFallback} />
          )}
          <View style={styles.bannerSocialIconsOverlay}>
            <View style={styles.socialIconsContainer}>
              <TouchableOpacity style={[styles.socialIcon, { marginRight: 7 }]} onPress={() => Linking.openURL('https://www.facebook.com/CannyCarrotRewards')}>
                <Image source={facebookIcon} style={styles.socialIconImage} resizeMode="contain" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialIcon, { marginRight: 7 }]} onPress={() => Linking.openURL('https://www.instagram.com/cannycarrotrewards')}>
                <Image source={instagramIcon} style={styles.socialIconImage} resizeMode="contain" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialIcon, { marginRight: 7 }]} onPress={() => Linking.openURL('https://www.tiktok.com/@cannycarrotrewards')}>
                <Image source={tiktokIcon} style={styles.socialIconImage} resizeMode="contain" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialIcon, { marginRight: 7 }]} onPress={() => Linking.openURL('https://twitter.com/CannyCarrotRew')}>
                <Image source={xIcon} style={styles.socialIconImage} resizeMode="contain" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIcon} onPress={() => Linking.openURL('https://www.linkedin.com/company/canny-carrot-rewards')}>
                <Image source={linkedinIcon} style={styles.socialIconImage} resizeMode="contain" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Ticker */}
        <View style={styles.tickerWrap}>
          <Text style={styles.tickerItem} numberOfLines={1}>{tickerText}</Text>
        </View>

        {/* Business details */}
        <View style={styles.businessSection}>
          <View style={styles.businessHeader}>
            {d?.logo ? (
              <Image source={{ uri: d.logo }} style={styles.businessLogo} resizeMode="contain" />
            ) : (
              <View style={styles.businessLogoPlaceholder}>
                <Text style={styles.businessLogoPlaceholderText}>{displayName.slice(0, 2).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.businessTitleBlock}>
              <Text style={styles.businessName}>{displayName}</Text>
              {d?.website ? (
                <TouchableOpacity onPress={() => Linking.openURL(d.website!)}>
                  <Text style={styles.businessWebsite} numberOfLines={1}>{d.website}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          {(d?.address || d?.phone || d?.email) ? (
            <View style={styles.businessInfo}>
              {d?.address ? <Text style={styles.businessLine}>{d.address}</Text> : null}
              {d?.phone ? <Text style={styles.businessLine}>📞 {d.phone}</Text> : null}
              {d?.email ? <Text style={styles.businessLine}>✉️ {d.email}</Text> : null}
            </View>
          ) : null}
          <View style={styles.businessActions}>
            {d?.website ? (
              <TouchableOpacity style={[styles.primaryButton, styles.primaryButtonSpacer]} onPress={() => Linking.openURL(d.website!)}>
                <Text style={styles.primaryButtonText}>Website</Text>
              </TouchableOpacity>
            ) : null}
            {d?.address ? (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => Linking.openURL(googleMapsUrl(d!.address!))}>
                <Text style={styles.primaryButtonText}>Directions</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* REWARDS – user's rewards/campaigns with this business */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>REWARDS</Text>
            <TouchableOpacity onPress={() => onNavigate('SeeAllRewards')}>
              <Text style={styles.sectionLink}>SEE ALL</Text>
            </TouchableOpacity>
          </View>
          {rewardCards.length === 0 ? (
            <Text style={styles.empty}>No rewards or campaigns with this business yet.</Text>
          ) : (
            <View style={styles.rewardsGrid}>
              {rewardCards.map((card) => {
                const total = Math.max(1, card.total);
                const earned = Math.min(card.count, total);
                return (
                  <TouchableOpacity
                    key={card.id}
                    style={styles.rewardCard}
                    onPress={() => handleRewardPress(card)}>
                    <Text style={styles.rewardTitle} numberOfLines={1}>
                      {card.title}
                    </Text>
                    <View style={styles.rewardProgressContainer}>
                      <CampaignProgressCircle
                        earned={earned}
                        total={total}
                        size={72}
                        circleColor={card.id.startsWith('campaign-') ? '#74A71C' : undefined}
                      />
                      {card.isEarned && (
                        <View style={styles.redeemBadge}>
                          <Text style={styles.redeemBadgeText}>🎁</Text>
                        </View>
                      )}
                    </View>
                    {card.businessName ? (
                      <Text style={styles.rewardBusinessName} numberOfLines={1}>{card.businessName}</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <BottomNavigation
        currentScreen={currentScreen}
        onNavigate={onNavigate}
        onScanPress={onScanPress}
      />

      <RewardQRCodeModal
        visible={rewardQRModalVisible}
        rewardName={selectedRewardForQR?.title ?? ''}
        qrValue={selectedRewardForQR?.qrCode ?? ''}
        count={selectedRewardForQR?.count ?? 0}
        total={Math.max(1, selectedRewardForQR?.total ?? 1)}
        businessName={selectedRewardForQR?.businessName}
        businessId={selectedRewardForQR?.businessId}
        circleLabels={selectedRewardForQR?.circleLabels}
        stampedIndices={selectedRewardForQR?.stampedIndices}
        onClose={() => { setRewardQRModalVisible(false); setSelectedRewardForQR(null); }}
        onNavigate={onNavigate}
        onViewBusinessPage={onViewBusinessPage}
      />
      <RedeemModal
        visible={redeemModalVisible}
        rewardName={selectedRewardForRedemption?.title ?? ''}
        pinCode={selectedRewardForRedemption?.pinCode}
        qrCode={selectedRewardForRedemption?.qrCode}
        onClose={() => { setRedeemModalVisible(false); setSelectedRewardForRedemption(null); }}
        onRedeem={handleRedeem}
      />
      <CongratulationsModal
        visible={congratulationsModalVisible}
        onClose={() => { setCongratulationsModalVisible(false); setJustRedeemedName(null); }}
        rewardName={justRedeemedName ?? undefined}
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
  logoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: { width: 50, height: 50 },
  logoText: { fontSize: 18, fontWeight: 'bold', color: Colors.background },
  greeting: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
    marginHorizontal: 12,
    textAlign: 'center',
  },
  versionText: { fontSize: 12, fontWeight: '400', color: Colors.text.secondary, opacity: 0.8 },
  headerIcons: { flexDirection: 'row' },
  iconButton: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  bannerSection: {
    width: '100%',
    position: 'relative',
    marginBottom: 0,
  },
  stablesBannerImage: {
    width: '100%',
    height: 140,
  },
  bannerFallback: {
    width: '100%',
    height: 140,
    backgroundColor: Colors.neutral[200],
  },
  bannerSocialIconsOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  socialIconsContainer: { flexDirection: 'row', alignItems: 'center' },
  socialIcon: { width: 27, height: 27, justifyContent: 'center', alignItems: 'center' },
  socialIconImage: { width: 27, height: 27 },
  tickerWrap: {
    width: '100%',
    backgroundColor: '#9E8F85',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  tickerItem: { fontSize: 16, color: 'white', flexShrink: 0 },
  businessSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  businessLogo: { width: 64, height: 64, borderRadius: 8, marginRight: 16 },
  businessLogoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: Colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  businessLogoPlaceholderText: { fontSize: 20, fontWeight: '700', color: Colors.neutral[600] },
  businessTitleBlock: { flex: 1 },
  businessName: { fontSize: 22, fontWeight: '700', color: Colors.text.primary, marginBottom: 4 },
  businessWebsite: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  businessInfo: { marginBottom: 12 },
  businessLine: { fontSize: 14, color: Colors.text.secondary, marginBottom: 4 },
  businessActions: { flexDirection: 'row', flexWrap: 'wrap' },
  primaryButton: {
    backgroundColor: '#0E7C86',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonSpacer: { marginRight: 12 },
  primaryButtonText: { fontSize: 16, fontWeight: '600', color: Colors.background },
  section: { marginBottom: 32, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.primary },
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
  rewardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  rewardCard: {
    width: CARD_WIDTH,
    alignItems: 'center',
    marginBottom: 20,
  },
  rewardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
    width: '100%',
  },
  rewardProgressContainer: { position: 'relative', marginBottom: 8, justifyContent: 'center', alignItems: 'center' },
  redeemBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  redeemBadgeText: { fontSize: 14 },
  rewardBusinessName: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  empty: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default BusinessPage;
