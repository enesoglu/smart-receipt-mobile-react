import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MainScreen from '../screens/MainScreen';
import ScanReceiptScreen from '../screens/ScanReceiptScreen';
import AddReceiptScreen from '../screens/AddReceiptScreen';
import ReceiptDetailScreen from '../screens/ReceiptDetailScreen';
import { Receipt } from '../services/api';

export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  Main: undefined;
  Scan: undefined;
  AddReceipt: { imageUri?: string } | undefined;
  ReceiptDetail: { receipt: Receipt };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { token } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          <>
            <Stack.Screen name="Main" component={MainScreen} />
            <Stack.Screen name="Scan" component={ScanReceiptScreen} />
            <Stack.Screen name="AddReceipt" component={AddReceiptScreen} />
            <Stack.Screen name="ReceiptDetail" component={ReceiptDetailScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
