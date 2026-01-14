/**
 * MapSearch Component
 * Implements Google Maps-based search (placeholder for react-native-maps)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSearchContext } from '../../contexts/SearchContext';
import { useGeoSearch } from '../../hooks/useGeoSearch';
import { MapBounds } from '../../types/search.types';
import { locationService } from '../../services/location';
import SearchResults from './SearchResults';
import { Colors } from '../../constants/Colors';

interface MapSearchProps {
  onNavigate: (screen: string, params?: any) => void;
}

const MapSearch: React.FC<MapSearchProps> = ({ onNavigate }) => {
  const { state, dispatch } = useSearchContext();
  const { performMapSearch, results, totalCount, loading, error } = useGeoSearch();
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    const initializeLocation = async () => {
      const hasPermission = await locationService.requestPermission();
      if (hasPermission) {
        const location = await locationService.getCurrentLocation();
        if (location) {
          setUserLocation({
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          });
        }
      }
    };
    initializeLocation();
  }, []);

  const handleSearchThisArea = () => {
    if (!userLocation) return;

    // Create bounds around user location (approximate 5km radius)
    const bounds: MapBounds = {
      northeast: {
        lat: userLocation.lat + 0.045, // ~5km
        lng: userLocation.lng + 0.045,
      },
      southwest: {
        lat: userLocation.lat - 0.045,
        lng: userLocation.lng - 0.045,
      },
    };

    dispatch({ type: 'SET_LOADING', payload: true });
    performMapSearch(bounds);
  };

  return (
    <View style={styles.container}>
      {/* Map placeholder - would use react-native-maps here */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapTitle}>Interactive Map</Text>
        <Text style={styles.mapSubtext}>
          {userLocation
            ? `Your location: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
            : 'Enable location to see map'}
        </Text>
        {userLocation && (
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearchThisArea}>
            <Text style={styles.searchButtonText}>Search This Area</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search results below map */}
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
  mapPlaceholder: {
    height: 300,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  mapTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 8,
  },
  mapSubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  searchButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  searchButtonText: {
    color: Colors.background,
    fontSize: 16,
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
});

export default MapSearch;


