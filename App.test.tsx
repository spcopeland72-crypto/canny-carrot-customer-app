import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

// Simple test component to verify the app works
function TestApp(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Canny Carrot App</Text>
      <Text style={styles.subtext}>If you see this, the app is working!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0E7C86',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    color: '#666',
  },
});

export default TestApp;


