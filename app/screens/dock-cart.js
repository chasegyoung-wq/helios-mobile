// ============================================================
// HELIOS MOBILE — DOCK CART SCREEN
// Scan QR code to check out a dock cart
// ============================================================

import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView, Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../lib/theme';
import { BottomNav } from '../../lib/BottomNav';

function fmtTime(mins) {
  if (mins < 60) return `${Math.round(mins)}m`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${h}h ${m}m`;
}

export default function DockCartScreen() {
  const { logout } = useAuthStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning,    setScanning]    = useState(false);
  const [session,     setSession]     = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [returning,   setReturning]   = useState(false);
  const scannedRef = useRef(false);

  useEffect(() => { loadSession(); }, []);

  // Refresh timer every 30 seconds when session active
  useEffect(() => {
    if (!session) return;
    const timer = setInterval(loadSession, 30000);
    return () => clearInterval(timer);
  }, [session]);

  async function loadSession() {
    try {
      const data = await api.get('/dock-carts/my-session');
      setSession(data.session);
      setSessionInfo(data);
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') logout();
    } finally {
      setLoading(false);
    }
  }

  async function handleScan({ data: qrCode }) {
    if (scannedRef.current) return;
    scannedRef.current = true;
    Vibration.vibrate(100);
    setScanning(false);

    try {
      const res = await api.post('/dock-carts/scan', { qrCode });
      await loadSession();
      Alert.alert('Cart Checked Out! 🛒', res.message);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to check out cart.');
    } finally {
      setTimeout(() => { scannedRef.current = false; }, 2000);
    }
  }

  async function returnCart() {
    if (!session) return;
    Alert.alert(
      'Return Cart',
      sessionInfo?.amountCharged > 0 || sessionInfo?.estimatedCharge > 0
        ? `Estimated charge: $${(sessionInfo?.estimatedCharge || 0).toFixed(2)}. Return cart now?`
        : 'Return cart now? No charge — still within free period.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Return Cart',
          onPress: async () => {
            setReturning(true);
            try {
              const res = await api.post('/dock-carts/return', { sessionId: session.id });
              setSession(null);
              setSessionInfo(null);
              Alert.alert('Cart Returned ✓', res.message);
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to return cart.');
            } finally {
              setReturning(false);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      <BottomNav />
      </SafeAreaView>
    );
  }

  // Active session view
  if (session) {
    const inGrace = sessionInfo?.inGracePeriod;
    const graceLeft = sessionInfo?.graceMinutesLeft || 0;
    const totalMins = sessionInfo?.totalMinutes || 0;
    const billableMins = sessionInfo?.billableMinutes || 0;
    const estCharge = sessionInfo?.estimatedCharge || 0;

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dock Cart</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Active cart card */}
          <View style={[styles.activeCard, inGrace ? styles.activeCardGrace : styles.activeCardBilling]}>
            <View style={styles.activeCardTop}>
              <Text style={styles.cartNumber}>🛒 Cart {session.cart_number}</Text>
              <View style={[styles.statusBadge, { backgroundColor: inGrace ? Colors.success + '22' : Colors.warning + '22' }]}>
                <Text style={[styles.statusText, { color: inGrace ? Colors.success : Colors.warning }]}>
                  {inGrace ? 'FREE' : 'BILLING'}
                </Text>
              </View>
            </View>

            <Text style={styles.cartLocation}>{session.location}</Text>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{fmtTime(totalMins)}</Text>
                <Text style={styles.statLabel}>Total Time</Text>
              </View>
              {inGrace ? (
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: Colors.success }]}>{fmtTime(graceLeft)}</Text>
                  <Text style={styles.statLabel}>Free Time Left</Text>
                </View>
              ) : (
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: Colors.warning }]}>{fmtTime(billableMins)}</Text>
                  <Text style={styles.statLabel}>Billed Time</Text>
                </View>
              )}
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: estCharge > 0 ? Colors.error : Colors.success }]}>
                  ${estCharge.toFixed(2)}
                </Text>
                <Text style={styles.statLabel}>Est. Charge</Text>
              </View>
            </View>

            {inGrace && (
              <View style={styles.graceBanner}>
                <Text style={styles.graceText}>
                  ✓ Free grace period — {fmtTime(graceLeft)} remaining before billing starts
                </Text>
              </View>
            )}
          </View>

          {/* Rate info */}
          <View style={styles.rateCard}>
            <Text style={styles.rateTitle}>Rate Information</Text>
            <Text style={styles.rateText}>• First {sessionInfo?.config?.grace_minutes || 60} minutes free</Text>
            <Text style={styles.rateText}>• ${sessionInfo?.config?.rate_per_minute || 0.50}/minute after grace period</Text>
            <Text style={styles.rateText}>• Maximum charge: ${sessionInfo?.config?.max_charge || 100.00}</Text>
          </View>

          {/* Return button */}
          <TouchableOpacity
            style={[styles.returnBtn, returning && { opacity: 0.6 }]}
            onPress={returnCart}
            disabled={returning}
          >
            {returning
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.returnBtnText}>Return Cart</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      <BottomNav />
      </SafeAreaView>
    );
  }

  // Scanner view
  if (scanning) {
    if (!permission?.granted) {
      return (
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionText}>Camera access is required to scan cart QR codes.</Text>
            <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
              <Text style={styles.permissionBtnText}>Allow Camera Access</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setScanning(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <View style={styles.scannerContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleScan}
        />
        {/* Overlay */}
        <View style={styles.scanOverlay}>
          <View style={styles.scanTop} />
          <View style={styles.scanMiddle}>
            <View style={styles.scanSide} />
            <View style={styles.scanFrame}>
              <View style={[styles.scanCorner, styles.cornerTL]} />
              <View style={[styles.scanCorner, styles.cornerTR]} />
              <View style={[styles.scanCorner, styles.cornerBL]} />
              <View style={[styles.scanCorner, styles.cornerBR]} />
            </View>
            <View style={styles.scanSide} />
          </View>
          <View style={styles.scanBottom}>
            <Text style={styles.scanHint}>Point camera at the QR code on the dock cart</Text>
            <TouchableOpacity style={styles.cancelScanBtn} onPress={() => setScanning(false)}>
              <Text style={styles.cancelScanText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Default — no active session
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dock Cart</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>No Active Cart</Text>
          <Text style={styles.emptyText}>Scan the QR code on any available dock cart to check it out.</Text>
        </View>

        <View style={styles.rateCard}>
          <Text style={styles.rateTitle}>Dock Cart Rates</Text>
          <Text style={styles.rateText}>• First 60 minutes free</Text>
          <Text style={styles.rateText}>• $0.50/minute after grace period</Text>
          <Text style={styles.rateText}>• Maximum charge: $100.00</Text>
          <Text style={styles.rateText}>• Charges posted to your member account</Text>
        </View>

        <TouchableOpacity style={styles.scanBtn} onPress={() => { scannedRef.current = false; setScanning(true); }}>
          <Text style={styles.scanBtnEmoji}>📷</Text>
          <Text style={styles.scanBtnText}>Scan Cart QR Code</Text>
        </TouchableOpacity>
      </ScrollView>
    <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: Colors.bg },
  header:            { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle:       { fontSize: Typography.xl, fontWeight: '700', color: Colors.text },
  loadingContainer:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent:     { padding: Spacing.lg },

  activeCard:        { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.md },
  activeCardGrace:   { backgroundColor: Colors.card, borderColor: Colors.success + '44' },
  activeCardBilling: { backgroundColor: Colors.card, borderColor: Colors.warning + '44' },
  activeCardTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cartNumber:        { fontSize: Typography.xl, fontWeight: '700', color: Colors.text },
  statusBadge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  statusText:        { fontSize: Typography.xs, fontWeight: '700', letterSpacing: 1 },
  cartLocation:      { fontSize: Typography.sm, color: Colors.textDim, marginBottom: Spacing.md },

  statsRow:          { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  statBox:           { flex: 1, alignItems: 'center', backgroundColor: Colors.bg, borderRadius: Radius.sm, padding: Spacing.sm },
  statValue:         { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  statLabel:         { fontSize: Typography.xs, color: Colors.textDim, marginTop: 2, textAlign: 'center' },

  graceBanner:       { backgroundColor: Colors.success + '11', borderRadius: Radius.sm, padding: Spacing.sm, borderWidth: 1, borderColor: Colors.success + '33' },
  graceText:         { fontSize: Typography.xs, color: Colors.success, textAlign: 'center' },

  rateCard:          { backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, marginBottom: Spacing.md },
  rateTitle:         { fontSize: Typography.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  rateText:          { fontSize: Typography.sm, color: Colors.textMid, marginBottom: 4 },

  returnBtn:         { backgroundColor: Colors.accent, borderRadius: Radius.sm, padding: Spacing.lg, alignItems: 'center' },
  returnBtnText:     { color: '#fff', fontSize: Typography.md, fontWeight: '700' },

  scanBtn:           { backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: Colors.accent + '44', ...Shadows.md },
  scanBtnEmoji:      { fontSize: 48, marginBottom: Spacing.md },
  scanBtnText:       { fontSize: Typography.lg, fontWeight: '700', color: Colors.accent },

  emptyState:        { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyEmoji:        { fontSize: 64, marginBottom: Spacing.md },
  emptyTitle:        { fontSize: Typography.xl, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  emptyText:         { fontSize: Typography.sm, color: Colors.textDim, textAlign: 'center', marginBottom: Spacing.xl },

  permissionContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  permissionText:    { fontSize: Typography.md, color: Colors.textMid, textAlign: 'center', marginBottom: Spacing.lg },
  permissionBtn:     { backgroundColor: Colors.accent, borderRadius: Radius.sm, padding: Spacing.md, alignItems: 'center', width: '100%', marginBottom: Spacing.sm },
  permissionBtnText: { color: '#fff', fontSize: Typography.md, fontWeight: '700' },
  cancelBtn:         { padding: Spacing.md, alignItems: 'center' },
  cancelBtnText:     { color: Colors.textMid, fontSize: Typography.sm },

  scannerContainer:  { flex: 1, backgroundColor: '#000' },
  scanOverlay:       { ...StyleSheet.absoluteFillObject, flexDirection: 'column' },
  scanTop:           { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  scanMiddle:        { flexDirection: 'row', height: 260 },
  scanSide:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  scanFrame:         { width: 260, height: 260, position: 'relative' },
  scanBottom:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', paddingTop: Spacing.lg },
  scanHint:          { color: '#fff', fontSize: Typography.sm, textAlign: 'center', marginBottom: Spacing.lg },
  cancelScanBtn:     { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm },
  cancelScanText:    { color: '#fff', fontSize: Typography.md, fontWeight: '600' },

  scanCorner:        { position: 'absolute', width: 30, height: 30, borderColor: Colors.accent, borderWidth: 3 },
  cornerTL:          { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0 },
  cornerTR:          { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0 },
  cornerBL:          { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0 },
  cornerBR:          { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0 },
});