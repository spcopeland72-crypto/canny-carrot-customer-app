/**
 * SearchModeToggle Component
 * Toggles between Text and Map search modes
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SearchMode } from '../../types/search.types';
import { Colors } from '../../constants/Colors';

interface SearchModeToggleProps {
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
}

const SearchModeToggle: React.FC<SearchModeToggleProps> = ({ mode, onModeChange }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, mode === SearchMode.TEXT && styles.buttonActive]}
        onPress={() => onModeChange(SearchMode.TEXT)}>
        <Text
          style={[styles.buttonText, mode === SearchMode.TEXT && styles.buttonTextActive]}>
          Text Search
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, mode === SearchMode.MAP && styles.buttonActive]}
        onPress={() => onModeChange(SearchMode.MAP)}>
        <Text
          style={[styles.buttonText, mode === SearchMode.MAP && styles.buttonTextActive]}>
          Map Search
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.neutral[100],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: {
    backgroundColor: Colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  buttonTextActive: {
    color: Colors.background,
  },
});

export default SearchModeToggle;


