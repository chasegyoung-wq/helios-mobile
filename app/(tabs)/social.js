// ============================================================
// HELIOS MOBILE — SOCIAL FEED SCREEN
// app/(tabs)/social.js
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, TextInput, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { Colors, Typography, Spacing, Radius } from '../../lib/theme';

function fmtTime(ts) {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60)   return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return ''; }
}

function PostCard({ post, onReact, onComment }) {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submitComment() {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await onComment(post.id, comment.trim());
      setComment('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.postCard}>
      {/* Author */}
      <View style={styles.postHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {post.first_name?.[0]}{post.last_name?.[0]}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.authorName}>{post.first_name} {post.last_name}</Text>
          <Text style={styles.postTime}>{fmtTime(post.created_at)}</Text>
        </View>
        {post.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{post.category}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      {post.title && <Text style={styles.postTitle}>{post.title}</Text>}
      <Text style={styles.postContent}>{post.content}</Text>

      {/* Reactions */}
      <View style={styles.reactionsRow}>
        {['👍', '❤️', '⚓', '🎉'].map(emoji => {
          const count = post.reactions?.[emoji] || 0;
          return (
            <TouchableOpacity key={emoji} style={styles.reactionBtn} onPress={() => onReact(post.id, emoji)}>
              <Text style={styles.reactionEmoji}>{emoji}</Text>
              {count > 0 && <Text style={styles.reactionCount}>{count}</Text>}
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity style={styles.commentToggle} onPress={() => setShowComments(!showComments)}>
          <Text style={styles.commentToggleText}>💬 {post.comment_count || 0}</Text>
        </TouchableOpacity>
      </View>

      {/* Comments */}
      {showComments && (
        <View style={styles.commentsSection}>
          {(post.comments || []).map(c => (
            <View key={c.id} style={styles.commentRow}>
              <View style={[styles.avatar, styles.commentAvatar]}>
                <Text style={[styles.avatarText, { fontSize: 10 }]}>{c.first_name?.[0]}{c.last_name?.[0]}</Text>
              </View>
              <View style={styles.commentBubble}>
                <Text style={styles.commentAuthor}>{c.first_name} {c.last_name}</Text>
                <Text style={styles.commentText}>{c.content}</Text>
              </View>
            </View>
          ))}

          {/* Add comment */}
          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Add a comment..."
              placeholderTextColor={Colors.textDimmer}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!comment.trim() || submitting) && { opacity: 0.5 }]}
              onPress={submitComment}
              disabled={!comment.trim() || submitting}
            >
              <Text style={styles.sendBtnText}>→</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

export default function SocialScreen() {
  const { user, logout } = useAuthStore();
  const [posts,      setPosts]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newPost,    setNewPost]    = useState('');
  const [posting,    setPosting]    = useState(false);
  const [showCompose,setShowCompose]= useState(false);

  async function loadFeed() {
    try {
      const data = await api.get('/social/feed?limit=20');
      setPosts(Array.isArray(data) ? data : data?.posts || []);
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') logout();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadFeed(); }, []);
  function onRefresh() { setRefreshing(true); loadFeed(); }

  async function handleReact(postId, emoji) {
    try {
      await api.post(`/social/posts/${postId}/react`, { emoji });
      loadFeed();
    } catch {}
  }

  async function handleComment(postId, content) {
    try {
      await api.post(`/social/posts/${postId}/comments`, { content });
      loadFeed();
    } catch {}
  }

  async function submitPost() {
    if (!newPost.trim()) return;
    setPosting(true);
    try {
      await api.post('/social/posts', { content: newPost.trim(), category: 'General' });
      setNewPost('');
      setShowCompose(false);
      loadFeed();
    } catch (err) {
      Alert.alert('Error', 'Failed to post. Please try again.');
    } finally {
      setPosting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Social Feed</Text>
        <TouchableOpacity style={styles.composeBtn} onPress={() => setShowCompose(!showCompose)}>
          <Text style={styles.composeBtnText}>✏️ Post</Text>
        </TouchableOpacity>
      </View>

      {/* Compose */}
      {showCompose && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.composeCard}>
            <TextInput
              style={styles.composeInput}
              value={newPost}
              onChangeText={setNewPost}
              placeholder="Share something with the community..."
              placeholderTextColor={Colors.textDimmer}
              multiline
              autoFocus
            />
            <View style={styles.composeActions}>
              <TouchableOpacity onPress={() => { setShowCompose(false); setNewPost(''); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.postBtn, (!newPost.trim() || posting) && { opacity: 0.5 }]}
                onPress={submitPost}
                disabled={!newPost.trim() || posting}
              >
                {posting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.postBtnText}>Post</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

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
          {posts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyText}>No posts yet. Be the first to share!</Text>
            </View>
          ) : (
            posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onReact={handleReact}
                onComment={handleComment}
              />
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
  composeBtn: { backgroundColor: Colors.accent + '22', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 6, borderWidth: 1, borderColor: Colors.accent + '44' },
  composeBtnText: { color: Colors.accent, fontSize: Typography.sm, fontWeight: '600' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: Spacing.md },

  composeCard:    { margin: Spacing.md, backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
  composeInput:   { color: Colors.text, fontSize: Typography.md, minHeight: 80, textAlignVertical: 'top' },
  composeActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm },
  cancelText:     { color: Colors.textMid, fontSize: Typography.sm },
  postBtn:        { backgroundColor: Colors.accent, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 6 },
  postBtnText:    { color: '#fff', fontSize: Typography.sm, fontWeight: '700' },

  postCard:   { backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.md },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  avatar:     { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: Typography.sm, fontWeight: '700', color: Colors.accent },
  authorName: { fontSize: Typography.sm, fontWeight: '700', color: Colors.text },
  postTime:   { fontSize: Typography.xs, color: Colors.textDim },
  categoryBadge: { backgroundColor: Colors.primary + '22', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  categoryText:  { fontSize: Typography.xs, color: Colors.accent, fontWeight: '600' },
  postTitle:  { fontSize: Typography.md, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  postContent:{ fontSize: Typography.sm, color: Colors.textSoft, lineHeight: 20, marginBottom: Spacing.sm },

  reactionsRow:   { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', flexWrap: 'wrap' },
  reactionBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.bg, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: Colors.border },
  reactionEmoji:  { fontSize: 16 },
  reactionCount:  { fontSize: Typography.xs, color: Colors.textMid, fontWeight: '600' },
  commentToggle:  { marginLeft: 'auto' },
  commentToggleText: { fontSize: Typography.sm, color: Colors.textMid },

  commentsSection: { marginTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm },
  commentRow:     { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  commentAvatar:  { width: 28, height: 28, borderRadius: 14 },
  commentBubble:  { flex: 1, backgroundColor: Colors.bg, borderRadius: Radius.sm, padding: Spacing.sm },
  commentAuthor:  { fontSize: Typography.xs, fontWeight: '700', color: Colors.accent, marginBottom: 2 },
  commentText:    { fontSize: Typography.xs, color: Colors.textSoft },
  commentInputRow:{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  commentInput:   { flex: 1, backgroundColor: Colors.bg, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border, padding: Spacing.sm, color: Colors.text, fontSize: Typography.sm },
  sendBtn:        { backgroundColor: Colors.accent, borderRadius: Radius.sm, width: 36, alignItems: 'center', justifyContent: 'center' },
  sendBtnText:    { color: '#fff', fontSize: Typography.lg, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyText:  { fontSize: Typography.md, color: Colors.textDim, textAlign: 'center' },
});
