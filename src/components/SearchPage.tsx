/**
 * SearchPage - Full GeoSearch Implementation
 * Based on GeoSearch_Implementation_Spec.txt
 * 
 * Features:
 * - Text search mode with all fields (business name, sector, hierarchical location)
 * - Map search mode
 * - Autocomplete on all input fields
 * - User submission capture
 * - Full filtering (rewards, campaigns, distance, sort)
 * - Results display with proper business cards
 */

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
  Switch,
  FlatList,
} from 'react-native';
import {Colors} from '../constants/Colors';
import PageTemplate from './PageTemplate';
import {discoveryApi, rewardsApi} from '../services/api';
import {locationService, type Coordinates} from '../services/location';
import {storage} from '../services/localStorage';
import {SearchMode, MapBounds, Coordinates as SearchCoordinates} from '../types/search.types';
import {Business} from '../types/business.types';
import {useAutocomplete} from '../hooks/useAutocomplete';
import {useGeoSearch} from '../hooks/useGeoSearch';
import {SearchProvider, useSearchContext} from '../contexts/SearchContext';
import {AutocompleteSuggestion} from '../types/search.types';
import {submitUserEntry} from '../services/userSubmissionsApi';

interface SearchPageProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onBack?: () => void;
  onScanPress?: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width || 375;
const SCREEN_HEIGHT = Dimensions.get('window').height || 667;

// Autocomplete Input Component
interface AutocompleteInputProps {
  fieldType: 'businessName' | 'sector' | 'country' | 'region' | 'city' | 'street';
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSuggestionSelect: (suggestion: AutocompleteSuggestion) => void;
  onNewEntry?: (value: string) => void;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  fieldType,
  placeholder,
  value,
  onChange,
  onSuggestionSelect,
  onNewEntry,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const {suggestions, loading, fetchSuggestions} = useAutocomplete(fieldType);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (value.length >= 2) {
      fetchSuggestions(value);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [value, fetchSuggestions]);

  const handleSelect = (suggestion: AutocompleteSuggestion) => {
    onSuggestionSelect(suggestion);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (value && !suggestions.find((s) => s.value === value)) {
        onNewEntry?.(value);
      }
      setIsOpen(false);
    }, 200);
  };

  return (
    <View style={styles.autocompleteContainer}>
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={value}
        onChangeText={onChange}
        onBlur={handleBlur}
        onFocus={() => value.length >= 2 && setIsOpen(true)}
        placeholder={placeholder}
        placeholderTextColor={Colors.text.light}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {loading && (
        <View style={styles.loadingIndicator}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      )}
      {isOpen && suggestions.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={suggestions}
            renderItem={({item}) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSelect(item)}>
                <Text style={styles.suggestionLabel}>{item.label}</Text>
                {item.type === 'userSubmitted' && (
                  <Text style={styles.badge}>Pending Review</Text>
                )}
              </TouchableOpacity>
            )}
            keyExtractor={(item, index) => `${item.value}-${index}`}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
    </View>
  );
};

