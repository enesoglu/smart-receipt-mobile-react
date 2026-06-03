import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { ScanResult } from '../services/api';

import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MainScreen from '../screens/MainScreen';
import ScanReceiptScreen from '../screens/ScanReceiptScreen';
import ScanReviewScreen from '../screens/ScanReviewScreen';
import AddReceiptScreen from '../screens/AddReceiptScreen';
import ReceiptDetailScreen from '../screens/ReceiptDetailScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import EditCategoryScreen from '../screens/EditCategoryScreen';
import BudgetsScreen from '../screens/BudgetsScreen';
import InsightsScreen from '../screens/InsightsScreen';
import ExportScreen from '../screens/ExportScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  Main: undefined;
  Scan: undefined;
  ScanReview: { imageUri: string; scanResult?: ScanResult };
  AddReceipt: { imageUri?: string; scanResult?: ScanResult; receiptId?: number } | undefined;
  ReceiptDetail: { receiptId: number };
  Categories: undefined;
  EditCategory: { categoryId?: number };
  Budgets: undefined;
  Insights: undefined;
  Export: undefined;
  EditProfile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { token, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#4A6CFA" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          <>
            <Stack.Screen name="Main" component={MainScreen} />
            <Stack.Screen name="Scan" component={ScanReceiptScreen} />
            <Stack.Screen name="ScanReview" component={ScanReviewScreen} />
            <Stack.Screen name="AddReceipt" component={AddReceiptScreen} />
            <Stack.Screen name="ReceiptDetail" component={ReceiptDetailScreen} />
            <Stack.Screen name="Categories" component={CategoriesScreen} />
            <Stack.Screen name="EditCategory" component={EditCategoryScreen} />
            <Stack.Screen name="Budgets" component={BudgetsScreen} />
            <Stack.Screen name="Insights" component={InsightsScreen} />
            <Stack.Screen name="Export" component={ExportScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
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

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5' },
});
