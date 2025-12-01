/**
 * Camera Module Integration Examples
 * 
 * This file contains example implementations showing different ways
 * to integrate the camera module with QR code scanning.
 * 
 * Copy these examples into your components as needed.
 */

import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Linking,
  StyleSheet,
} from 'react-native';
import ScanModal from '../components/ScanModal';
import {processQRCode, validateQRCode, QRCodeData} from '../utils/qrCodeUtils';
import {Colors} from '../constants/Colors';

// ============================================================================
// EXAMPLE 1: Basic Scan Button with Modal
// ============================================================================

export const BasicScanExample: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleScanComplete = (data: string, type: string) => {
    console.log('QR Code Scanned:', {data, type});
    Alert.alert('Scanned Successfully', `Data: ${data}\nType: ${type}`);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setModalVisible(true)}>
        <Text style={styles.buttonText}>Open Scanner</Text>
      </TouchableOpacity>

      <ScanModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onScanComplete={handleScanComplete}
      />
    </View>
  );
};

// ============================================================================
// EXAMPLE 2: Reward Code Scanner
// ============================================================================

export const RewardCodeScanner: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [lastRewardCode, setLastRewardCode] = useState<string | null>(null);

  const handleScanComplete = (data: string, type: string) => {
    const validation = validateQRCode(data, type);

    if (validation.isValid && validation.parsedData?.type === 'reward') {
      const rewardCode = validation.parsedData.code;
      setLastRewardCode(rewardCode);

      // Apply the reward code to user's account
      applyRewardCode(rewardCode);

      Alert.alert(
        '🎉 Reward Applied!',
        `Code: ${rewardCode}\n\nYour reward has been added to your account.`,
        [{text: 'OK', onPress: () => setModalVisible(false)}]
      );
    } else {
      Alert.alert(
        'Invalid Reward Code',
        'This QR code does not contain a valid reward code. Please try again.',
        [{text: 'OK'}]
      );
    }
  };

  const applyRewardCode = (code: string) => {
    // Your reward logic here
    console.log('Applying reward code:', code);
    // API call to backend to apply reward
  };

  return (
    <View style={styles.container}>
      {lastRewardCode && (
        <View style={styles.rewardBanner}>
          <Text style={styles.rewardText}>
            Last Reward: {lastRewardCode}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, styles.rewardButton]}
        onPress={() => setModalVisible(true)}>
        <Text style={styles.buttonText}>Scan Reward Code</Text>
      </TouchableOpacity>

      <ScanModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onScanComplete={handleScanComplete}
      />
    </View>
  );
};

// ============================================================================
// EXAMPLE 3: URL Handler with Navigation
// ============================================================================

export const URLScanner: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleScanComplete = (data: string, type: string) => {
    const result = processQRCode(data, type);

    if (result.action === 'navigate') {
      Alert.alert(
        'Open Website?',
        `Do you want to open:\n${result.payload.url}`,
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Open',
            onPress: () => {
              Linking.openURL(result.payload.url).catch(err =>
                console.error('Failed to open URL:', err)
              );
              setModalVisible(false);
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Not a URL',
        'This QR code does not contain a valid URL.',
        [{text: 'OK'}]
      );
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setModalVisible(true)}>
        <Text style={styles.buttonText}>Scan Website QR</Text>
      </TouchableOpacity>

      <ScanModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onScanComplete={handleScanComplete}
      />
    </View>
  );
};

// ============================================================================
// EXAMPLE 4: Multi-Purpose Scanner with History
// ============================================================================

