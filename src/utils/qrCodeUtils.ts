/**
 * QR Code Utility Functions
 * Helper functions for QR code processing and validation
 */

export interface QRCodeData {
  data: string;
  type: string;
  timestamp: Date;
}

export interface QRCodeValidationResult {
  isValid: boolean;
  message?: string;
  parsedData?: any;
}

/**
 * Parse and validate QR code data
 * @param data - Raw QR code data string
 * @param type - Barcode type
 * @returns Validation result with parsed data
 */
export const validateQRCode = (
  data: string,
  type: string
): QRCodeValidationResult => {
  if (!data || data.trim().length === 0) {
    return {
      isValid: false,
      message: 'QR code data is empty',
    };
  }

  // Check if it's a URL
  if (isValidURL(data)) {
    return {
      isValid: true,
      message: 'Valid URL QR code',
      parsedData: {type: 'url', url: data},
    };
  }

  // Check if it's JSON
  try {
    const jsonData = JSON.parse(data);
    return {
      isValid: true,
      message: 'Valid JSON QR code',
      parsedData: {type: 'json', data: jsonData},
    };
  } catch (e) {
    // Not JSON, continue
  }

  // Check if it's a reward code (alphanumeric, 8-16 characters)
  if (/^[A-Z0-9]{8,16}$/i.test(data)) {
    return {
      isValid: true,
      message: 'Valid reward code',
      parsedData: {type: 'reward', code: data},
    };
  }

  // Default: return as plain text
  return {
    isValid: true,
    message: 'Plain text QR code',
    parsedData: {type: 'text', text: data},
  };
};

/**
 * Check if a string is a valid URL
 * @param string - String to validate
 * @returns True if valid URL
 */
const isValidURL = (string: string): boolean => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

/**
 * Format QR code data for display
 * @param data - Raw QR code data
 * @param maxLength - Maximum length to display
 * @returns Formatted string
 */
export const formatQRCodeData = (data: string, maxLength: number = 50): string => {
  if (data.length <= maxLength) {
    return data;
  }
  return data.substring(0, maxLength) + '...';
};

/**
 * Log QR code scan event
 * @param qrCodeData - QR code data object
 */
export const logQRScan = (qrCodeData: QRCodeData): void => {
  console.log('[QR Scan]', {
    type: qrCodeData.type,
    data: formatQRCodeData(qrCodeData.data, 100),
    timestamp: qrCodeData.timestamp.toISOString(),
  });
};

/**
 * Store QR code scan history
 * @param qrCodeData - QR code data object
 */
export const storeQRScanHistory = async (
  qrCodeData: QRCodeData
): Promise<void> => {
  try {
    // This would integrate with AsyncStorage or a backend API
    // For now, just log it
    logQRScan(qrCodeData);
    console.log('[QR History] Scan stored successfully');
  } catch (error) {
    console.error('[QR History] Failed to store scan:', error);
  }
};

/**
 * Process scanned QR code based on type
 * @param data - QR code data
 * @param type - Barcode type
 * @returns Processing result
 */
export const processQRCode = (
  data: string,
  type: string
): {
  action: 'navigate' | 'reward' | 'info' | 'unknown';
  payload: any;
} => {
  const validation = validateQRCode(data, type);

  if (!validation.isValid || !validation.parsedData) {
    return {action: 'unknown', payload: {data, type}};
  }

  switch (validation.parsedData.type) {
    case 'url':
      return {
        action: 'navigate',
        payload: {url: validation.parsedData.url},
      };
    case 'reward':
      return {
        action: 'reward',
        payload: {code: validation.parsedData.code},
      };
    case 'json':
      // Check if JSON contains specific action
      if (validation.parsedData.data.action) {
        return {
          action: validation.parsedData.data.action,
          payload: validation.parsedData.data,
        };
      }
      return {action: 'info', payload: validation.parsedData.data};
    default:
      return {
        action: 'info',
        payload: {text: validation.parsedData.text},
      };
  }
};