// Text Search Component
const TextSearch: React.FC<{onNavigate: (screen: string, params?: any) => void}> = ({
  onNavigate,
}) => {
  const {performTextSearch, results, totalCount, loading, error} = useGeoSearch();
  const [businessName, setBusinessName] = useState('');
  const [sector, setSector] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [postcode, setPostcode] = useState('');
  // Radio button selection: 'rewards' | 'campaigns' | 'both'
  const [resultsType, setResultsType] = useState<'rewards' | 'campaigns' | 'both'>('both');
  const [distance, setDistance] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'distance' | 'name' | 'relevance'>('distance');
  const [distanceModalVisible, setDistanceModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);

  const handleSuggestionSelect = (
    field: string,
    suggestion: AutocompleteSuggestion,
  ) => {
    switch (field) {
      case 'businessName':
        setBusinessName(suggestion.value);
        // If business name is selected and has address metadata, populate address fields
        if (suggestion.metadata?.address) {
          const addr = suggestion.metadata.address;
          if (addr.street) setStreet(addr.street);
          if (addr.city) setCity(addr.city);
          if (addr.region) setRegion(addr.region);
          if (addr.postcode) setPostcode(addr.postcode);
          if (addr.country) setCountry(addr.country);
        }
        // Also populate sector from category if available
        if (suggestion.metadata?.category) {
          setSector(suggestion.metadata.category);
        }
        break;
      case 'sector':
        setSector(suggestion.value);
        break;
      case 'country':
        setCountry(suggestion.value);
        break;
      case 'region':
        setRegion(suggestion.value);
        break;
      case 'city':
        setCity(suggestion.value);
        break;
      case 'street':
        setStreet(suggestion.value);
        break;
    }
  };

  const handleNewEntry = async (field: string, value: string) => {
    try {
      await submitUserEntry({
        fieldType: field as any,
        enteredValue: value,
        userId: 'current-user', // TODO: Get from auth
        sessionId: 'current-session', // TODO: Generate session ID
      });
    } catch (err) {
      console.error('Failed to submit user entry:', err);
    }
  };

  const handleSearch = () => {
    performTextSearch({
      businessName: businessName || undefined,
      sector: sector || undefined,
      location: {
        country: country || undefined,
        region: region || undefined,
        city: city || undefined,
        street: street || undefined,
        postcode: postcode || undefined,
      },
      rewardsOnly: resultsType === 'rewards' || resultsType === 'both',
      campaignsOnly: resultsType === 'campaigns' || resultsType === 'both',
      distance,
      sortBy,
    });
  };

  return (
    <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Business Name</Text>
      <AutocompleteInput
        fieldType="businessName"
        placeholder="Enter business name"
        value={businessName}
        onChange={setBusinessName}
        onSuggestionSelect={(s) => handleSuggestionSelect('businessName', s)}
        onNewEntry={(v) => handleNewEntry('businessName', v)}
      />

      <Text style={styles.sectionTitle}>Sector/Type</Text>
      <AutocompleteInput
        fieldType="sector"
        placeholder="Enter sector or business type"
        value={sector}
        onChange={setSector}
        onSuggestionSelect={(s) => handleSuggestionSelect('sector', s)}
        onNewEntry={(v) => handleNewEntry('sector', v)}
      />

      <Text style={styles.sectionTitle}>Location</Text>
      <AutocompleteInput
        fieldType="country"
        placeholder="Country"
        value={country}
        onChange={setCountry}
        onSuggestionSelect={(s) => handleSuggestionSelect('country', s)}
        onNewEntry={(v) => handleNewEntry('country', v)}
      />

      <AutocompleteInput
        fieldType="region"
        placeholder="Region/County"
        value={region}
        onChange={setRegion}
        onSuggestionSelect={(s) => handleSuggestionSelect('region', s)}
        onNewEntry={(v) => handleNewEntry('region', v)}
      />

      <AutocompleteInput
        fieldType="city"
        placeholder="City"
        value={city}
        onChange={setCity}
        onSuggestionSelect={(s) => handleSuggestionSelect('city', s)}
        onNewEntry={(v) => handleNewEntry('city', v)}
      />

      <AutocompleteInput
        fieldType="street"
        placeholder="Street"
        value={street}
        onChange={setStreet}
        onSuggestionSelect={(s) => handleSuggestionSelect('street', s)}
        onNewEntry={(v) => handleNewEntry('street', v)}
      />

      <TextInput
        style={styles.input}
        placeholder="Postcode"
        value={postcode}
        onChangeText={setPostcode}
        placeholderTextColor={Colors.text.light}
        autoCapitalize="characters"
      />

      <Text style={styles.sectionTitle}>Show Results</Text>
      <View style={styles.radioGroup}>
        <TouchableOpacity
          style={styles.radioOption}
          onPress={() => setResultsType('both')}>
          <View style={styles.radioButton}>
            {resultsType === 'both' && <View style={styles.radioButtonSelected} />}
          </View>
          <Text style={styles.radioLabel}>Rewards & Campaigns</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioOption}
          onPress={() => setResultsType('rewards')}>
          <View style={styles.radioButton}>
            {resultsType === 'rewards' && <View style={styles.radioButtonSelected} />}
          </View>
          <Text style={styles.radioLabel}>Rewards Only</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioOption}
          onPress={() => setResultsType('campaigns')}>
          <View style={styles.radioButton}>
            {resultsType === 'campaigns' && <View style={styles.radioButtonSelected} />}
          </View>
          <Text style={styles.radioLabel}>Campaigns Only</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Distance</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setDistanceModalVisible(true)}>
          <Text style={styles.dropdownButtonText}>
            {distance === undefined
              ? 'All'
              : distance === 1
              ? '1 mile'
              : distance === 5
              ? '5 miles'
              : distance === 10
              ? '10 miles'
              : distance === 25
              ? '25 miles'
              : `${distance} miles`}
          </Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={distanceModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDistanceModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDistanceModalVisible(false)}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setDistance(undefined);
                setDistanceModalVisible(false);
              }}>
              <Text style={styles.modalOptionText}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setDistance(1);
                setDistanceModalVisible(false);
              }}>
              <Text style={styles.modalOptionText}>1 mile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setDistance(5);
                setDistanceModalVisible(false);
              }}>
              <Text style={styles.modalOptionText}>5 miles</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setDistance(10);
                setDistanceModalVisible(false);
              }}>
              <Text style={styles.modalOptionText}>10 miles</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setDistance(25);
                setDistanceModalVisible(false);
              }}>
              <Text style={styles.modalOptionText}>25 miles</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Sort By</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setSortModalVisible(true)}>
          <Text style={styles.dropdownButtonText}>
            {sortBy === 'distance'
              ? 'Distance'
              : sortBy === 'name'
              ? 'Name (A-Z)'
              : 'Relevance'}
          </Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={sortModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSortModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSortModalVisible(false)}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setSortBy('distance');
                setSortModalVisible(false);
              }}>
              <Text style={styles.modalOptionText}>Distance</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setSortBy('name');
                setSortModalVisible(false);
              }}>
              <Text style={styles.modalOptionText}>Name (A-Z)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setSortBy('relevance');
                setSortModalVisible(false);
              }}>
              <Text style={styles.modalOptionText}>Relevance</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
        <Text style={styles.searchButtonText}>Search</Text>
      </TouchableOpacity>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && !error && results && results.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No businesses found</Text>
          <Text style={styles.emptySubtext}>
            Try expanding your search area or removing some filters
          </Text>
        </View>
      )}

      {!loading && !error && results && results.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsCount}>
            {totalCount || results.length} {totalCount === 1 || results.length === 1 ? 'result' : 'results'} found
          </Text>
          {(() => {
            // Collect all rewards and campaigns from all businesses
            const allItems: Array<{type: 'reward' | 'campaign', data: any, business: any}> = [];
            
            results.forEach((business: any) => {
              const rewards = business.rewardsPrograms || [];
              const campaigns = business.campaigns || [];
              
              if (resultsType === 'rewards' || resultsType === 'both') {
                rewards.forEach((reward: any) => {
                  allItems.push({
                    type: 'reward',
                    data: reward,
                    business: business,
                  });
                });
              }
              
              if (resultsType === 'campaigns' || resultsType === 'both') {
                campaigns.forEach((campaign: any) => {
                  allItems.push({
                    type: 'campaign',
                    data: campaign,
                    business: business,
                  });
                });
              }
            });
            
            if (allItems.length === 0) {
              return (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    No {resultsType === 'rewards' ? 'rewards' : resultsType === 'campaigns' ? 'campaigns' : 'rewards or campaigns'} found
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Try adjusting your search filters
                  </Text>
                </View>
              );
            }
            
            return allItems.map((rewardOrCampaign, idx) => {
              const isReward = rewardOrCampaign.type === 'reward';
              const itemData = rewardOrCampaign.data;
              const business = rewardOrCampaign.business;
              
              // Calculate progress: current points/stamps out of required
              // For rewards: costStamps or stampsRequired
              // For campaigns: conditions.bonusStamps or similar
              const required = isReward 
                ? (itemData.costStamps || itemData.stampsRequired || itemData.pointsRequired || 0)
                : (itemData.conditions?.bonusStamps || itemData.pointsRequired || 5); // Default for campaigns
              
              const current = isReward
                ? (itemData.customerProgress?.['current-user'] || itemData.currentPoints || 0)
                : (itemData.customerProgress?.['current-user'] || itemData.currentPoints || 0);
              
              const progress = required > 0 ? `${current}/${required}` : '0/0';
              
              return (
                <TouchableOpacity
                  key={`${business.id}-${rewardOrCampaign.type}-${itemData.id || idx}`}
                  style={styles.rewardCard}
                  onPress={() => onNavigate('BusinessDetail', {businessId: business.id})}>
                  <View style={styles.rewardIcon}>
                    <Text style={styles.rewardIconText}>
                      {isReward ? '🎁' : '🎯'}
                    </Text>
                  </View>
                  <View style={styles.rewardContent}>
                    <View style={styles.rewardHeader}>
                      <Text style={styles.rewardTypeLabel}>
                        {isReward ? 'Reward' : 'Campaign'}
                      </Text>
                      <Text style={styles.rewardProgress}>{progress}</Text>
                    </View>
                    <Text style={styles.rewardDescription} numberOfLines={2}>
                      {itemData.description || itemData.name || 'No description'}
                    </Text>
                    <Text style={styles.rewardBusiness}>
                      {business.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            });
          })()}
        </View>
      )}
    </ScrollView>
  );
};

