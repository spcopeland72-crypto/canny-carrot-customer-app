import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import {Colors} from '../constants/Colors';

// Load Canny Carrot logo for stamps
let ccLogoImage: any = null;
try {
  ccLogoImage = require('../../assets/cc-icon-no-background.png');
} catch (e) {
  try {
    ccLogoImage = require('../../assets/logo.png');
  } catch (e2) {
    ccLogoImage = null;
  }
}

interface RewardQRCodeModalProps {
  visible: boolean;
  rewardName: string;
  qrValue: string;
  count: number; // Points earned
  total: number; // Points needed
  businessName?: string;
  onClose: () => void;
  onNavigate?: (screen: string) => void;
}

const RewardQRCodeModal: React.FC<RewardQRCodeModalProps> = ({
  visible,
  rewardName,
  count,
  total,
  businessName,
  onClose,
  onNavigate,
}) => {
  // Create array of circles - total circles, count have stamps
  const circles = Array.from({length: total}, (_, index) => ({
    id: index,
    hasStamp: index < count,
  }));

  const handleBusinessPage = () => {
    onClose();
    if (onNavigate) {
      // Navigate to business page - using MenuPage as business page
      onNavigate('Menu');
    }
  };

  const handleMessages = () => {
    onClose();
    if (onNavigate) {
      // Navigate to chat/messages page
      onNavigate('Chat');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{rewardName}</Text>
          
          {/* Circles with stamps across the top */}
          <View style={styles.circlesContainer}>
            {circles.map((circle) => (
              <View key={circle.id} style={styles.circleWrapper}>
                <View style={styles.circle}>
                  {circle.hasStamp && ccLogoImage ? (
                    <Image
                      source={ccLogoImage}
                      style={styles.stampImage}
                      resizeMode="contain"
                    />
                  ) : null}
                </View>
              </View>
            ))}
          </View>

          {/* Links at bottom */}
          <View style={styles.linksContainer}>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={handleBusinessPage}>
              <Text style={styles.linkText}>View {businessName || 'Business'} Page</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={handleMessages}>
              <Text style={styles.linkText}>View Messages</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
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
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  circlesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  circleWrapper: {
    margin: 4,
  },
  circle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: Colors.neutral[300],
    backgroundColor: Colors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  stampImage: {
    width: 46,
    height: 46,
  },
  linksContainer: {
    width: '100%',
    marginBottom: 16,
  },
  linkButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  linkText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: Colors.neutral[200],
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
});

export default RewardQRCodeModal;
