/**
 * ResultCard Component
 * Displays individual business search result
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Business } from '../../types/business.types';
import { Colors } from '../../constants/Colors';

interface ResultCardProps {
  business: Business;
  onNavigate: (screen: string, params?: any) => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ business, onNavigate }) => {
  const handlePress = () => {
    onNavigate('BusinessDetail', { businessId: business.id });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      {business.thumbnailUrl && (
        <Image
          source={{ uri: business.thumbnailUrl }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      )}
      <View style={styles.content}>
        <Text style={styles.name}>{business.name}</Text>
        <Text style={styles.sector}>{business.sector}</Text>
        <Text style={styles.address} numberOfLines={2}>
          {business.location.formattedAddress}
        </Text>
        {business.distanceFromSearch !== undefined && (
          <Text style={styles.distance}>
            {business.distanceFromSearch.toFixed(1)} miles away
          </Text>
        )}
        <View style={styles.badges}>
          {business.rewardsPrograms.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {business.rewardsPrograms.length} Reward
                {business.rewardsPrograms.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
          {business.campaigns.length > 0 && (
            <View style={[styles.badge, styles.campaignBadge]}>
              <Text style={styles.badgeText}>
                {business.campaigns.length} Campaign
                {business.campaigns.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  sector: {
    fontSize: 14,
    color: Colors.primary,
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  distance: {
    fontSize: 12,
    color: Colors.text.light,
    marginBottom: 8,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  campaignBadge: {
    backgroundColor: Colors.accent,
  },
  badgeText: {
    fontSize: 12,
    color: Colors.background,
    fontWeight: '600',
  },
});

export default ResultCard;







