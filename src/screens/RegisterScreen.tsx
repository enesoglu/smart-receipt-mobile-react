import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Register'> };

export default function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!name || !username || !password || !confirmPassword) {
      setErrorMessage('All fields are required');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    const result = await register(username, password);
    setLoading(false);
    if (!result.success) {
      setErrorMessage(result.error ?? 'Registration failed');
    }
    // On success, AppNavigator automatically switches to the authenticated stack
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Create New{'\n'}Account</Text>
          <Text style={styles.subtitle}>Fill in the form to continue</Text>

          <View style={styles.formContainer}>
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#999"
              value={name}
              onChangeText={(t) => { setName(t); setErrorMessage(''); }}
            />

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

            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={(t) => { setConfirmPassword(t); setErrorMessage(''); }}
              secureTextEntry
            />

            <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.registerButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.replace('Login')}>
              <Text style={styles.footerLink}>Sign In</Text>
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
  title: {
    fontSize: 28, fontWeight: 'bold', color: '#FFF',
    textAlign: 'center', lineHeight: 34, marginBottom: 8, marginTop: 20,
  },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: 32 },
  formContainer: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 24, marginBottom: 24 },
  errorContainer: { backgroundColor: 'rgba(255,0,0,0.2)', padding: 12, borderRadius: 12, marginBottom: 16 },
  errorText: { color: '#FFF', textAlign: 'center' },
  input: {
    backgroundColor: '#FFF', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 16, marginBottom: 16, fontSize: 16, color: '#333',
  },
  registerButton: { backgroundColor: '#3A5BD9', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  registerButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  footerContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 20 },
  footerText: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  footerLink: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
});
