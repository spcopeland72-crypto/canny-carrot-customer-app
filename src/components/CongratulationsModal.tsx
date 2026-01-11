import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import {Colors} from '../constants/Colors';

interface CongratulationsModalProps {
  visible: boolean;
  onClose: () => void;
  message?: string; // Optional custom message
  rewardName?: string; // Optional reward name for context
}

const SCREEN_WIDTH = Dimensions.get('window').width || 375;
const MODAL_MARGIN = 20;

// Load Gemini generated image
let congratulationsImage;
try {
  congratulationsImage = require('../../assets/Gemini_Generated_Image_1xqeuk1xqeuk1xqe.png');
} catch (e) {
  congratulationsImage = null;
}

const CongratulationsModal: React.FC<CongratulationsModalProps> = ({
  visible,
  onClose,
  message,
  rewardName,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>

          <View style={styles.content}>
            {congratulationsImage ? (
              <Image
                source={congratulationsImage}
                style={styles.image}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderText}>🎉</Text>
              </View>
            )}
            
            <Text style={styles.congratulationsText}>Congratulations!</Text>
            {message && (
              <Text style={styles.messageText}>{message}</Text>
            )}
            {!message && rewardName && (
              <Text style={styles.messageText}>
                Congrats you have earned a reward touch this icon for your redemption code
              </Text>
            )}

            <TouchableOpacity style={styles.closeButton2} onPress={onClose}>
              <Text style={styles.closeButtonText2}>Close</Text>
            </TouchableOpacity>
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
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 24,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 24,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  content: {
    alignItems: 'center',
    paddingTop: 20,
  },
  image: {
    width: '100%',
    height: 200,
    marginBottom: 24,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.neutral[100],
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  placeholderText: {
    fontSize: 64,
  },
  congratulationsText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.secondary, // Orange color
    marginBottom: 16,
    textAlign: 'center',
  },
  messageText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  closeButton2: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  closeButtonText2: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.background,
  },
});

export default CongratulationsModal;





