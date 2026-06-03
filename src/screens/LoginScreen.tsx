import React, { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Login'> };

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { login, isAuthenticating } = useAuth();

  const handleLogin = async () => {
    if (!isEmail(email)) {
      setErrorMessage('Enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Password is required.');
      return;
    }

    setErrorMessage('');
    const result = await login({ email: email.trim(), password });
    if (!result.success) setErrorMessage(result.error ?? 'Login failed.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.logo}>SmartReceipt</Text>
          <Text style={styles.title}>Sign in to your{'\n'}Account</Text>
          <Text style={styles.subtitle}>Enter your email and password to log in</Text>

          <View style={styles.formContainer}>
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={(value) => { setEmail(value); setErrorMessage(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={(value) => { setPassword(value); setErrorMessage(''); }}
              secureTextEntry
            />
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isAuthenticating}>
              {isAuthenticating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.loginButtonText}>Log In</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.replace('Register')}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#4A6CFA' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { color: '#FFF', fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFF', textAlign: 'center', lineHeight: 34, marginBottom: 8 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.82)', textAlign: 'center', marginBottom: 32 },
  formContainer: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 24, marginBottom: 24 },
  errorText: { color: '#FFF', backgroundColor: 'rgba(255,0,0,0.22)', padding: 12, borderRadius: 12, marginBottom: 16, textAlign: 'center' },
  input: { backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, marginBottom: 16, fontSize: 16, color: '#333' },
  loginButton: { backgroundColor: '#3A5BD9', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  loginButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  footerContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: 'rgba(255,255,255,0.82)', fontSize: 14 },
  footerLink: { color: '#FFF', fontSize: 14, fontWeight: '800' },
});
