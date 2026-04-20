// ============================================================
// HELIOS MOBILE — BILL SCREEN
// app/(tabs)/bill.js
// ============================================================

import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../lib/theme';

function fmt(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }); }
  catch { return d; }
}

const CATEGORY_COLORS = {
  Dues:      Colors.accent,
  Marina:    '#60A5FA',
  Hotel:     '#A78BFA',
  Dining:    '#4ADE80',
  Golf:      '#34D399',
  POS:       '#FBBF24',
  Payment:   Colors.success,
  default:   Colors.textMid,
};

export default function BillScreen() {
  const { logout } = useAuthStore();
  const [billData,   setBillData]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [month,      setMonth]      = useState(new Date().toISOString().slice(0, 7));

  async function loadBill() {
    try {
      const data = await api.get(`/portal/bill?month=${month}`);
      setBillData(data);
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') logout();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadBill(); }, [month]);

  function onRefresh() { setRefreshing(true); loadBill(); }

  const transactions = billData?.transactions || [];
  const balance      = billData?.balance || 0;

  // Group by category
  const grouped = transactions.reduce((acc, t) => {
    const cat = t.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  function handlePay() {
    Alert.alert(
      'Pay Balance',
      `Pay $${Math.abs(balance).toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pay Now', onPress: () => Alert.alert('Info', 'Open the web portal to complete payment with your saved card.') },
      ]
    );
  }

  // Month navigation
  function prevMonth() {
    const d = new Date(month + '-01');
    d.setMonth(d.getMonth() - 1);
    setMonth(d.toISOString().slice(0, 7));
  }
  function nextMonth() {
    const d = new Date(month + '-01');
    d.setMonth(d.getMonth() + 1);
    const now = new Date();
    if (d <= now) setMonth(d.toISOString().slice(0, 7));
  }

  const monthLabel = new Date(month + '-15').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bill</Text>
        {balance > 0 && (
          <TouchableOpacity style={styles.payBtn} onPress={handlePay}>
            <Text style={styles.payBtnText}>Pay ${Math.abs(balance).toFixed(2)}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Balance card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={[styles.balanceAmount, { color: balance > 0 ? Colors.error : Colors.success }]}>
          ${Math.abs(balance).toFixed(2)}
        </Text>
        <Text style={styles.balanceSub}>{balance > 0 ? 'Due on the 15th' : 'No outstanding balance'}</Text>
      </View>

      {/* Month selector */}
      <View style={styles.monthRow}>
        <TouchableOpacity onPress={prevMonth} style={styles.monthBtn}>
          <Text style={styles.monthBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.monthBtn}>
          <Text style={styles.monthBtnText}>›</Text>
        </TouchableOpacity>
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
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📄</Text>
              <Text style={styles.emptyText}>No transactions for {monthLabel}</Text>
            </View>
          ) : (
            Object.entries(grouped).map(([category, txns]) => (
              <View key={category} style={styles.categoryGroup}>
                <View style={styles.categoryHeader}>
                  <View style={[styles.categoryDot, { backgroundColor: CATEGORY_COLORS[category] || CATEGORY_COLORS.default }]} />
                  <Text style={styles.categoryName}>{category}</Text>
                  <Text style={styles.categoryTotal}>
                    ${txns.reduce((s, t) => s + parseFloat(t.amount || 0), 0).toFixed(2)}
                  </Text>
                </View>
                {txns.map(t => (
                  <View key={t.id} style={styles.txRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txDesc}>{t.description}</Text>
                      <Text style={styles.txDate}>{fmt(t.date)}</Text>
                    </View>
                    <Text style={[styles.txAmount, { color: parseFloat(t.amount) < 0 ? Colors.success : Colors.text }]}>
                      {parseFloat(t.amount) < 0 ? '-' : ''}${Math.abs(parseFloat(t.amount || 0)).toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            ))
          )}
          <View style={{ height: Spacing.xl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.bg },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle:{ fontSize: Typography.xl, fontWeight: '700', color: Colors.text },
  payBtn:     { backgroundColor: Colors.accent, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 8 },
  payBtnText: { color: '#fff', fontSize: Typography.sm, fontWeight: '700' },

  balanceCard:   { margin: Spacing.lg, backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, alignItems: 'center', ...Shadows.md },
  balanceLabel:  { fontSize: Typography.sm, color: Colors.textDim, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  balanceAmount: { fontSize: 48, fontWeight: '700', marginBottom: 4 },
  balanceSub:    { fontSize: Typography.sm, color: Colors.textDim },

  monthRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  monthBtn:    { padding: Spacing.sm },
  monthBtnText:{ fontSize: Typography.xxl, color: Colors.accent, fontWeight: '300' },
  monthLabel:  { fontSize: Typography.md, fontWeight: '600', color: Colors.text, minWidth: 160, textAlign: 'center' },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:       { flex: 1 },
  scrollContent:{ padding: Spacing.lg },

  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyText:  { fontSize: Typography.md, color: Colors.textDim },

  categoryGroup:  { marginBottom: Spacing.md },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  categoryDot:    { width: 8, height: 8, borderRadius: 4, marginRight: Spacing.sm },
  categoryName:   { flex: 1, fontSize: Typography.sm, fontWeight: '700', color: Colors.text },
  categoryTotal:  { fontSize: Typography.sm, fontWeight: '600', color: Colors.textMid },

  txRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  txDesc:   { fontSize: Typography.sm, color: Colors.text },
  txDate:   { fontSize: Typography.xs, color: Colors.textDim, marginTop: 2 },
  txAmount: { fontSize: Typography.sm, fontWeight: '600' },
});
