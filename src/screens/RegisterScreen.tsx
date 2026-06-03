import React, { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Register'> };

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isStrongPassword(value: string) {
  return value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);
}

export default function RegisterScreen({ navigation }: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { register, isAuthenticating } = useAuth();

  const handleRegister = async () => {
    if (fullName.trim().length < 2) {
      setErrorMessage('Full name must be at least 2 characters.');
      return;
    }
    if (!isEmail(email)) {
      setErrorMessage('Enter a valid email address.');
      return;
    }
    if (!isStrongPassword(password)) {
      setErrorMessage('Password must be at least 8 characters and include a letter and a digit.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setErrorMessage('');
    const result = await register({ fullName: fullName.trim(), email: email.trim(), password });
    if (!result.success) setErrorMessage(result.error ?? 'Registration failed.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Create New{'\n'}Account</Text>
          <Text style={styles.subtitle}>Fill in the form to continue</Text>

          <View style={styles.formContainer}>
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#999" value={fullName} onChangeText={(value) => { setFullName(value); setErrorMessage(''); }} />
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
            <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#999" value={password} onChangeText={(value) => { setPassword(value); setErrorMessage(''); }} secureTextEntry />
            <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor="#999" value={confirmPassword} onChangeText={(value) => { setConfirmPassword(value); setErrorMessage(''); }} secureTextEntry />
            <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={isAuthenticating}>
              {isAuthenticating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.registerButtonText}>Sign Up</Text>}
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
  title: { fontSize: 28, fontWeight: '700', color: '#FFF', textAlign: 'center', lineHeight: 34, marginBottom: 8, marginTop: 20 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.82)', textAlign: 'center', marginBottom: 32 },
  formContainer: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 24, marginBottom: 24 },
  errorText: { color: '#FFF', backgroundColor: 'rgba(255,0,0,0.22)', padding: 12, borderRadius: 12, marginBottom: 16, textAlign: 'center' },
  input: { backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, marginBottom: 16, fontSize: 16, color: '#333' },
  registerButton: { backgroundColor: '#3A5BD9', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  registerButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  footerContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 20 },
  footerText: { color: 'rgba(255,255,255,0.82)', fontSize: 14 },
  footerLink: { color: '#FFF', fontSize: 14, fontWeight: '800' },
});
