import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
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
          // Use qrcode library for web (lightweight and works well)
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
          // Fallback: use a simple canvas-based placeholder
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
    // Fallback if library not available
    QRCodeComponent = ({value, size}: {value: string; size: number}) => (
      <View style={[styles.qrPlaceholder, {width: size, height: size}]}>
        <Text style={styles.qrIcon}>📱</Text>
        <Text style={styles.qrText}>QR Code</Text>
      </View>
    );
  }
}

interface RewardQRCodeModalProps {
  visible: boolean;
  rewardName: string;
  qrValue: string;
  onClose: () => void;
  onView: () => void; // Navigate to reward edit page
}

const RewardQRCodeModal: React.FC<RewardQRCodeModalProps> = ({
  visible,
  rewardName,
  qrValue,
  onClose,
  onView,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{rewardName}</Text>
          
          <View style={styles.qrContainer}>
            {qrValue ? (
              <QRCodeComponent value={qrValue} size={200} />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Text style={styles.qrIcon}>📱</Text>
                <Text style={styles.qrText}>QR Code</Text>
                <Text style={styles.qrValue} numberOfLines={2}>
                  No QR code available
                </Text>
              </View>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.viewButton]}
              onPress={onView}>
              <Text style={styles.viewButtonText}>View</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.closeButton]}
              onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
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
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 350,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  qrContainer: {
    backgroundColor: Colors.background,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
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
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  qrValue: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButton: {
    backgroundColor: Colors.primary,
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
  },
  closeButton: {
    backgroundColor: Colors.neutral[200],
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
});

export default RewardQRCodeModal;

