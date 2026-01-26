/**
 * SearchContext for GeoSearch
 * Manages search state across components
 */

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { SearchCriteria, SearchMode } from '../types/search.types';
import { Business } from '../types/business.types';

interface SearchState {
  mode: SearchMode;
  criteria: SearchCriteria;
  results: Business[];
  totalCount: number;
  loading: boolean;
  error: string | null;
}

type SearchAction =
  | { type: 'SET_MODE'; payload: SearchMode }
  | { type: 'SET_CRITERIA'; payload: SearchCriteria }
  | { type: 'SET_RESULTS'; payload: { results: Business[]; totalCount: number } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_SEARCH' };

const initialState: SearchState = {
  mode: SearchMode.TEXT,
  criteria: {},
  results: [],
  totalCount: 0,
  loading: false,
  error: null,
};

const searchReducer = (state: SearchState, action: SearchAction): SearchState => {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.payload };
    case 'SET_CRITERIA':
      return { ...state, criteria: action.payload };
    case 'SET_RESULTS':
      return {
        ...state,
        results: action.payload.results,
        totalCount: action.payload.totalCount,
        loading: false,
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'RESET_SEARCH':
      return initialState;
    default:
      return state;
  }
};

interface SearchContextType {
  state: SearchState;
  dispatch: React.Dispatch<SearchAction>;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(searchReducer, initialState);

  return (
    <SearchContext.Provider value={{ state, dispatch }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearchContext = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearchContext must be used within SearchProvider');
  }
  return context;
};







