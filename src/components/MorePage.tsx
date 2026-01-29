import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {Colors} from '../constants/Colors';
import PageTemplate from './PageTemplate';

interface MorePageProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onBack?: () => void;
  onScanPress?: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width || 375;
const BUTTON_WIDTH = (SCREEN_WIDTH - 48) / 2; // 16px padding on each side + 16px gap
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2; // Same as buttons

const MorePage: React.FC<MorePageProps> = ({
  currentScreen,
  onNavigate,
  onBack,
  onScanPress,
}) => {
  return (
    <PageTemplate
      title="My Accounts"
      currentScreen={currentScreen}
      onNavigate={onNavigate}
      showBanner={false}
      onScanPress={onScanPress}
      onBack={onBack}>
      <View style={styles.content}>
        {/* Top Two Large Buttons */}
        <View style={styles.topButtonsRow}>
          <TouchableOpacity
            style={[styles.largeButton, styles.accountButton, {marginRight: 8}]}
            onPress={() => onNavigate('Account')}>
            <View style={styles.buttonIconContainer}>
              <View style={styles.phoneIcon}>
                <View style={styles.phoneScreen}>
                  <View style={styles.personIcon} />
                </View>
              </View>
            </View>
            <Text style={styles.buttonText}>Account →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.largeButton, styles.ordersButton, {marginLeft: 8}]}
            onPress={() => onNavigate('Orders')}>
            <View style={styles.buttonIconContainer}>
              <View style={styles.bagIcon}>
                <Text style={styles.bagText}>CC</Text>
                <View style={styles.bagItem} />
              </View>
            </View>
            <Text style={styles.buttonText}>My Rewards →</Text>
          </TouchableOpacity>
        </View>

        {/* Two Square Cards */}
        <View style={styles.cardsRow}>
          <TouchableOpacity
            style={[styles.squareCard, styles.findShopCard, {marginRight: 8}]}
            onPress={() => onNavigate('FindShop')}>
            <View style={styles.cardIconContainer}>
              <View style={styles.mapIcon}>
                <View style={styles.mapGrid}>
                  <View style={styles.mapRow}>
                    <View style={styles.mapSquare} />
                    <View style={styles.mapSquare} />
                    <View style={styles.mapSquare} />
                  </View>
                  <View style={styles.mapRow}>
                    <View style={styles.mapSquare} />
                    <View style={styles.mapSquare} />
                    <View style={styles.mapSquare} />
                  </View>
                  <View style={styles.mapRow}>
                    <View style={styles.mapSquare} />
                    <View style={styles.mapSquare} />
                    <View style={styles.mapSquare} />
                  </View>
                </View>
                <View style={styles.locationPin} />
              </View>
            </View>
            <Text style={styles.cardText}>Find a shop →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.squareCard, styles.menuCard, {marginLeft: 8}]}
            onPress={() => onNavigate('Menu')}>
            <View style={styles.cardIconContainer}>
              <View style={styles.coffeeIcon}>
                <View style={styles.coffeeCup}>
                  <Text style={styles.coffeeLogo}>CC</Text>
                </View>
                <View style={styles.burgerIcon}>
                  <View style={styles.burgerTop} />
                  <View style={styles.burgerMiddle} />
                  <View style={styles.burgerBottom} />
                </View>
              </View>
            </View>
            <Text style={styles.cardText}>Our Community →</Text>
          </TouchableOpacity>
        </View>

        {/* Help and Support Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>HELP AND SUPPORT</Text>

          <TouchableOpacity
            style={[styles.helpItem, styles.carrieItem]}
            onPress={() => onNavigate('Chat')}>
            <View style={[styles.helpIconContainer, styles.carrieIconContainer]}>
              <Text style={styles.carrieEmoji}>🥕</Text>
            </View>
            <View style={styles.carrieTextContainer}>
              <Text style={styles.carrieTitle}>Ask Carrie Carrot</Text>
              <Text style={styles.carrieSubtitle}>AI Support • Available 24/7</Text>
            </View>
            <Text style={styles.helpArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.helpItem}
            onPress={() => onNavigate('ContactCustomerCare')}>
            <View style={styles.helpIconContainer}>
              <Text style={styles.helpIcon}>✉</Text>
            </View>
            <Text style={styles.helpText}>Contact Customer Care</Text>
            <Text style={styles.helpArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.helpItem}
            onPress={() => onNavigate('EventLog')}>
            <View style={styles.helpIconContainer}>
              <Text style={styles.helpIcon}>📋</Text>
            </View>
            <Text style={styles.helpText}>Event Log</Text>
            <Text style={styles.helpArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.helpItem}
            onPress={() => onNavigate('Welcome')}>
            <View style={styles.helpIconContainer}>
              <Text style={styles.helpIcon}>?</Text>
            </View>
            <Text style={styles.helpText}>Welcome to the Canny Carrot App</Text>
            <Text style={styles.helpArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.helpItem}
            onPress={() => onNavigate('FAQs')}>
            <View style={styles.helpIconContainer}>
              <Text style={styles.helpIcon}>?</Text>
            </View>
            <Text style={styles.helpText}>FAQs</Text>
            <Text style={styles.helpArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.helpItem}
            onPress={() => onNavigate('About')}>
            <View style={styles.helpIconContainer}>
              <Text style={styles.helpIcon}>i</Text>
            </View>
            <Text style={styles.helpText}>About</Text>
            <Text style={styles.helpArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.helpItem}
            onPress={() => onNavigate('TermsConditions')}>
            <View style={styles.helpIconContainer}>
              <Text style={styles.helpIcon}>📄</Text>
            </View>
            <Text style={styles.helpText}>Terms & Conditions</Text>
            <Text style={styles.helpArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.helpItem}
            onPress={() => onNavigate('PrivacyPolicy')}>
            <View style={styles.helpIconContainer}>
              <Text style={styles.helpIcon}>🛡</Text>
            </View>
            <Text style={styles.helpText}>Privacy Policy</Text>
            <Text style={styles.helpArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
    </PageTemplate>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  topButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  largeButton: {
    width: BUTTON_WIDTH,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  accountButton: {
    backgroundColor: '#E8D5FF', // Light purple
  },
  ordersButton: {
    backgroundColor: '#B3E5FC', // Light blue
  },
  buttonIconContainer: {
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneIcon: {
    width: 50,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  phoneScreen: {
    width: 40,
    height: 60,
    backgroundColor: Colors.background,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  personIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
  },
  bagIcon: {
    width: 60,
    height: 70,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bagText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 8,
  },
  bagItem: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.secondary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  squareCard: {
    width: CARD_WIDTH,
    aspectRatio: 1,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  findShopCard: {
    backgroundColor: '#B2DFDB', // Light teal/green
  },
  menuCard: {
    backgroundColor: '#FFE0B2', // Light orange
  },
  cardIconContainer: {
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapIcon: {
    width: 80,
    height: 80,
    position: 'relative',
  },
  mapGrid: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 4,
    padding: 4,
  },
  mapRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  mapSquare: {
    flex: 1,
    height: 20,
    marginRight: 2,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  locationPin: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.secondary,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  coffeeIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coffeeCup: {
    width: 40,
    height: 50,
    backgroundColor: Colors.text.primary,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    marginRight: 8,
  },
  coffeeLogo: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  burgerIcon: {
    width: 30,
    height: 30,
  },
  burgerTop: {
    width: 30,
    height: 8,
    backgroundColor: Colors.secondary,
    borderRadius: 2,
    marginBottom: 2,
  },
  burgerMiddle: {
    width: 30,
    height: 8,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    marginBottom: 2,
  },
  burgerBottom: {
    width: 30,
    height: 8,
    backgroundColor: Colors.secondary,
    borderRadius: 2,
  },
  cardText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  helpSection: {
    marginTop: 8,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  carrieItem: {
    backgroundColor: Colors.secondary + '15',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 12,
    marginBottom: 8,
    borderBottomWidth: 0,
  },
  helpIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  carrieIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.secondary + '30',
  },
  carrieEmoji: {
    fontSize: 28,
  },
  carrieTextContainer: {
    flex: 1,
  },
  carrieTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 2,
  },
  carrieSubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  helpIcon: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: '600',
  },
  helpText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
  },
  helpArrow: {
    fontSize: 18,
    color: Colors.text.secondary,
    marginLeft: 8,
  },
});

export default MorePage;

