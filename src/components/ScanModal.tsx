import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
  Platform,
  SafeAreaView,
} from 'react-native';
// Use Platform-specific safe area handling
import {CameraView, useCameraPermissions, BarcodeScanningResult} from 'expo-camera';
import {Colors} from '../constants/Colors';
import {loadRewards, saveRewards, type CustomerReward} from '../utils/dataStorage';
import {parseQRCode, isValidQRCode} from '../utils/qrCodeUtils';
import {loadBusinesses, addOrUpdateBusiness, type MemberBusiness} from '../utils/businessStorage';
import {recordRewardScan, recordCampaignScan} from '../services/customerRecord';

// Check if browser supports native BarcodeDetector API
const supportsBarcodeDetector = (): boolean => {
  return Platform.OS === 'web' && 
         typeof window !== 'undefined' && 
         'BarcodeDetector' in window;
};

interface ScanModalProps {
  visible: boolean;
  onClose: () => void;
  onRewardScanned?: (reward: CustomerReward) => void;
  onRewardEarned?: (reward: CustomerReward) => void; // Callback when reward is newly earned
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const MODAL_MARGIN = 10;

// Load images
let calvinImage = null;
try {
  calvinImage = require('../../Images/calvin.png');
} catch (e) {
  calvinImage = null;
}

// Helper function to convert parsed QR to reward format
const convertParsedQRToReward = (parsed: ReturnType<typeof parseQRCode>): {
  id: string;
  name: string;
  requirement: number;
  rewardType: string;
  products: string[];
  pinCode?: string;
  businessId?: string;
  businessName?: string;
} | null => {
  if (parsed.type === 'reward') {
    return {
      id: parsed.data.id,
      name: parsed.data.name,
      requirement: parsed.data.requirement,
      rewardType: parsed.data.rewardType,
      products: parsed.data.products,
      pinCode: parsed.data.pinCode,
      businessId: parsed.data.businessId,
    };
  } else if (parsed.type === 'company') {
    // Convert company QR to reward-like format for compatibility
    return {
      id: `company-${parsed.data.number}`,
      name: parsed.data.name,
      requirement: 1,
      rewardType: 'other',
      products: [],
    };
  }
  return null;
};

const ScanModal: React.FC<ScanModalProps> = ({visible, onClose, onRewardScanned, onRewardEarned}) => {
  // Safe area top padding for iOS (status bar + notch)
  const safeAreaTop = Platform.OS === 'ios' ? 44 : 12;
  const [scanError, setScanError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const html5QrCodeRef = useRef<any>(null);
  
  // Native camera permissions and ref
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraKey, setCameraKey] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState<boolean>(true);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const lastScannedCodeRef = useRef<string | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  
  // Initialize cameraAvailable to true (we'll rely on permission errors if camera isn't available)
  useEffect(() => {
    if (visible && Platform.OS !== 'web') {
      // Assume camera is available, errors will surface if not
      setCameraAvailable(true);
    }
  }, [visible]);

  // Request permission when modal opens (native only)
  useEffect(() => {
    if (visible && Platform.OS !== 'web' && cameraAvailable !== false) {
      console.log('[ScanModal] Modal opened, checking permissions...', { permission, cameraAvailable });
      
      // Reset camera ready state when modal opens
      setCameraReady(false);
      setCameraError(null);
      
      // Request permission if not already granted
      // Note: useCameraPermissions returns undefined initially, then a permission object
      if (permission === null || permission === undefined) {
        // Permission state is still loading, wait for it
        console.log('[ScanModal] Permission state loading, will retry...');
        // Don't return - let the effect run again when permission loads
        return;
      }
      
      if (!permission.granted) {
        if (permission.canAskAgain !== false) {
          console.log('[ScanModal] Requesting camera permission...');
          requestPermission().then((result) => {
            console.log('[ScanModal] Permission result:', result);
            if (!result.granted) {
              setCameraError('Camera permission is required to scan QR codes');
            }
          }).catch((error) => {
            console.error('[ScanModal] Permission request error:', error);
            console.error('[ScanModal] Error details:', JSON.stringify(error, null, 2));
            setCameraError('Failed to request camera permission. Please enable it in device settings.');
          });
        } else {
          console.log('[ScanModal] Camera permission denied and cannot ask again');
          setCameraError('Camera permission denied. Please enable it in Settings > Privacy > Camera.');
        }
      }
    }
  }, [visible, permission, requestPermission, cameraAvailable]);
  
  // Reset everything when modal closes
  useEffect(() => {
    if (!visible) {
      try {
        // Stop html5-qrcode scanner if running
        if (html5QrCodeRef.current) {
          try {
            html5QrCodeRef.current.stop().then(() => {
              html5QrCodeRef.current.clear();
            }).catch(() => {
              // Ignore errors during cleanup
            });
          } catch (e) {
            // Ignore errors during cleanup
          }
          html5QrCodeRef.current = null;
        }
        
        // Stop video stream if running
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        // Stop scan interval if running
        if (scanIntervalRef.current !== null) {
          cancelAnimationFrame(scanIntervalRef.current);
          scanIntervalRef.current = null;
        }
        
        // Clear video element
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current = null;
        }
        
        // Clear video element from DOM
        const videoElement = document.getElementById('qr-scanner-video');
        if (videoElement && videoElement.parentNode) {
          videoElement.parentNode.removeChild(videoElement);
        }
        
        // Clear html5-qrcode-scanner div from DOM
        const html5ScannerElement = document.getElementById('html5-qrcode-scanner');
        if (html5ScannerElement && html5ScannerElement.parentNode) {
          // Clear inner content but keep the div (html5-qrcode needs it)
          html5ScannerElement.innerHTML = '';
        }
        
        setCameraError(null);
        setScanError(null);
        setCameraReady(false);
        setCameraKey(0);
        setLastScannedCode(null); // Reset scanned code when modal closes
        // Reset refs for next scan session
        lastScannedCodeRef.current = null;
        isProcessingRef.current = false;
        // Clear camera ref safely
        if (cameraRef.current) {
          cameraRef.current = null;
        }
      } catch (error) {
        console.error('Error resetting camera state:', error);
      }
    }
  }, [visible]);
  
