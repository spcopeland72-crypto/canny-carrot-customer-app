# How to View Your Mobile App

## Option 1: Quick Preview with Expo (Recommended for Development)

Expo allows you to preview the app on your phone without setting up Android Studio or Xcode.

### Steps:

1. **Install Expo CLI globally:**
   ```bash
   npm install -g expo-cli
   ```

2. **Install dependencies:**
   ```bash
   cd "c:\Canny Carrot\canny-carrot-mobile-app"
   npm install
   ```

3. **Install Expo in the project:**
   ```bash
   npx expo install expo
   ```

4. **Start the Expo development server:**
   ```bash
   npx expo start
   ```

5. **View on your phone:**
   - Install "Expo Go" app from App Store (iOS) or Google Play (Android)
   - Scan the QR code shown in the terminal with:
     - **iOS**: Camera app
     - **Android**: Expo Go app

## Option 2: React Native CLI (Full Native Setup)

### For Android:

1. **Install dependencies:**
   ```bash
   cd "c:\Canny Carrot\canny-carrot-mobile-app"
   npm install
   ```

2. **Set up Android development environment:**
   - Install Android Studio
   - Set up Android SDK
   - Create an Android Virtual Device (AVD)

3. **Run on Android emulator:**
   ```bash
   npm run android
   ```

### For iOS (Mac only):

1. **Install dependencies:**
   ```bash
   cd "c:\Canny Carrot\canny-carrot-mobile-app"
   npm install
   ```

2. **Install CocoaPods dependencies:**
   ```bash
   cd ios
   pod install
   cd ..
   ```

3. **Run on iOS simulator:**
   ```bash
   npm run ios
   ```

## Option 3: View Code in Your IDE

You can also view the code directly:

- **Home Screen:** `src/components/HomeScreen.tsx`
- **Colors:** `src/constants/Colors.ts`
- **Main App:** `App.tsx`

## Quick Start (Fastest Way)

If you just want to see it quickly:

```bash
cd "c:\Canny Carrot\canny-carrot-mobile-app"
npm install
npx expo install expo
npx expo start
```

Then scan the QR code with Expo Go app on your phone!