// Map Search Component
const MapSearch: React.FC<{onNavigate: (screen: string, params?: any) => void}> = ({
  onNavigate,
}) => {
  const {performMapSearch, results, totalCount, loading, error} = useGeoSearch();
  const [mapBusinessName, setMapBusinessName] = useState('');
  const [mapSector, setMapSector] = useState('');
  const [mapResultsType, setMapResultsType] = useState<'rewards' | 'campaigns' | 'both'>('both');
  const [userLocation, setUserLocation] = useState<SearchCoordinates | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    const getLocation = async () => {
      try {
        const location = await locationService.getCurrentLocation();
        if (location) {
          setUserLocation({lat: location.coords.latitude, lng: location.coords.longitude});
        }
      } catch (err) {
        console.error('Failed to get user location:', err);
      }
    };
    getLocation();
  }, []);

  const handleMapSearch = async () => {
    if (!userLocation) {
      return;
    }
    // Simple bounds calculation (can be improved with actual map bounds)
    const bounds: MapBounds = {
      northeast: {lat: userLocation.lat + 0.1, lng: userLocation.lng + 0.1},
      southwest: {lat: userLocation.lat - 0.1, lng: userLocation.lng - 0.1},
    };
                performMapSearch(bounds, {
                  businessName: mapBusinessName || undefined,
                  sector: mapSector || undefined,
                  rewardsOnly: mapResultsType === 'rewards' || mapResultsType === 'both',
                  campaignsOnly: mapResultsType === 'campaigns' || mapResultsType === 'both',
                });
  };

  const mapUrl = userLocation
    ? `https://www.google.com/maps/embed/v1/view?key=YOUR_API_KEY&center=${userLocation.lat},${userLocation.lng}&zoom=13`
    : 'https://www.google.com/maps/embed/v1/view?key=YOUR_API_KEY&center=51.5074,-0.1278&zoom=10';

  return (
    <View style={styles.mapContainer}>
      {Platform.OS === 'web' ? (
        <View style={styles.mapWrapper}>
          <iframe
            src={mapUrl}
            width="100%"
            height="100%"
            style={{border: 0}}
            allowFullScreen
            loading="lazy"
          />
        </View>
      ) : (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapTitle}>Map View</Text>
          <Text style={styles.mapSubtext}>
            Map integration requires react-native-maps
          </Text>
        </View>
      )}
      <View style={styles.mapSearchPanel}>
        <Text style={styles.sectionTitle}>Search This Area</Text>
        <AutocompleteInput
          fieldType="businessName"
          placeholder="Business name"
          value={mapBusinessName}
          onChange={setMapBusinessName}
          onSuggestionSelect={(s) => setMapBusinessName(s.value)}
          onNewEntry={(v) => submitUserEntry({fieldType: 'businessName', enteredValue: v, userId: 'current-user', sessionId: 'current-session'})}
        />
        <AutocompleteInput
          fieldType="sector"
          placeholder="Sector"
          value={mapSector}
          onChange={setMapSector}
          onSuggestionSelect={(s) => setMapSector(s.value)}
          onNewEntry={(v) => submitUserEntry({fieldType: 'sector', enteredValue: v, userId: 'current-user', sessionId: 'current-session'})}
        />
        <Text style={styles.sectionTitle}>Show Results</Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setMapResultsType('both')}>
            <View style={styles.radioButton}>
              {mapResultsType === 'both' && <View style={styles.radioButtonSelected} />}
            </View>
            <Text style={styles.radioLabel}>Rewards & Campaigns</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setMapResultsType('rewards')}>
            <View style={styles.radioButton}>
              {mapResultsType === 'rewards' && <View style={styles.radioButtonSelected} />}
            </View>
            <Text style={styles.radioLabel}>Rewards Only</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setMapResultsType('campaigns')}>
            <View style={styles.radioButton}>
              {mapResultsType === 'campaigns' && <View style={styles.radioButtonSelected} />}
            </View>
            <Text style={styles.radioLabel}>Campaigns Only</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleMapSearch}>
          <Text style={styles.searchButtonText}>Search This Area</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && !error && results && results.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No {mapResultsType === 'rewards' ? 'rewards' : mapResultsType === 'campaigns' ? 'campaigns' : 'rewards or campaigns'} found
          </Text>
          <Text style={styles.emptySubtext}>
            Try expanding your search area or removing some filters
          </Text>
        </View>
      )}

      {!loading && !error && results && results.length > 0 && (
        <ScrollView style={styles.resultsContainer}>
          <Text style={styles.resultsCount}>
            {totalCount || results.length} {totalCount === 1 || results.length === 1 ? 'result' : 'results'} found
          </Text>
          {(() => {
            // Collect all rewards and campaigns from all businesses
            const allItems: Array<{type: 'reward' | 'campaign', data: any, business: any}> = [];
            
            results.forEach((business: any) => {
              const rewards = business.rewardsPrograms || [];
              const campaigns = business.campaigns || [];
              
              if (mapResultsType === 'rewards' || mapResultsType === 'both') {
                rewards.forEach((reward: any) => {
                  allItems.push({
                    type: 'reward',
                    data: reward,
                    business: business,
                  });
                });
              }
              
              if (mapResultsType === 'campaigns' || mapResultsType === 'both') {
                campaigns.forEach((campaign: any) => {
                  allItems.push({
                    type: 'campaign',
                    data: campaign,
                    business: business,
                  });
                });
              }
            });
            
            if (allItems.length === 0) {
              return (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    No {mapResultsType === 'rewards' ? 'rewards' : mapResultsType === 'campaigns' ? 'campaigns' : 'rewards or campaigns'} found
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Try adjusting your search filters
                  </Text>
                </View>
              );
            }
            
            return allItems.map((rewardOrCampaign, idx) => {
              const isReward = rewardOrCampaign.type === 'reward';
              const itemData = rewardOrCampaign.data;
              const business = rewardOrCampaign.business;
              
              // Calculate progress: current points/stamps out of required
              const required = isReward 
                ? (itemData.costStamps || itemData.stampsRequired || itemData.pointsRequired || 0)
                : (itemData.conditions?.bonusStamps || itemData.pointsRequired || 5);
              
              const current = isReward
                ? (itemData.customerProgress?.['current-user'] || itemData.currentPoints || 0)
                : (itemData.customerProgress?.['current-user'] || itemData.currentPoints || 0);
              
              const progress = required > 0 ? `${current}/${required}` : '0/0';
              
              return (
                <TouchableOpacity
                  key={`${business.id}-${rewardOrCampaign.type}-${itemData.id || idx}`}
                  style={styles.rewardCard}
                  onPress={() => onNavigate('BusinessDetail', {businessId: business.id})}>
                  <View style={styles.rewardIcon}>
                    <Text style={styles.rewardIconText}>
                      {isReward ? '🎁' : '🎯'}
                    </Text>
                  </View>
                  <View style={styles.rewardContent}>
                    <View style={styles.rewardHeader}>
                      <Text style={styles.rewardTypeLabel}>
                        {isReward ? 'Reward' : 'Campaign'}
                      </Text>
                      <Text style={styles.rewardProgress}>{progress}</Text>
                    </View>
                    <Text style={styles.rewardDescription} numberOfLines={2}>
                      {itemData.description || itemData.name || 'No description'}
                    </Text>
                    <Text style={styles.rewardBusiness}>
                      {business.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            });
          })()}
        </ScrollView>
      )}
    </View>
  );
};

