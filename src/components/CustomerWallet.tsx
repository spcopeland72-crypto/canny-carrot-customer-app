import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Animated,
} from 'react-native';
import {Colors} from '../constants/Colors';
import {memberApi} from '../services/api';

interface LoyaltyCard {
  businessId: string;
  businessName: string;
  businessLogo?: string;
  category: string;
  currentStamps: number;
  stampsRequired: number;
  rewardName: string;
  nextReward?: {
    name: string;
    stampsRequired: number;
  };
  lastVisit?: string;
  color: string;
}

interface CustomerWalletProps {
  memberId: string;
  onCardPress?: (businessId: string) => void;
  onDiscoverPress?: () => void;
}

const CARD_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
];

const CustomerWallet: React.FC<CustomerWalletProps> = ({
  memberId,
  onCardPress,
  onDiscoverPress,
}) => {
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  
  // Demo data - would come from API
  const demoCards: LoyaltyCard[] = [
    {
      businessId: '1',
      businessName: 'Cafe Maison',
      category: 'cafe',
      currentStamps: 7,
      stampsRequired: 10,
      rewardName: 'Free Coffee',
      lastVisit: '2 days ago',
      color: CARD_COLORS[0],
    },
    {
      businessId: '2',
      businessName: 'The Stables',
      category: 'restaurant',
      currentStamps: 4,
      stampsRequired: 8,
      rewardName: 'Free Dessert',
      lastVisit: '1 week ago',
      color: CARD_COLORS[1],
    },
    {
      businessId: '3',
      businessName: 'Glow Beauty',
      category: 'beauty-salon',
      currentStamps: 9,
      stampsRequired: 10,
      rewardName: 'Free Facial',
      lastVisit: 'Yesterday',
      color: CARD_COLORS[2],
    },
    {
      businessId: '4',
      businessName: 'Fit Factory',
      category: 'gym',
      currentStamps: 2,
      stampsRequired: 15,
      rewardName: 'Free Month',
      lastVisit: '3 days ago',
      color: CARD_COLORS[3],
    },
    {
      businessId: '5',
      businessName: 'Toby Carvery',
      category: 'restaurant',
      currentStamps: 10,
      stampsRequired: 10,
      rewardName: 'Free Main Course',
      lastVisit: 'Today',
      color: CARD_COLORS[4],
    },
  ];
  
  useEffect(() => {
    loadCards();
  }, [memberId]);
  
  const loadCards = async () => {
    setIsLoading(true);
    try {
      const result = await memberApi.getLoyaltyCards(memberId);
      if (result.success && result.data) {
        // Assign colors to cards
        const cardsWithColors = result.data.map((card: any, index: number) => ({
          ...card,
          color: CARD_COLORS[index % CARD_COLORS.length],
        }));
        setCards(cardsWithColors);
      } else {
        // Use demo data for now
        setCards(demoCards);
      }
    } catch (error) {
      setCards(demoCards);
    } finally {
      setIsLoading(false);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadCards();
    setRefreshing(false);
  };
  
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'cafe': '☕',
      'restaurant': '🍽️',
      'beauty-salon': '💅',
      'barber': '💈',
      'retail': '🛍️',
      'pub': '🍺',
      'takeaway': '🥡',
      'gym': '💪',
    };
    return icons[category] || '📍';
  };
  
  const renderStampProgress = (current: number, required: number, color: string) => {
    const stamps = [];
    for (let i = 0; i < required; i++) {
      stamps.push(
        <View
          key={i}
          style={[
            styles.stamp,
            i < current ? {backgroundColor: '#fff'} : {backgroundColor: 'rgba(255,255,255,0.3)'},
          ]}>
          {i < current && <Text style={styles.stampCheck}>✓</Text>}
        </View>
      );
    }
    return <View style={styles.stampsRow}>{stamps}</View>;
  };
  
  const renderCard = (card: LoyaltyCard) => {
    const isReady = card.currentStamps >= card.stampsRequired;
    const progress = (card.currentStamps / card.stampsRequired) * 100;
    
    return (
      <TouchableOpacity
        key={card.businessId}
        style={[styles.card, {backgroundColor: card.color}]}
        onPress={() => {
          setSelectedCard(card.businessId);
          onCardPress?.(card.businessId);
        }}
        activeOpacity={0.9}>
        
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.businessInfo}>
            <Text style={styles.categoryIcon}>{getCategoryIcon(card.category)}</Text>
            <View>
              <Text style={styles.businessName}>{card.businessName}</Text>
              <Text style={styles.lastVisit}>Last visit: {card.lastVisit}</Text>
            </View>
          </View>
          {isReady && (
            <View style={styles.rewardBadge}>
              <Text style={styles.rewardBadgeText}>🎁 CLAIM!</Text>
            </View>
          )}
        </View>
        
        {/* Stamp Grid */}
        <View style={styles.stampGrid}>
          {renderStampProgress(card.currentStamps, card.stampsRequired, card.color)}
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, {width: `${Math.min(progress, 100)}%`}]} />
          </View>
          <Text style={styles.progressText}>
            {isReady 
              ? '🎉 Reward Ready!' 
              : `${card.stampsRequired - card.currentStamps} more for ${card.rewardName}`}
          </Text>
        </View>
        
        {/* Reward Info */}
        <View style={styles.rewardInfo}>
          <Text style={styles.rewardName}>{card.rewardName}</Text>
          <Text style={styles.rewardProgress}>
            {card.currentStamps}/{card.stampsRequired} stamps
          </Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  const readyToRedeem = cards.filter(c => c.currentStamps >= c.stampsRequired);
  const inProgress = cards.filter(c => c.currentStamps < c.stampsRequired);
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Wallet</Text>
          <Text style={styles.subtitle}>{cards.length} loyalty cards</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={onDiscoverPress}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        
        {/* Ready to Redeem Section */}
        {readyToRedeem.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🎁 Ready to Redeem</Text>
              <Text style={styles.sectionCount}>{readyToRedeem.length}</Text>
            </View>
            {readyToRedeem.map(renderCard)}
          </View>
        )}
        
        {/* In Progress Section */}
        {inProgress.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📝 Collecting</Text>
              <Text style={styles.sectionCount}>{inProgress.length}</Text>
            </View>
            {inProgress.map(renderCard)}
          </View>
        )}
        
        {/* Empty State */}
        {cards.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🥕</Text>
            <Text style={styles.emptyTitle}>No Loyalty Cards Yet</Text>
            <Text style={styles.emptyText}>
              Visit local businesses and start collecting stamps!
            </Text>
            <TouchableOpacity style={styles.discoverButton} onPress={onDiscoverPress}>
              <Text style={styles.discoverButtonText}>Discover Nearby</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Quick Stats */}
        {cards.length > 0 && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {cards.reduce((sum, c) => sum + c.currentStamps, 0)}
              </Text>
              <Text style={styles.statLabel}>Total Stamps</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{readyToRedeem.length}</Text>
              <Text style={styles.statLabel}>Rewards Ready</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{cards.length}</Text>
              <Text style={styles.statLabel}>Businesses</Text>
            </View>
          </View>
        )}
        
        {/* Discover More CTA */}
        <TouchableOpacity style={styles.discoverCTA} onPress={onDiscoverPress}>
          <Text style={styles.discoverCTAIcon}>🔍</Text>
          <View style={styles.discoverCTAText}>
            <Text style={styles.discoverCTATitle}>Discover More</Text>
            <Text style={styles.discoverCTASubtitle}>
              Find new places with rewards near you
            </Text>
          </View>
          <Text style={styles.discoverCTAArrow}>→</Text>
        </TouchableOpacity>
        
        <View style={{height: 100}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  addButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: Colors.background,
    fontWeight: '600',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  sectionCount: {
    fontSize: 14,
    color: Colors.text.secondary,
    backgroundColor: Colors.neutral[100],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  businessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 32,
    marginRight: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    padding: 8,
    borderRadius: 12,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  lastVisit: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  rewardBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rewardBadgeText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 12,
  },
  stampGrid: {
    marginBottom: 16,
  },
  stampsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  stamp: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stampCheck: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 14,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  rewardInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 12,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  rewardProgress: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  discoverButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  discoverButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral[50],
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.neutral[200],
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  discoverCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary + '15',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.secondary + '30',
  },
  discoverCTAIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  discoverCTAText: {
    flex: 1,
  },
  discoverCTATitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  discoverCTASubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  discoverCTAArrow: {
    fontSize: 24,
    color: Colors.secondary,
  },
});

export default CustomerWallet;




















