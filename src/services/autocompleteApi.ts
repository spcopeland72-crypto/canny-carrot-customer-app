/**
 * Autocomplete API Service
 * GET /api/v1/suggestions/{fieldType}?query={searchTerm}
 */

import { AutocompleteSuggestion } from '../types/search.types';

const API_BASE_URL = 'http://localhost:3001/api/v1';

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

type FieldType = 'businessName' | 'sector' | 'country' | 'region' | 'city' | 'street';

/**
 * Fetch autocomplete suggestions
 * GET /api/v1/suggestions/{fieldType}?query={searchTerm}
 * 
 * Note: For 'businessName' fieldType, the backend should return suggestions
 * from active businesses in Redis (status: 'active').
 * Backend should query Redis for businesses matching the query and filter by active status.
 */
export async function fetchAutocompleteSuggestions(
  fieldType: FieldType,
  query: string
): Promise<AutocompleteSuggestion[]> {
  if (query.length < 2) {
    return [];
  }

  const response = await apiCall<{ suggestions: AutocompleteSuggestion[] }>(
    `/suggestions/${fieldType}?query=${encodeURIComponent(query)}`
  );

  if (response.success && response.data) {
    return response.data.suggestions;
  }

  return [];
}

export const autocompleteApi = {
  fetch: fetchAutocompleteSuggestions,
};


