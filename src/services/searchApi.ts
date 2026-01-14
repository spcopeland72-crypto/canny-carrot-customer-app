/**
 * GeoSearch API Service
 * Implements text search, map search, autocomplete, and user submissions
 */

import { SearchCriteria, MapBounds, AutocompleteSuggestion, UserSubmittedEntry } from '../types/search.types';
import { SearchResult } from '../types/business.types';
import { Platform } from 'react-native';

// Determine API base URL based on environment
const getApiBaseUrl = (): string => {
  // For web production, use production API
  if (Platform.OS === 'web' && !__DEV__) {
    return 'https://api.cannycarrot.com/api/v1';
  }
  // For development or local testing
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Text Search Endpoint
 * POST /api/v1/search/text
 */
export async function searchText(
  criteria: SearchCriteria,
  page: number = 1
): Promise<SearchResult> {
  const response = await apiCall<SearchResult>('/search/text', {
    method: 'POST',
    body: JSON.stringify({
      ...criteria,
      page,
      pageSize: criteria.pageSize || 20,
    }),
  });

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.error || 'Search failed');
}

/**
 * Map Search Endpoint
 * POST /api/v1/search/map
 */
export async function searchMap(
  bounds: MapBounds,
  criteria?: Partial<SearchCriteria>
): Promise<SearchResult> {
  const response = await apiCall<SearchResult>('/search/map', {
    method: 'POST',
    body: JSON.stringify({
      bounds,
      ...criteria,
    }),
  });

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.error || 'Map search failed');
}

export const searchApi = {
  text: searchText,
  map: searchMap,
};


