import React from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import {Colors} from '../constants/Colors';
import PageTemplate from './PageTemplate';

interface OrdersPageProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width || 375;
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

const OrdersPage: React.FC<OrdersPageProps> = ({
  currentScreen,
  onNavigate,
}) => {
  return (
    <PageTemplate
      title="Orders & Receipts"
      currentScreen={currentScreen}
      onNavigate={onNavigate}>
      <View style={styles.content}>
        {/* 6 Elements in 3 rows of 2 */}
        {[1, 2, 3].map(row => (
          <View key={row} style={styles.row}>
            {[1, 2].map(col => (
              <View
                key={col}
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
                ]}>
                <Text style={styles.cardText}>
                  Item {row * 2 - 1 + col - 1}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </PageTemplate>
  );
};

const styles = StyleSheet.create({
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
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
    textAlign: 'center',
  },
});

export default OrdersPage;


