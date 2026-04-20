// ============================================================
// HELIOS MOBILE — LOGIN SCREEN
// app/(auth)/login.js
// ============================================================

import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, Image,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuthStore } from '../../lib/auth-store';
import { Colors, Typography, Spacing, Radius } from '../../lib/theme';

export default function LoginScreen() {
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [biometricOk, setBiometricOk] = useState(false);

  useEffect(() => {
    checkBiometric();
  }, []);

  async function checkBiometric() {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled   = await LocalAuthentication.isEnrolledAsync();
    setBiometricOk(compatible && enrolled);
  }

  async function handleBiometric() {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Sign in to Helios',
      fallbackLabel: 'Use Password',
    });
    if (result.success) {
      // Use stored credentials
      Alert.alert('Biometric', 'Use email/password first to enable biometric login.');
    }
  }

  async function handleLogin() {
    if (!email.trim()) { Alert.alert('Error', 'Email is required'); return; }
    if (!password)     { Alert.alert('Error', 'Password is required'); return; }
    clearError();
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      // Error is shown via store
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Background */}
      <View style={styles.bgGlow1} />
      <View style={styles.bgGlow2} />

      {/* Gold top line */}
      <View style={styles.topLine} />

     <View style={styles.inner}>
  {/* Logo */}
  <View style={styles.logoSection}>
    <Image
      source={require('../../assets/helios-logo.png')}
      style={styles.logoImage}
      resizeMode="contain"
    />
    <Text style={styles.appName}>HELIOS</Text>
    <Text style={styles.tagline}>NAVIGATE WHAT MATTERS</Text>
  </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerDiamond}>◆</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Card */}
        <View style={styles.card}>
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          )}

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            placeholderTextColor={Colors.textDimmer}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={Colors.textDimmer}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              <Text style={{ fontSize: 18 }}>{showPass ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, isLoading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.loginBtnText}>Sign In</Text>
            }
          </TouchableOpacity>

          {biometricOk && (
            <TouchableOpacity style={styles.biometricBtn} onPress={handleBiometric}>
              <Text style={styles.biometricText}>
                {Platform.OS === 'ios' ? '🔐 Sign in with Face ID' : '🔐 Sign in with Biometrics'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.footer}>
          New member? Contact your club for account setup.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  bgGlow1: { position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: Colors.primary, opacity: 0.08 },
  bgGlow2: { position: 'absolute', bottom: -100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: Colors.accent, opacity: 0.05 },
  topLine: { height: 3, backgroundColor: Colors.accent, opacity: 0.8 },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },

  logoSection: { alignItems: 'center', marginBottom: Spacing.lg },
logoImage: { width: 120, height: 120, marginBottom: Spacing.sm },  logoText: { fontSize: 36, fontWeight: '700', color: Colors.accent },
  appName: { fontSize: Typography.xxxl, fontWeight: '700', color: Colors.text, letterSpacing: 4 },
  tagline: { fontSize: Typography.xs, color: Colors.textDim, letterSpacing: 3, marginTop: 4 },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.borderMid },
  dividerDiamond: { color: Colors.accent, fontSize: 8, marginHorizontal: Spacing.sm, opacity: 0.6 },

  card: { backgroundColor: Colors.card, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg },

  errorBanner: { backgroundColor: 'rgba(248,113,113,0.08)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)', borderRadius: Radius.sm, padding: Spacing.sm, marginBottom: Spacing.md },
  errorText: { color: Colors.error, fontSize: Typography.sm },

  label: { fontSize: Typography.xs, fontWeight: '600', color: Colors.textMid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: { backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, padding: Spacing.md, color: Colors.text, fontSize: Typography.md, marginBottom: Spacing.md },

  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
  eyeBtn: { padding: 8 },

  loginBtn: { backgroundColor: Colors.accent, borderRadius: Radius.sm, padding: Spacing.md, alignItems: 'center', marginTop: 4 },
  loginBtnText: { color: '#fff', fontSize: Typography.md, fontWeight: '700', letterSpacing: 0.5 },

  biometricBtn: { marginTop: Spacing.md, alignItems: 'center', padding: Spacing.sm },
  biometricText: { color: Colors.accent, fontSize: Typography.sm, fontWeight: '500' },

  footer: { textAlign: 'center', color: Colors.textDimmer, fontSize: Typography.xs, marginTop: Spacing.lg },
});
