/**
 * Camera Module Type Definitions
 */

export type BarcodeType =
  | 'qr'
  | 'pdf417'
  | 'aztec'
  | 'ean13'
  | 'ean8'
  | 'code39'
  | 'code93'
  | 'code128'
  | 'datamatrix'
  | 'itf14'
  | 'upc_e';

export interface BarcodeScanResult {
  data: string;
  type: string;
  bounds?: {
    origin: {x: number; y: number};
    size: {width: number; height: number};
  };
  cornerPoints?: Array<{x: number; y: number}>;
}

export interface CameraPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined';
}

export interface CameraModuleProps {
  onBarcodeScanned: (data: string, type: string) => void;
  onClose: () => void;
  onError?: (error: Error) => void;
}

export interface ScanModalProps {
  visible: boolean;
  onClose: () => void;
  onScanComplete?: (data: string, type: string) => void;
}


