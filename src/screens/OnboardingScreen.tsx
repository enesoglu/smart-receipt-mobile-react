import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type OnboardingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

interface Props {
  navigation: OnboardingScreenNavigationProp;
}

const { width } = Dimensions.get('window');

const pages = [
  {
    icon: '🧾', // placeholder for Material Icons (receipt_long)
    title: 'Say goodbye 👋\nto paper receipts',
    subtitle: 'Digitize your receipts easily',
  },
  {
    icon: '📊', // placeholder for bar_chart
    title: 'Monitor your\ndaily spending',
    subtitle: 'Track your expenses with charts',
  },
  {
    icon: '📍', // placeholder for location_on
    title: 'Easily access your\nreceipts anywhere',
    subtitle: 'Your receipts are always with you',
  },
];

export default function OnboardingScreen({ navigation }: Props) {
  const [currentPage, setCurrentPage] = useState(0);

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setCurrentPage(Math.round(index));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        <View style={styles.carouselContainer}>
          {/* We'll use a simple horizontal ScrollView as a PageView */}
          {pages.map((page, index) => (
            <View key={index} style={[styles.pageContainer, { display: currentPage === index ? 'flex' : 'none' }]}>
              <View style={styles.iconContainer}>
                <Text style={styles.iconText}>{page.icon}</Text>
              </View>
              <Text style={styles.title}>{page.title}</Text>
              <Text style={styles.subtitle}>{page.subtitle}</Text>
            </View>
          ))}
        </View>

        {/* Page Indicator */}
        <View style={styles.indicatorContainer}>
          {pages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                currentPage === index ? styles.indicatorActive : styles.indicatorInactive,
              ]}
            />
          ))}
          <View style={styles.simplePaginator}>
             <TouchableOpacity onPress={() => setCurrentPage((prev) => Math.max(0, prev - 1))} style={styles.pageBtn}><Text style={{color: 'transparent'}}>Prev</Text></TouchableOpacity>
             <TouchableOpacity onPress={() => setCurrentPage((prev) => Math.min(2, prev + 1))} style={styles.pageBtn}><Text style={{color: 'transparent'}}>Next</Text></TouchableOpacity>
          </View>
        </View>

        <View style={{ position: 'absolute', top: 100, left: 0, right: 0, height: 300, zIndex: -1 }}>
           <TouchableOpacity onPress={() => setCurrentPage(0)} style={{width: 50, height: '100%', position: 'absolute', left: 0}} />
           <TouchableOpacity onPress={() => setCurrentPage(2)} style={{width: 50, height: '100%', position: 'absolute', right: 0}} />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.replace('Register')}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.replace('Login')}
          >
            <Text style={styles.secondaryButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4A6CFA',
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageContainer: {
    width: width,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 150,
    height: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
  },
  iconText: {
    fontSize: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
    position: 'relative',
  },
  indicator: {
    marginHorizontal: 4,
    borderRadius: 5,
  },
  indicatorActive: {
    width: 10,
    height: 10,
    backgroundColor: '#FFFFFF',
  },
  indicatorInactive: {
    width: 8,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  buttonContainer: {
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#4A6CFA',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: '#FFFFFF',
    borderWidth: 2,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  simplePaginator: {
    position: 'absolute',
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between'
  },
  pageBtn: {
     flex: 1,
     height: 50,
  }
});
