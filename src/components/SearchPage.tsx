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
  Modal,
} from 'react-native';
import {Colors} from '../constants/Colors';
import PageTemplate from './PageTemplate';
import {discoveryApi, rewardsApi, type Business, type Reward} from '../services/api';
import {locationService, type Coordinates} from '../services/location';
import {addOrUpdateBusiness} from '../utils/businessStorage';
import {storage} from '../services/localStorage';

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

interface SearchResult {
  type: 'business' | 'reward' | 'campaign';
  business?: BusinessWithDistance;
  reward?: Reward;
  campaign?: any;
}

type SearchType = 'all' | 'businesses' | 'rewards' | 'campaigns';
type SortOption = 'distance' | 'name' | 'relevance';
type DistanceFilter = 'all' | '1km' | '5km' | '10km' | '25km';

const SCREEN_WIDTH = Dimensions.get('window').width || 375;
const SCREEN_HEIGHT = Dimensions.get('window').height || 667;

const CATEGORIES = [
  'All',
  'Restaurant',
  'Cafe',
  'Retail',
  'Beauty',
  'Fitness',
  'Entertainment',
  'Other',
];

const SearchPage: React.FC<SearchPageProps> = ({
  currentScreen,
  onNavigate,
  onBack,
  onScanPress,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [businesses, setBusinesses] = useState<BusinessWithDistance[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [distanceFilter, setDistanceFilter] = useState<DistanceFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [searchCache, setSearchCache] = useState<Map<string, SearchResult[]>>(new Map());
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load search history and cache
  useEffect(() => {
    loadSearchHistory();
    loadSearchCache();
  }, []);

  // Request location permission
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

  const loadSearchHistory = async () => {
    try {
      const history = await storage.get<string[]>('search_history');
      if (history && Array.isArray(history)) {
        setSearchHistory(history.slice(0, 10)); // Last 10 searches
      }
    } catch (err) {
      console.error('Error loading search history:', err);
    }
  };

  const loadSearchCache = async () => {
    try {
      const cached = await storage.get<Record<string, SearchResult[]>>('search_cache');
      if (cached) {
        const cacheMap = new Map<string, SearchResult[]>();
        Object.entries(cached).forEach(([key, value]) => {
          cacheMap.set(key, value);
        });
        setSearchCache(cacheMap);
      }
    } catch (err) {
      console.error('Error loading search cache:', err);
    }
  };

  const saveSearchCache = async (query: string, results: SearchResult[]) => {
    try {
      const cacheKey = `${query.toLowerCase()}_${searchType}_${selectedCategory}_${distanceFilter}`;
      const newCache = new Map(searchCache);
      newCache.set(cacheKey, results);
      setSearchCache(newCache);
      
      // Save to storage (keep last 50 cached searches)
      const cacheObj: Record<string, SearchResult[]> = {};
      Array.from(newCache.entries()).slice(-50).forEach(([key, value]) => {
        cacheObj[key] = value;
      });
      await storage.set('search_cache', cacheObj);
    } catch (err) {
      console.error('Error saving search cache:', err);
    }
  };

  const getCachedResults = (query: string): SearchResult[] | null => {
    const cacheKey = `${query.toLowerCase()}_${searchType}_${selectedCategory}_${distanceFilter}`;
    return searchCache.get(cacheKey) || null;
  };

  const saveSearchHistory = async (query: string) => {
    if (!query.trim()) return;
    
    try {
      const history = await storage.get<string[]>('search_history') || [];
      const updated = [query, ...history.filter(h => h !== query)].slice(0, 10);
      await storage.set('search_history', updated);
      setSearchHistory(updated);
    } catch (err) {
      console.error('Error saving search history:', err);
    }
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setBusinesses([]);
      setRewards([]);
      setCampaigns([]);
      return;
    }

    // Check cache first
    const cached = getCachedResults(query);
    if (cached && cached.length > 0) {
      setResults(cached);
      setBusinesses(cached.filter(r => r.type === 'business').map(r => r.business!).filter(Boolean));
      setRewards(cached.filter(r => r.type === 'reward').map(r => r.reward!).filter(Boolean));
      setCampaigns(cached.filter(r => r.type === 'campaign').map(r => r.campaign!).filter(Boolean));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setShowHistory(false);

    try {
      const allResults: SearchResult[] = [];

      // Search businesses
      if (searchType === 'all' || searchType === 'businesses') {
        const businessResult = await discoveryApi.search(query);
        if (businessResult.success && businessResult.data) {
          let businessesList = businessResult.data.map((business) => {
            if (userLocation && business.address?.latitude && business.address?.longitude) {
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

          // Apply distance filter
          if (distanceFilter !== 'all' && userLocation) {
            const maxDistance = parseFloat(distanceFilter.replace('km', '')) * 1000;
            businessesList = businessesList.filter(b => 
              (b as BusinessWithDistance).distance !== undefined && 
              (b as BusinessWithDistance).distance! <= maxDistance
            );
          }

          // Apply category filter
          if (selectedCategory !== 'All') {
            businessesList = businessesList.filter(b => b.category === selectedCategory);
          }

          // Sort businesses
          businessesList = sortBusinesses(businessesList, sortBy);

          setBusinesses(businessesList);
          businessesList.forEach(b => {
            allResults.push({ type: 'business', business: b });
          });
        }
      }

      // Search rewards (through businesses)
      if (searchType === 'all' || searchType === 'rewards') {
        // Get all businesses first, then search their rewards
        const businessResult = await discoveryApi.search(query);
        if (businessResult.success && businessResult.data) {
          const rewardsList: Reward[] = [];
          
          for (const business of businessResult.data.slice(0, 10)) {
            try {
              const rewardResult = await rewardsApi.getAvailableRewards(business.id);
              if (rewardResult.success && rewardResult.data) {
                const matchingRewards = rewardResult.data.filter(r =>
                  r.name.toLowerCase().includes(query.toLowerCase()) ||
                  r.description?.toLowerCase().includes(query.toLowerCase())
                );
                rewardsList.push(...matchingRewards.map(r => ({ ...r, businessId: business.id })));
              }
            } catch (err) {
              // Skip if business rewards fail
            }
          }

          setRewards(rewardsList);
          rewardsList.forEach(r => {
            allResults.push({ type: 'reward', reward: r });
          });
        }
      }

      // Search campaigns (placeholder - would need campaign API)
      if (searchType === 'all' || searchType === 'campaigns') {
        // Campaign search would go here when API is available
        setCampaigns([]);
      }

      setResults(allResults);
      await saveSearchHistory(query);
      await saveSearchCache(query, allResults);
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const sortBusinesses = (list: BusinessWithDistance[], sort: SortOption): BusinessWithDistance[] => {
    const sorted = [...list];
    
    switch (sort) {
      case 'distance':
        return sorted.sort((a, b) => {
          const distA = a.distance || Infinity;
          const distB = b.distance || Infinity;
          return distA - distB;
        });
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'relevance':
      default:
        return sorted; // Keep original order (relevance from API)
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setBusinesses([]);
      setRewards([]);
      setCampaigns([]);
      setShowHistory(true);
      return;
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 500);
  };

  const handleSearchHistoryClick = (query: string) => {
    setSearchQuery(query);
    performSearch(query);
  };

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
    if (!userLocation) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${userLocation.latitude},${userLocation.longitude}`;
    Linking.openURL(url).catch((err) => {
      console.error('Error opening Google Maps:', err);
    });
  };

  // Render search filters
  const renderFilters = () => {
    if (!showFilters) return null;

    return (
      <View style={styles.filtersContainer}>
        {/* Search Type Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {(['all', 'businesses', 'rewards', 'campaigns'] as SearchType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterChip,
                searchType === type ? styles.filterChipActive : null,
              ]}
              onPress={() => setSearchType(type)}>
              <Text
                style={[
                  styles.filterChipText,
                  searchType === type ? styles.filterChipTextActive : null,
                ]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterChip,
                selectedCategory === category ? styles.filterChipActive : null,
              ]}
              onPress={() => {
                setSelectedCategory(category);
                if (searchQuery) performSearch(searchQuery);
              }}>
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === category ? styles.filterChipTextActive : null,
                ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Distance Filter */}
        {userLocation && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            <Text style={styles.filterLabel}>Distance:</Text>
            {(['all', '1km', '5km', '10km', '25km'] as DistanceFilter[]).map((distance) => (
              <TouchableOpacity
                key={distance}
                style={[
                  styles.filterChip,
                  distanceFilter === distance ? styles.filterChipActive : null,
                ]}
                onPress={() => {
                  setDistanceFilter(distance);
                  if (searchQuery) performSearch(searchQuery);
                }}>
                <Text
                  style={[
                    styles.filterChipText,
                    distanceFilter === distance ? styles.filterChipTextActive : null,
                  ]}>
                  {distance === 'all' ? 'All' : distance}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Sort Options */}
        <View style={styles.sortRow}>
          <Text style={styles.filterLabel}>Sort by:</Text>
          {(['relevance', 'distance', 'name'] as SortOption[]).map((sort) => (
            <TouchableOpacity
              key={sort}
              style={[
                styles.filterChip,
                sortBy === sort ? styles.filterChipActive : null,
              ]}
              onPress={() => {
                setSortBy(sort);
                if (searchQuery) {
                  const sorted = sortBusinesses(businesses, sort);
                  setBusinesses(sorted);
                }
              }}>
              <Text
                style={[
                  styles.filterChipText,
                  sortBy === sort ? styles.filterChipTextActive : null,
                ]}>
                {sort.charAt(0).toUpperCase() + sort.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // Render search history
  const renderSearchHistory = () => {
    if (!showHistory || searchHistory.length === 0) return null;

    return (
      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>Recent Searches</Text>
        {searchHistory.map((query, index) => (
          <TouchableOpacity
            key={index}
            style={styles.historyItem}
            onPress={() => handleSearchHistoryClick(query)}>
            <Text style={styles.historyIcon}>🕐</Text>
            <Text style={styles.historyText}>{query}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Render map view
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
              <Text style={styles.businessCount}>
                {businesses.length} businesses found
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
        </View>

        {/* Business markers overlay */}
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
                  {business.distanceFormatted && (
                    <Text style={styles.markerDistance}>
                      {business.distanceFormatted}
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
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => performSearch(searchQuery)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!searchQuery.trim()) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Start searching...</Text>
          <Text style={styles.emptySubtext}>
            Search for businesses, rewards, or campaigns
          </Text>
          {renderSearchHistory()}
        </View>
      );
    }

    if (results.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No results found</Text>
          <Text style={styles.emptySubtext}>
            Try a different search term or adjust filters
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.resultsList} showsVerticalScrollIndicator={false}>
        {/* Businesses */}
        {businesses.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Businesses ({businesses.length})</Text>
            {businesses.map((business) => (
              <TouchableOpacity
                key={business.id}
                style={styles.resultCard}
                onPress={() => setSelectedBusiness(business)}>
                <View style={styles.resultCardContent}>
                  {business.logo && (
                    <Image
                      source={{uri: business.logo}}
                      style={styles.resultLogo}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName}>{business.name}</Text>
                    {business.category && (
                      <Text style={styles.resultCategory}>{business.category}</Text>
                    )}
                    {business.address && (
                      <Text style={styles.resultAddress} numberOfLines={2}>
                        {business.address.line1}
                        {business.address.city && `, ${business.address.city}`}
                      </Text>
                    )}
                    {business.distanceFormatted && (
                      <Text style={styles.resultDistance}>
                        📍 {business.distanceFormatted} away
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
          </View>
        )}

        {/* Rewards */}
        {rewards.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Rewards ({rewards.length})</Text>
            {rewards.map((reward) => (
              <TouchableOpacity
                key={reward.id}
                style={styles.resultCard}
                onPress={() => {
                  // Navigate to reward detail or business
                  if (reward.businessId) {
                    onNavigate(`Business${reward.businessId}`);
                  }
                }}>
                <View style={styles.resultCardContent}>
                  <View style={styles.rewardIcon}>
                    <Text style={styles.rewardIconText}>🎁</Text>
                  </View>
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName}>{reward.name}</Text>
                    {reward.description && (
                      <Text style={styles.resultDescription} numberOfLines={2}>
                        {reward.description}
                      </Text>
                    )}
                    <Text style={styles.rewardRequirement}>
                      {reward.stampsRequired} stamps required
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Campaigns */}
        {campaigns.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Campaigns ({campaigns.length})</Text>
            {campaigns.map((campaign) => (
              <TouchableOpacity
                key={campaign.id}
                style={styles.resultCard}>
                <View style={styles.resultCardContent}>
                  <View style={styles.rewardIcon}>
                    <Text style={styles.rewardIconText}>🎯</Text>
                  </View>
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName}>{campaign.name}</Text>
                    {campaign.description && (
                      <Text style={styles.resultDescription} numberOfLines={2}>
                        {campaign.description}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <PageTemplate
      title="Search"
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
              placeholder="Search businesses, rewards, campaigns..."
              placeholderTextColor={Colors.text.light}
              value={searchQuery}
              onChangeText={handleSearch}
              returnKeyType="search"
              onSubmitEditing={() => {
                if (searchQuery.trim()) {
                  performSearch(searchQuery);
                }
              }}
              onFocus={() => setShowHistory(true)}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.filterToggleButton}
              onPress={() => setShowFilters(!showFilters)}>
              <Text style={styles.filterToggleText}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filters */}
        {renderFilters()}

        {/* View Toggle */}
        <View style={styles.viewToggle}>
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
        </View>

        {/* Content */}
        {viewMode === 'map' ? renderMapView() : renderListView()}

        {/* Business Details Modal */}
        {selectedBusiness && (
          <Modal
            visible={!!selectedBusiness}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setSelectedBusiness(null)}>
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
          </Modal>
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
  filterToggleButton: {
    marginLeft: 8,
    padding: 4,
  },
  filterToggleText: {
    fontSize: 20,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.neutral[50],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  filterRow: {
    marginBottom: 8,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginRight: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: Colors.background,
  },
  historyContainer: {
    padding: 16,
    backgroundColor: Colors.neutral[50],
    borderRadius: 12,
    marginTop: 16,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  historyIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  historyText: {
    fontSize: 14,
    color: Colors.text.primary,
    flex: 1,
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
  },
  openMapsButtonText: {
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
  resultsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  resultsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  resultCard: {
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
  resultCardContent: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  resultLogo: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: Colors.neutral[100],
  },
  rewardIcon: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rewardIconText: {
    fontSize: 32,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  resultCategory: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  resultAddress: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  resultDistance: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  resultDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  rewardRequirement: {
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
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
