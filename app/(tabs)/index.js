// ============================================================
// HELIOS MOBILE — HOME SCREEN
// app/(tabs)/index.js
// ============================================================

import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../lib/auth-store';
import { api } from '../../lib/api';
import { FeedbackBanner } from '../../lib/feedback-banner';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../lib/theme';

function StatCard({ label, value, color, sub }) {
  return (
    <View style={[styles.statCard, Shadows.sm]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color && { color }]}>{value ?? '—'}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

function SectionCard({ title, children, onPress, linkText }) {
  return (
    <View style={[styles.sectionCard, Shadows.sm]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {onPress && <TouchableOpacity onPress={onPress}><Text style={styles.sectionLink}>{linkText || 'View all'}</Text></TouchableOpacity>}
      </View>
      {children}
    </View>
  );
}

export default function HomeScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [dashboard, setDashboard] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  async function loadDashboard() {
    try {
      const data = await api.get('/portal/dashboard');
      setDashboard(data);
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') logout();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadDashboard(); }, []);

  function onRefresh() { setRefreshing(true); loadDashboard(); }

  const member   = dashboard?.member;
  const balance  = dashboard?.balance || 0;
  const reservations = dashboard?.reservations || [];
  const events   = dashboard?.events || [];
  const vessel   = dashboard?.vessel;
  const expiringDocs = dashboard?.expiringDocs || [];

  function fmt(d) {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }); }
    catch { return d; }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.memberName}>{user?.firstName || member?.first_name || 'Member'}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.firstName?.[0] || 'M')}{(user?.lastName?.[0] || '')}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Expiring docs alert */}
          {expiringDocs.length > 0 && (
            <View style={styles.alertBanner}>
              <Text style={styles.alertText}>⚠️ {expiringDocs.length} vessel document{expiringDocs.length > 1 ? 's' : ''} expiring soon</Text>
            </View>
          )}

          {/* Stats row */}
          <View style={styles.statsRow}>
            <StatCard
              label="Balance"
              value={`$${Math.abs(balance).toFixed(2)}`}
              color={balance > 0 ? Colors.error : Colors.success}
              sub={balance > 0 ? 'Due' : 'Clear'}
            />
            <StatCard
              label="Member #"
              value={`#${member?.member_number || user?.memberNumber || '—'}`}
              sub={member?.member_type || member?.membership_type || ''}
            />
            <StatCard
              label="Status"
              value="●"
              color={Colors.success}
              sub="Active"
            />
          </View>

          {/* Upcoming reservations */}
          <SectionCard title="Upcoming Stays" onPress={() => router.push('/(tabs)/bookings')} >
            {reservations.length > 0 ? reservations.slice(0, 3).map(r => (
              <View key={r.id} style={styles.listRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>Room {r.room_number}</Text>
                  <Text style={styles.listSub}>{fmt(r.check_in)} → {fmt(r.check_out)} · {r.nights} nights</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: Colors.accent + '22' }]}>
                  <Text style={[styles.badgeText, { color: Colors.accent }]}>{r.status}</Text>
                </View>
              </View>
            )) : (
              <Text style={styles.emptyText}>No upcoming hotel stays</Text>
            )}
          </SectionCard>
          {/* Upcoming Regattas */}
<SectionCard title="Upcoming Regattas" onPress={() => router.push('/(tabs)/bookings')}>
  {(dashboard?.regattas || []).length > 0 ? (dashboard.regattas).map(r => (
    <View key={r.id} style={styles.listRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.listTitle}>{r.name}</Text>
        <Text style={styles.listSub}>{fmt(r.start_date)} · {r.location}</Text>
        <Text style={styles.listSub}>⛵ {r.boat_name} · {r.entry_status}</Text>
      </View>
    </View>
  )) : (
    <Text style={styles.emptyText}>No upcoming regattas</Text>
  )}
</SectionCard>

          {/* My vessel */}
          {vessel && (
            <SectionCard title="My Vessel">
              <View style={styles.vesselCard}>
                <Text style={styles.vesselName}>{vessel.name}</Text>
                <Text style={styles.vesselSub}>{vessel.vessel_type} · {vessel.make} {vessel.model} {vessel.year}</Text>
                {vessel.slip_code && (
                  <View style={styles.slipBadge}>
                    <Text style={styles.slipText}>⚓ Slip {vessel.slip_code}</Text>
                  </View>
                )}
              </View>
            </SectionCard>
          )}

          {/* Upcoming events */}
          <SectionCard title="Upcoming Events" onPress={() => router.push('/(tabs)/bookings')}>
            {events.length > 0 ? events.slice(0, 3).map(e => (
              <View key={e.id} style={styles.listRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>{e.name}</Text>
                  <Text style={styles.listSub}>{fmt(e.date)}</Text>
                </View>
              </View>
            )) : (
              <Text style={styles.emptyText}>No upcoming events</Text>
            )}
          </SectionCard>

          {/* Sign out */}
          <TouchableOpacity style={styles.signOutBtn} onPress={logout}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          <View style={{ height: Spacing.xl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.bg },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  greeting:   { fontSize: Typography.sm, color: Colors.textDim },
  memberName: { fontSize: Typography.xl, fontWeight: '700', color: Colors.text },
  avatar:     { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.accent + '44' },
  avatarText: { fontSize: Typography.md, fontWeight: '700', color: Colors.accent },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:       { flex: 1 },
  scrollContent:{ padding: Spacing.lg },

  alertBanner: { backgroundColor: 'rgba(249,115,22,0.1)', borderWidth: 1, borderColor: 'rgba(249,115,22,0.3)', borderRadius: Radius.sm, padding: Spacing.sm, marginBottom: Spacing.md },
  alertText:   { color: Colors.orange, fontSize: Typography.sm, fontWeight: '600' },

  statsRow:  { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  statCard:  { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, alignItems: 'center' },
  statLabel: { fontSize: Typography.xs, color: Colors.textDim, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  statValue: { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  statSub:   { fontSize: Typography.xs, color: Colors.textDim, marginTop: 2 },

  quickActions: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  quickAction:  { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.sm, alignItems: 'center', gap: 6 },
  quickActionEmoji: { fontSize: 22 },
  quickActionLabel: { fontSize: 10, fontWeight: '600', color: Colors.textMid, textAlign: 'center' },

  sectionCard:   { backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle:  { fontSize: Typography.md, fontWeight: '700', color: Colors.text },
  sectionLink:   { fontSize: Typography.xs, color: Colors.accent },

  listRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  listTitle: { fontSize: Typography.sm, fontWeight: '600', color: Colors.accent },
  listSub:   { fontSize: Typography.xs, color: Colors.textMid, marginTop: 2 },

  badge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  badgeText: { fontSize: Typography.xs, fontWeight: '600' },

  vesselCard: { paddingVertical: Spacing.sm },
  vesselName: { fontSize: Typography.lg, fontWeight: '700', color: Colors.accent, marginBottom: 4 },
  vesselSub:  { fontSize: Typography.sm, color: Colors.textMid },
  slipBadge:  { marginTop: Spacing.sm, backgroundColor: Colors.primary + '22', borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4, alignSelf: 'flex-start' },
  slipText:   { fontSize: Typography.sm, color: Colors.primary, fontWeight: '600' },

  emptyText: { fontSize: Typography.sm, color: Colors.textDim, textAlign: 'center', paddingVertical: Spacing.md },

  signOutBtn:  { alignItems: 'center', padding: Spacing.md, marginTop: Spacing.md },
  signOutText: { color: Colors.error, fontSize: Typography.sm, fontWeight: '600' },
});
