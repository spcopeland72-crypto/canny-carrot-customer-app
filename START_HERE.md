# How to Start the App

## Quick Start

**Option 1: Double-click the batch file**
- Double-click `start.bat` in this folder
- This will start Expo automatically

**Option 2: Manual start in terminal**

1. Open PowerShell or Command Prompt
2. Navigate to the project:
   ```powershell
   cd "c:\Canny Carrot\canny-carrot-mobile-app"
   ```
3. Start Expo:
   ```powershell
   npx expo start --clear
   ```

## What You Should See

After running the command, you should see:
- "Starting project at..."
- "Starting Metro Bundler"
- "Metro waiting on exp://..."
- A QR code
- Menu options (press a, w, r, etc.)

## Viewing the App

1. **On your phone:**
   - Install Expo Go app
   - Scan the QR code from the terminal
   - Make sure phone and computer are on same Wi-Fi

2. **In web browser:**
   - Press `w` in the terminal
   - App opens in browser

## Troubleshooting

If Expo doesn't start:
1. Make sure you're in the correct directory
2. Check if port 8081 is in use (try port 8082)
3. Try: `npm start` instead of `npx expo start`
4. Check for error messages in the terminal


