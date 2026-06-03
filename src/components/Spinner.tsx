import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export function Spinner({ caption }: { caption?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4A6CFA" />
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5' },
  caption: { marginTop: 12, color: '#555', fontSize: 14 },
});
