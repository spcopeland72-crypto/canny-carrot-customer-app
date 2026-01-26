/**
 * AutocompleteInput Component
 * React Native implementation with debouncing and suggestion dropdown
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useAutocomplete } from '../../hooks/useAutocomplete';
import { AutocompleteSuggestion } from '../../types/search.types';
import { Colors } from '../../constants/Colors';

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
  const { suggestions, loading, fetchSuggestions } = useAutocomplete(fieldType);
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
    // Check if entered value is not in suggestions
    setTimeout(() => {
      if (value && !suggestions.find((s) => s.value === value)) {
        onNewEntry?.(value);
      }
      setIsOpen(false);
    }, 200);
  };

  const renderSuggestion = ({ item }: { item: AutocompleteSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSelect(item)}>
      <Text style={styles.suggestionLabel}>{item.label}</Text>
      {item.type === 'userSubmitted' && (
        <Text style={styles.badge}>Pending Review</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      )}
      {isOpen && suggestions.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item, index) => `${item.value}-${index}`}
            keyboardShouldPersistTaps="handled"
            style={styles.suggestionsList}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 10,
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
  loadingContainer: {
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
});

export default AutocompleteInput;







