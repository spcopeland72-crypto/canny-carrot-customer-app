import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import {CameraView, Camera, PermissionStatus} from 'expo-camera';
import {BarcodeScanningResult} from 'expo-camera';
import {Colors} from '../constants/Colors';

interface CameraModuleProps {
  onBarcodeScanned: (data: string, type: string) => void;
  onClose: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const CameraModule: React.FC<CameraModuleProps> = ({
  onBarcodeScanned,
  onClose,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    try {
      console.log('Requesting camera permission...');
      
      // Always try to request permission - this triggers the native dialog
      const permission = await Camera.requestCameraPermissionsAsync();
      
      console.log('Permission result:', permission);
      
      setHasPermission(permission.status === 'granted');
      setCanAskAgain(permission.canAskAgain);
      
      if (permission.status === 'granted') {
        console.log('Camera permission granted!');
      } else if (!permission.canAskAgain) {
        console.log('Permission denied permanently - user must enable in settings');
      } else {
        console.log('Permission denied but can ask again');
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setHasPermission(false);
      Alert.alert(
        'Error',
        'Failed to request camera permission. Please try again.',
        [{text: 'OK'}]
      );
    }
  };

  const handleOpenSettings = () => {
    Alert.alert(
      'Camera Permission Required',
      'Please enable camera access in your device settings to scan QR codes.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: onClose,
        },
        {
          text: 'Open Settings',
          onPress: () => {
            Linking.openSettings();
          },
        },
      ]
    );
  };

  const handleTryAgain = async () => {
    console.log('Try Again button pressed');
    
    // Show alert to confirm button is working
    Alert.alert('Debug', 'Button was pressed! Now requesting permission...');
    
    // Reset state to show loading
    setHasPermission(null);
    
    // Small delay to let alert show
    setTimeout(async () => {
      // Request permission which will trigger native dialog
      await requestCameraPermission();
    }, 500);
  };

  const handleBarCodeScanned = ({type, data}: BarcodeScanningResult) => {
    if (!scanned && !isProcessing) {
      setScanned(true);
      setIsProcessing(true);
      onBarcodeScanned(data, type);
      
      // Reset after 3 seconds to allow scanning again
      setTimeout(() => {
        setScanned(false);
        setIsProcessing(false);
      }, 3000);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={styles.message}>Requesting camera access...</Text>
          <Text style={styles.subMessage}>
            Please allow camera permission to scan QR codes
          </Text>
        </View>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionIcon}>🔒</Text>
          <Text style={styles.message}>Camera Access Needed</Text>
          <Text style={styles.subMessage}>
            {canAskAgain
              ? 'Camera permission is required to scan QR codes for rewards and promotions.'
              : 'Camera access was denied. Please enable it in your device settings to use the QR scanner.'}
          </Text>

          <View style={styles.buttonContainer}>
            {canAskAgain ? (
              <>
                <TouchableOpacity
                  style={[styles.permissionButton, styles.primaryButton]}
                  onPress={() => {
                    console.log('Allow Camera Access button pressed!');
                    handleTryAgain();
                  }}
                  activeOpacity={0.7}>
                  <Text style={styles.primaryButtonText}>Allow Camera Access</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.permissionButton, styles.secondaryButton]}
                  onPress={onClose}
                  activeOpacity={0.7}>
                  <Text style={styles.secondaryButtonText}>Not Now</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.permissionButton, styles.primaryButton]}
                  onPress={() => {
                    console.log('Open Settings button pressed!');
                    handleOpenSettings();
                  }}
                  activeOpacity={0.7}>
                  <Text style={styles.primaryButtonText}>Open Settings</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.permissionButton, styles.secondaryButton]}
                  onPress={onClose}
                  activeOpacity={0.7}>
                  <Text style={styles.secondaryButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: [
            'qr',
            'pdf417',
            'aztec',
            'ean13',
            'ean8',
            'code39',
            'code93',
            'code128',
            'datamatrix',
            'itf14',
            'upc_e',
          ],
        }}>
        {/* Scanner Overlay */}
        <View style={styles.overlay}>
          {/* Top overlay */}
          <View style={styles.overlayTop} />
          
          {/* Middle section with scanner frame */}
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            <View style={styles.scannerFrame}>
              {/* Corner indicators */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              
              {scanned && (
                <View style={styles.scannedIndicator}>
                  <Text style={styles.scannedText}>✓ Scanned!</Text>
                </View>
              )}
            </View>
            <View style={styles.overlaySide} />
          </View>
          
          {/* Bottom overlay */}
          <View style={styles.overlayBottom}>
            <Text style={styles.instructionText}>
              Position QR code within the frame
            </Text>
          </View>
        </View>

        {/* Close button */}
        <TouchableOpacity
          style={styles.closeButtonCamera}
          onPress={onClose}>
          <Text style={styles.closeButtonTextCamera}>×</Text>
        </TouchableOpacity>

        {/* Manual rescan button */}
        {scanned && (
          <TouchableOpacity
            style={styles.rescanButton}
            onPress={() => setScanned(false)}>
            <Text style={styles.rescanButtonText}>Tap to Scan Again</Text>
          </TouchableOpacity>
        )}
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  permissionContainer: {
    paddingHorizontal: 32,
    alignItems: 'center',
    maxWidth: 400,
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  message: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.background,
    textAlign: 'center',
    marginBottom: 12,
  },
  subMessage: {
    fontSize: 15,
    color: Colors.background,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    opacity: 0.9,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    zIndex: 10,
  },
  permissionButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 56,
  },
  primaryButton: {
    backgroundColor: Colors.secondary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.background,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
  },
  closeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
  },
  closeButtonCamera: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  closeButtonTextCamera: {
    fontSize: 32,
    color: Colors.background,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: 280,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  scannerFrame: {
    width: 280,
    height: 280,
    backgroundColor: 'transparent',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: Colors.secondary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.background,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  scannedIndicator: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  scannedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.background,
  },
  rescanButton: {
    position: 'absolute',
    bottom: 60,
    left: SCREEN_WIDTH / 2 - 100,
    width: 200,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
  },
  rescanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
  },
});

export default CameraModule;