  // Small delay before showing camera to ensure permission state is stable
  // Also ensure camera module is loaded (important for standalone builds)
  useEffect(() => {
    // On web, we don't use useCameraPermissions - we request directly via getUserMedia
    if (visible && Platform.OS !== 'web') {
      if (permission?.granted) {
        console.log('[ScanModal] Permission granted, preparing camera...');
        try {
          // Longer delay for standalone builds to ensure native module is ready
          const timer = setTimeout(() => {
            console.log('[ScanModal] Setting camera ready...');
            setCameraReady(true);
          }, 500); // Increased to 500ms for more stability
          return () => {
            console.log('[ScanModal] Cleaning up camera ready timer');
            clearTimeout(timer);
          };
        } catch (error) {
          console.error('[ScanModal] Error setting camera ready:', error);
          console.error('[ScanModal] Error stack:', error instanceof Error ? error.stack : 'No stack');
          setCameraError('Failed to initialize camera');
          setCameraReady(false);
        }
      } else {
        console.log('[ScanModal] Camera not ready:', { visible, platform: Platform.OS, granted: permission?.granted });
        setCameraReady(false);
      }
    } else if (visible && Platform.OS === 'web') {
      // On web, camera ready state is managed by the startScanner function
      // Don't set cameraReady here - it will be set when the web scanner starts successfully
      console.log('[ScanModal] Web platform - camera will be initialized by scanner');
    }
  }, [visible, permission]);

