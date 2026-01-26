/**
 * useGeoSearch Hook
 * Manages text and map search operations
 */

import { useState, useCallback } from 'react';
import { SearchCriteria, MapBounds } from '../types/search.types';
import { Business } from '../types/business.types';
import { searchText, searchMap } from '../services/searchApi';

export const useGeoSearch = () => {
  const [results, setResults] = useState<Business[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performTextSearch = useCallback(
    async (criteria: SearchCriteria, page: number = 1) => {
      setLoading(true);
      setError(null);

      try {
        const response = await searchText(criteria, page);
        setResults(response.results);
        setTotalCount(response.totalCount);
      } catch (err) {
        setError('Search failed. Please try again.');
        setResults([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const performMapSearch = useCallback(
    async (bounds: MapBounds, criteria?: Partial<SearchCriteria>) => {
      setLoading(true);
      setError(null);

      try {
        const response = await searchMap(bounds, criteria);
        setResults(response.results);
        setTotalCount(response.totalCount);
      } catch (err) {
        setError('Map search failed. Please try again.');
        setResults([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    results,
    totalCount,
    loading,
    error,
    performTextSearch,
    performMapSearch,
  };
};







