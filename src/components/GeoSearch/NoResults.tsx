/**
 * NoResults Component
 * Displays when no search results are found
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';

const NoResults: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>No businesses found</Text>
      <Text style={styles.subtitle}>
        Try expanding your search area or removing some filters
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});

export default NoResults;


