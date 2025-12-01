# Quick Setup Guide - Camera Module with QR Scanner

## 🚀 Quick Start (5 minutes)

### Step 1: Install Dependencies

```bash
cd canny-carrot-mobile-app
npm install
```

### Step 2: Start Development Server

```bash
npm start
```

### Step 3: Run on Device/Emulator

Choose your platform:

**iOS:**
```bash
npm run ios
```

**Android:**
```bash
npm run android
```

**Note:** Camera features require a physical device. Emulators may not support camera access.

## 📱 Testing the Camera Module

### On Physical Device:

1. Launch the app
2. Navigate to any screen with a scan button
3. Tap the **scan icon** in the bottom navigation or any "SCAN" button
4. The scan modal will appear showing your QR code
5. Tap **"SCAN QR CODE"** button
6. Point camera at any QR code
7. Scan will automatically detect and show results

### First-Time Setup:

When you first use the camera:
1. App will request camera permission
2. Tap **"Allow"** when prompted
3. Camera view will appear
4. Position QR code within the frame

## 🎯 What's Been Implemented

### ✅ New Components

| File | Purpose |
|------|---------|
| `src/components/CameraModule.tsx` | Camera view with QR scanning |
| `src/components/ScanModal.tsx` | Updated with real camera integration |
| `src/utils/qrCodeUtils.ts` | QR code validation and processing |
| `src/types/camera.types.ts` | TypeScript type definitions |

### ✅ Dependencies Added

```json
"expo-camera": "~15.0.16",
"expo-barcode-scanner": "~13.0.1"
```

### ✅ Permissions Configured

**iOS** - Added to app.json:
- NSCameraUsageDescription

**Android** - Added to app.json:
- CAMERA permission

## 🔧 Configuration Files Updated

### package.json
- Added camera dependencies

### app.json
- Added iOS camera permissions
- Added Android camera permissions
- Added expo-camera plugin

## 💡 How It Works

```
User Flow:
1. User taps scan button → Opens ScanModal
2. Modal shows user's QR code
3. User taps "SCAN QR CODE" → Opens CameraModule
4. Camera activates with overlay frame
5. User positions QR code in frame
6. QR code detected automatically
7. Alert shows scanned data
8. User can scan again or close
```

## 🎨 Features

### Scanner Overlay
- Corner indicators for frame positioning
- Semi-transparent overlay
- Clear instructions
- Success feedback

### Permission Handling
- Automatic permission request
- Clear error messages
- Settings guidance if denied

### Scan Processing
- Multiple barcode type support
- Data validation
- Type detection (URL, JSON, reward code, text)
- 3-second cooldown between scans

## 🧪 Test QR Codes

Generate test QR codes at: https://www.qr-code-generator.com/

Test with different data types:

**1. URL:**
```
https://cannycarrot.com
```

**2. Reward Code:**
```
REWARD2024XYZ
```

**3. JSON Data:**
```json
{"action":"reward","code":"ABC123","points":100}
```

**4. Plain Text:**
```
Hello from Canny Carrot!
```

## 📋 Integration Points

The camera module is integrated in:

- **ScanModal** - Main modal for QR scanning
- **App.tsx** - Modal state management
- **Multiple pages** - Scan button triggers

Current pages with scan functionality:
- HomeScreen
- TermsConditionsPage
- PrivacyPolicyPage
- LearnMorePage
- RewardDetailPage (all rewards)
- ShopOnlinePage
- ChatPage
- WriteReviewPage
- ReferEarnPage
- PersonalDetailsPage
- CommunicationPreferencesPage
- YourOrdersPage

## 🐛 Common Issues

### "Camera permission denied"
**Fix:** Go to Settings > Canny Carrot > Enable Camera

### "Expo Camera not found"
**Fix:** 
```bash
npm install
npm start -- --clear
```

### Build errors
**Fix:**
```bash
rm -rf node_modules
npm install
npm run android # or ios
```

### Camera shows black screen
**Fix:**
1. Check device camera works in other apps
2. Restart the app
3. Check permissions in device settings

## 📖 Documentation

Full documentation available in:
- `CAMERA_MODULE_README.md` - Complete technical documentation

## 🎓 Code Examples

### Basic Usage in Your Component:

```typescript
import ScanModal from './src/components/ScanModal';

function YourComponent() {
  const [scanVisible, setScanVisible] = useState(false);

  const handleScanComplete = (data: string, type: string) => {
    console.log('Scanned:', {data, type});
    // Your logic here
  };

  return (
    <>
      <TouchableOpacity onPress={() => setScanVisible(true)}>
        <Text>Open Scanner</Text>
      </TouchableOpacity>

      <ScanModal
        visible={scanVisible}
        onClose={() => setScanVisible(false)}
        onScanComplete={handleScanComplete}
      />
    </>
  );
}
```

### Processing Scanned Data:

```typescript
import {processQRCode, validateQRCode} from './src/utils/qrCodeUtils';

const handleScan = (data: string, type: string) => {
  // Validate
  const validation = validateQRCode(data, type);
  
  if (validation.isValid) {
    // Process
    const result = processQRCode(data, type);
    
    switch (result.action) {
      case 'navigate':
        // Handle URL
        break;
      case 'reward':
        // Handle reward code
        break;
      case 'info':
        // Handle info
        break;
    }
  }
};
```

## ✨ Next Steps

1. **Install dependencies:** `npm install`
2. **Test on device:** `npm run ios` or `npm run android`
3. **Scan test QR code**
4. **Customize styling** if needed
5. **Add business logic** for reward codes

## 📞 Need Help?

1. Check `CAMERA_MODULE_README.md` for detailed docs
2. Review code comments in component files
3. Check Expo docs: https://docs.expo.dev/versions/latest/sdk/camera/

---

**Ready to scan! 📷** The camera module is fully integrated and ready to use.


