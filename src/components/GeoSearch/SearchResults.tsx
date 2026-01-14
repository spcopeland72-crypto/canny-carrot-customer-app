/**
 * SearchResults Component
 * Displays search results with ResultCard components
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Business } from '../../types/business.types';
import ResultCard from './ResultCard';
import NoResults from './NoResults';
import { Colors } from '../../constants/Colors';

interface SearchResultsProps {
  results: Business[];
  totalCount: number;
  onNavigate: (screen: string, params?: any) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  totalCount,
  onNavigate,
}) => {
  if (results.length === 0) {
    return <NoResults />;
  }

  const renderItem = ({ item }: { item: Business }) => (
    <ResultCard business={item} onNavigate={onNavigate} />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.resultCount}>
          {totalCount} {totalCount === 1 ? 'result' : 'results'} found
        </Text>
      </View>
      <FlatList
        data={results}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    backgroundColor: Colors.neutral[50],
  },
  resultCount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  list: {
    padding: 16,
  },
});

export default SearchResults;


