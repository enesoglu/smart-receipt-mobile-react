import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ReceiptsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Receipts History</Text>
      <Text style={styles.subText}>API connection expected in Week 4</Text>
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  subText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  }
});
