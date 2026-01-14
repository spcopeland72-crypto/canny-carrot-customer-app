/**
 * Business Type Definitions for GeoSearch
 * Extends existing Business type with additional fields
 */

import { Coordinates } from './search.types';

// Business entity
export interface Business {
  id: string;
  name: string;
  sector: string;
  location: BusinessLocation;
  rewardsPrograms: RewardProgram[];
  campaigns: Campaign[];
  status: 'active' | 'inactive' | 'pending';
  thumbnailUrl?: string;
  createdDate: Date;
  distanceFromSearch?: number; // in miles, if location provided
}

export interface BusinessLocation {
  country: string;
  region: string;
  city: string;
  street: string;
  postcode: string;
  coordinates: Coordinates;
  formattedAddress: string;
}

// Rewards program
export interface RewardProgram {
  id: string;
  name: string;
  description: string;
  active: boolean;
  startDate: Date;
  endDate?: Date;
}

// Campaign
export interface Campaign {
  id: string;
  name: string;
  description: string;
  active: boolean;
  startDate: Date;
  endDate: Date;
}

// Search result
export interface SearchResult {
  results: Business[];
  totalCount: number;
  page?: number;
  hasMore?: boolean;
}

