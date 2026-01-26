import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import {Colors} from '../constants/Colors';

const ROW_PATTERN = [3, 1, 2];

function chunkIntoRows<T>(arr: T[]): T[][] {
  const rows: T[][] = [];
  let i = 0;
  let p = 0;
  while (i < arr.length) {
    const n = ROW_PATTERN[p % ROW_PATTERN.length];
    const take = Math.min(n, arr.length - i);
    if (take > 0) rows.push(arr.slice(i, i + take));
    i += take;
    p += 1;
  }
  return rows;
}

// Load Canny Carrot logo for stamps
let ccLogoImage: any = null;
try {
  ccLogoImage = require('../../assets/cc-icon-no-background.png');
} catch (e) {
  try {
    ccLogoImage = require('../../assets/logo.png');
  } catch (e2) {
    ccLogoImage = null;
  }
}

interface RewardQRCodeModalProps {
  visible: boolean;
  rewardName: string;
  qrValue: string;
  count: number; // Points earned
  total: number; // Points needed
  businessName?: string;
  /** Product/action labels per circle (from QR data only). Length = total. */
  circleLabels?: string[];
  onClose: () => void;
  onNavigate?: (screen: string) => void;
}

const RewardQRCodeModal: React.FC<RewardQRCodeModalProps> = ({
  visible,
  rewardName,
  count,
  total,
  businessName,
  circleLabels,
  onClose,
  onNavigate,
}) => {
  const padded =
    total > 0 && circleLabels
      ? [...circleLabels.slice(0, total), ...Array(Math.max(0, total - circleLabels.length)).fill('Remaining')].slice(0, total)
      : circleLabels;
  const circles = Array.from({length: total}, (_, index) => ({
    id: index,
    hasStamp: index < count,
    label: padded && padded[index] ? String(padded[index]) : undefined,
  }));

  const rows = chunkIntoRows(circles);

  const handleBusinessPage = () => {
    onClose();
    if (onNavigate) onNavigate('Menu');
  };

  const handleMessages = () => {
    onClose();
    if (onNavigate) onNavigate('Chat');
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{rewardName}</Text>
          
          {/* Rows of 3, 1, 2, 3, 1, 2…; rows of 1 or 2 centered */}
          <View style={styles.circlesContainer}>
            {rows.map((row, ri) => (
              <View
                key={ri}
                style={[
                  styles.circleRow,
                  row.length < 3 && styles.circleRowCentered,
                ]}>
                {row.map((circle) => (
                  <View key={circle.id} style={styles.circleWrapper}>
                    {circle.label != null ? (
                      <Text style={styles.circleLabel} numberOfLines={2}>
                        {circle.label}
                      </Text>
                    ) : null}
                    <View style={styles.circle}>
                      {circle.hasStamp && ccLogoImage ? (
                        <Image
                          source={ccLogoImage}
                          style={styles.stampImage}
                          resizeMode="contain"
                        />
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>

          {/* Links at bottom */}
          <View style={styles.linksContainer}>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={handleBusinessPage}>
              <Text style={styles.linkText}>View {businessName || 'Business'} Page</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={handleMessages}>
              <Text style={styles.linkText}>View Messages</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
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
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  circlesContainer: {
    marginBottom: 32,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  circleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  circleRowCentered: {
    justifyContent: 'center',
  },
  circleWrapper: {
    margin: 4,
    alignItems: 'center',
    minWidth: 56,
  },
  circleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 4,
    textAlign: 'center',
    maxWidth: 70,
  },
  circle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: Colors.neutral[300],
    backgroundColor: Colors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  stampImage: {
    width: 46,
    height: 46,
  },
  linksContainer: {
    width: '100%',
    marginBottom: 16,
  },
  linkButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  linkText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: Colors.neutral[200],
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
});

export default RewardQRCodeModal;
