import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';

import HomeScreen from './HomeScreen';
import SearchScreen from './SearchScreen';
import ReceiptsScreen from './ReceiptsScreen';
import ProfileScreen from './ProfileScreen';

const Tab = createBottomTabNavigator();

type Props = NativeStackScreenProps<RootStackParamList, 'Main'>;

export default function MainScreen({ navigation }: Props) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#4A6CFA',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: 'white',
          height: 70,
          paddingBottom: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -5 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 10,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let tabIcon: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Home') {
            tabIcon = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            tabIcon = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Receipts') {
            tabIcon = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Profile') {
            tabIcon = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={tabIcon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      
      {/* Custom Scan Button */}
      <Tab.Screen 
        name="ScanSpacer" 
        component={View} 
        options={{
          tabBarLabel: '',
          tabBarIcon: () => (
             <TouchableOpacity 
               style={styles.scanButton}
               onPress={() => navigation.navigate('Scan')}
             >
               <Ionicons name="scan-outline" size={30} color="#FFF" />
             </TouchableOpacity>
          )
        }}
      />
      
      <Tab.Screen name="Receipts" component={ReceiptsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  scanButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4A6CFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30, // To make it float a bit higher than the bar
    shadowColor: '#4A6CFA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
  }
});
