import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginHorizontal: 16, marginBottom: 18 },
  title: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 10 },
});
