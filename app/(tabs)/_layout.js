// ============================================================
// HELIOS MOBILE — TAB NAVIGATION
// app/(tabs)/_layout.js
// ============================================================

import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../lib/theme';

function TabIcon({ emoji, focused }) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconFocused]}>
      <Text style={styles.emoji}>{emoji}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
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
        name="social"
        options={{
          title: 'Social',
          tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} />,
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
  name="dock-cart"
  options={{
    title: 'Dock Cart',
    tabBarIcon: ({ focused }) => <TabIcon emoji="🛒" focused={focused} />,
  }}
/>
    </Tabs>
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
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  iconFocused: {
    backgroundColor: Colors.primary + '33',
  },
  emoji: { fontSize: 20 },
});
