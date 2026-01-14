import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Linking,
  Image,
} from 'react-native';
import {Colors} from '../constants/Colors';
import PageTemplate from './PageTemplate';
import {discoveryApi, type Business, type Reward} from '../services/api';
import {locationService, type Coordinates} from '../services/location';
import {addOrUpdateBusiness} from '../utils/businessStorage';

interface SearchPageProps {
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
const SCREEN_HEIGHT = Dimensions.get('window').height || 667;

const SearchPage: React.FC<SearchPageProps> = ({
  currentScreen,
  onNavigate,
  onBack,
  onScanPress,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [businesses, setBusinesses] = useState<BusinessWithDistance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Load nearby businesses when location is available
  useEffect(() => {
    if (userLocation && viewMode === 'map') {
      loadNearbyBusinesses();
    }
  }, [userLocation, viewMode]);

  const loadNearbyBusinesses = async () => {
    if (!userLocation) return;

    setLoading(true);
    setError(null);

    try {
      const result = await discoveryApi.findNearby({
        lat: userLocation.latitude,
        lng: userLocation.longitude,
      });

      if (result.success && result.data) {
        let businessesList = result.data.map((business) => {
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

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If query is empty, load nearby businesses
    if (!query.trim()) {
      if (userLocation) {
        loadNearbyBusinesses();
      } else {
        setBusinesses([]);
      }
      return;
    }

    // Debounce search - wait 500ms after user stops typing
    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await discoveryApi.search(query);
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
        } else {
          setError(result.error || 'Search failed');
          setBusinesses([]);
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('Search failed. Please try again.');
        setBusinesses([]);
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleGetDirections = (business: Business) => {
    if (!business.address?.latitude || !business.address?.longitude) {
      return;
    }

    const url = Platform.select({
      ios: `maps://maps.apple.com/?daddr=${business.address.latitude},${business.address.longitude}`,
      android: `google.navigation:q=${business.address.latitude},${business.address.longitude}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${business.address.latitude},${business.address.longitude}`,
    });

    Linking.openURL(url).catch((err) => {
      console.error('Error opening maps:', err);
    });
  };

  const openGoogleMaps = () => {
    if (!userLocation) {
      return;
    }

    const url = `https://www.google.com/maps/search/?api=1&query=${userLocation.latitude},${userLocation.longitude}`;
    Linking.openURL(url).catch((err) => {
      console.error('Error opening Google Maps:', err);
    });
  };

  // Render map view (Google Maps integration)
  const renderMapView = () => {
    return (
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapTitle}>Interactive Map</Text>
          <Text style={styles.mapSubtext}>
            {userLocation
              ? 'Business locations displayed on map'
              : 'Enable location to see map'}
          </Text>
          {userLocation && (
            <>
              <Text style={styles.mapCoordinates}>
                Your location: {userLocation.latitude.toFixed(4)},{' '}
                {userLocation.longitude.toFixed(4)}
              </Text>
              <Text style={styles.businessCount}>
                {businesses.length} businesses nearby
              </Text>
              <TouchableOpacity
                style={styles.openMapsButton}
                onPress={openGoogleMaps}>
                <Text style={styles.openMapsButtonText}>
                  Open in Google Maps
                </Text>
              </TouchableOpacity>
            </>
          )}
          {!userLocation && (
            <TouchableOpacity
              style={styles.enableLocationButton}
              onPress={async () => {
                const hasPermission = await locationService.requestPermission();
                if (hasPermission) {
                  const location = await locationService.getCurrentLocation();
                  if (location) {
                    setUserLocation(location.coords);
                  }
                }
              }}>
              <Text style={styles.enableLocationButtonText}>
                Enable Location
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Business markers overlay (simulated) */}
        {userLocation && businesses.length > 0 && (
          <View style={styles.markersOverlay}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.markersList}>
              {businesses.slice(0, 5).map((business) => (
                <TouchableOpacity
                  key={business.id}
                  style={styles.markerCard}
                  onPress={() => setSelectedBusiness(business)}>
                  <Text style={styles.markerName} numberOfLines={1}>
                    {business.name}
                  </Text>
                  {(business as BusinessWithDistance).distanceFormatted && (
                    <Text style={styles.markerDistance}>
                      {(business as BusinessWithDistance).distanceFormatted}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  // Render list view
  const renderListView = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              if (searchQuery) {
                handleSearch(searchQuery);
              } else {
                loadNearbyBusinesses();
              }
            }}>
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
            {searchQuery
              ? 'Try a different search term'
              : 'Enable location to find nearby businesses'}
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
            onPress={() => setSelectedBusiness(business)}>
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
              </View>
            </View>
            <TouchableOpacity
              style={styles.directionsButton}
              onPress={() => handleGetDirections(business)}>
              <Text style={styles.directionsButtonText}>Directions</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <PageTemplate
      title="Search & Map"
      currentScreen={currentScreen}
      onNavigate={onNavigate}
      onBack={onBack}
      onScanPress={onScanPress}>
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search businesses, rewards..."
              placeholderTextColor={Colors.text.light}
              value={searchQuery}
              onChangeText={handleSearch}
              returnKeyType="search"
              onSubmitEditing={() => {
                // Trigger search immediately on submit
                if (searchQuery.trim()) {
                  handleSearch(searchQuery);
                }
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* View Toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              viewMode === 'map' ? styles.viewToggleButtonActive : null,
            ]}
            onPress={() => setViewMode('map')}>
            <Text
              style={[
                styles.viewToggleText,
                viewMode === 'map' ? styles.viewToggleTextActive : null,
              ]}>
              Map
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              viewMode === 'list' ? styles.viewToggleButtonActive : null,
            ]}
            onPress={() => setViewMode('list')}>
            <Text
              style={[
                styles.viewToggleText,
                viewMode === 'list' ? styles.viewToggleTextActive : null,
              ]}>
              List
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {viewMode === 'map' ? renderMapView() : renderListView()}

        {/* Business Details Modal */}
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

                <TouchableOpacity
                  style={styles.modalActionButton}
                  onPress={() => {
                    handleGetDirections(selectedBusiness);
                    setSelectedBusiness(null);
                  }}>
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
    height: SCREEN_HEIGHT * 0.6,
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mapTitle: {
    fontSize: 24,
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
    marginBottom: 8,
  },
  businessCount: {
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: 16,
  },
  openMapsButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  openMapsButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  enableLocationButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  enableLocationButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  markersOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
  },
  markersList: {
    paddingHorizontal: 16,
  },
  markerCard: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    minWidth: 120,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  markerName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  markerDistance: {
    fontSize: 12,
    color: Colors.primary,
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
  },
  directionsButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-end',
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

export default SearchPage;
