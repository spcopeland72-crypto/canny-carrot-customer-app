import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import {Colors} from '../constants/Colors';
import BottomNavigation from './BottomNavigation';
import PreferenceModal from './PreferenceModal';

interface CommunicationPreferencesPageProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onBack?: () => void;
  onScanPress?: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width || 375;
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

const preferenceCards = [
  {id: 1, title: 'Email Preferences'},
  {id: 2, title: 'Mobile Preferences'},
  {id: 3, title: 'Facebook Preferences'},
  {id: 4, title: 'Instagram Preferences'},
  {id: 5, title: 'TikTok Preferences'},
  {id: 6, title: 'X (Twitter) Preferences'},
];

const CommunicationPreferencesPage: React.FC<
  CommunicationPreferencesPageProps
> = ({currentScreen, onNavigate, onBack, onScanPress}) => {
  const [selectedModal, setSelectedModal] = useState<string | null>(null);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      onNavigate('Account');
    }
  };

  // Generate random banner color
  const getRandomBannerColor = (): string => {
    const colors = [
      '#FF6B6B', // Red
      '#4ECDC4', // Teal
      '#45B7D1', // Blue
      '#96CEB4', // Green
      '#FFEAA7', // Yellow
      '#DDA0DD', // Plum
      '#98D8C8', // Mint
      '#F7DC6F', // Gold
      '#BB8FCE', // Purple
      '#85C1E2', // Sky Blue
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const headerColor = getRandomBannerColor();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={headerColor} />

      {/* Header Banner */}
      <View style={[styles.headerBanner, {backgroundColor: headerColor}]}>
        {onBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Communication preferences</Text>
        {onBack && <View style={styles.backButtonSpacer} />}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {[0, 1, 2].map(rowIndex => (
            <View key={rowIndex} style={styles.row}>
              {preferenceCards.slice(rowIndex * 2, rowIndex * 2 + 2).map((card, colIndex) => {
                const col = colIndex + 1;
                const row = rowIndex + 1;
                return (
                  <TouchableOpacity
                    key={card.id}
                    style={[
                      styles.squareCard,
                      {
                        backgroundColor:
                          (row + col) % 2 === 0
                            ? Colors.primary
                            : Colors.secondary,
                        marginRight: col === 1 ? 8 : 0,
                        marginLeft: col === 2 ? 8 : 0,
                      },
                    ]}
                    onPress={() => setSelectedModal(card.title)}>
                    <Text style={styles.cardText}>{card.title}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Preference Modals */}
      {preferenceCards.map(card => (
        <PreferenceModal
          key={card.id}
          visible={selectedModal === card.title}
          onClose={() => setSelectedModal(null)}
          title={card.title}
        />
      ))}

      {/* Bottom Navigation */}
      <BottomNavigation
        currentScreen={currentScreen}
        onNavigate={onNavigate}
        onScanPress={onScanPress}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBanner: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  backArrow: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.background,
  },
  backButtonSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.background,
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  squareCard: {
    width: CARD_WIDTH,
    aspectRatio: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.background,
    textAlign: 'center',
  },
});

export default CommunicationPreferencesPage;