  // Helper function to stop camera/scanner
  const stopCameraAndScanner = async () => {
    try {
      // Stop html5-qrcode scanner if running
      if (html5QrCodeRef.current) {
        const scannerInstance = html5QrCodeRef.current;
        html5QrCodeRef.current = null; // Clear ref first to prevent double-stop
        try {
          await scannerInstance.stop();
          scannerInstance.clear();
        } catch (e) {
          // Ignore errors - scanner may already be stopped
        }
      }
      
      // Clear html5-qrcode-scanner div from DOM
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const scannerDiv = document.getElementById('html5-qrcode-scanner');
        if (scannerDiv) {
          scannerDiv.innerHTML = '';
        }
      }
      
      // Stop video stream if running
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Stop scan interval if running
      if (scanIntervalRef.current !== null) {
        cancelAnimationFrame(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    } catch (error) {
      console.error('[ScanModal] Error stopping camera/scanner:', error);
    }
  };

  // Process scanned campaign QR code
  const processCampaignQRCode = async (qrValue: string, parsed: ReturnType<typeof parseQRCode>) => {
    if (parsed.type !== 'campaign' || !parsed.data) {
      console.warn('[ScanModal] Invalid campaign QR code:', qrValue);
      isProcessingRef.current = false;
      Alert.alert('Invalid QR Code', 'This does not appear to be a valid campaign QR code.');
      return;
    }

    const campaignData = parsed.data;
    const campaignId = campaignData.id;
    const campaignName = campaignData.name || 'Campaign';
    const campaignDescription = campaignData.description || '';

    try {
      console.log('[ScanModal] Processing campaign QR code:', {
        campaignId,
        campaignName,
        campaignDescription,
      });

      // Extract business_id and other campaign data from parsed QR code
      let businessId = campaignData.businessId || 'default';
      let businessName = campaignData.businessName;
      
      // If business info not in QR, try to get from member businesses
      if (businessId === 'default' && !businessName) {
        try {
          const businesses = await loadBusinesses();
          // Try to find business by campaign name or use first business
          const foundBusiness = businesses.find(b => 
            b.name.toLowerCase().includes(campaignName.toLowerCase()) ||
            campaignName.toLowerCase().includes(b.name.toLowerCase())
          );
          if (foundBusiness) {
            businessId = foundBusiness.id;
            businessName = foundBusiness.name;
          }
        } catch (error) {
          console.warn('[ScanModal] Could not load businesses:', error);
        }
      }

      // Load existing rewards to check if campaign already exists
      const existingRewards = await loadRewards();
      let existingCampaign = existingRewards.find(
        r => r.id === `campaign-${campaignId}` || r.qrCode === qrValue
      );

      // Get campaign points from QR code or use defaults
      const pointsPerScan = campaignData.pointsPerScan || 1;
      const pointsRequired = campaignData.pointsRequired || 5; // Default: 5 points required

      // Record campaign scan using customer record service
      console.log('[ScanModal] Recording campaign scan in customer record');
      const { campaignProgress, isNewlyEarned } = await recordCampaignScan(
        campaignId,
        campaignName,
        pointsPerScan,
        pointsRequired,
        businessId,
        businessName,
        qrValue
      );

      // Create or update campaign as a CustomerReward for carousel display
      const campaignIcon = '🎯'; // Campaign icon
      const campaignType = 'action';

      if (existingCampaign) {
        // Update existing campaign
        existingCampaign.pointsEarned = campaignProgress.pointsEarned;
        existingCampaign.count = Math.floor(campaignProgress.pointsEarned / pointsPerScan);
        existingCampaign.total = Math.ceil(pointsRequired / pointsPerScan);
        existingCampaign.isEarned = campaignProgress.status === 'earned' || campaignProgress.status === 'redeemed';
        existingCampaign.lastScannedAt = new Date().toISOString();

        const updatedRewards = existingRewards.map(r =>
          r.id === existingCampaign!.id ? existingCampaign! : r
        );
        await saveRewards(updatedRewards);

        console.log('[ScanModal] Campaign updated:', existingCampaign.name);

        // Stop camera/scanner
        isProcessingRef.current = false;
        await stopCameraAndScanner();

        // Show success message
        Alert.alert(
          'Campaign Updated!',
          `You earned ${pointsPerScan} point(s) for "${campaignName}"!\n\nProgress: ${existingCampaign.count} of ${existingCampaign.total}`,
          [{text: 'OK', onPress: () => {
            onClose();
            setTimeout(() => {
              onRewardScanned?.(existingCampaign!);
            }, 100);
          }}]
        );
      } else {
        // Create new campaign entry
        const newCampaign: CustomerReward = {
          id: `campaign-${campaignId}`,
          name: campaignName,
          count: Math.floor(campaignProgress.pointsEarned / pointsPerScan),
          total: Math.ceil(pointsRequired / pointsPerScan),
          icon: campaignIcon,
          type: campaignType,
          requirement: Math.ceil(pointsRequired / pointsPerScan),
          pointsPerPurchase: pointsPerScan,
          rewardType: 'other',
          qrCode: qrValue,
          pointsEarned: campaignProgress.pointsEarned,
          businessId: businessId !== 'default' ? businessId : undefined,
          businessName: businessName,
          isEarned: campaignProgress.status === 'earned' || campaignProgress.status === 'redeemed',
          createdAt: new Date().toISOString(),
          lastScannedAt: new Date().toISOString(),
        };

        console.log('[ScanModal] Creating new campaign:', {
          id: newCampaign.id,
          name: newCampaign.name,
          pointsEarned: newCampaign.pointsEarned,
          total: newCampaign.total,
        });

        const updatedRewards = [...existingRewards, newCampaign];
        await saveRewards(updatedRewards);

        // Verify the campaign was saved
        const verifyRewards = await loadRewards();
        const savedCampaign = verifyRewards.find(r => r.id === newCampaign.id);
        if (savedCampaign) {
          console.log('[ScanModal] ✅ New campaign confirmed in storage:', savedCampaign.name);
        } else {
          console.warn('[ScanModal] ⚠️ New campaign NOT found in storage after save!');
        }

        // Stop camera/scanner
        isProcessingRef.current = false;
        await stopCameraAndScanner();

        // Show success message
        Alert.alert(
          'Campaign Added!',
          `You've joined "${campaignName}"!\n\nYou earned ${pointsPerScan} point(s).\n\nProgress: ${newCampaign.count} of ${newCampaign.total}`,
          [{text: 'OK', onPress: () => {
            onClose();
            setTimeout(() => {
              onRewardScanned?.(newCampaign);
            }, 100);
          }}]
        );
      }
    } catch (error) {
      console.error('[ScanModal] Error processing campaign QR code:', error);
      isProcessingRef.current = false;
      Alert.alert('Error', 'Failed to process campaign QR code. Please try again.');
    }
  };

  // Process scanned reward QR code
  const processRewardQRCode = async (qrValue: string) => {
    if (!qrValue || typeof qrValue !== 'string') {
      console.warn('[ScanModal] Invalid QR code value:', qrValue);
      return;
    }
    
    // Prevent duplicate processing
    if (isProcessingRef.current) {
      console.log('[ScanModal] Already processing QR code, ignoring duplicate scan');
      return;
    }
    
    // Trim whitespace and normalize
    const normalizedQr = qrValue.trim();
    console.log('[ScanModal] Processing QR code:', normalizedQr);
    
    // Check for duplicate scans (same code scanned twice in quick succession)
    if (lastScannedCodeRef.current === normalizedQr) {
      console.log('[ScanModal] Duplicate QR code scan detected, ignoring');
      return;
    }
    
    // Mark as processing and update last scanned code
    isProcessingRef.current = true;
    lastScannedCodeRef.current = normalizedQr;
    
    // Validate QR code format
    if (!isValidQRCode(normalizedQr)) {
      console.warn('[ScanModal] Invalid QR code format:', normalizedQr);
      isProcessingRef.current = false;
      lastScannedCodeRef.current = null;
      Alert.alert(
        'Invalid QR Code', 
        `This does not appear to be a valid QR code.\n\nScanned: ${normalizedQr.substring(0, 50)}${normalizedQr.length > 50 ? '...' : ''}`
      );
      return;
    }
    
    try {
      // Parse QR code using shared utility
      const parsed = parseQRCode(normalizedQr);
      
      // Handle campaign QR codes separately
      if (parsed.type === 'campaign') {
        await processCampaignQRCode(normalizedQr, parsed);
        return;
      }
      
      const parsedReward = convertParsedQRToReward(parsed);
      
      if (!parsedReward || parsed.type === 'unknown') {
        console.warn('[ScanModal] Failed to parse QR code:', normalizedQr);
        isProcessingRef.current = false;
        Alert.alert(
          'Invalid QR Code', 
          `This does not appear to be a valid reward QR code.\n\nScanned: ${normalizedQr.substring(0, 50)}${normalizedQr.length > 50 ? '...' : ''}`
        );
        return;
      }
      
      console.log('[ScanModal] Successfully parsed QR code:', parsedReward);

      // Extract business ID from QR code (unique ID from registration/creation)
      const businessId = parsedReward.businessId || 'default';
      let businessName = parsedReward.businessName;
      
      // If business name not in QR, try to load from member businesses
      if (!businessName && businessId !== 'default') {
        try {
          const businesses = await loadBusinesses();
          const foundBusiness = businesses.find(b => b.id === businessId);
          if (foundBusiness) {
            businessName = foundBusiness.name;
          }
        } catch (businessError) {
          console.error('[ScanModal] Error loading businesses:', businessError);
        }
      }

      const existingRewards = await loadRewards();
      let existingReward = existingRewards.find(r => r.id === parsedReward.id || r.qrCode === normalizedQr);
      
      // Use the new customer record service to track rewards properly
      // Get points per purchase from QR code (default: 1)
      // Note: pointsPerPurchase is not in current ParsedRewardQR interface
      // This would need to be added to the QR format if needed
      const pointsPerPurchase = 1;
      const pointsToAdd = pointsPerPurchase; // Points earned per scan
      const requirement = parsedReward.requirement || 1; // Number of purchases/actions needed
      const totalPointsRequired = requirement * pointsPerPurchase; // Total points needed to earn reward
      const rewardType = parsedReward.rewardType as 'free_product' | 'discount' | 'other' || 'free_product';
      
      // Debug logging
      console.log('[ScanModal] QR Code Details:', {
        pointsPerPurchase,
        requirement,
        totalPointsRequired,
        businessName: businessName,
        businessId: businessId,
      });
      
      // Record the scan in the structured customer record (handles active/earned/redeemed)
      console.log('[ScanModal] Recording reward scan in customer record');
      const { rewardProgress, isNewlyEarned } = await recordRewardScan(
        parsedReward.id,
        parsedReward.name,
        pointsToAdd,
        totalPointsRequired, // Total points needed (requirement * pointsPerPurchase)
        businessId,
        businessName,
        rewardType,
        normalizedQr
      );
      
      // Also maintain backward-compatible simple rewards list
      if (existingReward) {
        const existingPointsPerPurchase = existingReward.pointsPerPurchase || 1;
        existingReward.pointsEarned = rewardProgress.pointsEarned;
        existingReward.count = Math.floor(rewardProgress.pointsEarned / existingPointsPerPurchase); // Current progress (e.g., 1 of 4)
        existingReward.total = requirement; // Update total if changed
        existingReward.pointsPerPurchase = pointsPerPurchase; // Update points per purchase
        existingReward.isEarned = rewardProgress.pointsEarned >= (requirement * pointsPerPurchase);
        // Business logo would come from QR code if available in future format
        // For now, we'll skip logo updates for rewards
        // Update PIN code and business info if not already set
        if (parsedReward.pinCode && !existingReward.pinCode) {
          existingReward.pinCode = parsedReward.pinCode;
        }
        if (businessId !== 'default' && !existingReward.businessId) {
          existingReward.businessId = businessId;
          existingReward.businessName = businessName;
        }
        
        const updatedRewards = existingRewards.map(r => 
          r.id === existingReward!.id ? existingReward! : r
        );
        await saveRewards(updatedRewards);
        
        // Verify the reward was saved
        const verifyRewards = await loadRewards();
        console.log('[ScanModal] Verified saved rewards after update:', verifyRewards.length, 'rewards found');
        const savedReward = verifyRewards.find(r => r.id === existingReward.id);
        if (savedReward) {
          console.log('[ScanModal] ✅ Updated reward confirmed in storage:', savedReward.name);
        }
        
        // Stop camera/scanner immediately before showing Alert
        isProcessingRef.current = false;
        await stopCameraAndScanner();
        
        // Call onRewardEarned callback if reward was newly earned
        if (isNewlyEarned) {
          setTimeout(() => {
            onRewardEarned?.(existingReward!);
          }, 100);
        }
        
        // Show reward point earned message
        Alert.alert(
          'Success, you earned a point!',
          `You earned ${pointsToAdd} point(s) for "${parsedReward.name}"!`,
          [{text: 'OK', onPress: () => {
            // Close modal after user dismisses alert
            onClose();
            // Call callback to reload rewards and return to home
            setTimeout(() => {
              onRewardScanned?.(existingReward!);
            }, 100);
          }}]
        );
      } else {
        const icons = ['🎁', '⭐', '📱', '👥', '💎', '🎂', '🎉', '🏆', '🎯', '🎊'];
        const type = parsedReward.products.length > 0 ? 'product' : 'action';
        
        // Use random icon for reward (business logo would come from QR if available in future format)
        const rewardIcon = icons[Math.floor(Math.random() * icons.length)];
        
        const newReward: CustomerReward = {
          id: parsedReward.id,
          name: parsedReward.name,
          count: Math.floor(rewardProgress.pointsEarned / pointsPerPurchase), // Current progress (e.g., 1 of 4)
          total: requirement, // Total purchases/actions needed (e.g., 4)
          icon: rewardIcon,
          type: type,
          requirement: requirement,
          pointsPerPurchase: pointsPerPurchase, // Store points per purchase
          rewardType: rewardType,
          selectedProducts: parsedReward.products.length > 0 ? parsedReward.products : undefined,
          qrCode: normalizedQr,
          pointsEarned: rewardProgress.pointsEarned,
          pinCode: parsedReward.pinCode,
          businessId: businessId !== 'default' ? businessId : undefined,
          businessName: businessName || undefined,
          isEarned: rewardProgress.pointsEarned >= totalPointsRequired,
          createdAt: new Date().toISOString(), // Add timestamp so it appears in carousel
          lastScannedAt: new Date().toISOString(), // Track last scan time
        };
        
        console.log('[ScanModal] Creating new reward:', {
          id: newReward.id,
          name: newReward.name,
          pointsPerPurchase: newReward.pointsPerPurchase,
          requirement: newReward.requirement,
          total: newReward.total,
          businessLogo: newReward.businessLogo ? 'present' : 'missing',
          businessName: newReward.businessName,
        });
        
        const updatedRewards = [...existingRewards, newReward];
        await saveRewards(updatedRewards);
        console.log('[ScanModal] Reward saved successfully, total rewards:', updatedRewards.length);
        
        // Verify the reward was saved by reloading
        const verifyRewards = await loadRewards();
        console.log('[ScanModal] Verified saved rewards:', verifyRewards.length, 'rewards found');
        const savedReward = verifyRewards.find(r => r.id === newReward.id);
        if (savedReward) {
          console.log('[ScanModal] ✅ New reward confirmed in storage:', savedReward.name);
        } else {
          console.warn('[ScanModal] ⚠️ New reward NOT found in storage after save!');
        }
        
        // Stop camera/scanner immediately before showing Alert
        isProcessingRef.current = false;
        await stopCameraAndScanner();
        
        // Call onRewardEarned callback if reward was newly earned
        if (isNewlyEarned) {
          setTimeout(() => {
            onRewardEarned?.(newReward);
          }, 100);
        }
        
        // Show reward point earned message
        Alert.alert(
          'Success, you earned a point!',
          `You earned ${pointsToAdd} point(s) for "${parsedReward.name}"!`,
          [{text: 'OK', onPress: () => {
            // Close modal after user dismisses alert
            onClose();
            // Call callback to reload rewards and return to home
            setTimeout(() => {
              onRewardScanned?.(newReward);
            }, 100);
          }}]
        );
      }
    } catch (error) {
      console.error('Error processing reward QR code:', error);
      isProcessingRef.current = false;
      Alert.alert('Error', 'Failed to process reward QR code. Please try again.');
    }
  };

  // Start camera scanner automatically when modal opens
  useEffect(() => {
    if (!visible) {
      return;
    }
    
    // Only run on web platform
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }
    
    const startScanner = async () => {
      try {
        setScanError(null);
        
        // Wait for React to render
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Find the container element
        const container = document.querySelector('[data-testid="scanner-container"]');
        if (!container) {
          throw new Error('Scanner container not found');
        }
        
        // Check if getUserMedia is available and handle undefined navigator.mediaDevices
        let stream: MediaStream;
        
        // Try modern API first (navigator.mediaDevices.getUserMedia)
        // If that's not available, try legacy APIs
        const tryGetUserMedia = async (constraints: MediaStreamConstraints): Promise<MediaStream> => {
          // Wait a bit for navigator.mediaDevices to be available (some mobile browsers need this)
          let attempts = 0;
          while (typeof navigator !== 'undefined' && !navigator.mediaDevices && attempts < 5) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
          }
          
          // Try modern API first - just try calling it, don't check first
          try {
            if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
              return await navigator.mediaDevices.getUserMedia(constraints);
            }
          } catch (e: any) {
            // If it's a permission error or other real error, re-throw it
            if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError' || 
                e.name === 'NotFoundError' || e.name === 'NotReadableError') {
              throw e;
            }
            // Otherwise, try legacy APIs
          }
          
          // Try legacy APIs as fallback (for older browsers)
          const getUserMedia = (navigator as any)?.getUserMedia || 
                               (navigator as any)?.webkitGetUserMedia ||
                               (window as any)?.webkitGetUserMedia || 
                               (window as any)?.mozGetUserMedia ||
                               (window as any)?.msGetUserMedia;
          
          if (getUserMedia) {
            // Use legacy API (promisified)
            return new Promise((resolve, reject) => {
              getUserMedia.call(navigator || window, constraints, resolve, reject);
            });
          }
          
          // If we get here, neither modern nor legacy APIs are available
          // Check if we're on HTTP (camera requires HTTPS on most browsers except localhost)
          const isSecureContext = typeof window !== 'undefined' && 
                                  (window.location.protocol === 'https:' || 
                                   window.location.hostname === 'localhost' || 
                                   window.location.hostname === '127.0.0.1' ||
                                   window.location.hostname.match(/^192\.168\./)); // Allow local network IPs for development
          
          // Log for debugging
          console.error('getUserMedia not available. navigator:', typeof navigator !== 'undefined', 
                       'mediaDevices:', navigator?.mediaDevices, 
                       'getUserMedia:', (navigator as any)?.getUserMedia,
                       'isSecureContext:', isSecureContext,
                       'protocol:', window?.location?.protocol,
                       'hostname:', window?.location?.hostname);
          
          // For development, try to use the API anyway even on HTTP
          // Some browsers allow it on local network IPs
          if (!isSecureContext && typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            // If it's a local network IP, try one more time with a direct call
            if (hostname.match(/^192\.168\./) || hostname.match(/^10\./) || hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
              // Try one more time - some mobile browsers allow HTTP on local network
              try {
                if (navigator.mediaDevices) {
                  return await navigator.mediaDevices.getUserMedia(constraints);
                }
              } catch (finalError: any) {
                // If it's a security error, provide helpful message
                if (finalError.name === 'NotAllowedError' || finalError.name === 'NotSupportedError') {
                  throw new Error('Camera access blocked. Mobile browsers require HTTPS for camera access. Please use HTTPS or test on localhost.');
                }
                throw finalError;
              }
            }
          }
          
          throw new Error('Camera access is not available. Please ensure you are using a modern browser with camera support.');
        };
        
        // Request camera access
        try {
          // Try with ideal constraints first
          try {
            stream = await tryGetUserMedia({
              video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
              }
            });
          } catch (constraintError: any) {
            // If constraints fail, try simpler ones
            if (constraintError.name === 'OverconstrainedError' || constraintError.name === 'ConstraintNotSatisfiedError') {
              stream = await tryGetUserMedia({
                video: { facingMode: 'environment' }
              });
            } else {
              throw constraintError;
            }
          }
        } catch (mediaError: any) {
          console.error('getUserMedia error:', mediaError);
          
          // Provide specific error messages
          if (mediaError.name === 'NotAllowedError' || mediaError.name === 'PermissionDeniedError') {
            throw new Error('Camera permission denied. Please allow camera access in your browser settings and try again.');
          } else if (mediaError.name === 'NotFoundError' || mediaError.name === 'DevicesNotFoundError') {
            throw new Error('No camera found. Please ensure your device has a camera.');
          } else if (mediaError.name === 'NotReadableError' || mediaError.name === 'TrackStartError') {
            throw new Error('Camera is already in use by another application. Please close other apps using the camera.');
          } else {
            throw new Error(`Camera access failed: ${mediaError.message || mediaError.name}. Please check your browser permissions.`);
          }
        }
        
