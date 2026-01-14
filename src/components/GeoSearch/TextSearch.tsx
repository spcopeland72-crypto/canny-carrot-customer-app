/**
 * TextSearch Component
 * Implements structured text search with autocomplete fields
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useSearchContext } from '../../contexts/SearchContext';
import { useGeoSearch } from '../../hooks/useGeoSearch';
import { SearchCriteria } from '../../types/search.types';
import AutocompleteInput from './AutocompleteInput';
import SearchResults from './SearchResults';
import { AutocompleteSuggestion } from '../../types/search.types';
import { Colors } from '../../constants/Colors';

interface TextSearchProps {
  onNavigate: (screen: string, params?: any) => void;
}

const TextSearch: React.FC<TextSearchProps> = ({ onNavigate }) => {
  const { state, dispatch } = useSearchContext();
  const { performTextSearch, results, totalCount, loading, error } = useGeoSearch();

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

  const handleSuggestionSelect = (
    field: string,
    suggestion: AutocompleteSuggestion
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

  const handleSearch = () => {
    const criteria: SearchCriteria = {
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
      sortBy: 'distance',
    };

    dispatch({ type: 'SET_CRITERIA', payload: criteria });
    dispatch({ type: 'SET_LOADING', payload: true });
    performTextSearch(criteria);
  };

  const handleNewEntry = async (field: string, value: string) => {
    // TODO: Submit to user submissions API
    console.log(`New entry for ${field}: ${value}`);
  };

  return (
    <View style={styles.container}>
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

        <View style={styles.postcodeContainer}>
          <TextInput
            style={styles.postcodeInput}
            placeholder="Postcode"
            value={postcode}
            onChangeText={setPostcode}
            placeholderTextColor={Colors.text.light}
            autoCapitalize="characters"
          />
        </View>

        <Text style={styles.sectionTitle}>Filters</Text>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Rewards Only</Text>
          <Switch
            value={rewardsOnly}
            onValueChange={setRewardsOnly}
            trackColor={{ false: Colors.neutral[300], true: Colors.primary }}
          />
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Campaigns Only</Text>
          <Switch
            value={campaignsOnly}
            onValueChange={setCampaignsOnly}
            trackColor={{ false: Colors.neutral[300], true: Colors.primary }}
          />
        </View>

        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </ScrollView>

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

      {!loading && !error && results.length > 0 && (
        <SearchResults
          results={results}
          totalCount={totalCount}
          onNavigate={onNavigate}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  postcodeContainer: {
    marginTop: 8,
  },
  postcodeInput: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.background,
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
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
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
});

export default TextSearch;

