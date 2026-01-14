/**
 * GeoSearchPage - Main Page Component
 * Implements dual search modes: Text and Map
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SearchMode } from '../../types/search.types';
import { SearchProvider } from '../../contexts/SearchContext';
import PageTemplate from '../PageTemplate';
import SearchModeToggle from './SearchModeToggle';
import TextSearch from './TextSearch';
import MapSearch from './MapSearch';
import { Colors } from '../../constants/Colors';

interface GeoSearchPageProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onBack?: () => void;
  onScanPress?: () => void;
}

const GeoSearchPage: React.FC<GeoSearchPageProps> = ({
  currentScreen,
  onNavigate,
  onBack,
  onScanPress,
}) => {
  const [searchMode, setSearchMode] = useState<SearchMode>(SearchMode.TEXT);

  return (
    <SearchProvider>
      <PageTemplate
        title="Find Rewards Near You"
        currentScreen={currentScreen}
        onNavigate={onNavigate}
        onBack={onBack}
        onScanPress={onScanPress}>
        <View style={styles.container}>
          <SearchModeToggle mode={searchMode} onModeChange={setSearchMode} />
          <View style={styles.searchContainer}>
            {searchMode === SearchMode.TEXT ? (
              <TextSearch onNavigate={onNavigate} />
            ) : (
              <MapSearch onNavigate={onNavigate} />
            )}
          </View>
        </View>
      </PageTemplate>
    </SearchProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    flex: 1,
  },
});

export default GeoSearchPage;


