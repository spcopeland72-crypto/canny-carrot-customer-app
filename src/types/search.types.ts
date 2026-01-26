/**
 * GeoSearch Type Definitions
 * Based on GeoSearch_Implementation_Spec.txt
 */

// Search mode enumeration
export enum SearchMode {
  TEXT = 'text',
  MAP = 'map',
}

// Search criteria interface
export interface SearchCriteria {
  businessName?: string;
  sector?: string;
  location?: LocationCriteria;
  rewardsOnly?: boolean;
  campaignsOnly?: boolean;
  distance?: number; // in miles
  sortBy?: 'distance' | 'name' | 'relevance';
  page?: number;
  pageSize?: number;
}

// Location criteria (hierarchical)
export interface LocationCriteria {
  country?: string;
  region?: string;
  city?: string;
  street?: string;
  postcode?: string;
  coordinates?: Coordinates;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

// Map bounds for spatial queries
export interface MapBounds {
  northeast: Coordinates;
  southwest: Coordinates;
}

// Autocomplete suggestion
export interface AutocompleteSuggestion {
  value: string;
  label: string;
  type: 'verified' | 'userSubmitted';
  metadata?: Record<string, any>;
}

// User-submitted entry
export interface UserSubmittedEntry {
  id?: string;
  fieldType: 'businessName' | 'sector' | 'country' | 'region' | 'city' | 'street' | 'postcode';
  enteredValue: string;
  context?: Record<string, any>;
  userId: string;
  sessionId: string;
  timestamp: Date;
  status?: 'pending' | 'approved' | 'rejected';
}







