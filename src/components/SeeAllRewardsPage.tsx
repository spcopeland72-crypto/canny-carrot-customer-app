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
import {loadRewards, saveRewards, type CustomerReward} from '../utils/dataStorage';
import RewardQRCodeModal from './RewardQRCodeModal';
import RedeemModal from './RedeemModal';
import CongratulationsModal from './CongratulationsModal';
import {redeemReward} from '../services/customerRecord';

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
  const [redeemModalVisible, setRedeemModalVisible] = useState(false);
  const [congratulationsModalVisible, setCongratulationsModalVisible] = useState(false);
  const [selectedReward, setSelectedReward] = useState<CustomerReward | null>(null);
  const [selectedRewardForRedemption, setSelectedRewardForRedemption] = useState<CustomerReward | null>(null);

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
    if (reward.isEarned) {
      // Reward is earned - open Redeem modal for redemption
      setSelectedRewardForRedemption(reward);
      setRedeemModalVisible(true);
    } else {
      // Reward not yet earned - show QR code
      setSelectedReward(reward);
      setRewardQRModalVisible(true);
    }
  };

  const handleRedeemDotPress = (reward: CustomerReward, e: any) => {
    e.stopPropagation();
    // Badge click opens Redeem modal for redemption
    setSelectedRewardForRedemption(reward);
    setRedeemModalVisible(true);
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
              {/* Red dot indicator if earned - clickable */}
              {reward.isEarned && (
                <TouchableOpacity
                  style={styles.redeemDotContainer}
                  onPress={(e) => handleRedeemDotPress(reward, e)}
                  activeOpacity={0.8}>
                  <View style={styles.redeemDot} />
                </TouchableOpacity>
              )}
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
          
          {/* Redeem Modal */}
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
                    
                    // Reload rewards to update UI
                    setRewards(allRewards);
                  }
                  
                  // Show congratulations modal
                  setRedeemModalVisible(false);
                  setCongratulationsModalVisible(true);
                  
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
            rewardName={selectedRewardForRedemption?.name || 'Reward'}
            qrCode={selectedRewardForRedemption?.qrCode}
            pinCode={selectedRewardForRedemption?.pinCode}
          />
          
          {/* Congratulations Modal */}
          <CongratulationsModal
            visible={congratulationsModalVisible}
            onClose={() => {
              setCongratulationsModalVisible(false);
              setSelectedRewardForRedemption(null);
            }}
            message="Congratulations you have redeemed your reward"
            rewardName={selectedRewardForRedemption?.name}
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
  redeemDotContainer: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  redeemDot: {
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

