/**
 * useChat Hook
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * Custom hook for managing chat state and real-time subscriptions.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ChatMessage,
  getMessages,
  getConversations,
  sendMessage as sendChatMessage,
  markMessagesAsRead,
  getUnreadCount,
  getNotificationSettings,
  playNotificationSound,
} from '@/lib/chat';

interface UseChatOptions {
  userId: string;
  enabled?: boolean;
}

interface UseChatReturn {
  messages: ChatMessage[];
  conversations: {
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
  }[];
  unreadCount: number;
  isLoading: boolean;
  activeConversation: string | null;
  sendMessage: (recipientId: string, message: string, projectId?: string) => Promise<boolean>;
  openConversation: (userId: string) => void;
  closeConversation: () => void;
  refreshConversations: () => Promise<void>;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

export function useChat({ userId, enabled = true }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<UseChatReturn['conversations']>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Load notification settings
  useEffect(() => {
    if (!enabled || !userId) return;

    const loadSettings = async () => {
      const settings = await getNotificationSettings(userId);
      if (settings) {
        setSoundEnabled(settings.sound_enabled);
      }
    };

    loadSettings();
  }, [userId, enabled]);

  // Load conversations
  const refreshConversations = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const convos = await getConversations(userId);
      setConversations(convos);

      const count = await getUnreadCount(userId);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Load messages for active conversation
  const loadMessages = useCallback(async (otherUserId: string) => {
    if (!userId) return;

    try {
      const msgs = await getMessages(userId, otherUserId);
      setMessages(msgs);

      // Mark messages as read
      await markMessagesAsRead(userId, otherUserId);

      // Refresh unread count
      const count = await getUnreadCount(userId);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  }, [userId]);

  // Open a conversation
  const openConversation = useCallback((otherUserId: string) => {
    setActiveConversation(otherUserId);
    loadMessages(otherUserId);
  }, [loadMessages]);

  // Close conversation
  const closeConversation = useCallback(() => {
    setActiveConversation(null);
    setMessages([]);
  }, []);

  // Send a message
  const sendMessage = useCallback(async (
    recipientId: string,
    message: string,
    projectId?: string
  ): Promise<boolean> => {
    if (!userId || !message.trim()) return false;

    const sent = await sendChatMessage(userId, recipientId, message, projectId);
    if (sent) {
      // Add to local messages immediately
      setMessages(prev => [...prev, sent]);

      // Refresh conversations to update last message
      refreshConversations();
    }

    return !!sent;
  }, [userId, refreshConversations]);

  // Set up real-time subscription
  useEffect(() => {
    if (!enabled || !userId) return;

    // Initial load
    refreshConversations();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;

          // Play notification sound if enabled and not in active conversation
          if (soundEnabled && newMessage.sender_id !== activeConversation) {
            playNotificationSound();
          }

          // If this is from the active conversation, add to messages
          if (newMessage.sender_id === activeConversation) {
            setMessages(prev => [...prev, newMessage]);
            // Mark as read immediately
            markMessagesAsRead(userId, newMessage.sender_id);
          } else {
            // Update unread count
            setUnreadCount(prev => prev + 1);
          }

          // Refresh conversations to update list
          refreshConversations();
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [userId, enabled, soundEnabled, activeConversation, refreshConversations]);

  // Reload messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation);
    }
  }, [activeConversation, loadMessages]);

  return {
    messages,
    conversations,
    unreadCount,
    isLoading,
    activeConversation,
    sendMessage,
    openConversation,
    closeConversation,
    refreshConversations,
    soundEnabled,
    setSoundEnabled,
  };
}
