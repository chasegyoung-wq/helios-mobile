import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Dimensions,
  Modal, TextInput, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../lib/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH  = width - Spacing.lg * 2;
const CARD_HEIGHT = CARD_WIDTH * 0.6;

function fmt(d) {
  if (!d) return 'No Expiry';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); }
  catch { return d; }
}

function fmtTime(ts) {
  if (!ts) return '';
  try { return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  catch { return ts; }
}

function MemberCard({ card, isGuest }) {
  return (
    <View style={[
      styles.memberCard,
      { width: CARD_WIDTH, height: CARD_HEIGHT },
      isGuest && styles.guestCard,
    ]}>
      {/* Holographic layers */}
      <View style={styles.holoLayer1} />
      <View style={styles.holoLayer2} />
      <View style={styles.holoLayer3} />
<View style={styles.holoShimmer} />
<View style={styles.cardGlow} />

      <View style={styles.cardContent}>
        {/* Top row */}
        <View style={styles.cardTopRow}>
          <View>
            <Image
              source={require('../../assets/helios-logo.png')}
              style={styles.cardLogo}
              resizeMode="contain"
            />
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.cardBrand}>HELIOS</Text>
            <Text style={styles.cardSubBrand}>{isGuest ? 'GUEST ACCESS' : 'MEMBER ACCESS'}</Text>
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
            <Text style={styles.cardFieldLabel}>{isGuest ? 'GUEST' : 'MEMBER'}</Text>
            <Text style={styles.cardFieldValue}>{card.card_holder_name}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.cardFieldLabel}>VALID UNTIL</Text>
            <Text style={styles.cardFieldValue}>{fmt(card.valid_until)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function GuestCardModal({ visible, onClose, onCreated }) {
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [phone,     setPhone]     = useState('');
  const [duration,  setDuration]  = useState('24');
  const [notes,     setNotes]     = useState('');
  const [loading,   setLoading]   = useState(false);

  async function submit() {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Required', 'Guest first and last name are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/portal/access/guest-card', {
        guestFirstName: firstName.trim(),
        guestLastName:  lastName.trim(),
        guestEmail:     email.trim() || null,
        guestPhone:     phone.trim() || null,
        duration:       parseInt(duration) || 24,
        notes:          notes.trim() || null,
      });
      Alert.alert('Guest Card Created', res.message || 'Guest card created successfully.');
      setFirstName(''); setLastName(''); setEmail(''); setPhone(''); setDuration('24'); setNotes('');
      onCreated();
      onClose();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create guest card.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Create Guest Card</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalClose}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalScroll} contentContainerStyle={{ padding: Spacing.lg }}>
          <Text style={styles.modalSub}>Guest information will be saved to the club's CRM automatically.</Text>

          <Text style={styles.inputLabel}>First Name *</Text>
          <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="First name" placeholderTextColor={Colors.textDimmer} />

          <Text style={styles.inputLabel}>Last Name *</Text>
          <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Last name" placeholderTextColor={Colors.textDimmer} />

          <Text style={styles.inputLabel}>Email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="guest@email.com" placeholderTextColor={Colors.textDimmer} keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.inputLabel}>Phone</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="(555) 555-5555" placeholderTextColor={Colors.textDimmer} keyboardType="phone-pad" />

          <Text style={styles.inputLabel}>Access Duration</Text>
          <View style={styles.durationRow}>
            {['12', '24', '48', '72'].map(h => (
              <TouchableOpacity key={h} onPress={() => setDuration(h)}
                style={[styles.durationBtn, duration === h && styles.durationBtnActive]}>
                <Text style={[styles.durationText, duration === h && styles.durationTextActive]}>{h}hr</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Notes</Text>
          <TextInput style={[styles.input, { minHeight: 70 }]} value={notes} onChangeText={setNotes} placeholder="Optional notes for staff..." placeholderTextColor={Colors.textDimmer} multiline />

          <TouchableOpacity style={[styles.createBtn, loading && { opacity: 0.6 }]} onPress={submit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.createBtnText}>Create Guest Card</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function CardScreen() {
  const { logout } = useAuthStore();
  const [accessData,  setAccessData]  = useState(null);
  const [guestCards,  setGuestCards]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [showModal,   setShowModal]   = useState(false);
  const [showGuests,  setShowGuests]  = useState(false);

  async function loadAccess() {
    try {
      const [data, guests] = await Promise.all([
        api.get('/portal/access'),
        api.get('/portal/access/guest-cards').catch(() => ({ cards: [] })),
      ]);
      setAccessData(data);
      setGuestCards(guests?.cards || []);
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
          text: 'Report Lost', style: 'destructive',
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

  function revokeGuest(cardId, name) {
    Alert.alert(
      'Revoke Guest Card',
      `Revoke access for ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke', style: 'destructive',
          onPress: async () => {
            try {
              await api.post('/portal/access/guest-card/' + cardId + '/revoke', {});
              loadAccess();
            } catch {
              Alert.alert('Error', 'Failed to revoke card.');
            }
          },
        },
      ]
    );
  }

  const cards  = accessData?.cards?.filter(c => !c.is_guest) || [];
  const log    = accessData?.log   || [];
  const active = cards.filter(c => c.status === 'Active');
  const activeGuests = guestCards.filter(c => c.status === 'Active');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Access Card</Text>
        <TouchableOpacity style={styles.guestBtn} onPress={() => setShowModal(true)}>
          <Text style={styles.guestBtnText}>+ Guest Card</Text>
        </TouchableOpacity>
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
          {/* Member cards */}
          {active.length > 0 ? active.map(card => (
            <View key={card.id}>
              <MemberCard card={card} isGuest={false} />

              {card.allowed_zones?.length > 0 && (
                <View style={styles.zonesRow}>
                  {card.allowed_zones.map(zone => (
                    <View key={zone} style={styles.zoneBadge}>
                      <Text style={styles.zoneText}>{zone}</Text>
                    </View>
                  ))}
                </View>
              )}

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

          {/* Guest cards section */}
          <TouchableOpacity style={styles.sectionHeader} onPress={() => setShowGuests(!showGuests)}>
            <Text style={styles.sectionTitle}>Active Guest Cards ({activeGuests.length})</Text>
            <Text style={styles.sectionToggle}>{showGuests ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showGuests && (
            activeGuests.length > 0 ? activeGuests.map(card => (
              <View key={card.id} style={styles.guestCardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.guestName}>{card.card_holder_name}</Text>
                  <Text style={styles.guestSub}>Valid until {fmt(card.valid_until)}</Text>
                  {card.guest_email && <Text style={styles.guestSub}>{card.guest_email}</Text>}
                </View>
                <TouchableOpacity style={styles.revokeBtn} onPress={() => revokeGuest(card.id, card.card_holder_name)}>
                  <Text style={styles.revokeBtnText}>Revoke</Text>
                </TouchableOpacity>
              </View>
            )) : (
              <Text style={styles.emptyText}>No active guest cards</Text>
            )
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

      <GuestCardModal visible={showModal} onClose={() => setShowModal(false)} onCreated={loadAccess} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.bg },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle:{ fontSize: Typography.xl, fontWeight: '700', color: Colors.text },
  guestBtn:   { backgroundColor: Colors.accent + '22', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 6, borderWidth: 1, borderColor: Colors.accent + '44' },
  guestBtnText:{ color: Colors.accent, fontSize: Typography.sm, fontWeight: '600' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: Spacing.lg },

  memberCard: {
  borderRadius: Radius.lg,
  borderWidth: 1.5,
  borderColor: Colors.accent,
  overflow: 'hidden',
  marginBottom: Spacing.md,
  backgroundColor: '#0D1F35',
  ...Shadows.lg,
},
guestCard: {
  borderColor: Colors.info,
  backgroundColor: '#0A1828',
},
holoLayer1: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Colors.accent, opacity: 0.03 },
holoLayer2: { position: 'absolute', top: -60, left: -60, width: 180, height: 180, borderRadius: 90, backgroundColor: Colors.accent, opacity: 0.07 },
holoLayer3: { position: 'absolute', bottom: -40, right: -40, width: 120, height: 120, borderRadius: 60, backgroundColor: '#60A5FA', opacity: 0.05 },
// Diagonal shimmer stripe
holoShimmer: {
  position: 'absolute',
  top: -30, left: -20,
  width: 60, height: 300,
  backgroundColor: 'rgba(255,255,255,0.06)',
  transform: [{ rotate: '35deg' }],
},
cardGlow: { position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: Colors.accent, opacity: 0.08 },
cardContent:   { flex: 1, padding: Spacing.md, justifyContent: 'space-between' },
cardTopRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
cardLogo:      { width: 44, height: 44 },
cardBrand:     { fontSize: Typography.lg, fontWeight: '800', color: Colors.accent, letterSpacing: 3 },
cardSubBrand:  { fontSize: Typography.xs, color: Colors.accent + 'AA', letterSpacing: 2, marginTop: 2, textAlign: 'right' },
cardChip: {
  width: 32, height: 24, borderRadius: 4,
  backgroundColor: '#B8944F',
  borderWidth: 1, borderColor: '#D4AE6B',
  marginBottom: 4,
  shadowColor: '#B8944F', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4,
},
cardNumberBox: {
  backgroundColor: 'rgba(20,40,65,0.85)',
  borderRadius: Radius.sm, padding: Spacing.sm,
  alignItems: 'center',
  borderWidth: 1, borderColor: Colors.accent + '33',
},
cardNumber:    { fontSize: Typography.xl, fontWeight: '700', color: Colors.accent, letterSpacing: 4, fontFamily: 'monospace' },
cardNumberSub: { fontSize: Typography.xs, color: Colors.textDim, marginTop: 2 },
cardBottomRow:  { flexDirection: 'row', justifyContent: 'space-between' },
cardFieldLabel: { fontSize: 9, color: Colors.accent + 'AA', letterSpacing: 1, textTransform: 'uppercase' },
cardFieldValue: { fontSize: Typography.sm, fontWeight: '600', color: Colors.text, marginTop: 2 },
  zonesRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  zoneBadge: { backgroundColor: Colors.primary + '22', borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderWidth: 1, borderColor: Colors.primary },
  zoneText:  { fontSize: Typography.xs, color: Colors.accent, fontWeight: '600' },

  reportBtn:     { borderWidth: 1, borderColor: Colors.error + '44', borderRadius: Radius.sm, padding: Spacing.md, alignItems: 'center', marginBottom: Spacing.lg },
  reportBtnText: { color: Colors.error, fontSize: Typography.sm, fontWeight: '600' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, marginBottom: Spacing.sm },
  sectionTitle:  { fontSize: Typography.md, fontWeight: '700', color: Colors.text },
  sectionToggle: { color: Colors.textDim, fontSize: Typography.sm },

  guestCardRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.sm },
  guestName:    { fontSize: Typography.sm, fontWeight: '600', color: Colors.accent },
  guestSub:     { fontSize: Typography.xs, color: Colors.textDim, marginTop: 2 },
  revokeBtn:    { backgroundColor: 'rgba(248,113,113,0.08)', borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: 6, borderWidth: 1, borderColor: Colors.error + '44' },
  revokeBtnText:{ color: Colors.error, fontSize: Typography.xs, fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: Typography.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  emptyText:  { fontSize: Typography.sm, color: Colors.textDim, textAlign: 'center', paddingVertical: Spacing.sm },

  historySection: { marginTop: Spacing.md },
  historyTitle:   { fontSize: Typography.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  logRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, gap: Spacing.sm },
  logIcon:  { fontSize: 18 },
  logGate:  { fontSize: Typography.sm, fontWeight: '600', color: Colors.text },
  logSub:   { fontSize: Typography.xs, color: Colors.textDim },
  logTime:  { fontSize: Typography.xs, color: Colors.textDim, textAlign: 'right' },

  // Modal
  modalContainer: { flex: 1, backgroundColor: Colors.bg },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle:     { fontSize: Typography.xl, fontWeight: '700', color: Colors.text },
  modalClose:     { color: Colors.accent, fontSize: Typography.md },
  modalScroll:    { flex: 1 },
  modalSub:       { fontSize: Typography.sm, color: Colors.textDim, marginBottom: Spacing.lg },
  inputLabel:     { fontSize: Typography.xs, fontWeight: '600', color: Colors.textMid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input:          { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, padding: Spacing.md, color: Colors.text, fontSize: Typography.md, marginBottom: Spacing.md },
  durationRow:    { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  durationBtn:    { flex: 1, padding: Spacing.sm, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  durationBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '22' },
  durationText:   { fontSize: Typography.sm, fontWeight: '600', color: Colors.textMid },
  durationTextActive: { color: Colors.accent },
  createBtn:      { backgroundColor: Colors.accent, borderRadius: Radius.sm, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.md },
  createBtnText:  { color: '#fff', fontSize: Typography.md, fontWeight: '700' },
});