// Main SearchPage Component
const SearchPageContent: React.FC<SearchPageProps> = ({
  currentScreen,
  onNavigate,
  onBack,
  onScanPress,
}) => {
  const [searchMode, setSearchMode] = useState<SearchMode>(SearchMode.TEXT);

  return (
    <PageTemplate
      title="Find Rewards Near You"
      currentScreen={currentScreen}
      onNavigate={onNavigate}
      onBack={onBack}
      onScanPress={onScanPress}
      showBanner={false}>
      <View style={styles.container}>
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              searchMode === SearchMode.TEXT && styles.modeButtonActive,
            ]}
            onPress={() => setSearchMode(SearchMode.TEXT)}>
            <Text
              style={[
                styles.modeButtonText,
                searchMode === SearchMode.TEXT && styles.modeButtonTextActive,
              ]}>
              Text Search
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              searchMode === SearchMode.MAP && styles.modeButtonActive,
            ]}
            onPress={() => setSearchMode(SearchMode.MAP)}>
            <Text
                style={[
                styles.modeButtonText,
                searchMode === SearchMode.MAP && styles.modeButtonTextActive,
              ]}>
              Map Search
                </Text>
          </TouchableOpacity>
              </View>

        {searchMode === SearchMode.TEXT ? (
          <TextSearch onNavigate={onNavigate} />
        ) : (
          <MapSearch onNavigate={onNavigate} />
        )}
      </View>
    </PageTemplate>
  );
};