        // Ensure stream was obtained first
        if (!stream) {
          throw new Error('Failed to obtain camera stream.');
        }
        
        // Try html5-qrcode library first (more reliable than BarcodeDetector)
        // It handles its own video stream and QR code detection
        let html5QrCodeAvailable = false;
        try {
          // Check if html5-qrcode can be loaded
          const html5QrcodeModule = require('html5-qrcode');
          const Html5Qrcode = html5QrcodeModule.default || html5QrcodeModule.Html5Qrcode || html5QrcodeModule;
          if (Html5Qrcode && typeof Html5Qrcode === 'function') {
            html5QrCodeAvailable = true;
            // Stop the existing stream since html5-qrcode will create its own
            stream.getTracks().forEach(track => track.stop());
            
            const html5QrCode = new Html5Qrcode('html5-qrcode-scanner');
            
            await html5QrCode.start(
              { facingMode: 'environment' },
              {
                fps: 10,
                qrbox: { width: 250, height: 250 },
              },
              (decodedText: string) => {
                console.log('[ScanModal] QR code scanned via html5-qrcode:', decodedText);
                // Process the QR code (scanner will be stopped inside processRewardQRCode)
                processRewardQRCode(decodedText).catch((err: any) => {
                  console.error('[ScanModal] Error processing QR code:', err);
                });
              },
              (errorMessage: string) => {
                // Ignore scanning errors, just continue scanning
              }
            );
            
            html5QrCodeRef.current = html5QrCode;
            setScanError(null);
            return; // Successfully started html5-qrcode, exit early
          }
        } catch (html5Error) {
          console.warn('[ScanModal] html5-qrcode not available, trying BarcodeDetector:', html5Error);
          // Continue to BarcodeDetector fallback
        }
        
