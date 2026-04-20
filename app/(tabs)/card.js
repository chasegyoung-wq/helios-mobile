// ============================================================
// HELIOS MOBILE — ACCESS CARD SCREEN
// app/(tabs)/card.js
// ============================================================

import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../lib/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH  = width - Spacing.lg * 2;
const CARD_HEIGHT = CARD_WIDTH * 0.6;

function fmt(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); }
  catch { return d; }
}

function fmtTime(ts) {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch { return ts; }
}

export default function CardScreen() {
  const { user, logout } = useAuthStore();
  const [accessData, setAccessData] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadAccess() {
    try {
      const data = await api.get('/portal/access');
      setAccessData(data);
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') logout();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadAccess(); }, []);

  function onRefresh() { setRefreshing(true); loadAccess(); }

  function reportLost(cardId) {
    Alert.alert(
      'Report Card Lost',
      'This will deactivate your card immediately. You will need to visit the front desk for a replacement.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report Lost',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post('/portal/access/report-lost', { cardId });
              loadAccess();
              Alert.alert('Done', 'Card reported as lost. Please visit the front desk.');
            } catch {
              Alert.alert('Error', 'Failed to report card. Please try again.');
            }
          },
        },
      ]
    );
  }

  const cards  = accessData?.cards || [];
  const log    = accessData?.log   || [];
  const active = cards.filter(c => c.status === 'Active');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Access Card</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
          showsVerticalScrollIndicator={false}
        >
          {active.length > 0 ? active.map(card => (
            <View key={card.id}>
              {/* Digital Member Card */}
              <View style={[styles.memberCard, { width: CARD_WIDTH, height: CARD_HEIGHT }]}>
                {/* Holographic shimmer overlay */}
                <View style={styles.cardShimmer} />
                <View style={styles.cardGlow} />

                <View style={styles.cardContent}>
                  {/* Top row */}
                  <View style={styles.cardTopRow}>
                    <View>
                      <Text style={styles.cardBrand}>HELIOS</Text>
                      <Text style={styles.cardSubBrand}>MEMBER ACCESS</Text>
                    </View>
                    <View style={styles.cardLogoCircle}>
                      <Text style={styles.cardLogoText}>H</Text>
                    </View>
                  </View>

                  {/* Card number */}
                  <View style={styles.cardNumberBox}>
                    <Text style={styles.cardNumber}>{card.card_id}</Text>
                    <Text style={styles.cardNumberSub}>Present at gates and entrances</Text>
                  </View>

                  {/* Bottom row */}
                  <View style={styles.cardBottomRow}>
                    <View>
                      <Text style={styles.cardFieldLabel}>MEMBER</Text>
                      <Text style={styles.cardFieldValue}>{card.card_holder_name}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.cardFieldLabel}>VALID UNTIL</Text>
                      <Text style={styles.cardFieldValue}>{card.valid_until ? fmt(card.valid_until) : 'No Expiry'}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Access zones */}
              {card.allowed_zones?.length > 0 && (
                <View style={styles.zonesRow}>
                  {card.allowed_zones.map(zone => (
                    <View key={zone} style={styles.zoneBadge}>
                      <Text style={styles.zoneText}>{zone}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Report lost */}
              <TouchableOpacity style={styles.reportBtn} onPress={() => reportLost(card.id)}>
                <Text style={styles.reportBtnText}>Report Card Lost</Text>
              </TouchableOpacity>
            </View>
          )) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🔑</Text>
              <Text style={styles.emptyTitle}>No Active Card</Text>
              <Text style={styles.emptyText}>Contact the front desk to obtain your access card.</Text>
            </View>
          )}

          {/* Access history */}
          {log.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>Recent Access</Text>
              {log.slice(0, 10).map(entry => (
                <View key={entry.id} style={styles.logRow}>
                  <Text style={styles.logIcon}>{entry.granted ? '✅' : '❌'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.logGate}>{entry.gate_name || 'Gate'}</Text>
                    <Text style={styles.logSub}>{entry.gate_location} · {entry.method}</Text>
                  </View>
                  <Text style={styles.logTime}>{fmtTime(entry.timestamp)}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: Spacing.xl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.bg },
  header:     { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle:{ fontSize: Typography.xl, fontWeight: '700', color: Colors.text },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: Spacing.lg },

  // Member Card
  memberCard: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.lg,
    background: 'linear-gradient(135deg, #1B3A5C, #0E1A2E)',
    backgroundColor: Colors.primary,
  },
  cardShimmer: {
    position: 'absolute', inset: 0,
    backgroundColor: 'transparent',
    borderRadius: Radius.lg,
    // Simulated holographic effect via opacity overlay
    opacity: 0.06,
    backgroundColor: Colors.accent,
  },
  cardGlow: {
    position: 'absolute', top: -40, right: -40,
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: Colors.accent, opacity: 0.08,
  },
  cardContent:   { flex: 1, padding: Spacing.md, justifyContent: 'space-between' },
  cardTopRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardBrand:     { fontSize: Typography.lg, fontWeight: '800', color: Colors.accent, letterSpacing: 3 },
  cardSubBrand:  { fontSize: Typography.xs, color: Colors.accent + 'AA', letterSpacing: 2, marginTop: 2 },
  cardLogoCircle:{ width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.accent + '22', borderWidth: 1, borderColor: Colors.accent + '44', alignItems: 'center', justifyContent: 'center' },
  cardLogoText:  { fontSize: Typography.md, fontWeight: '700', color: Colors.accent },

  cardNumberBox: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: Radius.sm, padding: Spacing.sm, alignItems: 'center' },
  cardNumber:    { fontSize: Typography.xl, fontWeight: '700', color: Colors.primary, letterSpacing: 4, fontFamily: 'monospace' },
  cardNumberSub: { fontSize: Typography.xs, color: '#888', marginTop: 2 },

  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cardFieldLabel:{ fontSize: 9, color: Colors.accent + 'AA', letterSpacing: 1, textTransform: 'uppercase' },
  cardFieldValue:{ fontSize: Typography.sm, fontWeight: '600', color: Colors.text, marginTop: 2 },

  zonesRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  zoneBadge: { backgroundColor: Colors.primary + '22', borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderWidth: 1, borderColor: Colors.primary },
  zoneText:  { fontSize: Typography.xs, color: Colors.accent, fontWeight: '600' },

  reportBtn:     { borderWidth: 1, borderColor: Colors.error + '44', borderRadius: Radius.sm, padding: Spacing.md, alignItems: 'center', marginBottom: Spacing.lg },
  reportBtnText: { color: Colors.error, fontSize: Typography.sm, fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: Typography.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  emptyText:  { fontSize: Typography.sm, color: Colors.textDim, textAlign: 'center' },

  historySection: { marginTop: Spacing.md },
  historyTitle:   { fontSize: Typography.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  logRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, gap: Spacing.sm },
  logIcon:  { fontSize: 18 },
  logGate:  { fontSize: Typography.sm, fontWeight: '600', color: Colors.text },
  logSub:   { fontSize: Typography.xs, color: Colors.textDim },
  logTime:  { fontSize: Typography.xs, color: Colors.textDim, textAlign: 'right' },
});
