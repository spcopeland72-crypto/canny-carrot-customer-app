import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import {Colors} from '../constants/Colors';

// QR Code Component - uses qrcode library for web, react-native-qrcode-svg for native
let QRCodeComponent: any = null;

if (Platform.OS === 'web') {
  // Web QR code display using qrcode library
  QRCodeComponent = ({value, size}: {value: string; size: number}) => {
    const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);
    
    React.useEffect(() => {
      const generateQR = async () => {
        try {
          const QRCode = (await import('qrcode')).default;
          const dataUrl = await QRCode.toDataURL(value, {
            width: size,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          });
          setQrDataUrl(dataUrl);
        } catch (error) {
          console.error('Error generating QR code:', error);
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, size, size);
            ctx.fillStyle = '#666';
            ctx.font = `${size / 10}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('QR Code', size / 2, size / 2);
            setQrDataUrl(canvas.toDataURL());
          }
        }
      };
      
      if (value) {
        generateQR();
      }
    }, [value, size]);
    
    if (qrDataUrl) {
      return (
        <img
          src={qrDataUrl}
          alt="QR Code"
          style={{width: size, height: size, borderRadius: 8}}
        />
      );
    }
    
    return (
      <View style={[styles.qrPlaceholder, {width: size, height: size}]}>
        <Text style={styles.qrIcon}>📱</Text>
        <Text style={styles.qrText}>QR Code</Text>
      </View>
    );
  };
} else {
  // Native QR code display
  try {
    const QRCode = require('react-native-qrcode-svg').default;
    QRCodeComponent = ({value, size}: {value: string; size: number}) => (
      <QRCode
        value={value}
        size={size}
        color={Colors.text.primary}
        backgroundColor={Colors.background}
      />
    );
  } catch (e) {
    QRCodeComponent = ({value, size}: {value: string; size: number}) => (
      <View style={[styles.qrPlaceholder, {width: size, height: size}]}>
        <Text style={styles.qrIcon}>📱</Text>
        <Text style={styles.qrText}>QR Code</Text>
      </View>
    );
  }
}

// Load logo image
let logoImage: any = null;
try {
  logoImage = require('../../assets/cropped-cc-app-logo.png');
} catch (e) {
  console.log('Logo not found:', e);
}

interface RedeemModalProps {
  visible: boolean;
  onClose: () => void;
  onRedeem: (pin: string) => Promise<boolean>;
  rewardName: string;
  qrCode?: string;
  pinCode?: string;
}

const SCREEN_WIDTH = Dimensions.get('window').width || 375;
const MODAL_MARGIN = 20;

const RedeemModal: React.FC<RedeemModalProps> = ({
  visible,
  onClose,
  onRedeem,
  rewardName,
  qrCode,
  pinCode,
}) => {
  const [pin, setPin] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  const handleRedeem = async () => {
    if (pin.length !== 4) {
      Alert.alert('Invalid PIN', 'Please enter a 4-digit PIN code');
      return;
    }

    if (!pinCode) {
      Alert.alert('Error', 'PIN code not found for this reward');
      return;
    }

    if (pin !== pinCode) {
      Alert.alert('Incorrect PIN', 'The PIN code you entered is incorrect. Please try again.');
      setPin('');
      return;
    }

    setIsRedeeming(true);
    try {
      const success = await onRedeem(pin);
      if (success) {
        // Success handled by parent component
        setPin('');
        setIsRedeeming(false);
      } else {
        Alert.alert('Error', 'Failed to redeem reward. Please try again.');
        setIsRedeeming(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to redeem reward. Please try again.');
      setIsRedeeming(false);
    }
  };

  const handleClose = () => {
    setPin('');
    setIsRedeeming(false);
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
            {/* Logo at top */}
            {logoImage && (
              <Image
                source={logoImage}
                style={styles.logo}
                resizeMode="contain"
              />
            )}

            {/* QR Code */}
            <View style={styles.qrContainer}>
              {qrCode ? (
                <QRCodeComponent value={qrCode} size={180} />
              ) : (
                <View style={styles.qrPlaceholder}>
                  <Text style={styles.qrIcon}>📱</Text>
                  <Text style={styles.qrText}>QR Code</Text>
                </View>
              )}
            </View>

            {/* PIN Input */}
            <View style={styles.pinContainer}>
              <Text style={styles.pinLabel}>Enter PIN Code</Text>
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

            {/* Redeem Button */}
            <TouchableOpacity
              style={[styles.redeemButton, (isRedeeming || pin.length !== 4) && styles.redeemButtonDisabled]}
              onPress={handleRedeem}
              disabled={isRedeeming || pin.length !== 4}>
              <Text style={styles.redeemButtonText}>
                {isRedeeming ? 'Redeeming...' : 'Redeem'}
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
    maxWidth: 400,
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
  logo: {
    width: 120,
    height: 60,
    marginBottom: 24,
  },
  qrContainer: {
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrPlaceholder: {
    width: 180,
    height: 180,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  qrIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  qrText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  pinContainer: {
    width: '100%',
    marginBottom: 24,
  },
  pinLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
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

export default RedeemModal;

