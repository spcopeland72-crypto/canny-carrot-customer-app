/**
 * Location & Geofencing Service
 * For Canny Carrot Customer App
 */

import { Platform } from 'react-native';
import * as Location from 'expo-location';

// Types
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeofenceRegion {
  id: string;
  businessId: string;
  businessName: string;
  center: Coordinates;
  radius: number; // meters
}

export interface LocationResult {
  coords: Coordinates;
  accuracy: number;
  timestamp: number;
}

/**
 * Location Service
 * Handles user location tracking and geofencing
 */
export class LocationService {
  private static instance: LocationService;
  private watchId: number | Location.LocationSubscription | null = null;
  private currentLocation: LocationResult | null = null;
  private geofences: GeofenceRegion[] = [];
  private activeGeofences: Set<string> = new Set();
  private geofenceListeners: Array<(event: GeofenceEvent) => void> = [];
  private locationListeners: Array<(location: LocationResult) => void> = [];

  private constructor() {}

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Request location permissions
   */
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return this.requestWebPermission();
    } else {
      return this.requestMobilePermission();
    }
  }

  private async requestWebPermission(): Promise<boolean> {
    if (!('geolocation' in navigator)) {
      console.log('Geolocation not supported');
      return false;
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      if (result.state === 'granted') {
        return true;
      } else if (result.state === 'prompt') {
        // Will be prompted when we try to get location
        return true;
      }
      return false;
    } catch (error) {
      // Some browsers don't support permissions API
      return true; // Will be prompted when we try to get location
    }
  }

  private async requestMobilePermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Location permission request failed:', error);
      return false;
    }
  }

  /**
   * Get current location
   */
  async getCurrentLocation(): Promise<LocationResult | null> {
    if (Platform.OS === 'web') {
      return this.getWebLocation();
    } else {
      return this.getMobileLocation();
    }
  }

  private getWebLocation(): Promise<LocationResult | null> {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const result: LocationResult = {
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          this.currentLocation = result;
          resolve(result);
        },
        (error) => {
          console.error('Geolocation error:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }

  private async getMobileLocation(): Promise<LocationResult | null> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission not granted');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const result: LocationResult = {
        coords: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        accuracy: location.coords.accuracy || 100,
        timestamp: location.timestamp,
      };

      this.currentLocation = result;
      return result;
    } catch (error) {
      console.error('Get mobile location failed:', error);
      return null;
    }
  }

  /**
   * Start watching location
   */
  startWatching() {
    if (Platform.OS === 'web') {
      this.startWebWatching();
    } else {
      this.startMobileWatching();
    }
  }

  private startWebWatching() {
    if (!('geolocation' in navigator) || this.watchId !== null) {
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const result: LocationResult = {
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        this.currentLocation = result;
        this.notifyLocationListeners(result);
        this.checkGeofences(result.coords);
      },
      (error) => {
        console.error('Watch position error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }

  private async startMobileWatching() {
    if (this.watchId !== null) {
      return; // Already watching
    }

    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission not granted for watching');
        return;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          const result: LocationResult = {
            coords: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            },
            accuracy: location.coords.accuracy || 100,
            timestamp: location.timestamp,
          };
          this.currentLocation = result;
          this.notifyLocationListeners(result);
          this.checkGeofences(result.coords);
        }
      );

      // Store subscription ID (expo-location returns a subscription object)
      this.watchId = subscription as any;
    } catch (error) {
      console.error('Start mobile location watching failed:', error);
    }
  }

  /**
   * Stop watching location
   */
  stopWatching() {
    if (Platform.OS === 'web' && this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    } else if (Platform.OS !== 'web' && this.watchId !== null) {
      // For mobile: expo-location subscription has remove() method
      if (this.watchId && typeof (this.watchId as any).remove === 'function') {
        (this.watchId as any).remove();
      }
      this.watchId = null;
    }
  }

  /**
   * Add geofence region
   */
  addGeofence(region: GeofenceRegion) {
    this.geofences.push(region);
    console.log(`Geofence added: ${region.businessName}`);
  }

  /**
   * Remove geofence region
   */
  removeGeofence(regionId: string) {
    this.geofences = this.geofences.filter(r => r.id !== regionId);
    this.activeGeofences.delete(regionId);
  }

  /**
   * Load business geofences from API
   */
  async loadBusinessGeofences(apiBaseUrl: string): Promise<void> {
    try {
      const location = await this.getCurrentLocation();
      if (!location) return;

      const response = await fetch(
        `${apiBaseUrl}/api/v1/businesses?lat=${location.coords.latitude}&lng=${location.coords.longitude}&radius=5`
      );
      
      if (!response.ok) return;
      
      const result = await response.json();
      if (result.success && result.data) {
        result.data.forEach((business: any) => {
          if (business.address?.latitude && business.address?.longitude) {
            this.addGeofence({
              id: `geofence-${business.id}`,
              businessId: business.id,
              businessName: business.name,
              center: {
                latitude: business.address.latitude,
                longitude: business.address.longitude,
              },
              radius: 100, // 100 meters default radius
            });
          }
        });
      }
    } catch (error) {
      console.error('Failed to load business geofences:', error);
    }
  }

  /**
   * Check if user is inside any geofences
   */
  private checkGeofences(coords: Coordinates) {
    this.geofences.forEach((region) => {
      const distance = this.calculateDistance(coords, region.center);
      const isInside = distance <= region.radius;
      const wasInside = this.activeGeofences.has(region.id);

      if (isInside && !wasInside) {
        // Entered geofence
        this.activeGeofences.add(region.id);
        this.notifyGeofenceListeners({
          type: 'enter',
          region,
          timestamp: Date.now(),
        });
      } else if (!isInside && wasInside) {
        // Exited geofence
        this.activeGeofences.delete(region.id);
        this.notifyGeofenceListeners({
          type: 'exit',
          region,
          timestamp: Date.now(),
        });
      }
    });
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371000; // Earth's radius in meters
    const lat1 = this.toRadians(coord1.latitude);
    const lat2 = this.toRadians(coord2.latitude);
    const deltaLat = this.toRadians(coord2.latitude - coord1.latitude);
    const deltaLng = this.toRadians(coord2.longitude - coord1.longitude);

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Add location listener
   */
  addLocationListener(callback: (location: LocationResult) => void): () => void {
    this.locationListeners.push(callback);
    return () => {
      this.locationListeners = this.locationListeners.filter(l => l !== callback);
    };
  }

  private notifyLocationListeners(location: LocationResult) {
    this.locationListeners.forEach(listener => {
      try {
        listener(location);
      } catch (error) {
        console.error('Location listener error:', error);
      }
    });
  }

  /**
   * Add geofence listener
   */
  addGeofenceListener(callback: (event: GeofenceEvent) => void): () => void {
    this.geofenceListeners.push(callback);
    return () => {
      this.geofenceListeners = this.geofenceListeners.filter(l => l !== callback);
    };
  }

  private notifyGeofenceListeners(event: GeofenceEvent) {
    this.geofenceListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Geofence listener error:', error);
      }
    });
  }

  /**
   * Get nearby businesses sorted by distance
   */
  async getNearbyBusinesses(apiBaseUrl: string, limit: number = 10): Promise<any[]> {
    const location = await this.getCurrentLocation();
    if (!location) return [];

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/v1/businesses?lat=${location.coords.latitude}&lng=${location.coords.longitude}&limit=${limit}`
      );
      
      if (!response.ok) return [];
      
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Failed to get nearby businesses:', error);
      return [];
    }
  }

  /**
   * Format distance for display
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  }
}

// Geofence Event type
export interface GeofenceEvent {
  type: 'enter' | 'exit';
  region: GeofenceRegion;
  timestamp: number;
}

// Export singleton instance
export const locationService = LocationService.getInstance();

/**
 * Tees Valley Business Locations (Demo Data)
 * These would normally come from the API
 */
export const TEES_VALLEY_LOCATIONS: GeofenceRegion[] = [
  {
    id: 'geofence-cafe-maison',
    businessId: 'cafe-maison',
    businessName: 'Cafe Maison',
    center: { latitude: 54.5742, longitude: -1.2349 },
    radius: 100,
  },
  {
    id: 'geofence-stables',
    businessId: 'the-stables',
    businessName: 'The Stables',
    center: { latitude: 54.5685, longitude: -1.3120 },
    radius: 100,
  },
  {
    id: 'geofence-glow-beauty',
    businessId: 'glow-beauty',
    businessName: 'Glow Beauty',
    center: { latitude: 54.5247, longitude: -1.5526 },
    radius: 100,
  },
  // Add more Tees Valley businesses...
];

export default locationService;






