/**
 * useAutocomplete Hook
 * Manages autocomplete suggestions with debouncing
 */

import { useState, useCallback, useRef } from 'react';
import { AutocompleteSuggestion } from '../types/search.types';
import { fetchAutocompleteSuggestions } from '../services/autocompleteApi';

type FieldType = 'businessName' | 'sector' | 'country' | 'region' | 'city' | 'street';

export const useAutocomplete = (fieldType: FieldType) => {
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce: wait 300ms before making API call
      debounceTimerRef.current = setTimeout(async () => {
        setLoading(true);
        setError(null);

        try {
          const results = await fetchAutocompleteSuggestions(fieldType, query);
          setSuggestions(results);
        } catch (err) {
          setError('Failed to fetch suggestions');
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      }, 300);
    },
    [fieldType]
  );

  return { suggestions, loading, error, fetchSuggestions };
};

