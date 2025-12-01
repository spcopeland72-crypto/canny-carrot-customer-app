import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Linking,
} from 'react-native';
import {Video, ResizeMode} from 'expo-av';
import {Colors} from '../constants/Colors';
import BottomNavigation from './BottomNavigation';

interface AboutPageProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onBack?: () => void;
}

const AboutPage: React.FC<AboutPageProps> = ({
  currentScreen,
  onNavigate,
  onBack,
}) => {
  const videoRef = useRef<any>(null);

  const menuItems = [
    {
      id: 1,
      icon: '❓',
      title: 'Give us your app feedback',
      action: () => {
        // Open feedback form or navigate to feedback page
        Linking.openURL('mailto:feedback@cannycarrot.com?subject=App Feedback');
      },
      hasArrow: true,
    },
    {
      id: 2,
      icon: '▶️',
      title: 'Rate us on the Google Play Store',
      action: () => {
        Linking.openURL('https://play.google.com/store');
      },
      externalLink: true,
    },
    {
      id: 3,
      icon: '📘',
      title: 'Like us on Facebook',
      action: () => {
        Linking.openURL('https://www.facebook.com/CannyCarrotRewards');
      },
      externalLink: true,
    },
    {
      id: 4,
      icon: '🐦',
      title: 'Follow us on Twitter',
      action: () => {
        Linking.openURL('https://twitter.com/CannyCarrotRew');
      },
      externalLink: true,
    },
    {
      id: 5,
      icon: '📷',
      title: 'Follow us on Instagram',
      action: () => {
        Linking.openURL('https://www.instagram.com/cannycarrotrewards');
      },
      externalLink: true,
    },
    {
      id: 6,
      icon: '📺',
      title: 'Follow us on YouTube',
      action: () => {
        Linking.openURL('https://www.youtube.com/@cannycarrotrewards');
      },
      externalLink: true,
    },
    {
      id: 7,
      icon: '🌐',
      title: 'Visit our website',
      action: () => {
        Linking.openURL('https://www.cannycarrot.com');
      },
      externalLink: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      {/* Header with Title */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Video Header */}
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            style={styles.video}
            source={require('../../Images/canny-carrot-team.mp4')}
            useNativeControls={false}
            resizeMode={ResizeMode.STRETCH}
            isLooping
            shouldPlay
            isMuted
            videoStyle={{
              width: '100%',
              height: '100%',
            }}
          />
        </View>

        {/* Menu Items */}
        <View style={styles.menuList}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === 0 && styles.menuItemFirst,
                index === menuItems.length - 1 && styles.menuItemLast,
              ]}
              onPress={item.action}
              activeOpacity={0.7}>
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <Text style={styles.iconText}>{item.icon}</Text>
                </View>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
              </View>
              <View style={styles.arrowContainer}>
                {item.externalLink ? (
                  <Text style={styles.externalLinkIcon}>↗</Text>
                ) : (
                  <Text style={styles.arrowIcon}>›</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation
        currentScreen={currentScreen}
        onNavigate={onNavigate}
        onScanPress={() => {}}
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
  videoContainer: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.neutral[900],
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: 200,
  },
  menuList: {
    backgroundColor: Colors.background,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    minHeight: 72,
  },
  menuItemFirst: {
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 24,
  },
  menuItemTitle: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '400',
    flex: 1,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    fontSize: 32,
    color: Colors.text.secondary,
    fontWeight: '300',
  },
  externalLinkIcon: {
    fontSize: 24,
    color: Colors.primary,
    fontWeight: 'bold',
  },
});

export default AboutPage;
