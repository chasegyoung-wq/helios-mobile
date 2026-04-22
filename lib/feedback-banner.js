// ============================================================
// HELIOS MOBILE — FEEDBACK BANNER COMPONENT
// Shows pending survey prompts on the home screen
// Import and use in app/(tabs)/index.js
// ============================================================

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from './api';
import { Colors, Typography, Spacing, Radius } from './theme';

const CAT_EMOJI = {
  Dining: '🍽️', Marina: '⚓', Events: '📅',
  Golf: '⛳', Fitness: '🏋️', Spa: '💆', General: '💬',
};

export function FeedbackBanner() {
  const router = useRouter();
  const [pending,   setPending]   = useState([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    api.get('/feedback/pending')
      .then(d => setPending(d.triggers || []))
      .catch(() => {});
  }, []);

  if (dismissed || pending.length === 0) return null;

  const first = pending[0];
  const emoji = CAT_EMOJI[first.category] || '⭐';

  return (
    <View style={styles.banner}>
      <Text style={styles.bannerEmoji}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.bannerTitle}>How was your {first.category} experience?</Text>
        <Text style={styles.bannerSub}>Takes 30 seconds · {pending.length} pending</Text>
      </View>
      <TouchableOpacity style={styles.rateBtn} onPress={() => router.push('/(tabs)/feedback')}>
        <Text style={styles.rateBtnText}>Rate</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setDismissed(true)} style={styles.dismissBtn}>
        <Text style={styles.dismissText}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner:      { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.accent + '44', padding: Spacing.md, marginBottom: Spacing.md, gap: Spacing.sm },
  bannerEmoji: { fontSize: 24 },
  bannerTitle: { fontSize: Typography.sm, fontWeight: '700', color: Colors.accent },
  bannerSub:   { fontSize: Typography.xs, color: Colors.textDim, marginTop: 2 },
  rateBtn:     { backgroundColor: Colors.accent, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 6 },
  rateBtnText: { color: '#fff', fontSize: Typography.xs, fontWeight: '700' },
  dismissBtn:  { padding: 4 },
  dismissText: { color: Colors.textDim, fontSize: Typography.lg },
});