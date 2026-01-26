import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import {Colors} from '../constants/Colors';
import PageTemplate from './PageTemplate';
import {discoveryApi, type Business, type Reward} from '../services/api';
import {locationService, type Coordinates} from '../services/location';
import {addOrUpdateBusiness} from '../utils/businessStorage';

interface FindMoreRewardsPageProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onBack?: () => void;
  onScanPress?: () => void;
}

interface BusinessWithDistance extends Business {
  distance?: number;
  distanceFormatted?: string;
}

const SCREEN_WIDTH = Dimensions.get('window').width || 375;

const FindMoreRewardsPage: React.FC<FindMoreRewardsPageProps> = ({
  currentScreen,
  onNavigate,
  onBack,
  onScanPress,
}) => {
  const [businesses, setBusinesses] = useState<BusinessWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [businessRewards, setBusinessRewards] = useState<Reward[]>([]);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [mapView, setMapView] = useState<'map' | 'list'>('list');
  const mapRef = useRef<any>(null);

  // Categories for filtering
  const categories = [
    'All',
    'Restaurant',
    'Cafe',
    'Retail',
    'Beauty',
    'Fitness',
    'Entertainment',
    'Other',
  ];

  // Request location permission and get user location
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        const hasPermission = await locationService.requestPermission();
        if (hasPermission) {
          const location = await locationService.getCurrentLocation();
          if (location) {
            setUserLocation(location.coords);
          }
        }
      } catch (err) {
        console.error('Location initialization error:', err);
      }
    };

    initializeLocation();
  }, []);

  // Load nearby businesses
  useEffect(() => {
    loadBusinesses();
  }, [userLocation, selectedCategory]);

  const loadBusinesses = async () => {
    setLoading(true);
    setError(null);

    try {
      let result;
      
      if (userLocation) {
        // Find nearby businesses
        result = await discoveryApi.findNearby(
          {
            lat: userLocation.latitude,
            lng: userLocation.longitude,
          },
          selectedCategory && selectedCategory !== 'All' ? selectedCategory : undefined
        );
      } else {
        // Get featured businesses if no location
        result = await discoveryApi.getFeatured();
      }

      if (result.success && result.data) {
        let businessesList = result.data;

        // Calculate distances if user location is available
        if (userLocation) {
          businessesList = businessesList.map((business) => {
            if (business.address?.latitude && business.address?.longitude) {
              const distance = locationService.calculateDistance(
                userLocation,
                {
                  latitude: business.address.latitude,
                  longitude: business.address.longitude,
                }
              );
              return {
                ...business,
                distance,
                distanceFormatted: locationService.formatDistance(distance),
              };
            }
            return business;
          });

          // Sort by distance
          businessesList.sort((a, b) => {
            const distA = (a as BusinessWithDistance).distance || Infinity;
            const distB = (b as BusinessWithDistance).distance || Infinity;
            return distA - distB;
          });
        }

        setBusinesses(businessesList);

        // Cache businesses
        businessesList.forEach((business) => {
          addOrUpdateBusiness({
            id: business.id,
            name: business.name,
            address: business.address?.line1 || '',
            phone: business.phone,
            email: business.email,
            website: business.website,
            socialMedia: business.socialMedia,
            createdAt: business.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        });
      } else {
        setError(result.error || 'Failed to load businesses');
      }
    } catch (err) {
      console.error('Error loading businesses:', err);
      setError('Failed to load businesses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Search businesses
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      loadBusinesses();
      return;
    }

    setLoading(true);
    try {
      const result = await discoveryApi.search(query);
      if (result.success && result.data) {
        setBusinesses(result.data);
      } else {
        setError(result.error || 'Search failed');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load rewards for a business
  const loadBusinessRewards = async (businessId: string) => {
    setLoadingRewards(true);
    try {
      const result = await discoveryApi.getBusinessDetails(businessId);
      if (result.success && result.data?.rewards) {
        setBusinessRewards(result.data.rewards);
      }
    } catch (err) {
      console.error('Error loading rewards:', err);
    } finally {
      setLoadingRewards(false);
    }
  };

  // Handle business selection
  const handleBusinessSelect = async (business: Business) => {
    setSelectedBusiness(business);
    await loadBusinessRewards(business.id);
  };

  // Handle get directions
  const handleGetDirections = (business: Business) => {
    if (!business.address?.latitude || !business.address?.longitude) {
      Alert.alert('Error', 'Business location not available');
      return;
    }

    const url = Platform.select({
      ios: `maps://maps.apple.com/?daddr=${business.address.latitude},${business.address.longitude}`,
      android: `google.navigation:q=${business.address.latitude},${business.address.longitude}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${business.address.latitude},${business.address.longitude}`,
    });

    Linking.openURL(url).catch((err) => {
      console.error('Error opening maps:', err);
      Alert.alert('Error', 'Could not open maps application');
    });
  };

  // Render map view (placeholder for Google Maps integration)
  const renderMapView = () => {
    return (
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapText}>Map View</Text>
          <Text style={styles.mapSubtext}>
            {userLocation
              ? 'Interactive map with business markers'
              : 'Enable location to see map'}
          </Text>
          {userLocation && (
            <Text style={styles.mapCoordinates}>
              Your location: {userLocation.latitude.toFixed(4)},{' '}
              {userLocation.longitude.toFixed(4)}
            </Text>
          )}
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => {
              // Navigate to SearchPage with map view
              onNavigate('Search');
            }}>
            <Text style={styles.mapButtonText}>Open Full Map</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render business list
  const renderBusinessList = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading businesses...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadBusinesses}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (businesses.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No businesses found</Text>
          <Text style={styles.emptySubtext}>
            Try adjusting your search or filters
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.businessList} showsVerticalScrollIndicator={false}>
        {businesses.map((business) => (
          <TouchableOpacity
            key={business.id}
            style={styles.businessCard}
            onPress={() => handleBusinessSelect(business)}>
            <View style={styles.businessCardContent}>
              {business.logo && (
                <Image
                  source={{uri: business.logo}}
                  style={styles.businessLogo}
                  resizeMode="cover"
                />
              )}
              <View style={styles.businessInfo}>
                <Text style={styles.businessName}>{business.name}</Text>
                {business.category && (
                  <Text style={styles.businessCategory}>{business.category}</Text>
                )}
                {business.address && (
                  <Text style={styles.businessAddress} numberOfLines={2}>
                    {business.address.line1}
                    {business.address.city && `, ${business.address.city}`}
                  </Text>
                )}
                {(business as BusinessWithDistance).distanceFormatted && (
                  <Text style={styles.businessDistance}>
                    📍 {(business as BusinessWithDistance).distanceFormatted} away
                  </Text>
                )}
                {business.description && (
                  <Text style={styles.businessDescription} numberOfLines={2}>
                    {business.description}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.businessActions}>
              <TouchableOpacity
                style={styles.directionsButton}
                onPress={() => handleGetDirections(business)}>
                <Text style={styles.directionsButtonText}>Directions</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <PageTemplate
      title="Find More Rewards"
      currentScreen={currentScreen}
      onNavigate={onNavigate}
      onBack={onBack}
      onScanPress={onScanPress}>
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <Text
              style={styles.searchInput}
              onPress={() => {
                // Navigate to SearchPage for full search functionality
                onNavigate('Search');
              }}>
              Search businesses, rewards...
            </Text>
          </View>
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category ||
                (category === 'All' && selectedCategory === null)
                  ? styles.categoryChipActive
                  : null,
              ]}
              onPress={() => {
                setSelectedCategory(category === 'All' ? null : category);
              }}>
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === category ||
                  (category === 'All' && selectedCategory === null)
                    ? styles.categoryChipTextActive
                    : null,
                ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* View Toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              mapView === 'list' ? styles.viewToggleButtonActive : null,
            ]}
            onPress={() => setMapView('list')}>
            <Text
              style={[
                styles.viewToggleText,
                mapView === 'list' ? styles.viewToggleTextActive : null,
              ]}>
              List
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              mapView === 'map' ? styles.viewToggleButtonActive : null,
            ]}
            onPress={() => {
              setMapView('map');
              // Navigate to SearchPage for full map functionality
              onNavigate('Search');
            }}>
            <Text
              style={[
                styles.viewToggleText,
                mapView === 'map' ? styles.viewToggleTextActive : null,
              ]}>
              Map
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {mapView === 'map' ? renderMapView() : renderBusinessList()}

        {/* Business Details Modal (if selected) */}
        {selectedBusiness && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedBusiness.name}</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setSelectedBusiness(null)}>
                  <Text style={styles.modalCloseText}>×</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {selectedBusiness.description && (
                  <Text style={styles.modalDescription}>
                    {selectedBusiness.description}
                  </Text>
                )}

                {selectedBusiness.address && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Address</Text>
                    <Text style={styles.modalSectionText}>
                      {selectedBusiness.address.line1}
                      {selectedBusiness.address.line2 && `, ${selectedBusiness.address.line2}`}
                      {selectedBusiness.address.city && `, ${selectedBusiness.address.city}`}
                      {selectedBusiness.address.postcode && ` ${selectedBusiness.address.postcode}`}
                    </Text>
                  </View>
                )}

                {loadingRewards ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : businessRewards.length > 0 ? (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Available Rewards</Text>
                    {businessRewards.map((reward) => (
                      <View key={reward.id} style={styles.rewardItem}>
                        <Text style={styles.rewardName}>{reward.name}</Text>
                        <Text style={styles.rewardDescription}>
                          {reward.description}
                        </Text>
                        <Text style={styles.rewardRequirement}>
                          {reward.stampsRequired} stamps required
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noRewardsText}>
                    No rewards available at this business
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.modalActionButton}
                  onPress={() => handleGetDirections(selectedBusiness)}>
                  <Text style={styles.modalActionButtonText}>Get Directions</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        )}
      </View>
    </PageTemplate>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 50,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.neutral[100],
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: Colors.background,
  },
  viewToggle: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  viewToggleButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  viewToggleButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  viewToggleText: {
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  viewToggleTextActive: {
    color: Colors.background,
  },
  mapContainer: {
    flex: 1,
    height: 400,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mapText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  mapSubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  mapCoordinates: {
    fontSize: 12,
    color: Colors.text.light,
    marginBottom: 16,
  },
  mapButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  mapButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  businessList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  businessCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  businessCardContent: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  businessLogo: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: Colors.neutral[100],
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  businessCategory: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  businessAddress: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  businessDistance: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  businessDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  businessActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  directionsButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  directionsButtonText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  errorText: {
    fontSize: 16,
    color: Colors.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    width: SCREEN_WIDTH - 32,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    flex: 1,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 24,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 16,
  },
  modalDescription: {
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 20,
    marginBottom: 16,
  },
  modalSection: {
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  modalSectionText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  rewardItem: {
    backgroundColor: Colors.neutral[50],
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  rewardRequirement: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  noRewardsText: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  modalActionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  modalActionButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FindMoreRewardsPage;







