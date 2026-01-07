import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {Colors} from '../constants/Colors';
import PageTemplate from './PageTemplate';
import {loadRewards, type CustomerReward} from '../utils/dataStorage';
import RewardQRCodeModal from './RewardQRCodeModal';

interface SeeAllRewardsPageProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onBack?: () => void;
}

const SeeAllRewardsPage: React.FC<SeeAllRewardsPageProps> = ({
  currentScreen,
  onNavigate,
  onBack,
}) => {
  const [rewards, setRewards] = useState<CustomerReward[]>([]);
  const [rewardQRModalVisible, setRewardQRModalVisible] = useState(false);
  const [selectedReward, setSelectedReward] = useState<CustomerReward | null>(null);

  useEffect(() => {
    const loadRewardsData = async () => {
      try {
        const loadedRewards = await loadRewards();
        console.log('[SeeAllRewardsPage] Loaded rewards:', loadedRewards.length, 'rewards');
        // Sort by newest first (most recently created/scanned)
        const sorted = [...loadedRewards].sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (bTime !== aTime) return bTime - aTime;
          return b.id.localeCompare(a.id);
        });
        setRewards(sorted);
        console.log('[SeeAllRewardsPage] Sorted rewards:', sorted.length, 'rewards');
      } catch (error) {
        console.error('Error loading rewards:', error);
      }
    };
    loadRewardsData();
  }, [currentScreen]); // Reload when screen changes to this page

  // Default example rewards if none loaded
  const defaultRewards: CustomerReward[] = [
    {
      id: '1',
      name: 'Blackwells Butchers',
      count: 8,
      total: 10,
      icon: '🥐',
      requirement: 10,
      pointsEarned: 8,
      businessName: 'Blackwells Butchers',
    },
    {
      id: '2',
      name: 'Bluecorn Bakers',
      count: 7,
      total: 10,
      icon: '☕',
      requirement: 10,
      pointsEarned: 7,
      businessName: 'Bluecorn Bakers',
    },
    {
      id: '3',
      name: 'The Green Florist',
      count: 9,
      total: 10,
      icon: '🥪',
      requirement: 10,
      pointsEarned: 9,
      businessName: 'The Green Florist',
    },
    {
      id: '4',
      name: 'Sweet Treats',
      count: 9,
      total: 10,
      icon: '🍩',
      requirement: 10,
      pointsEarned: 9,
      businessName: 'Sweet Treats',
    },
    {
      id: '5',
      name: 'Hot Meals',
      count: 6,
      total: 10,
      icon: '🍲',
      requirement: 10,
      pointsEarned: 6,
      businessName: 'Hot Meals',
    },
    {
      id: '6',
      name: 'Breakfast',
      count: 5,
      total: 10,
      icon: '🥞',
      requirement: 10,
      pointsEarned: 5,
      businessName: 'Breakfast',
    },
  ];

  const displayRewards = rewards.length > 0 ? rewards : defaultRewards;

  const handleRewardPress = (reward: CustomerReward) => {
    setSelectedReward(reward);
    setRewardQRModalVisible(true);
  };

  return (
    <PageTemplate
      title="All Rewards"
      currentScreen={currentScreen}
      onNavigate={onNavigate}
      onBack={onBack}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {displayRewards.map((reward) => (
          <TouchableOpacity
            key={reward.id}
            style={styles.rewardRow}
            onPress={() => handleRewardPress(reward)}>
            {/* Reward Icon */}
            <View style={styles.iconContainer}>
              {reward.businessLogo ? (
                <Image
                  source={{ uri: reward.businessLogo }}
                  style={styles.rewardIcon}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.rewardIconEmoji}>{reward.icon || '🎁'}</Text>
              )}
              {/* Red dot indicator if earned */}
              {reward.isEarned && <View style={styles.redeemDot} />}
            </View>

            {/* Reward Info */}
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardName}>{reward.name}</Text>
              <Text style={styles.rewardProgress}>
                {reward.count} of {reward.total}
              </Text>
              {reward.businessName && (
                <Text style={styles.businessName} numberOfLines={1}>
                  {reward.businessName}
                </Text>
              )}
            </View>

            {/* Arrow indicator */}
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
          </ScrollView>
          
          {/* Reward QR Code Modal */}
          <RewardQRCodeModal
            visible={rewardQRModalVisible}
            rewardName={selectedReward?.name || ''}
            qrValue={selectedReward?.qrCode || ''}
            onClose={() => setRewardQRModalVisible(false)}
            onView={() => {
              setRewardQRModalVisible(false);
              if (selectedReward) {
                onNavigate(`Reward${selectedReward.id}`);
              }
            }}
          />
        </PageTemplate>
      );
    };

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    backgroundColor: Colors.background,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  rewardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  rewardIconEmoji: {
    fontSize: 30,
  },
  redeemDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF0000',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  rewardProgress: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  businessName: {
    fontSize: 12,
    color: Colors.text.light,
    marginTop: 2,
  },
  arrow: {
    fontSize: 24,
    color: Colors.text.light,
    marginLeft: 8,
  },
});

export default SeeAllRewardsPage;