        // Fallback: Use BarcodeDetector API with manual video stream
        
        streamRef.current = stream;
        
        // Create video element
        let videoElement = document.getElementById('qr-scanner-video') as HTMLVideoElement;
        if (!videoElement) {
          videoElement = document.createElement('video');
          videoElement.id = 'qr-scanner-video';
          videoElement.style.width = '100%';
          videoElement.style.height = '100%';
          videoElement.style.objectFit = 'cover';
          videoElement.setAttribute('autoplay', 'true');
          videoElement.setAttribute('playsinline', 'true');
          videoElement.setAttribute('muted', 'true'); // Required for autoplay on mobile
          container.appendChild(videoElement);
        }
        
        videoRef.current = videoElement;
        videoElement.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise((resolve, reject) => {
          videoElement.onloadedmetadata = () => {
            videoElement.play()
              .then(() => {
                setScanError(null); // Clear any errors - camera is working
                resolve(undefined);
              })
              .catch(reject);
          };
          videoElement.onerror = reject;
        });
        
        // Clear any errors - camera is working
        setScanError(null);
        
        // Use native BarcodeDetector API if available
        if (supportsBarcodeDetector()) {
          try {
            const barcodeDetector = new (window as any).BarcodeDetector({
              formats: ['qr_code']
            });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) {
              throw new Error('Could not get canvas context');
            }
            
            const scanFrame = async () => {
              if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
                canvas.width = videoElement.videoWidth;
                canvas.height = videoElement.videoHeight;
                context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                
                try {
                  const barcodes = await barcodeDetector.detect(canvas);
                  if (barcodes && barcodes.length > 0) {
                    const qrCode = barcodes[0].rawValue;
                    stream.getTracks().forEach(track => track.stop());
                    processRewardQRCode(qrCode);
                    return;
                  }
                } catch (detectError) {
                  // Continue scanning
                }
              }
              scanIntervalRef.current = requestAnimationFrame(scanFrame);
            };
            
