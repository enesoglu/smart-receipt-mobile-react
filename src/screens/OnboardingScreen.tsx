import React, { useState } from 'react';
import { Dimensions, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'> };

const { width } = Dimensions.get('window');

const pages: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string }[] = [
  { icon: 'receipt-outline', title: 'Say goodbye to paper receipts', subtitle: 'Digitize your receipts easily' },
  { icon: 'bar-chart-outline', title: 'Monitor your daily spending', subtitle: 'Track your expenses with charts' },
  { icon: 'cloud-outline', title: 'Easily access your receipts anywhere', subtitle: 'Your receipts are always with you' },
];

export default function OnboardingScreen({ navigation }: Props) {
  const [currentPage, setCurrentPage] = useState(0);
  const page = pages[currentPage];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.pageContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name={page.icon} size={78} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>{page.title}</Text>
        <Text style={styles.subtitle}>{page.subtitle}</Text>
      </View>

      <View style={styles.indicatorContainer}>
        {pages.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.indicator, currentPage === index ? styles.indicatorActive : styles.indicatorInactive]}
            onPress={() => setCurrentPage(index)}
          />
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.replace('Register')}>
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.replace('Login')}>
          <Text style={styles.secondaryButtonText}>Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#4A6CFA' },
  pageContainer: { width, flex: 1, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center' },
  iconContainer: {
    width: 150, height: 150, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 42,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', lineHeight: 34, marginBottom: 14 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.82)', textAlign: 'center' },
  indicatorContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 34 },
  indicator: { marginHorizontal: 5, borderRadius: 5 },
  indicatorActive: { width: 20, height: 8, backgroundColor: '#FFFFFF' },
  indicatorInactive: { width: 8, height: 8, backgroundColor: 'rgba(255,255,255,0.4)' },
  buttonContainer: { paddingHorizontal: 32, paddingBottom: 40 },
  primaryButton: { backgroundColor: '#FFFFFF', paddingVertical: 16, borderRadius: 30, alignItems: 'center', marginBottom: 12 },
  primaryButtonText: { color: '#4A6CFA', fontSize: 16, fontWeight: '700' },
  secondaryButton: { borderColor: '#FFFFFF', borderWidth: 2, paddingVertical: 14, borderRadius: 30, alignItems: 'center' },
  secondaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
