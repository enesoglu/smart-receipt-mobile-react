import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function EmptyState({ icon = 'receipt-outline', title, message }: { icon?: keyof typeof Ionicons.glyphMap; title: string; message: string }) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={44} color="#B8C0D9" />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  title: { marginTop: 12, fontSize: 17, fontWeight: '700', color: '#333' },
  message: { marginTop: 6, fontSize: 14, color: '#888', textAlign: 'center' },
});