export const AdvancedScanner: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [scanHistory, setScanHistory] = useState<QRCodeData[]>([]);

  const handleScanComplete = (data: string, type: string) => {
    const qrCodeData: QRCodeData = {
      data,
      type,
      timestamp: new Date(),
    };

    // Add to history
    setScanHistory(prev => [qrCodeData, ...prev.slice(0, 9)]); // Keep last 10

    // Process the QR code
    const result = processQRCode(data, type);

    switch (result.action) {
      case 'navigate':
        handleURLScan(result.payload.url);
        break;
      case 'reward':
        handleRewardScan(result.payload.code);
        break;
      case 'info':
        handleInfoScan(result.payload);
        break;
      default:
        Alert.alert('Scanned', `Data: ${data}`);
    }
  };

  const handleURLScan = (url: string) => {
    Alert.alert('Open URL?', url, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Open', onPress: () => Linking.openURL(url)},
    ]);
  };

  const handleRewardScan = (code: string) => {
    Alert.alert('Reward Code', `Applying code: ${code}`, [
      {
        text: 'OK',
        onPress: () => {
          // Apply reward logic
          console.log('Reward applied:', code);
          setModalVisible(false);
        },
      },
    ]);
  };

  const handleInfoScan = (payload: any) => {
    Alert.alert('Information', JSON.stringify(payload, null, 2));
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setModalVisible(true)}>
        <Text style={styles.buttonText}>Scan QR Code</Text>
      </TouchableOpacity>

      {scanHistory.length > 0 && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Recent Scans:</Text>
          {scanHistory.slice(0, 3).map((scan, index) => (
            <View key={index} style={styles.historyItem}>
              <Text style={styles.historyData} numberOfLines={1}>
                {scan.data}
              </Text>
              <Text style={styles.historyTime}>
                {scan.timestamp.toLocaleTimeString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      <ScanModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onScanComplete={handleScanComplete}
      />
    </View>
  );
};

// ============================================================================
// EXAMPLE 5: Product Barcode Scanner (EAN/UPC)
// ============================================================================

export const ProductScanner: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [productInfo, setProductInfo] = useState<any>(null);

  const handleScanComplete = (data: string, type: string) => {
    // Check if it's a product barcode (EAN, UPC, etc.)
    if (['ean13', 'ean8', 'upc_e'].includes(type.toLowerCase())) {
      lookupProduct(data);
    } else {
      Alert.alert(
        'Not a Product Barcode',
        'Please scan a product barcode (EAN or UPC)',
        [{text: 'OK'}]
      );
    }
  };

  const lookupProduct = async (barcode: string) => {
    try {
      // Mock product lookup - replace with actual API call
      const mockProduct = {
        barcode,
        name: 'Sample Product',
        price: '$9.99',
        description: 'This is a sample product',
      };

      setProductInfo(mockProduct);
      setModalVisible(false);

      Alert.alert(
        'Product Found',
        `${mockProduct.name}\nPrice: ${mockProduct.price}`,
        [{text: 'OK'}]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to lookup product', [{text: 'OK'}]);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setModalVisible(true)}>
        <Text style={styles.buttonText}>Scan Product</Text>
      </TouchableOpacity>

      {productInfo && (
        <View style={styles.productCard}>
          <Text style={styles.productName}>{productInfo.name}</Text>
          <Text style={styles.productPrice}>{productInfo.price}</Text>
          <Text style={styles.productBarcode}>
            Barcode: {productInfo.barcode}
          </Text>
        </View>
      )}

      <ScanModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onScanComplete={handleScanComplete}
      />
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  rewardButton: {
    backgroundColor: Colors.secondary,
  },
  buttonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  rewardBanner: {
    backgroundColor: Colors.secondary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  rewardText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  historyContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.text,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  historyData: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  historyTime: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  productCard: {
    marginTop: 20,
    padding: 16,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  productBarcode: {
    fontSize: 12,
    color: '#666',
  },
});

// ============================================================================
// USAGE NOTES
// ============================================================================

/**
 * To use these examples in your components:
 * 
 * 1. Import the example you want:
 *    import { BasicScanExample } from './examples/CameraIntegrationExamples';
 * 
 * 2. Use it in your component:
 *    <BasicScanExample />
 * 
 * 3. Or copy the code and customize for your needs
 * 
 * Available Examples:
 * - BasicScanExample: Simple scan button with modal
 * - RewardCodeScanner: Validate and apply reward codes
 * - URLScanner: Open URLs from QR codes
 * - AdvancedScanner: Multi-purpose with history tracking
 * - ProductScanner: Scan product barcodes (EAN/UPC)
 */


