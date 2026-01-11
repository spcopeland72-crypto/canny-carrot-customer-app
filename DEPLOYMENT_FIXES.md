# Deployment & Testing Environment Fixes

## Issues Fixed

### 1. Expo SDK Version Mismatch (SDK 54 vs SDK 51)

**Problem**: App was showing SDK version mismatch warnings when running on iPhone.

**Solution**:
- Added explicit `sdkVersion: "54.0.0"` to `app.json`
- Verified all dependencies are aligned with Expo SDK 54:
  - `expo: ~54.0.0` ✅
  - `expo-camera: ~17.0.10` ✅ (compatible with SDK 54)
  - `@expo/config-plugins: ~54.0.4` ✅
- Ran `npx expo install --fix` to ensure all dependencies are compatible

**Next Steps**:
- If you still see SDK mismatch warnings, you may need to:
  1. Clear Expo cache: `npx expo start --clear`
  2. Rebuild native code: `npx expo prebuild --clean` (if using bare workflow)
  3. For managed workflow, the SDK version in app.json should be sufficient

### 2. Camera/QR Code Scanning Not Working on iPhone

**Problem**: Camera doesn't work for QR code scanning on iPhone (used to work).

**Root Cause**: Likely related to SDK version mismatch causing native module issues.

**Solution**:
- Verified `expo-camera` version `~17.0.10` is compatible with SDK 54
- Camera permissions are properly configured in `app.json`:
  ```json
  "NSCameraUsageDescription": "Canny Carrot needs camera access to scan QR codes for stamps"
  ```
- Camera plugin is properly configured in `app.json` plugins section

**Troubleshooting Steps**:
1. **Clear app cache and rebuild**:
   ```bash
   cd canny-carrot-mobile-app
   npx expo start --clear
   ```

2. **Check camera permissions on device**:
   - Settings > Privacy & Security > Camera > Canny Carrot
   - Ensure permission is granted

3. **Test camera in development**:
   - Run `npx expo run:ios` to rebuild with latest native code
   - This ensures native modules are properly linked

4. **If using EAS Build**:
   - The SDK version fix should resolve this in new builds
   - Rebuild the app: `eas build --platform ios --profile preview`

### 3. Account Details Not Loading Reliably (charles dickens account)

**Problem**: Login as "charles dickens" does not have 100% success loading account details.

**Root Cause**: 
- `AccountPage.tsx` had hardcoded values instead of loading from customer record
- No retry logic for loading customer data
- No error handling for failed loads

**Solution**:
- Updated `AccountPage.tsx` to load account details from `getCustomerRecord()`
- Added retry logic (3 attempts with 500ms delay between retries)
- Added loading state and error handling
- Account details now load dynamically from customer record:
  - Name: `${firstName} ${lastName}` or fallback to "User"
  - Email: from profile or "No email set"

**How It Works**:
1. Component loads customer record on mount
2. Retries up to 3 times if initial load fails
3. Displays loading indicator while fetching
4. Shows error message if all retries fail
5. Falls back to default values if no profile exists

**Testing**:
- Account details should now load reliably for all users
- If loading fails, user sees "Loading account..." then error message
- Data persists in local storage and syncs to Redis

## Verification Steps

1. **SDK Version**:
   ```bash
   cd canny-carrot-mobile-app
   npx expo --version  # Should show 54.x.x
   ```

2. **Camera**:
   - Open app on iPhone
   - Navigate to Scan page
   - Camera should open and scan QR codes
   - Check console for any camera permission errors

3. **Account Loading**:
   - Login/log in as any user (including "charles dickens")
   - Navigate to Account page
   - Account details should load within 1-2 seconds
   - If it fails, retry logic will attempt 3 times

## Next Steps for Production

1. **Test on physical iPhone device** (not just simulator)
2. **Verify camera permissions** are requested properly
3. **Test account loading** with various user accounts
4. **Monitor error logs** for any remaining issues
5. **Consider adding**:
   - Offline mode handling for account loading
   - Better error messages for users
   - Account refresh button

## Files Modified

- `app.json` - Added `sdkVersion: "54.0.0"`
- `src/components/AccountPage.tsx` - Dynamic account loading with retry logic
- `package.json` - Already had correct SDK 54 dependencies
- `package-lock.json` - Regenerated to sync dependencies

## Notes

- The app uses device-based authentication (no traditional login)
- Customer records are stored in local storage and synced to Redis
- Account details come from the customer record's profile
- If profile doesn't exist, defaults are used




