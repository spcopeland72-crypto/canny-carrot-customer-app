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

const screenWidth = Dimensions.get('window').width || 375;
const CARD_WIDTH = screenWidth * 0.25;

const TICKER_TEXT = 'Canny Carrot welcomes our newest Silver Member Powder Butterfly and our latest Gold Member Blackwells Butchers';

let logoImage: any = null;
let stablesBannerImage: any = null;
let facebookIcon: any;
let instagramIcon: any;
let tiktokIcon: any;
let xIcon: any;
let linkedinIcon: any;
try {
  stablesBannerImage = require('../../Images/stables banner.png');
} catch { stablesBannerImage = null; }
try {
  facebookIcon = require('../../Images/facebook.png');
  instagramIcon = require('../../Images/instagram.png');
  tiktokIcon = require('../../Images/tiktok.png');
  xIcon = require('../../Images/x.png');
  linkedinIcon = require('../../Images/linkedin.png');
} catch {
  facebookIcon = instagramIcon = tiktokIcon = xIcon = linkedinIcon = null;
}

try {
  logoImage = require('../../assets/logo.png');
} catch {
  try {
    logoImage = require('../../Images/NEW Logo With Outline.png');
  } catch {
    logoImage = null;
  }
}

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
  startDate?: string;
  collectedItems?: { itemType: string; itemName: string }[];
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
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselTotal = 1;

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

  const buildRewardCard = (reward: CustomerReward): RewardCard => {
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
    const bid = reward.businessId;
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
      businessId: bid ?? reward.businessId,
      startDate: reward.startDate,
      collectedItems: reward.collectedItems,
      circleLabels,
      stampedIndices: stampedIndices.length > 0 ? stampedIndices : undefined,
    };
  };

  const rewardCards: RewardCard[] = rewards.map((reward) => buildRewardCard(reward));

  const handleRewardPress = (card: RewardCard) => {
    if (card.isEarned) {
      setSelectedRewardForRedemption(card);
      setRedeemModalVisible(true);
    } else {
      (async () => {
        const fresh = await loadRewards();
        const r = fresh.find((x) => x.id === card.id);
        const modalCard = r ? buildRewardCard(r) : card;
        setSelectedRewardForQR(modalCard);
        setRewardQRModalVisible(true);
      })();
    }
  };

  const handleRedeem = async (enteredPin: string): Promise<boolean> => {
    if (!selectedRewardForRedemption) return false;
    const id = selectedRewardForRedemption.id;
    const name = selectedRewardForRedemption.title;
    try {
      const isCampaign = selectedRewardForRedemption.startDate != null || (Array.isArray(selectedRewardForRedemption.collectedItems) && selectedRewardForRedemption.collectedItems.length > 0);
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
        {/* Stables banner – business banner instead of Canny Carrot */}
        <View style={styles.bannerSection}>
          {stablesBannerImage ? (
            <Image source={stablesBannerImage} style={styles.stablesBannerImage} resizeMode="cover" />
          ) : (
            <View style={styles.bannerFallback} />
          )}
          <View style={styles.bannerSocialOverlay}>
            {facebookIcon && (
              <TouchableOpacity style={styles.socialIconBtn} onPress={() => Linking.openURL('https://www.facebook.com/CannyCarrotRewards')}>
                <Image source={facebookIcon} style={styles.socialIconImg} resizeMode="contain" />
              </TouchableOpacity>
            )}
            {instagramIcon && (
              <TouchableOpacity style={styles.socialIconBtn} onPress={() => Linking.openURL('https://www.instagram.com/cannycarrotrewards')}>
                <Image source={instagramIcon} style={styles.socialIconImg} resizeMode="contain" />
              </TouchableOpacity>
            )}
            {tiktokIcon && (
              <TouchableOpacity style={styles.socialIconBtn} onPress={() => Linking.openURL('https://www.tiktok.com/@cannycarrotrewards')}>
                <Image source={tiktokIcon} style={styles.socialIconImg} resizeMode="contain" />
              </TouchableOpacity>
            )}
            {xIcon && (
              <TouchableOpacity style={styles.socialIconBtn} onPress={() => Linking.openURL('https://twitter.com/CannyCarrotRew')}>
                <Image source={xIcon} style={styles.socialIconImg} resizeMode="contain" />
              </TouchableOpacity>
            )}
            {linkedinIcon && (
              <TouchableOpacity style={styles.socialIconBtn} onPress={() => Linking.openURL('https://www.linkedin.com/company/canny-carrot-rewards')}>
                <Image source={linkedinIcon} style={styles.socialIconImg} resizeMode="contain" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Ticker */}
        <View style={styles.tickerWrap}>
          <Text style={styles.tickerItem} numberOfLines={1}>{TICKER_TEXT}</Text>
        </View>

        {/* Google Business listing format */}
        <View style={styles.gmbSection}>
          <Text style={styles.gmbName}>{displayName}</Text>
          {d?.website ? (
            <TouchableOpacity onPress={() => Linking.openURL(d.website!)}>
              <Text style={styles.gmbWebsite} numberOfLines={1}>{d.website}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.gmbWebsitePlaceholder}>Add website</Text>
          )}

          <View style={styles.gmbRatingRow}>
            <Text style={styles.gmbRating}>5/5 (1 review)</Text>
            <Text style={styles.gmbDot}> · </Text>
            <Text style={styles.gmbType}>{d?.type || '—'}</Text>
          </View>

          <View style={styles.gmbAddressRow}>
            <Text style={styles.gmbAddress} numberOfLines={2}>{d?.address || '—'}</Text>
            {d?.address ? <Text style={styles.gmbDistance}> · 5.5 mi</Text> : null}
          </View>

          <View style={styles.gmbHoursRow}>
            <Text style={styles.gmbHours}>—</Text>
            <TouchableOpacity><Text style={styles.gmbHoursLink}> · More hours</Text></TouchableOpacity>
          </View>

          <View style={styles.gmbContactBlock}>
            {d?.phone ? (
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${d.phone}`)}>
                <Text style={styles.gmbContactLink}>{d.phone}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.gmbContact}>—</Text>
            )}
            {d?.email ? (
              <TouchableOpacity onPress={() => Linking.openURL(`mailto:${d.email}`)}>
                <Text style={styles.gmbContactLink}>{d.email}</Text>
              </TouchableOpacity>
            ) : null}
            {d?.whatsapp ? (
              <TouchableOpacity onPress={() => Linking.openURL(`https://wa.me/${String(d.whatsapp).replace(/\D/g, '')}`)}>
                <Text style={styles.gmbContactLink}>WhatsApp</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Image carousel – GMB style */}
          <Text style={styles.carouselTitle}>{(displayName || 'Business').toUpperCase().replace(/\s+/g, ' & ')}</Text>
          <View style={styles.carouselRow}>
            <TouchableOpacity style={styles.carouselArrow} onPress={() => setCarouselIndex((i) => Math.max(0, i - 1))}>
              <Text style={styles.carouselArrowText}>‹</Text>
            </TouchableOpacity>
            <View style={styles.carouselSlide}>
              <View style={styles.carouselPlaceholder}><Text style={styles.carouselPlaceholderText}>Add photos</Text></View>
            </View>
            <TouchableOpacity style={styles.carouselArrow} onPress={() => setCarouselIndex((i) => Math.min(carouselTotal - 1, i + 1))}>
              <Text style={styles.carouselArrowText}>›</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.carouselCounter}>{carouselIndex + 1}/{carouselTotal}</Text>

          {/* Map – GMB style */}
          <Text style={styles.mapLabel}>Map</Text>
          <View style={styles.mapWrap}>
            {d?.address ? (
              <TouchableOpacity style={styles.mapBox} onPress={() => Linking.openURL(googleMapsUrl(d.address!))}>
                <Text style={styles.mapPlaceholderText}>📍 {d.address}</Text>
                <Text style={styles.mapHint}>Tap for directions</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.mapBox}><Text style={styles.mapPlaceholderText}>Add location</Text></View>
            )}
          </View>

          <View style={styles.gmbActions}>
            {d?.website ? (
              <TouchableOpacity style={[styles.gmbBtn, styles.gmbBtnSpacer]} onPress={() => Linking.openURL(d.website!)}>
                <Text style={styles.gmbBtnText}>Website</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.gmbBtn, styles.gmbBtnSpacer, styles.gmbBtnDisabled]}><Text style={styles.gmbBtnTextDisabled}>Website</Text></View>
            )}
            {d?.address ? (
              <TouchableOpacity style={styles.gmbBtn} onPress={() => Linking.openURL(googleMapsUrl(d.address!))}>
                <Text style={styles.gmbBtnText}>Directions</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.gmbBtn, styles.gmbBtnDisabled]}><Text style={styles.gmbBtnTextDisabled}>Directions</Text></View>
            )}
          </View>
        </View>

        {/* REWARDS – horizontal carousel as per image */}
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
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContent}>
              {rewardCards.map((card) => {
                const total = Math.max(1, card.total);
                const earned = Math.min(card.count, total);
                return (
                  <TouchableOpacity key={card.id} style={styles.rewardCard} onPress={() => handleRewardPress(card)}>
                    <Text style={styles.rewardTitle} numberOfLines={1}>{card.title}</Text>
                    <View style={styles.rewardProgressContainer}>
                      <CampaignProgressCircle
                        earned={earned}
                        total={total}
                        size={80}
                        circleColor={(card.startDate != null || (Array.isArray(card.collectedItems) && card.collectedItems.length > 0)) ? '#74A71C' : undefined}
                      />
                      {card.isEarned && (
                        <View style={styles.redeemBadge}><Text style={styles.redeemBadgeText}>🎁</Text></View>
                      )}
                    </View>
                    {card.businessName ? <Text style={styles.rewardBusinessName} numberOfLines={1}>{card.businessName}</Text> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
  bannerSection: { width: '100%', position: 'relative', marginBottom: 0 },
  stablesBannerImage: { width: '100%', height: 171 },
  bannerFallback: { width: '100%', height: 171, backgroundColor: '#74A71C' },
  bannerSocialOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  socialIconBtn: { width: 27, height: 27, marginRight: 7, justifyContent: 'center', alignItems: 'center' },
  socialIconImg: { width: 27, height: 27 },
  tickerWrap: {
    width: '100%',
    height: 45,
    backgroundColor: '#9E8F85',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    justifyContent: 'center',
  },
  tickerItem: { fontSize: 26, color: 'white', flexShrink: 0 },
  gmbSection: { paddingHorizontal: 16, paddingBottom: 24, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.neutral[200] },
  gmbName: { fontSize: 24, fontWeight: '700', color: Colors.text.primary, marginBottom: 4 },
  gmbWebsite: { fontSize: 14, color: '#1a73e8', fontWeight: '500', marginBottom: 8 },
  gmbWebsitePlaceholder: { fontSize: 14, color: Colors.neutral[400], fontStyle: 'italic', marginBottom: 8 },
  gmbRatingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  gmbRating: { fontSize: 14, color: '#0E7C86', fontWeight: '600' },
  gmbDot: { fontSize: 14, color: Colors.text.secondary },
  gmbType: { fontSize: 14, color: Colors.text.secondary },
  gmbAddressRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  gmbAddress: { fontSize: 14, color: Colors.text.secondary },
  gmbDistance: { fontSize: 14, color: Colors.text.secondary },
  gmbHoursRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  gmbHours: { fontSize: 14, color: Colors.text.secondary },
  gmbHoursLink: { fontSize: 14, color: '#1a73e8', fontWeight: '500' },
  gmbContactBlock: { marginBottom: 16 },
  gmbContact: { fontSize: 14, color: Colors.text.secondary },
  gmbContactLink: { fontSize: 14, color: '#1a73e8', fontWeight: '500', marginBottom: 4 },
  carouselTitle: { fontSize: 14, fontWeight: '700', color: Colors.text.secondary, marginBottom: 8 },
  carouselRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  carouselArrow: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.neutral[200], justifyContent: 'center', alignItems: 'center' },
  carouselArrowText: { fontSize: 28, fontWeight: '300', color: Colors.text.primary },
  carouselSlide: { flex: 1, marginHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  carouselPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.neutral[200],
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselPlaceholderText: { fontSize: 14, color: Colors.neutral[500] },
  carouselCounter: { fontSize: 12, color: Colors.neutral[500], textAlign: 'center', marginBottom: 8 },
  mapLabel: { fontSize: 12, fontWeight: '600', color: Colors.neutral[500], marginBottom: 8 },
  mapWrap: { marginBottom: 16 },
  mapBox: {
    width: '100%',
    aspectRatio: 2,
    backgroundColor: Colors.neutral[200],
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  mapPlaceholderText: { fontSize: 14, color: Colors.text.secondary, textAlign: 'center' },
  mapHint: { fontSize: 12, color: '#1a73e8', marginTop: 4 },
  gmbActions: { flexDirection: 'row', flexWrap: 'wrap' },
  gmbBtn: { backgroundColor: '#1a73e8', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  gmbBtnSpacer: { marginRight: 12 },
  gmbBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  gmbBtnDisabled: { opacity: 0.5 },
  gmbBtnTextDisabled: { fontSize: 16, fontWeight: '600', color: Colors.neutral[500] },
  section: { marginBottom: 32, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.primary },
  sectionTitleRewardsCampaigns: { color: '#000000' },
  sectionLink: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    backgroundColor: Colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  carouselContent: { paddingRight: 16 },
  rewardCard: {
    width: CARD_WIDTH,
    alignItems: 'center',
    marginRight: 12,
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
  rewardBusinessName: { fontSize: 11, fontWeight: '700', color: Colors.text.secondary, textAlign: 'center' },
  empty: { fontSize: 16, color: Colors.text.secondary, textAlign: 'center', marginTop: 16 },
});

export default BusinessPage;
