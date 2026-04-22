// ============================================================
// HELIOS MOBILE — TAB NAVIGATION v2
// 5 primary tabs + More menu
// app/(tabs)/_layout.js
// ============================================================

import { useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Pressable, Dimensions,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../lib/theme';

const { width } = Dimensions.get('window');

function TabIcon({ emoji, focused }) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconFocused]}>
      <Text style={styles.emoji}>{emoji}</Text>
    </View>
  );
}

const MORE_ITEMS = [
  { emoji: '💬', label: 'Social',    route: '/screens/social' },
  { emoji: '⭐', label: 'Feedback',  route: '/screens/feedback' },
  { emoji: '🛒', label: 'Dock Cart', route: '/screens/dock-cart' },
];

function MoreMenu({ visible, onClose }) {
  const router = useRouter();

  function navigate(route) {
    onClose();
    router.push(route);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.moreMenu} onPress={e => e.stopPropagation()}>
          {/* Handle bar */}
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

export default function TabLayout() {
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor:   Colors.accent,
          tabBarInactiveTintColor: Colors.textDim,
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="bill"
          options={{
            title: 'My Bill',
            tabBarIcon: ({ focused }) => <TabIcon emoji="💳" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="bookings"
          options={{
            title: 'Bookings',
            tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="card"
          options={{
            title: 'My Card',
            tabBarIcon: ({ focused }) => <TabIcon emoji="🔑" focused={focused} />,
          }}
        />

        <Tabs.Screen
  name="more-button"
  options={{
    title: 'More',
    tabBarIcon: ({ focused }) => (
      <View style={[styles.iconContainer, (focused || showMore) && styles.iconFocused]}>
        <View style={{ gap: 4, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: focused || showMore ? Colors.accent : Colors.textMid }} />
            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: focused || showMore ? Colors.accent : Colors.textMid }} />
            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: focused || showMore ? Colors.accent : Colors.textMid }} />
          </View>
        </View>
      </View>
    ),
    tabBarButton: (props) => (
      <TouchableOpacity
        {...props}
        onPress={() => setShowMore(true)}
        style={props.style}
      />
    ),
  }}
/>

        {/* Hidden tabs — accessible via More menu */}
        

      </Tabs>
      <MoreMenu visible={showMore} onClose={() => setShowMore(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.card,
    borderTopColor:  Colors.border,
    borderTopWidth:  1,
    paddingTop: 6,
    paddingBottom: 8,
    height: 70,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  iconContainer: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 10,
  },
  iconFocused: {
    backgroundColor: Colors.primary + '33',
  },
  emoji: { fontSize: 20 },

  // More menu
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  moreMenu: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    paddingBottom: 40,
    ...Shadows.lg,
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  moreTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  moreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  moreItem: {
    width: (width - Spacing.lg * 2 - Spacing.md * 2) / 3,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  moreIconBox: {
    width: 64, height: 64,
    backgroundColor: Colors.bg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  moreEmoji: { fontSize: 28 },
  moreLabel: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textMid,
    textAlign: 'center',
  },
  cancelBtn: {
    backgroundColor: Colors.bg,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: {
    color: Colors.textMid,
    fontSize: Typography.md,
    fontWeight: '600',
  },
});