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
} from 'react-native';
import {Colors} from '../constants/Colors';
import BottomNavigation from './BottomNavigation';
import {loadRewards, type CustomerReward} from '../utils/dataStorage';

let logoImage: any = null;
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
  businessName: string;
  businessId?: string;
}

function matchBusiness(r: CustomerReward, name: string, id?: string): boolean {
  const n = (s: string) => (s ?? '').toLowerCase().trim();
  if (id && n(r.businessId ?? '') === n(id)) return true;
  if (name && n(r.businessName ?? '') === n(name)) return true;
  return false;
}

function qrDataLines(r: CustomerReward): string[] {
  const lines: string[] = [];
  if (r.qrCode) lines.push(`QR: ${r.qrCode}`);
  lines.push(`id: ${r.id}`);
  if (r.businessId) lines.push(`businessId: ${r.businessId}`);
  if (r.businessName) lines.push(`businessName: ${r.businessName}`);
  lines.push(`count: ${r.count} / total: ${r.total}`);
  lines.push(`pointsEarned: ${r.pointsEarned}`);
  if (r.requirement != null) lines.push(`requirement: ${r.requirement}`);
  if (r.pointsPerPurchase != null) lines.push(`pointsPerPurchase: ${r.pointsPerPurchase}`);
  if (r.selectedProducts?.length) lines.push(`selectedProducts: ${r.selectedProducts.join(', ')}`);
  if (r.selectedActions?.length) lines.push(`selectedActions: ${r.selectedActions.join(', ')}`);
  if (r.collectedItems?.length) {
    lines.push(`collectedItems: ${r.collectedItems.map((c) => `${c.itemType}:${c.itemName}`).join(', ')}`);
  }
  if (r.startDate) lines.push(`startDate: ${r.startDate}`);
  if (r.endDate) lines.push(`endDate: ${r.endDate}`);
  if (r.pinCode) lines.push(`pinCode: ${r.pinCode}`);
  if (r.createdAt) lines.push(`createdAt: ${r.createdAt}`);
  if (r.lastScannedAt) lines.push(`lastScannedAt: ${r.lastScannedAt}`);
  return lines;
}

const BusinessPage: React.FC<BusinessPageProps> = ({
  currentScreen,
  onNavigate,
  onScanPress,
  businessName,
  businessId,
}) => {
  const [rewards, setRewards] = useState<CustomerReward[]>([]);

  const load = useCallback(async () => {
    const all = await loadRewards();
    const filtered = all.filter((r) => matchBusiness(r, businessName, businessId));
    setRewards(filtered);
  }, [businessName, businessId]);

  useEffect(() => {
    load();
  }, [load, currentScreen]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header – same structure as Home */}
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
            {businessName}
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

      {/* Clear page: only list */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {rewards.length === 0 ? (
          <Text style={styles.empty}>No rewards or campaigns for this business in local store.</Text>
        ) : (
          rewards.map((r) => (
            <View key={r.id} style={styles.block}>
              <Text style={styles.name}>{r.name}</Text>
              {qrDataLines(r).map((line, i) => (
                <Text key={i} style={styles.dataLine}>
                  {line}
                </Text>
              ))}
            </View>
          ))
        )}
      </ScrollView>

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
  logo: {
    width: 50,
    height: 50,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.background,
  },
  greeting: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: Colors.primary,
    marginHorizontal: 12,
    textAlign: 'center',
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
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  empty: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 32,
  },
  block: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  dataLine: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
});

export default BusinessPage;
