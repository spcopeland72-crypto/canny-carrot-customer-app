import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import {Colors} from '../constants/Colors';

interface PinEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onVerify: (pin: string) => Promise<boolean>;
  rewardName: string;
}

const SCREEN_WIDTH = Dimensions.get('window').width || 375;
const MODAL_MARGIN = 20;

const PinEntryModal: React.FC<PinEntryModalProps> = ({
  visible,
  onClose,
  onVerify,
  rewardName,
}) => {
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (pin.length !== 4) {
      Alert.alert('Invalid PIN', 'Please enter a 4-digit PIN code');
      return;
    }

    setIsVerifying(true);
    try {
      const isValid = await onVerify(pin);
      if (!isValid) {
        Alert.alert('Incorrect PIN', 'The PIN code you entered is incorrect. Please try again.');
        setPin('');
        setIsVerifying(false);
      }
      // If valid, the parent component will handle closing and showing congratulations
    } catch (error) {
      Alert.alert('Error', 'Failed to verify PIN. Please try again.');
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setPin('');
    setIsVerifying(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>

          <View style={styles.content}>
            <Text style={styles.title}>Enter PIN Code</Text>
            <Text style={styles.subtitle}>
              Please enter the 4-digit PIN code to redeem "{rewardName}"
            </Text>

            <View style={styles.pinContainer}>
              <TextInput
                style={styles.pinInput}
                value={pin}
                onChangeText={(text) => setPin(text.replace(/[^0-9]/g, '').slice(0, 4))}
                placeholder="----"
                keyboardType="numeric"
                maxLength={4}
                autoFocus={true}
                secureTextEntry={false}
                placeholderTextColor={Colors.text.light}
              />
            </View>

            <TouchableOpacity
              style={[styles.redeemButton, isVerifying && styles.redeemButtonDisabled]}
              onPress={handleVerify}
              disabled={isVerifying || pin.length !== 4}>
              <Text style={styles.redeemButtonText}>
                {isVerifying ? 'Verifying...' : 'Redeem'}
              </Text>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  pinContainer: {
    width: '100%',
    marginBottom: 32,
  },
  pinInput: {
    width: '100%',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 8,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    color: Colors.text.primary,
    backgroundColor: Colors.neutral[50],
  },
  redeemButton: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  redeemButtonDisabled: {
    opacity: 0.5,
  },
  redeemButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.background,
  },
});

export default PinEntryModal;


