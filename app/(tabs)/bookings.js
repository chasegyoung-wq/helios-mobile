// ============================================================
// HELIOS MOBILE — BOOKINGS SCREEN
// app/(tabs)/bookings.js
// ============================================================

import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { Colors, Typography, Spacing, Radius } from '../../lib/theme';

function fmt(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }); }
  catch { return d; }
}

function Badge({ text, color }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color + '44' }]}>
      <Text style={[styles.badgeText, { color }]}>{text}</Text>
    </View>
  );
}

const TABS = [
  { key: 'hotel',   label: 'Hotel',   emoji: '🏨' },
  { key: 'events',  label: 'Events',  emoji: '📅' },
  { key: 'fitness', label: 'Fitness', emoji: '🏋️' },
  { key: 'spa',     label: 'Spa',     emoji: '💆' },
];

export default function BookingsScreen() {
  const { logout } = useAuthStore();
  const [tab,        setTab]        = useState('hotel');
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    try {
      const res = await api.get('/portal/reservations');
      setData(res);
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') logout();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadData(); }, []);
  function onRefresh() { setRefreshing(true); loadData(); }

  const hotel   = data?.hotel   || [];
  const events  = data?.events  || [];
  const fitness = data?.fitness || [];
  const spa     = data?.spa     || [];

  function renderHotel() {
    if (hotel.length === 0) return <EmptyState emoji="🏨" text="No hotel reservations" />;
    return hotel.map(r => (
      <View key={r.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Room {r.room_number}</Text>
          <Badge text={r.status} color={r.status === 'Checked In' ? Colors.success : r.status === 'Reserved' ? Colors.accent : Colors.textMid} />
        </View>
        <Text style={styles.cardSub}>{r.room_type}</Text>
        <View style={styles.dateRow}>
          <View style={styles.dateBox}>
            <Text style={styles.dateLabel}>CHECK IN</Text>
            <Text style={styles.dateValue}>{fmt(r.check_in)}</Text>
          </View>
          <Text style={styles.dateSeparator}>→</Text>
          <View style={styles.dateBox}>
            <Text style={styles.dateLabel}>CHECK OUT</Text>
            <Text style={styles.dateValue}>{fmt(r.check_out)}</Text>
          </View>
          <View style={[styles.dateBox, { alignItems: 'flex-end' }]}>
            <Text style={styles.dateLabel}>TOTAL</Text>
            <Text style={[styles.dateValue, { color: Colors.accent }]}>${parseFloat(r.total || 0).toFixed(0)}</Text>
          </View>
        </View>
      </View>
    ));
  }

  function renderEvents() {
    if (events.length === 0) return <EmptyState emoji="📅" text="No event registrations" />;
    return events.map(e => (
      <View key={e.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{e.name}</Text>
          <Badge text={e.reg_status || 'Registered'} color={Colors.success} />
        </View>
        <Text style={styles.cardSub}>{fmt(e.date)}</Text>
      </View>
    ));
  }

  function renderFitness() {
    if (fitness.length === 0) return <EmptyState emoji="🏋️" text="No fitness bookings" />;
    return fitness.map(f => (
      <View key={f.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{f.class_name}</Text>
          <Badge text={f.status} color={f.status === 'Confirmed' ? Colors.success : Colors.error} />
        </View>
        <Text style={styles.cardSub}>{fmt(f.booking_date)} · {f.instructor}</Text>
      </View>
    ));
  }

  function renderSpa() {
    if (spa.length === 0) return <EmptyState emoji="💆" text="No spa appointments" />;
    return spa.map(s => (
      <View key={s.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{s.service_name}</Text>
          <Badge text={s.status} color={s.status === 'Confirmed' ? Colors.success : Colors.error} />
        </View>
        <Text style={styles.cardSub}>{fmt(s.booking_date)} · {s.duration_minutes} min · ${parseFloat(s.amount || 0).toFixed(0)}</Text>
      </View>
    ));
  }

  const renderTab = { hotel: renderHotel, events: renderEvents, fitness: renderFitness, spa: renderSpa };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} onPress={() => setTab(t.key)}
            style={[styles.tab, tab === t.key && styles.tabActive]}>
            <Text style={styles.tabEmoji}>{t.emoji}</Text>
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
          {renderTab[tab]?.()}
          <View style={{ height: Spacing.xl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function EmptyState({ emoji, text }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.bg },
  header:     { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle:{ fontSize: Typography.xl, fontWeight: '700', color: Colors.text },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  tabScroll:  { maxHeight: 60, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabContent: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, alignItems: 'center' },
  tab:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
  tabActive:  { borderColor: Colors.accent, backgroundColor: Colors.primary + '22' },
  tabEmoji:   { fontSize: 16 },
  tabLabel:   { fontSize: Typography.sm, fontWeight: '600', color: Colors.textMid },
  tabLabelActive: { color: Colors.accent },

  scrollContent: { padding: Spacing.lg },

  card:       { backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle:  { fontSize: Typography.md, fontWeight: '700', color: Colors.accent, flex: 1 },
  cardSub:    { fontSize: Typography.sm, color: Colors.textMid, marginBottom: Spacing.sm },

  badge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, borderWidth: 1 },
  badgeText: { fontSize: Typography.xs, fontWeight: '600' },

  dateRow:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  dateBox:      { flex: 1 },
  dateLabel:    { fontSize: 9, color: Colors.textDim, textTransform: 'uppercase', letterSpacing: 0.5 },
  dateValue:    { fontSize: Typography.sm, fontWeight: '600', color: Colors.text, marginTop: 2 },
  dateSeparator:{ fontSize: Typography.lg, color: Colors.textDim },

  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyText:  { fontSize: Typography.md, color: Colors.textDim },
});
