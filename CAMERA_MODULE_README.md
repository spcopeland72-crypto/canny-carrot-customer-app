# Camera Module with QR Code Scanner

## Overview

This module provides complete camera functionality with QR code scanning capabilities for the Canny Carrot customer mobile app. It uses Expo's camera API and supports multiple barcode formats.

## Features

✅ **Real-time QR Code Scanning** - Instant barcode detection using device camera  
✅ **Multiple Barcode Format Support** - QR codes, EAN, Code128, PDF417, and more  
✅ **Permission Handling** - Automatic camera permission requests with user-friendly error messages  
✅ **Visual Feedback** - Scanner frame overlay with corner indicators  
✅ **Scan Confirmation** - Alert dialog with scanned data preview  
✅ **Rescan Capability** - Easy rescan without closing the camera  
✅ **Cross-Platform** - Works on iOS and Android  

## Components

### 1. CameraModule (`src/components/CameraModule.tsx`)

The core camera component that handles:
- Camera permission requests
- Real-time barcode scanning
- Visual scanner overlay with frame indicators
- Scan result feedback
- Error handling

**Props:**
```typescript
interface CameraModuleProps {
  onBarcodeScanned: (data: string, type: string) => void;
  onClose: () => void;
}
```

### 2. ScanModal (`src/components/ScanModal.tsx`)

Modal wrapper that provides:
- Display user's QR code
- Launch camera scanner
- Handle scan results
- Integration with existing app navigation

**Props:**
```typescript
interface ScanModalProps {
  visible: boolean;
  onClose: () => void;
  onScanComplete?: (data: string, type: string) => void;
}
```

### 3. QR Code Utilities (`src/utils/qrCodeUtils.ts`)

Helper functions for:
- QR code validation
- URL detection
- JSON parsing
- Reward code validation
- Data formatting
- Scan history logging

### 4. Type Definitions (`src/types/camera.types.ts`)

TypeScript types for:
- Barcode types
- Scan results
- Camera permissions
- Component props

## Installation

### 1. Install Dependencies

```bash
cd canny-carrot-mobile-app
npm install
```

The following packages have been added to `package.json`:
- `expo-camera@~15.0.16` - Camera access and barcode scanning
- `expo-barcode-scanner@~13.0.1` - Barcode scanner utilities

### 2. Configure Permissions

Permissions are already configured in `app.json`:

**iOS:**
- Camera usage description added to Info.plist
- Explains why camera access is needed

**Android:**
- CAMERA permission added to manifest
- Runtime permission handling included

### 3. Rebuild the App

For native changes to take effect:

```bash
# Clear cache and rebuild
npm start -- --clear

# For iOS
npm run ios

# For Android
npm run android
```

## Usage

### Basic Implementation

The camera module is already integrated into the app through the `ScanModal`:

```typescript
import ScanModal from './src/components/ScanModal';

function MyComponent() {
  const [modalVisible, setModalVisible] = useState(false);

  const handleScanComplete = (data: string, type: string) => {
    console.log('Scanned:', data);
    // Process the scanned data
  };

  return (
    <>
      <Button onPress={() => setModalVisible(true)} title="Scan QR" />
      
      <ScanModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onScanComplete={handleScanComplete}
      />
    </>
  );
}
```

### Direct Camera Module Usage

For custom implementations:

```typescript
import CameraModule from './src/components/CameraModule';

function CustomScanner() {
  const handleScan = (data: string, type: string) => {
    console.log('Barcode detected:', {data, type});
  };

  return (
    <CameraModule
      onBarcodeScanned={handleScan}
      onClose={() => navigation.goBack()}
    />
  );
}
```

### Using QR Code Utilities

```typescript
import {
  validateQRCode,
  processQRCode,
  formatQRCodeData,
} from './src/utils/qrCodeUtils';

function handleQRScan(data: string, type: string) {
  // Validate the QR code
  const validation = validateQRCode(data, type);
  
  if (validation.isValid) {
    // Process based on type
    const result = processQRCode(data, type);
    
    switch (result.action) {
      case 'navigate':
        // Open URL
        Linking.openURL(result.payload.url);
        break;
      case 'reward':
        // Apply reward code
        applyRewardCode(result.payload.code);
        break;
      case 'info':
        // Show information
        Alert.alert('Info', JSON.stringify(result.payload));
        break;
    }
  }
}
```

