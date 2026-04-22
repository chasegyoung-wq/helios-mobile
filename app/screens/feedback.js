// ============================================================
// HELIOS MOBILE — FEEDBACK SCREEN
// app/(tabs)/feedback.js
// ============================================================

import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../lib/theme';
import { BottomNav } from '../../lib/BottomNav';

const CATEGORIES = [
  { key: 'Dining',  label: 'Dining',   emoji: '🍽️' },
  { key: 'Marina',  label: 'Marina',   emoji: '⚓' },
  { key: 'Events',  label: 'Events',   emoji: '📅' },
  { key: 'Golf',    label: 'Golf',     emoji: '⛳' },
  { key: 'Fitness', label: 'Fitness',  emoji: '🏋️' },
  { key: 'Spa',     label: 'Spa',      emoji: '💆' },
  { key: 'General', label: 'General',  emoji: '💬' },
];

function StarRating({ rating, onRate, size = 44 }) {
  return (
    <View style={styles.starsRow}>
      {[1,2,3,4,5].map(i => (
        <TouchableOpacity key={i} onPress={() => onRate(i)} style={styles.starBtn}>
          <Text style={{ fontSize: size, color: i <= rating ? '#F59E0B' : Colors.borderMid }}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function FeedbackModal({ visible, category, onClose, onSubmitted }) {
  const [rating,  setRating]  = useState(0);
  const [comment, setComment] = useState('');
  const [anon,    setAnon]    = useState(false);
  const [loading, setLoading] = useState(false);

  function reset() { setRating(0); setComment(''); setAnon(false); }

  async function submit() {
    if (!rating) { Alert.alert('Required', 'Please select a star rating.'); return; }
    setLoading(true);
    try {
      await api.post('/feedback', { category, rating, comment: comment.trim() || null, isAnonymous: anon });
      reset();
      onSubmitted();
      onClose();
      Alert.alert('Thank You! ⭐', 'Your feedback helps us improve your experience.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to submit feedback.');
    } finally {
      setLoading(false);
    }
  }

  const cat = CATEGORIES.find(c => c.key === category) || {};

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Rate Your Experience</Text>
          <TouchableOpacity onPress={() => { reset(); onClose(); }}>
            <Text style={styles.modalClose}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
          {/* Category */}
          <View style={styles.catBadge}>
            <Text style={styles.catEmoji}>{cat.emoji}</Text>
            <Text style={styles.catLabel}>{cat.label}</Text>
          </View>

          {/* Stars */}
          <Text style={styles.ratePrompt}>How would you rate your experience?</Text>
          <StarRating rating={rating} onRate={setRating} size={52} />
          {rating > 0 && (
            <Text style={styles.ratingLabel}>
              {['','Poor','Fair','Good','Great','Excellent!'][rating]}
            </Text>
          )}

          {/* Comment */}
          <Text style={styles.inputLabel}>Tell us more (optional)</Text>
          <TextInput
            style={styles.commentInput}
            value={comment}
            onChangeText={setComment}
            placeholder="Share your thoughts..."
            placeholderTextColor={Colors.textDimmer}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Anonymous toggle */}
          <TouchableOpacity style={styles.anonRow} onPress={() => setAnon(!anon)}>
            <View style={[styles.checkbox, anon && styles.checkboxChecked]}>
              {anon && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.anonLabel}>Submit anonymously</Text>
          </TouchableOpacity>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, (!rating || loading) && { opacity: 0.5 }]}
            onPress={submit}
            disabled={!rating || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitBtnText}>Submit Feedback</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function FeedbackScreen() {
  const { logout } = useAuthStore();
  const [pending,      setPending]      = useState([]);
  const [showModal,    setShowModal]    = useState(false);
  const [selectedCat,  setSelectedCat]  = useState(null);
  const [recentHistory,setRecentHistory]= useState([]);
  const [loading,      setLoading]      = useState(true);

  async function loadData() {
    try {
      const data = await api.get('/feedback/pending');
      setPending(data.triggers || []);
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') logout();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  function openFeedback(category) {
    setSelectedCat(category);
    setShowModal(true);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feedback</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Pending surveys */}
        {pending.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Awaiting Your Feedback</Text>
            {pending.map(t => {
              const cat = CATEGORIES.find(c => c.key === t.category) || {};
              return (
                <TouchableOpacity key={t.id} style={styles.pendingCard} onPress={() => openFeedback(t.category)}>
                  <Text style={styles.pendingEmoji}>{cat.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pendingTitle}>{t.title || `Rate your ${t.category} experience`}</Text>
                    <Text style={styles.pendingSub}>Tap to rate · Takes 30 seconds</Text>
                  </View>
                  <Text style={styles.pendingArrow}>›</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Rate by category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rate Your Experience</Text>
          <Text style={styles.sectionSub}>Your feedback helps us improve and rewards our best staff.</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity key={cat.key} style={styles.catCard} onPress={() => openFeedback(cat.key)}>
                <Text style={styles.catCardEmoji}>{cat.emoji}</Text>
                <Text style={styles.catCardLabel}>{cat.label}</Text>
                <View style={styles.miniStars}>
                  {[1,2,3,4,5].map(i => (
                    <Text key={i} style={{ fontSize: 10, color: Colors.accent }}>★</Text>
                  ))}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Why Your Feedback Matters</Text>
          <Text style={styles.infoText}>• Ratings directly influence staff performance reviews</Text>
          <Text style={styles.infoText}>• Departments with high ratings earn bonus incentives</Text>
          <Text style={styles.infoText}>• Your input shapes club improvements and investments</Text>
          <Text style={styles.infoText}>• Anonymous submissions are always available</Text>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      <FeedbackModal
        visible={showModal}
        category={selectedCat}
        onClose={() => setShowModal(false)}
        onSubmitted={loadData}
      />
    <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.bg },
  header:       { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle:  { fontSize: Typography.xl, fontWeight: '700', color: Colors.text },
  scrollContent:{ padding: Spacing.lg },

  section:      { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: Typography.md, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  sectionSub:   { fontSize: Typography.sm, color: Colors.textDim, marginBottom: Spacing.md },

  pendingCard:  { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.accent + '44', padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.sm, ...Shadows.sm },
  pendingEmoji: { fontSize: 28 },
  pendingTitle: { fontSize: Typography.sm, fontWeight: '700', color: Colors.accent },
  pendingSub:   { fontSize: Typography.xs, color: Colors.textDim, marginTop: 2 },
  pendingArrow: { fontSize: Typography.xl, color: Colors.accent },

  catGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  catCard:      { width: '30%', backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, alignItems: 'center', gap: 4, ...Shadows.sm },
  catCardEmoji: { fontSize: 28 },
  catCardLabel: { fontSize: Typography.xs, fontWeight: '600', color: Colors.textMid, textAlign: 'center' },
  miniStars:    { flexDirection: 'row', gap: 1 },

  infoCard:     { backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg },
  infoTitle:    { fontSize: Typography.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  infoText:     { fontSize: Typography.sm, color: Colors.textMid, marginBottom: 4 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: Colors.bg },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle:     { fontSize: Typography.xl, fontWeight: '700', color: Colors.text },
  modalClose:     { color: Colors.accent, fontSize: Typography.md },
  modalContent:   { padding: Spacing.lg },

  catBadge:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.card, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, alignSelf: 'flex-start', marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  catEmoji:     { fontSize: 24 },
  catLabel:     { fontSize: Typography.md, fontWeight: '700', color: Colors.text },

  ratePrompt:   { fontSize: Typography.md, color: Colors.textMid, textAlign: 'center', marginBottom: Spacing.md },
  starsRow:     { flexDirection: 'row', justifyContent: 'center', marginBottom: Spacing.sm },
  starBtn:      { padding: 4 },
  ratingLabel:  { textAlign: 'center', fontSize: Typography.md, fontWeight: '700', color: '#F59E0B', marginBottom: Spacing.lg },

  inputLabel:   { fontSize: Typography.xs, fontWeight: '600', color: Colors.textMid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  commentInput: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, padding: Spacing.md, color: Colors.text, fontSize: Typography.md, minHeight: 100, marginBottom: Spacing.md },

  anonRow:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  checkbox:     { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  checkmark:    { color: '#fff', fontSize: 12, fontWeight: '700' },
  anonLabel:    { fontSize: Typography.sm, color: Colors.textMid },

  submitBtn:    { backgroundColor: Colors.accent, borderRadius: Radius.sm, padding: Spacing.lg, alignItems: 'center' },
  submitBtnText:{ color: '#fff', fontSize: Typography.md, fontWeight: '700' },
});