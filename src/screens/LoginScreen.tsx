import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Login'> };

export default function LoginScreen({ navigation }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!username || !password) {
      setErrorMessage('Username and Password are required');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    const result = await login(username, password);
    setLoading(false);
    if (!result.success) {
      setErrorMessage(result.error ?? 'Login failed');
    }
    // On success, AppNavigator automatically switches to the authenticated stack
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>🧾</Text>
          </View>

          <Text style={styles.title}>Sign in to your{'\n'}Account</Text>
          <Text style={styles.subtitle}>Enter your username and password to log in</Text>

          <View style={styles.formContainer}>
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#999"
              value={username}
              onChangeText={(t) => { setUsername(t); setErrorMessage(''); }}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={(t) => { setPassword(t); setErrorMessage(''); }}
              secureTextEntry
            />

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.loginButtonText}>Log In</Text>
              )}
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
  logoContainer: {
    width: 100, height: 100,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
    alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginBottom: 24,
  },
  logoText: { fontSize: 60 },
  title: {
    fontSize: 28, fontWeight: 'bold', color: '#FFF',
    textAlign: 'center', lineHeight: 34, marginBottom: 8,
  },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: 32 },
  formContainer: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 24, marginBottom: 24 },
  errorContainer: { backgroundColor: 'rgba(255,0,0,0.2)', padding: 12, borderRadius: 12, marginBottom: 16 },
  errorText: { color: '#FFF', textAlign: 'center' },
  input: {
    backgroundColor: '#FFF', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 16, marginBottom: 16, fontSize: 16, color: '#333',
  },
  loginButton: { backgroundColor: '#3A5BD9', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  loginButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  footerContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  footerLink: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
});