// Wrapper with SearchProvider
const SearchPage: React.FC<SearchPageProps> = (props) => {
  return (
    <SearchProvider>
      <SearchPageContent {...props} />
    </SearchProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modeToggle: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.neutral[100],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  modeButton: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  modeButtonActive: {
    backgroundColor: Colors.primary,
  },
  modeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  modeButtonTextActive: {
    color: Colors.background,
  },
  form: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  autocompleteContainer: {
    position: 'relative',
    zIndex: 10,
    marginBottom: 8,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.background,
  },
  loadingIndicator: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  dropdown: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    maxHeight: 200,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  suggestionLabel: {
    fontSize: 16,
    color: Colors.text.primary,
    flex: 1,
  },
  badge: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  filterLabel: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  searchButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  searchButtonText: {
    color: Colors.background,
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: Colors.neutral[100],
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    color: Colors.secondary,
    fontSize: 16,
    textAlign: 'center',
  },
  resultsContainer: {
    marginTop: 16,
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  resultSector: {
    fontSize: 14,
    color: Colors.primary,
    marginBottom: 4,
  },
  resultAddress: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  resultDistance: {
    fontSize: 12,
    color: Colors.text.light,
  },
  rewardCard: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  rewardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rewardIconText: {
    fontSize: 24,
  },
  rewardContent: {
    flex: 1,
  },
  rewardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  rewardTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rewardProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  rewardDescription: {
    fontSize: 14,
    color: Colors.text.primary,
    marginBottom: 6,
    lineHeight: 20,
  },
  rewardBusiness: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  radioGroup: {
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioButtonSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  radioLabel: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: 8,
    backgroundColor: Colors.background,
    minWidth: 120,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: Colors.text.primary,
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 8,
    minWidth: 200,
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  modalOptionText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  mapContainer: {
    flex: 1,
  },
  mapWrapper: {
    width: '100%',
    height: 300,
    backgroundColor: Colors.neutral[200],
  },
  mapPlaceholder: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral[200],
    padding: 32,
  },
  mapTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 8,
  },
  mapSubtext: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  mapSearchPanel: {
    padding: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
  },
});

export default SearchPage;

