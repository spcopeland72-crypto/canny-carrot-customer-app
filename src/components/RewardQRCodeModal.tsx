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

const COLS = 3;

function chunkIntoGrid<T>(arr: T[]): (T | null)[][] {
  const rows: (T | null)[][] = [];
  for (let i = 0; i < arr.length; i += COLS) {
    const row: (T | null)[] = [...arr.slice(i, i + COLS)];
    while (row.length < COLS) row.push(null as T | null);
    rows.push(row);
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
  businessId?: string;
  /** Fixed headings per circle (products then actions). Length = total. */
  circleLabels?: string[];
  /** Which circle indices have a stamp (by position in list). If set, use this; else fill first `count` circles. */
  stampedIndices?: number[];
  onClose: () => void;
  onNavigate?: (screen: string) => void;
  /** When set, "View Business Page" navigates to BusinessPage with this business instead of Menu. */
  onViewBusinessPage?: (businessName: string, businessId?: string) => void;
}

const RewardQRCodeModal: React.FC<RewardQRCodeModalProps> = ({
  visible,
  rewardName,
  count,
  total,
  businessName,
  businessId,
  circleLabels,
  stampedIndices,
  onClose,
  onNavigate,
  onViewBusinessPage,
}) => {
  const stampedSet = stampedIndices ? new Set(stampedIndices) : null;
  const circles = Array.from({length: total}, (_, index) => ({
    id: index,
    hasStamp: stampedSet ? stampedSet.has(index) : index < count,
    label: circleLabels?.[index] ?? undefined,
  }));

  const grid = chunkIntoGrid(circles);

  const handleBusinessPage = () => {
    onClose();
    if (onViewBusinessPage && (businessName || businessId)) {
      onViewBusinessPage(businessName || 'Business', businessId);
    } else if (onNavigate) {
      onNavigate('Menu');
    }
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
          
          {/* 3×3 grid: top-left to bottom-right, row by row. Fixed cell size so circles align. */}
          <View style={styles.gridContainer}>
            {grid.map((row, ri) => (
              <View key={ri} style={styles.gridRow}>
                {row.map((cell, ci) => {
                  if (!cell) {
                    return (
                      <View key={`empty-${ri}-${ci}`} style={styles.gridCell}>
                        <View style={styles.labelSlot} />
                        <View style={[styles.circle, styles.circlePlaceholder]} />
                      </View>
                    );
                  }
                  return (
                    <View key={cell.id} style={styles.gridCell}>
                      <View style={styles.labelSlot}>
                        <Text style={styles.circleLabel} numberOfLines={2}>
                          {cell.label ?? ''}
                        </Text>
                      </View>
                      <View style={styles.circle}>
                        {cell.hasStamp && ccLogoImage ? (
                          <Image
                            source={ccLogoImage}
                            style={styles.stampImage}
                            resizeMode="contain"
                          />
                        ) : null}
                      </View>
                    </View>
                  );
                })}
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
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  gridContainer: {
    width: '100%',
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  gridCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginHorizontal: 4,
  },
  labelSlot: {
    height: 52,
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 6,
  },
  circleLabel: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  circle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: Colors.neutral[300],
    backgroundColor: Colors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  stampImage: {
    width: 92,
    height: 92,
  },
  circlePlaceholder: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
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
