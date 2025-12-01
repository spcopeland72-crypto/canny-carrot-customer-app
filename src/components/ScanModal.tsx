import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import {Colors} from '../constants/Colors';
import CameraModule from './CameraModule';

interface ScanModalProps {
  visible: boolean;
  onClose: () => void;
  onScanComplete?: (data: string, type: string) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const MODAL_MARGIN = 10;

// Load images
let calvinImage = null;
let largeQrImage = null;

try {
  calvinImage = require('../../Images/calvin.png');
} catch (e) {
  calvinImage = null;
}

try {
  largeQrImage = require('../../Images/large-qr.png');
} catch (e) {
  try {
    largeQrImage = require('../../Images/qr.png');
  } catch (e2) {
    largeQrImage = null;
  }
}

const ScanModal: React.FC<ScanModalProps> = ({
  visible,
  onClose,
  onScanComplete,
}) => {
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = () => {
    setIsScanning(true);
  };

  const handleBarcodeScanned = (data: string, type: string) => {
    console.log('QR Code Scanned:', {data, type});
    
    // Alert user of successful scan
    Alert.alert(
      'QR Code Scanned',
      `Type: ${type}\nData: ${data}`,
      [
        {
          text: 'Scan Another',
          onPress: () => {
            // Keep scanner open
          },
          style: 'default',
        },
        {
          text: 'Done',
          onPress: () => {
            setIsScanning(false);
            if (onScanComplete) {
              onScanComplete(data, type);
            }
            onClose();
          },
          style: 'default',
        },
      ],
      {cancelable: false}
    );
  };

  const handleCloseScanner = () => {
    setIsScanning(false);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        {!isScanning ? (
          <View style={styles.modalContainer}>
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>

            {/* Content */}
            <View style={styles.content}>
              {/* Calvin Image - Top Center */}
              {calvinImage && (
                <View style={styles.calvinContainer}>
                  <Image
                    source={calvinImage}
                    style={styles.calvinImage}
                    resizeMode="contain"
                  />
                </View>
              )}

              {/* Large QR Image - Centered, scaled to within 10px of edges */}
              {largeQrImage && (
                <View style={styles.qrContainer}>
                  <Image
                    source={largeQrImage}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.qrTitle}>Your QR Code</Text>
                  <Text style={styles.qrSubtitle}>
                    Show this code to earn rewards
                  </Text>
                </View>
              )}

              {/* SCAN Button */}
              <TouchableOpacity style={styles.scanButton} onPress={handleScan}>
                <Text style={styles.scanButtonText}>SCAN QR CODE</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <CameraModule
            onBarcodeScanned={handleBarcodeScanned}
            onClose={handleCloseScanner}
          />
        )}
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
  content: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calvinContainer: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  calvinImage: {
    width: 120,
    height: 120,
    maxWidth: SCREEN_WIDTH - MODAL_MARGIN * 2 - 20,
  },
  qrContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  qrImage: {
    width: SCREEN_WIDTH - MODAL_MARGIN * 2 - 20,
    height: SCREEN_WIDTH - MODAL_MARGIN * 2 - 20,
    maxWidth: '100%',
    maxHeight: '100%',
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  qrSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary || Colors.text,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  scanButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 25,
    marginTop: 20,
    marginBottom: 20,
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.background,
    letterSpacing: 1,
  },
});

export default ScanModal;


