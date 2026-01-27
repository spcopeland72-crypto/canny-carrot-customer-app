import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import {Colors} from '../constants/Colors';
import PageTemplate from './PageTemplate';
import {loadRewards, saveRewards, type CustomerReward} from '../utils/dataStorage';
import {loadBusinesses} from '../utils/businessStorage';
import {indexInList} from '../utils/campaignStampUtils';
import RewardQRCodeModal from './RewardQRCodeModal';
import RedeemModal from './RedeemModal';
import CongratulationsModal from './CongratulationsModal';
import {redeemReward} from '../services/customerRecord';

interface SeeAllRewardsPageProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onBack?: () => void;
  onViewBusinessPage?: (businessName: string, businessId?: string) => void;
}

const SeeAllRewardsPage: React.FC<SeeAllRewardsPageProps> = ({
  currentScreen,
  onNavigate,
  onBack,
  onViewBusinessPage,
}) => {
  const [rewards, setRewards] = useState<CustomerReward[]>([]);
  const [rewardQRModalVisible, setRewardQRModalVisible] = useState(false);
  const [redeemModalVisible, setRedeemModalVisible] = useState(false);
  const [congratulationsModalVisible, setCongratulationsModalVisible] = useState(false);
  const [selectedReward, setSelectedReward] = useState<CustomerReward | null>(null);
  const [selectedRewardForRedemption, setSelectedRewardForRedemption] = useState<CustomerReward | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [rewardToDelete, setRewardToDelete] = useState<CustomerReward | null>(null);
  const [businessNameByIds, setBusinessNameByIds] = useState<Record<string, string>>({});

  useEffect(() => {
    loadBusinesses()
      .then((list) => {
        const map: Record<string, string> = {};
        for (const b of list) {
          if (b?.id && b?.name) map[b.id] = b.name;
        }
        setBusinessNameByIds(map);
      })
      .catch(() => {});
  }, []);

  const loadRewardsData = useCallback(async () => {
    try {
      const loadedRewards = await loadRewards();
      const sorted = [...loadedRewards].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (bTime !== aTime) return bTime - aTime;
        return b.id.localeCompare(a.id);
      });
      setRewards(sorted);
    } catch (error) {
      console.error('Error loading rewards:', error);
    }
  }, []);

  useEffect(() => {
    loadRewardsData();
  }, [currentScreen, loadRewardsData]);

  const displayRewards = rewards;

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
    setSelectedRewardForRedemption(reward);
    setRedeemModalVisible(true);
  };

  const handleDeletePress = (reward: CustomerReward, e: any) => {
    e.stopPropagation();
    setRewardToDelete(reward);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!rewardToDelete) return;
    try {
      const all = await loadRewards();
      const updated = all.filter((r) => r.id !== rewardToDelete.id);
      await saveRewards(updated);
      const sorted = [...updated].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (bTime !== aTime) return bTime - aTime;
        return b.id.localeCompare(a.id);
      });
      setRewards(sorted);
      setDeleteModalVisible(false);
      setRewardToDelete(null);
    } catch (error) {
      console.error('Error deleting reward:', error);
      setDeleteModalVisible(false);
      setRewardToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setRewardToDelete(null);
  };

  return (
    <PageTemplate
      title="All Rewards"
      currentScreen={currentScreen}
      onNavigate={onNavigate}
      onBack={onBack}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {displayRewards.map((reward) => {
          let effectiveBusinessId = reward.businessId;
          if (!effectiveBusinessId && reward.id.startsWith('campaign-')) {
            const parts = reward.id.slice(9).split('-');
            if (parts.length >= 2) effectiveBusinessId = parts[0];
          }
          const effectiveBusinessName =
            reward.businessName ?? (effectiveBusinessId ? businessNameByIds[effectiveBusinessId] : undefined);
          return (
          <TouchableOpacity
            key={reward.id}
            style={styles.rewardRow}
            onPress={() => handleRewardPress(reward)}>
            {/* Reward Icon + business name below (same as campaign) */}
            <View style={styles.iconColumn}>
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
              {effectiveBusinessName ? (
                <Text style={styles.businessNameUnderIcon} numberOfLines={1}>
                  {effectiveBusinessName}
                </Text>
              ) : null}
            </View>

            {/* Reward Info */}
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardName}>{reward.name}</Text>
              <Text style={styles.rewardProgress}>
                {reward.count} of {reward.total}
              </Text>
            </View>

            {/* Delete bin icon — only when we have saved rewards */}
            {rewards.length > 0 && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={(e) => handleDeletePress(reward, e)}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={styles.deleteButtonIcon}>🗑️</Text>
              </TouchableOpacity>
            )}

            {/* Arrow indicator */}
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
          );
        })}
          </ScrollView>
          
          {/* Reward QR Code Modal — same effective business name/id as list */}
          <RewardQRCodeModal
            visible={rewardQRModalVisible}
            rewardName={selectedReward?.name || ''}
            qrValue={selectedReward?.qrCode || ''}
            count={selectedReward?.count ?? 0}
            total={selectedReward?.total ?? 0}
            businessName={(() => {
              if (!selectedReward) return undefined;
              let bid = selectedReward.businessId;
              if (!bid && selectedReward.id.startsWith('campaign-')) {
                const parts = selectedReward.id.slice(9).split('-');
                if (parts.length >= 2) bid = parts[0];
              }
              return selectedReward.businessName ?? (bid ? businessNameByIds[bid] : undefined);
            })()}
            businessId={(() => {
              if (!selectedReward) return undefined;
              let bid = selectedReward.businessId;
              if (!bid && selectedReward.id.startsWith('campaign-')) {
                const parts = selectedReward.id.slice(9).split('-');
                if (parts.length >= 2) bid = parts[0];
              }
              return bid;
            })()}
            circleLabels={(() => {
              if (!selectedReward || (selectedReward.total ?? 0) <= 0) return undefined;
              const total = selectedReward.total ?? 0;
              const products = selectedReward.selectedProducts || [];
              const actions = selectedReward.selectedActions || [];
              const fromQr = [...products, ...actions].slice(0, total);
              return fromQr.length >= total ? fromQr : undefined;
            })()}
            stampedIndices={(() => {
              if (!selectedReward) return undefined;
              const products = selectedReward.selectedProducts || [];
              const actions = selectedReward.selectedActions || [];
              const collected = selectedReward.collectedItems || [];
              const out: number[] = [];
              for (const c of collected) {
                if (c.itemType === 'product') {
                  const i = indexInList(products, c.itemName);
                  if (i >= 0) out.push(i);
                } else {
                  const i = indexInList(actions, c.itemName);
                  if (i >= 0) out.push(products.length + i);
                }
              }
              return out.length > 0 ? out : undefined;
            })()}
            onClose={() => setRewardQRModalVisible(false)}
            onNavigate={onNavigate}
            onViewBusinessPage={onViewBusinessPage}
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
              loadRewardsData();
            }}
            message="Congratulations you have redeemed your reward"
            rewardName={selectedRewardForRedemption?.name}
          />

          {/* Delete confirmation modal */}
          <Modal
            visible={deleteModalVisible}
            transparent
            animationType="fade"
            onRequestClose={cancelDelete}>
            <View style={styles.modalOverlay}>
              <View style={styles.deleteModal}>
                <Text style={styles.deleteModalTitle}>
                  {rewardToDelete?.id.startsWith('campaign-') ? 'Delete Campaign?' : 'Delete Reward?'}
                </Text>
                <Text style={styles.deleteModalMessage}>
                  Are you sure you want to delete "{rewardToDelete?.name}"? This action cannot be undone.
                </Text>
                <View style={styles.deleteModalButtons}>
                  <TouchableOpacity
                    style={[styles.deleteModalButton, styles.deleteModalButtonCancel]}
                    onPress={cancelDelete}>
                    <Text style={styles.deleteModalButtonTextCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteModalButton, styles.deleteModalButtonDelete]}
                    onPress={confirmDelete}>
                    <Text style={styles.deleteModalButtonTextDelete}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
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
  iconColumn: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 60,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  businessNameUnderIcon: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.text.secondary,
    marginTop: 4,
    maxWidth: 80,
    textAlign: 'center',
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
  },
  arrow: {
    fontSize: 24,
    color: Colors.text.light,
    marginLeft: 8,
  },
  deleteButton: {
    padding: 8,
    marginRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonIcon: {
    fontSize: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  deleteModal: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  deleteModalMessage: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  deleteModalButtons: {
    flexDirection: 'row',
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteModalButtonCancel: {
    backgroundColor: Colors.neutral[200],
    marginRight: 6,
  },
  deleteModalButtonDelete: {
    backgroundColor: '#FF3B30',
    marginLeft: 6,
  },
  deleteModalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  deleteModalButtonTextDelete: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
  },
});

export default SeeAllRewardsPage;