            // Start scanning immediately and also on metadata load
            if (videoElement.readyState >= videoElement.HAVE_METADATA) {
              scanFrame();
            } else {
              videoElement.addEventListener('loadedmetadata', () => {
                scanFrame();
              }, { once: true });
            }
          } catch (barcodeError) {
            console.warn('BarcodeDetector initialization failed, trying html5-qrcode fallback:', barcodeError);
            // Fallback: Use html5-qrcode library
            try {
              const Html5Qrcode = require('html5-qrcode');
              const html5QrCode = new Html5Qrcode('html5-qrcode-scanner');
              
              html5QrCode.start(
                { facingMode: 'environment' },
                {
                  fps: 10,
                  qrbox: { width: 250, height: 250 },
                },
                (decodedText: string) => {
                  console.log('[ScanModal] QR code scanned via html5-qrcode:', decodedText);
                  // Process the QR code first, then stop scanner
                  // Process the QR code (scanner will be stopped inside processRewardQRCode)
                  processRewardQRCode(decodedText).catch((err: any) => {
                    console.error('[ScanModal] Error processing QR code:', err);
                  });
                },
                (errorMessage: string) => {
                  // Ignore scanning errors, just continue scanning
                }
              ).catch((err: any) => {
                console.error('[ScanModal] html5-qrcode start failed:', err);
                setScanError('Failed to start QR code scanner. Please check camera permissions.');
              });
              
              html5QrCodeRef.current = html5QrCode;
              setScanError(null);
            } catch (html5Error) {
              console.error('[ScanModal] html5-qrcode not available:', html5Error);
              setScanError('QR code scanning is not available. Please use a modern browser.');
            }
          }
        } else {
          // Browser doesn't support BarcodeDetector - try html5-qrcode fallback
          try {
            const html5QrcodeModule = require('html5-qrcode');
            const Html5Qrcode = html5QrcodeModule.default || html5QrcodeModule.Html5Qrcode || html5QrcodeModule;
            if (Html5Qrcode && typeof Html5Qrcode === 'function') {
              const html5QrCode = new Html5Qrcode('html5-qrcode-scanner');
              
              html5QrCode.start(
                { facingMode: 'environment' },
                {
                  fps: 10,
                  qrbox: { width: 250, height: 250 },
                },
                (decodedText: string) => {
                  console.log('[ScanModal] QR code scanned via html5-qrcode:', decodedText);
                  // Process the QR code (scanner will be stopped inside processRewardQRCode)
                  processRewardQRCode(decodedText).catch((err: any) => {
                    console.error('[ScanModal] Error processing QR code:', err);
                  });
                },
                (errorMessage: string) => {
                  // Ignore scanning errors, just continue scanning
                }
              ).catch((err: any) => {
                console.error('[ScanModal] html5-qrcode start failed:', err);
                if (err.message && (err.message.includes('Permission') || err.message.includes('NotAllowed'))) {
                  setScanError('Camera permission denied. Please allow camera access in your browser settings and refresh the page.');
                } else {
                  setScanError('Failed to start QR code scanner. Please check camera permissions.');
                }
              });
              
              html5QrCodeRef.current = html5QrCode;
              setScanError(null);
            } else {
              throw new Error('html5-qrcode module not available');
            }
          } catch (html5Error) {
            console.error('[ScanModal] html5-qrcode not available:', html5Error);
            setScanError('QR code scanning requires camera access. Please allow camera permissions and try again.');
          }
        }
        
      } catch (error: any) {
        console.error('Error starting camera:', error);
        // Show user-friendly error message
        const errorMessage = error.message || 'Failed to start camera scanner. Please check your browser permissions.';
        setScanError(errorMessage);
      }
    };
    
    startScanner();
    
    // Cleanup on close
    return () => {
      if (scanIntervalRef.current) {
        cancelAnimationFrame(scanIntervalRef.current);
      }
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      // Clear html5-qrcode-scanner div from DOM
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const scannerDiv = document.getElementById('html5-qrcode-scanner');
        if (scannerDiv) {
          scannerDiv.innerHTML = '';
        }
      }
    };
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={[styles.closeButton, {top: safeAreaTop}]} onPress={onClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>

          <View style={styles.content}>
            {calvinImage && (
              <View style={styles.calvinContainer}>
                <Image
                  source={calvinImage}
                  style={styles.calvinImage}
                  resizeMode="contain"
                />
              </View>
            )}

            {Platform.OS === 'web' ? (
              <View style={styles.scannerContainer} testID="scanner-container">
                {scanError ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{scanError}</Text>
                    <Text style={styles.errorSubtext}>
                      Please allow camera access and try again
                    </Text>
                  </View>
                ) : (
                  <View style={styles.videoWrapper}>
                    <div 
                      id="html5-qrcode-scanner"
                      style={{ width: '100%', height: '100%' }}
                    />
                  </View>
            )}
              </View>
            ) : (
              <View style={styles.nativeScannerContainer}>
                {!permission ? (
                  <View style={styles.nativePlaceholder}>
                    <Text style={styles.scannerText}>Requesting camera permission...</Text>
                  </View>
                ) : !permission.granted ? (
                  <View style={styles.nativePlaceholder}>
                    <Text style={styles.scannerText}>Camera permission required</Text>
                    <Text style={styles.scannerSubtext}>
                      Please allow camera access to scan QR codes
                    </Text>
                    <TouchableOpacity
                      style={styles.permissionButton}
                      onPress={async () => {
                        const result = await requestPermission();
                        // Permission state will update automatically via useCameraPermissions hook
                      }}>
                      <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
                  </View>
                ) : permission.granted ? (
                  !cameraReady ? (
                    <View style={styles.nativePlaceholder}>
                      <Text style={styles.scannerText}>Starting camera...</Text>
                    </View>
                  ) : (
                    <View style={styles.cameraContainer}>
                      {cameraError ? (
                        <View style={styles.errorContainer}>
                          <Text style={styles.errorText}>{cameraError}</Text>
                        </View>
                      ) : (
                        <CameraView
                          key={`camera-${cameraKey}`}
                          ref={(ref) => {
                            console.log('[ScanModal] CameraView ref callback:', ref ? 'valid' : 'null');
                            cameraRef.current = ref;
                          }}
                          style={styles.camera}
                          facing="back"
                          onBarcodeScanned={(result: BarcodeScanningResult) => {
                            try {
                              console.log('[ScanModal] Barcode scanned:', result?.data);
                              if (result && result.data && typeof result.data === 'string') {
                                const qrData = result.data.trim();
                                // Prevent duplicate scans using ref (state is async and unreliable in callbacks)
                                if (lastScannedCodeRef.current === qrData) {
                                  console.log('[ScanModal] Duplicate scan ignored');
                                  return;
                                }
                                // Prevent processing while another scan is being processed
                                if (isProcessingRef.current) {
                                  console.log('[ScanModal] Already processing, ignoring');
                                  return;
                                }
                                // Mark as processing and update refs
                                isProcessingRef.current = true;
                                lastScannedCodeRef.current = qrData;
                                setLastScannedCode(qrData);
                                console.log('[ScanModal] Processing QR code:', qrData);
                                // Process immediately
                                processRewardQRCode(qrData);
                              }
                            } catch (error) {
                              console.error('[ScanModal] Barcode scan processing error:', error);
                              console.error('[ScanModal] Error stack:', error instanceof Error ? error.stack : 'No stack');
                              isProcessingRef.current = false;
                            }
                          }}
                          barcodeScannerSettings={{
                            barcodeTypes: ['qr'],
                          }}
                        />
                      )}
                      {cameraError && (
                        <View style={styles.errorOverlay}>
                          <Text style={styles.errorText}>{cameraError}</Text>
                          <TouchableOpacity
                            style={styles.permissionButton}
                            onPress={() => {
                              setCameraError(null);
                              setCameraKey(prev => prev + 1);
                              setCameraReady(false);
                              setTimeout(() => setCameraReady(true), 200);
                            }}>
                            <Text style={styles.permissionButtonText}>Retry</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )
                ) : (
                  <View style={styles.nativePlaceholder}>
                    <Text style={styles.scannerText}>Camera permission denied</Text>
                <Text style={styles.scannerSubtext}>
                      Please enable camera access in device settings
                </Text>
                  </View>
                )}
              </View>
            )}
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
    width: SCREEN_WIDTH - MODAL_MARGIN * 4, // Smaller width
    maxWidth: SCREEN_WIDTH * 0.95, // Max 95% of screen width
    height: SCREEN_HEIGHT - MODAL_MARGIN * 4, // Smaller height
    maxHeight: SCREEN_HEIGHT * 0.9, // Max 90% of screen height
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
  scannerContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoWrapper: {
    width: Math.min(SCREEN_WIDTH - 60, 400),
    height: Math.min(SCREEN_WIDTH - 60, 400),
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.neutral[100],
  },
  videoContainer: {
    width: '100%',
    height: '100%',
  },
  nativeScannerContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraContainer: {
    width: Math.min(SCREEN_WIDTH - 60, 400),
    height: Math.min(SCREEN_WIDTH - 60, 400),
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  nativePlaceholder: {
    width: Math.min(SCREEN_WIDTH - 60, 400),
    height: Math.min(SCREEN_WIDTH - 60, 400),
    backgroundColor: Colors.neutral[100],
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  scannerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  scannerSubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#DC3545',
    marginTop: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
  errorSubtext: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default ScanModal;
