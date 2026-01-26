/**
 * Chat Utilities Library
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * Functions for managing chat messages and notifications.
 */

import { supabase } from './supabase';

export interface ChatMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  project_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  recipient?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface ChatNotificationSettings {
  id: string;
  user_id: string;
  last_email_sent: string | null;
  unread_count: number;
  email_enabled: boolean;
  sound_enabled: boolean;
}

/**
 * Send a new chat message
 */
export async function sendMessage(
  senderId: string,
  recipientId: string,
  message: string,
  projectId?: string
): Promise<ChatMessage | null> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        sender_id: senderId,
        recipient_id: recipientId,
        message: message.trim(),
        project_id: projectId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return null;
    }

    // Update unread count for recipient
    await incrementUnreadCount(recipientId);

    return data;
  } catch (err) {
    console.error('Error in sendMessage:', err);
    return null;
  }
}

/**
 * Get messages between two users
 */
export async function getMessages(
  userId: string,
  otherUserId: string,
  limit = 50
): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:users!chat_messages_sender_id_fkey(id, name, email, role),
        recipient:users!chat_messages_recipient_id_fkey(id, name, email, role)
      `)
      .or(
        `and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`
      )
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error in getMessages:', err);
    return [];
  }
}

/**
 * Get all conversations for a user (grouped by other user)
 */
export async function getConversations(userId: string): Promise<{
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}[]> {
  try {
    // Get all messages involving this user
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:users!chat_messages_sender_id_fkey(id, name, email, role),
        recipient:users!chat_messages_recipient_id_fkey(id, name, email, role)
      `)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }

    // Group by other user
    const conversationMap = new Map<string, {
      userId: string;
      userName: string;
      userEmail: string;
      userRole: string;
      lastMessage: string;
      lastMessageTime: string;
      unreadCount: number;
    }>();

    for (const msg of messages || []) {
      const otherUser = msg.sender_id === userId ? msg.recipient : msg.sender;
      const otherId = otherUser?.id;

      if (!otherId || conversationMap.has(otherId)) continue;

      // Count unread messages from this user
      const unreadCount = (messages || []).filter(
        m => m.sender_id === otherId && m.recipient_id === userId && !m.is_read
      ).length;

      conversationMap.set(otherId, {
        userId: otherId,
        userName: otherUser?.name || 'Unknown',
        userEmail: otherUser?.email || '',
        userRole: otherUser?.role || 'user',
        lastMessage: msg.message,
        lastMessageTime: msg.created_at,
        unreadCount,
      });
    }

    return Array.from(conversationMap.values());
  } catch (err) {
    console.error('Error in getConversations:', err);
    return [];
  }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  recipientId: string,
  senderId: string
): Promise<void> {
  try {
    await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('recipient_id', recipientId)
      .eq('sender_id', senderId)
      .eq('is_read', false);

    // Reset unread count for this conversation
    await updateUnreadCount(recipientId);
  } catch (err) {
    console.error('Error marking messages as read:', err);
  }
}

/**
 * Get total unread message count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('Error in getUnreadCount:', err);
    return 0;
  }
}

/**
 * Increment unread count for a user
 */
async function incrementUnreadCount(userId: string): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from('chat_notifications')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existing) {
      await supabase
        .from('chat_notifications')
        .update({ unread_count: (existing.unread_count || 0) + 1 })
        .eq('user_id', userId);
    } else {
      await supabase
        .from('chat_notifications')
        .insert({ user_id: userId, unread_count: 1 });
    }
  } catch (err) {
    console.error('Error incrementing unread count:', err);
  }
}

/**
 * Update unread count for a user (recalculate from messages)
 */
async function updateUnreadCount(userId: string): Promise<void> {
  try {
    const count = await getUnreadCount(userId);

    const { data: existing } = await supabase
      .from('chat_notifications')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existing) {
      await supabase
        .from('chat_notifications')
        .update({ unread_count: count })
        .eq('user_id', userId);
    } else {
      await supabase
        .from('chat_notifications')
        .insert({ user_id: userId, unread_count: count });
    }
  } catch (err) {
    console.error('Error updating unread count:', err);
  }
}

/**
 * Get notification settings for a user
 */
export async function getNotificationSettings(
  userId: string
): Promise<ChatNotificationSettings | null> {
  try {
    const { data, error } = await supabase
      .from('chat_notifications')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching notification settings:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error in getNotificationSettings:', err);
    return null;
  }
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(
  userId: string,
  settings: Partial<Pick<ChatNotificationSettings, 'email_enabled' | 'sound_enabled'>>
): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from('chat_notifications')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existing) {
      await supabase
        .from('chat_notifications')
        .update(settings)
        .eq('user_id', userId);
    } else {
      await supabase
        .from('chat_notifications')
        .insert({ user_id: userId, ...settings });
    }
  } catch (err) {
    console.error('Error updating notification settings:', err);
  }
}

/**
 * Get all admins (for developer to chat with)
 */
export async function getAdmins(): Promise<{
  id: string;
  name: string;
  email: string;
}[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('role', 'admin')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching admins:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error in getAdmins:', err);
    return [];
  }
}

/**
 * Get all developers (for admin to chat with)
 */
export async function getDevelopers(): Promise<{
  id: string;
  name: string;
  email: string;
}[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('role', 'developer')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching developers:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error in getDevelopers:', err);
    return [];
  }
}

/**
 * Play notification sound
 */
export function playNotificationSound(): void {
  try {
    // Create a simple notification sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    // Create oscillator for a pleasant notification tone
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure the sound
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (err) {
    console.error('Error playing notification sound:', err);
  }
}

/**
 * Format timestamp for display
 */
export function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
