import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {Colors} from '../constants/Colors';
import BottomNavigation from './BottomNavigation';
import {getCustomerRecord} from '../services/customerRecord';

interface EventLogPageProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onBack?: () => void;
  onScanPress?: () => void;
}

const EventLogPage: React.FC<EventLogPageProps> = ({
  currentScreen,
  onNavigate,
  onBack,
  onScanPress,
}) => {
  const [log, setLog] = useState<{ timestamp: string; action: string; data: Record<string, unknown> }[]>([]);

  useEffect(() => {
    let mounted = true;
    getCustomerRecord().then((record) => {
      if (mounted && Array.isArray(record.transactionLog)) {
        setLog(record.transactionLog);
      }
    });
    return () => { mounted = false; };
  }, []);

  const handleBack = () => {
    if (onBack) onBack();
    else onNavigate('More');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Log</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        <View style={styles.menuList}>
          {log.length === 0 ? (
            <View style={styles.menuItem}>
              <Text style={styles.menuItemTitle}>No events yet.</Text>
            </View>
          ) : (
            log.map((entry, index) => (
              <View key={index} style={styles.menuItem}>
                <Text style={styles.menuItemTitle}>{JSON.stringify(entry)}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

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
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 28,
    color: Colors.background,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  menuList: {
    backgroundColor: Colors.background,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    minHeight: 72,
  },
  menuItemTitle: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '400',
    flex: 1,
  },
});

export default EventLogPage;
