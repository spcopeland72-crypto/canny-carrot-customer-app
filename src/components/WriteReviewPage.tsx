import React from 'react';
import {View, Text, StyleSheet, Dimensions, Image, TouchableOpacity} from 'react-native';
import {Colors} from '../constants/Colors';
import PageTemplate from './PageTemplate';

interface WriteReviewPageProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onBack?: () => void;
  onScanPress?: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width || 375;
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

// Load review platform images - using placeholders if not found
// Temporarily disabled to prevent blank screen - images will be loaded in component
let googleReviewsImage = null;
let trustpilotImage = null;
let tripadvisorImage = null;
let yelpImage = null;

// Image loading will be handled in component state to prevent module-level crashes

const reviewPlatforms = [
  {
    id: 1,
    name: 'Google Reviews',
    image: googleReviewsImage,
    color: Colors.primary,
  },
  {
    id: 2,
    name: 'Trustpilot',
    image: trustpilotImage,
    color: Colors.secondary,
  },
  {
    id: 3,
    name: 'Tripadvisor',
    image: tripadvisorImage,
    color: Colors.primary,
  },
  {
    id: 4,
    name: 'Yelp',
    image: yelpImage,
    color: Colors.secondary,
  },
];

const WriteReviewPage: React.FC<WriteReviewPageProps> = ({
  currentScreen,
  onNavigate,
  onBack,
  onScanPress,
}) => {
  // Load images in component to prevent module-level crashes
  const [images, setImages] = React.useState({
    google: null as any,
    trustpilot: null as any,
    tripadvisor: null as any,
    yelp: null as any,
  });

  React.useEffect(() => {
    const loadImages = () => {
      try {
        const google = require('../../Images/google-reviews.png');
        setImages(prev => ({...prev, google}));
      } catch (e) {
        // Image not found, will use placeholder
      }
      try {
        const trustpilot = require('../../Images/truspilot.png');
        setImages(prev => ({...prev, trustpilot}));
      } catch (e) {
        try {
          const trustpilot = require('../../Images/trustpilot.png');
          setImages(prev => ({...prev, trustpilot}));
        } catch (e2) {
          // Image not found, will use placeholder
        }
      }
      try {
        const tripadvisor = require('../../Images/tripadvisor.png');
        setImages(prev => ({...prev, tripadvisor}));
      } catch (e) {
        // Image not found, will use placeholder
      }
      try {
        const yelp = require('../../Images/yelp.png');
        setImages(prev => ({...prev, yelp}));
      } catch (e) {
        // Image not found, will use placeholder
      }
    };
    loadImages();
  }, []);

  const reviewPlatformsWithImages = [
    {
      ...reviewPlatforms[0],
      image: images.google,
    },
    {
      ...reviewPlatforms[1],
      image: images.trustpilot,
    },
    {
      ...reviewPlatforms[2],
      image: images.tripadvisor,
    },
    {
      ...reviewPlatforms[3],
      image: images.yelp,
    },
  ];

  return (
    <PageTemplate
      title="Write a Review for More Rewards"
      currentScreen={currentScreen}
      onNavigate={onNavigate}
      onBack={onBack}
      onScanPress={onScanPress}>
      <View style={styles.content}>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.squareCard, {backgroundColor: reviewPlatformsWithImages[0].color}]}>
            <View style={styles.imageContainer}>
              {reviewPlatformsWithImages[0].image ? (
                <Image
                  source={reviewPlatformsWithImages[0].image}
                  style={styles.platformImage}
                  resizeMode="contain"
                  onError={() => {
                    console.log('Google Reviews image failed to load');
                  }}
                />
              ) : (
                <View style={styles.placeholderContainer}>
                  <Text style={styles.placeholderText}>G</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardText}>{reviewPlatformsWithImages[0].name}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.squareCard, {backgroundColor: reviewPlatformsWithImages[1].color}]}>
            <View style={styles.imageContainer}>
              {reviewPlatformsWithImages[1].image ? (
                <Image
                  source={reviewPlatformsWithImages[1].image}
                  style={styles.platformImage}
                  resizeMode="contain"
                  onError={() => {
                    console.log('Trustpilot image failed to load');
                  }}
                />
              ) : (
                <View style={styles.placeholderContainer}>
                  <Text style={styles.placeholderText}>T</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardText}>{reviewPlatformsWithImages[1].name}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.squareCard, {backgroundColor: reviewPlatformsWithImages[2].color}]}>
            <View style={styles.imageContainer}>
              {reviewPlatformsWithImages[2].image ? (
                <Image
                  source={reviewPlatformsWithImages[2].image}
                  style={styles.platformImage}
                  resizeMode="contain"
                  onError={() => {
                    console.log('Tripadvisor image failed to load');
                  }}
                />
              ) : (
                <View style={styles.placeholderContainer}>
                  <Text style={styles.placeholderText}>T</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardText}>{reviewPlatformsWithImages[2].name}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.squareCard, {backgroundColor: reviewPlatformsWithImages[3].color}]}>
            <View style={styles.imageContainer}>
              {reviewPlatformsWithImages[3].image ? (
                <Image
                  source={reviewPlatformsWithImages[3].image}
                  style={styles.platformImage}
                  resizeMode="contain"
                  onError={() => {
                    console.log('Yelp image failed to load');
                  }}
                />
              ) : (
                <View style={styles.placeholderContainer}>
                  <Text style={styles.placeholderText}>Y</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardText}>{reviewPlatformsWithImages[3].name}</Text>
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
    justifyContent: 'space-between',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  platformImage: {
    width: '88%', // Increased by 10% from 80%
    height: '88%', // Increased by 10% from 80%
    maxHeight: '100%',
  },
  placeholderContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  cardText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.background,
    textAlign: 'center',
    width: '100%',
  },
});

export default WriteReviewPage;

