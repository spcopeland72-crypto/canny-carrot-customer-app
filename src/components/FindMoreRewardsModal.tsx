import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import {Colors} from '../constants/Colors';

interface FindMoreRewardsModalProps {
  visible: boolean;
  onClose: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const MODAL_MARGIN = 10;

const FindMoreRewardsModal: React.FC<FindMoreRewardsModalProps> = ({
  visible,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>

          {/* Google Maps Section - Top 80% */}
          <View style={styles.mapsContainer}>
            <View style={styles.mapsPlaceholder}>
              <Text style={styles.mapsText}>Google Maps</Text>
              <Text style={styles.mapsSubtext}>
                Interactive map will be embedded here
              </Text>
            </View>
          </View>

          {/* Text Section - Bottom 20% */}
          <View style={styles.textSection}>
            <ScrollView style={styles.textScrollView}>
              <Text style={styles.textTitle}>Find More Rewards</Text>
              <Text style={styles.textContent}>
                Discover nearby businesses offering rewards through Canny
                Carrot. Use the map to explore locations, view available
                rewards, and find the best deals in your area.
              </Text>
              <Text style={styles.textContent}>
                Tap on any location marker to see details and available
                rewards. You can filter by category, distance, or reward type
                to find exactly what you're looking for.
              </Text>
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: SCREEN_WIDTH - MODAL_MARGIN * 2,
    height: SCREEN_HEIGHT - MODAL_MARGIN * 2,
    backgroundColor: Colors.background,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 24,
    color: Colors.background,
    fontWeight: 'bold',
  },
  mapsContainer: {
    height: (SCREEN_HEIGHT - MODAL_MARGIN * 2) * 0.8,
    width: '100%',
  },
  mapsPlaceholder: {
    flex: 1,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  mapsSubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  textSection: {
    height: (SCREEN_HEIGHT - MODAL_MARGIN * 2) * 0.2,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
    padding: 16,
  },
  textScrollView: {
    flex: 1,
  },
  textTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  textContent: {
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 20,
    marginBottom: 8,
  },
});

export default FindMoreRewardsModal;