## Supported Barcode Types

The scanner supports the following barcode formats:
- **QR Code** - Most common 2D barcode
- **PDF417** - Used on ID cards
- **Aztec** - High-density 2D barcode
- **EAN-13** - Standard product barcode
- **EAN-8** - Short product barcode
- **Code 39** - Alphanumeric barcode
- **Code 93** - Improved version of Code 39
- **Code 128** - High-density linear barcode
- **Data Matrix** - 2D barcode for small items
- **ITF-14** - Shipping container barcode
- **UPC-E** - Short version of UPC barcode

## Customization

### Change Scanner Frame Size

Edit `CameraModule.tsx`:

```typescript
const styles = StyleSheet.create({
  overlayMiddle: {
    flexDirection: 'row',
    height: 280, // Change this value
  },
  scannerFrame: {
    width: 280, // Change this value
    height: 280, // Change this value
  },
});
```

### Change Frame Corner Color

```typescript
const styles = StyleSheet.create({
  corner: {
    borderColor: Colors.secondary, // Change color here
  },
});
```

### Modify Scan Behavior

In `CameraModule.tsx`, adjust the scan timeout:

```typescript
setTimeout(() => {
  setScanned(false);
  setIsProcessing(false);
}, 3000); // Change delay (in milliseconds)
```

## Testing

### Test QR Code Generation

You can generate test QR codes at:
- https://www.qr-code-generator.com/
- https://www.qrcode-monkey.com/

### Test Different Barcode Types

Create test barcodes with different data:
- **URL**: `https://example.com`
- **JSON**: `{"action":"reward","code":"ABC123"}`
- **Reward Code**: `REWARD2024ABC`
- **Plain Text**: `Any text here`

### Test Permissions

Test permission scenarios:
1. **First Launch** - Should request permission
2. **Permission Denied** - Should show error message
3. **Permission Granted** - Should show camera view

## Troubleshooting

### Camera Not Working

**Issue:** Black screen or no camera view  
**Solution:**
1. Check permissions in device settings
2. Rebuild the app with `npm run android` or `npm run ios`
3. Verify camera works in other apps

### Barcode Not Scanning

**Issue:** QR codes not being detected  
**Solution:**
1. Ensure good lighting
2. Hold device steady
3. Position QR code within the frame
4. Check barcode type is supported

### Build Errors

**Issue:** Build fails after adding camera module  
**Solution:**
```bash
# Clear all caches
npm start -- --clear

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules
npm install

# Rebuild native modules
npm run android # or npm run ios
```

### Permission Errors

**Issue:** "Camera permission denied"  
**Solution:**
1. Go to device Settings > Apps > Canny Carrot
2. Enable Camera permission
3. Restart the app

## Architecture

```
CameraModule Flow:
┌──────────────────┐
│   ScanModal      │ - User interface
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  CameraModule    │ - Camera access
└────────┬─────────┘ - Barcode scanning
         │          - Permission handling
         ▼
┌──────────────────┐
│  Expo Camera API │ - Native camera
└────────┬─────────┘ - Barcode detection
         │
         ▼
┌──────────────────┐
│  QR Code Utils   │ - Data validation
└──────────────────┘ - Processing logic
```

## Performance Considerations

- **Camera Stream**: Runs at 30 FPS for smooth scanning
- **Scan Throttling**: 3-second cooldown prevents multiple rapid scans
- **Memory Management**: Camera released when modal closes
- **Battery Impact**: Camera only active when scanning

## Security

- **Permissions**: Explicit user consent required
- **Data Validation**: All scanned data validated before processing
- **No Auto-Actions**: User confirms before opening URLs or applying codes
- **Privacy**: No scan data sent to servers without user consent

## Future Enhancements

Potential improvements:
- [ ] Flashlight toggle for low-light scanning
- [ ] Image-based QR code scanning (from gallery)
- [ ] Multiple simultaneous barcode detection
- [ ] Scan history with persistent storage
- [ ] Custom QR code generation
- [ ] Analytics tracking for scan metrics

## Support

For issues or questions:
1. Check this documentation
2. Review code comments in component files
3. Check Expo Camera documentation: https://docs.expo.dev/versions/latest/sdk/camera/

## License

Part of the Canny Carrot mobile application.


