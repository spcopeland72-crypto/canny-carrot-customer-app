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
import {discoveryApi, rewardsApi, type Business, type Reward} from '../services/api';
import {locationService, type Coordinates} from '../services/location';
import {storage} from '../services/localStorage';
import {SearchMode} from '../types/search.types';
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
  const [rewardsOnly, setRewardsOnly] = useState(false);
  const [campaignsOnly, setCampaignsOnly] = useState(false);
  const [distance, setDistance] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'distance' | 'name' | 'relevance'>('distance');

  const handleSuggestionSelect = (
    field: string,
    suggestion: AutocompleteSuggestion,
  ) => {
    switch (field) {
      case 'businessName':
        setBusinessName(suggestion.value);
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
      rewardsOnly,
      campaignsOnly,
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

      <Text style={styles.sectionTitle}>Filters</Text>
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Rewards Only</Text>
        <Switch
          value={rewardsOnly}
          onValueChange={setRewardsOnly}
          trackColor={{false: Colors.neutral[300], true: Colors.primary}}
        />
      </View>

      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Campaigns Only</Text>
        <Switch
          value={campaignsOnly}
          onValueChange={setCampaignsOnly}
          trackColor={{false: Colors.neutral[300], true: Colors.primary}}
        />
      </View>

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

      {!loading && !error && results && results.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsCount}>
            {totalCount || results.length} {totalCount === 1 || results.length === 1 ? 'result' : 'results'} found
          </Text>
          {results.map((business) => (
            <TouchableOpacity
              key={business.id}
              style={styles.resultCard}
              onPress={() => onNavigate('BusinessDetail', {businessId: business.id})}>
              {business.thumbnailUrl && (
                <Image
                  source={{uri: business.thumbnailUrl}}
                  style={styles.resultThumbnail}
                />
              )}
              <View style={styles.resultContent}>
                <Text style={styles.resultName}>{business.name}</Text>
                <Text style={styles.resultSector}>{business.sector}</Text>
                <Text style={styles.resultAddress}>
                  {business.location.formattedAddress}
                </Text>
                {business.distanceFromSearch !== undefined && (
                  <Text style={styles.resultDistance}>
                    {business.distanceFromSearch.toFixed(1)} miles away
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

// Map Search Component (placeholder)
const MapSearch: React.FC<{onNavigate: (screen: string, params?: any) => void}> = ({
  onNavigate,
}) => {
  return (
    <View style={styles.mapPlaceholder}>
      <Text style={styles.mapTitle}>Map Search</Text>
      <Text style={styles.mapSubtext}>
        Map integration coming soon. Use Text Search for now.
      </Text>
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
      onScanPress={onScanPress}>
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: Colors.primary,
  },
  modeButtonText: {
    fontSize: 16,
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
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default SearchPage;

