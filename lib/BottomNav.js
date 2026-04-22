import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadows } from './theme';

const { width } = Dimensions.get('window');

const NAV_ITEMS = [
  { emoji: '🏠', label: 'Home',     route: '/(tabs)/' },
  { emoji: '💳', label: 'My Bill',  route: '/(tabs)/bill' },
  { emoji: '📅', label: 'Bookings', route: '/(tabs)/bookings' },
  { emoji: '🔑', label: 'My Card',  route: '/(tabs)/card' },
];

const MORE_ITEMS = [
  { emoji: '💬', label: 'Social',    route: '/screens/social' },
  { emoji: '⭐', label: 'Feedback',  route: '/screens/feedback' },
  { emoji: '🛒', label: 'Dock Cart', route: '/screens/dock-cart' },
];

function MoreMenu({ visible, onClose }) {
  const router = useRouter();
  function navigate(route) { onClose(); router.push(route); }
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.moreMenu} onPress={e => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.moreTitle}>More</Text>
          <View style={styles.moreGrid}>
            {MORE_ITEMS.map(item => (
              <TouchableOpacity key={item.route} style={styles.moreItem} onPress={() => navigate(item.route)}>
                <View style={styles.moreIconBox}>
                  <Text style={styles.moreEmoji}>{item.emoji}</Text>
                </View>
                <Text style={styles.moreLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function BottomNav() {
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      <View style={styles.container}>
        {NAV_ITEMS.map(item => (
          <TouchableOpacity key={item.route} style={styles.item} onPress={() => router.push(item.route)}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.label}>{item.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.item} onPress={() => setShowMore(true)}>
          <View style={styles.dotsRow}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
          <Text style={styles.label}>More</Text>
        </TouchableOpacity>
      </View>
      <MoreMenu visible={showMore} onClose={() => setShowMore(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container:   { flexDirection: 'row', backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 6, paddingBottom: 8, height: 70 },
  item:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  emoji:       { fontSize: 20 },
  label:       { fontSize: 10, fontWeight: '600', color: Colors.textDim },
  dotsRow:     { flexDirection: 'row', gap: 4, height: 20, alignItems: 'center' },
  dot:         { width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.textMid },

  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  moreMenu:    { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, paddingBottom: 40, ...Shadows.lg },
  handle:      { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  moreTitle:   { fontSize: Typography.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.lg },
  moreGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.lg },
  moreItem:    { width: (width - Spacing.lg * 2 - Spacing.md * 2) / 3, alignItems: 'center', gap: Spacing.sm },
  moreIconBox: { width: 64, height: 64, backgroundColor: Colors.bg, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  moreEmoji:   { fontSize: 28 },
  moreLabel:   { fontSize: Typography.xs, fontWeight: '600', color: Colors.textMid, textAlign: 'center' },
  cancelBtn:   { backgroundColor: Colors.bg, borderRadius: Radius.sm, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  cancelText:  { color: Colors.textMid, fontSize: Typography.md, fontWeight: '600' },
});