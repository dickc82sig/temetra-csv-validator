/**
 * Chat Widget Component
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * Main chat widget that shows in the header and opens the chat popup.
 * Self-contained component that fetches its own user data.
 */

'use client';

import { useState, useEffect } from 'react';
import {
  MessageCircle,
  X,
  Volume2,
  VolumeX,
  User,
  Loader2,
  Users,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useChat } from '@/hooks/useChat';
import { getAdmins, getDevelopers, formatMessageTime, updateNotificationSettings } from '@/lib/chat';
import ChatWindow from './ChatWindow';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'developer' | 'end_customer';
}

export default function ChatWidget() {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<{
    id: string;
    name: string;
    email: string;
  }[]>([]);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
    role: string;
  } | null>(null);

  // Load current user data
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Get user profile from our users table
          const { data: userData } = await supabase
            .from('users')
            .select('id, name, email, role')
            .eq('email', user.email)
            .single();

          if (userData) {
            setCurrentUser(userData as UserData);
          } else {
            // Fallback: create a temporary user object for testing
            // This allows chat to work even if user isn't in users table yet
            console.log('Chat: User not found in users table, using fallback');
            setCurrentUser({
              id: user.id,
              name: user.email?.split('@')[0] || 'User',
              email: user.email || '',
              role: 'admin', // Default to admin for testing
            });
          }
        }
      } catch (err) {
        console.error('Error loading current user:', err);
      } finally {
        setIsLoadingUser(false);
      }
    };

    loadCurrentUser();
  }, []);

  const {
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
  } = useChat({ userId: currentUser?.id || '', enabled: !!currentUser?.id });

  // Load available users to chat with
  useEffect(() => {
    if (!currentUser) return;

    const loadUsers = async () => {
      // Developers can chat with admins, admins can chat with developers
      if (currentUser.role === 'developer') {
        const admins = await getAdmins();
        setAvailableUsers(admins);
      } else if (currentUser.role === 'admin') {
        const developers = await getDevelopers();
        setAvailableUsers(developers);
      }
    };

    loadUsers();
  }, [currentUser]);

  // Toggle sound notifications
  const toggleSound = async () => {
    if (!currentUser) return;
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    await updateNotificationSettings(currentUser.id, { sound_enabled: newValue });
  };

  // Start new conversation
  const startConversation = (user: { id: string; name: string; email: string }) => {
    if (!currentUser) return;
    setSelectedUser({ id: user.id, name: user.name, role: currentUser.role === 'admin' ? 'developer' : 'admin' });
    openConversation(user.id);
  };

  // Open existing conversation
  const openExistingConversation = (convo: typeof conversations[0]) => {
    setSelectedUser({ id: convo.userId, name: convo.userName, role: convo.userRole });
    openConversation(convo.userId);
  };

  // Handle send message
  const handleSendMessage = async (message: string): Promise<boolean> => {
    if (!selectedUser) return false;
    return sendMessage(selectedUser.id, message);
  };

  // Go back to conversation list
  const handleBack = () => {
    setSelectedUser(null);
    closeConversation();
    refreshConversations();
  };

  // Close chat widget
  const handleClose = () => {
    setIsOpen(false);
    setSelectedUser(null);
    closeConversation();
  };

  // Don't show if user is not loaded, not logged in, or is end_customer
  if (isLoadingUser || !currentUser || currentUser.role === 'end_customer') {
    return null;
  }

  return (
    <>
      {/* Chat button in header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        title="Chat"
      >
        <MessageCircle className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Chat popup */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 w-80 h-[480px] bg-white rounded-lg shadow-2xl border flex flex-col z-50">
          {activeConversation && selectedUser ? (
            // Conversation view
            <ChatWindow
              currentUserId={currentUser.id}
              currentUserName={currentUser.name}
              otherUserId={selectedUser.id}
              otherUserName={selectedUser.name}
              otherUserRole={selectedUser.role}
              messages={messages}
              onSendMessage={handleSendMessage}
              onBack={handleBack}
              onClose={handleClose}
              isLoading={isLoading}
            />
          ) : (
            // Conversation list view
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b bg-white rounded-t-lg">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-temetra-blue-600" />
                  <span className="font-semibold text-gray-900">Messages</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleSound}
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                    title={soundEnabled ? 'Mute notifications' : 'Enable notifications'}
                  >
                    {soundEnabled ? (
                      <Volume2 className="h-4 w-4" />
                    ) : (
                      <VolumeX className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={handleClose}
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-temetra-blue-600" />
                  </div>
                ) : (
                  <>
                    {/* Existing conversations */}
                    {conversations.length > 0 && (
                      <div className="border-b">
                        <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50">
                          Recent Conversations
                        </p>
                        {conversations.map((convo) => (
                          <button
                            key={convo.userId}
                            onClick={() => openExistingConversation(convo)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 text-left"
                          >
                            <div className="relative">
                              <div className="w-10 h-10 rounded-full bg-temetra-blue-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-temetra-blue-600" />
                              </div>
                              {convo.unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-0.5">
                                  {convo.unreadCount}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-gray-900 text-sm truncate">
                                  {convo.userName}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {formatMessageTime(convo.lastMessageTime)}
                                </p>
                              </div>
                              <p className="text-xs text-gray-500 truncate mt-0.5">
                                {convo.lastMessage}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Start new conversation */}
                    <div>
                      <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50">
                        <Users className="h-3 w-3 inline mr-1" />
                        {currentUser.role === 'admin' ? 'Developers' : 'Admins'}
                      </p>
                      {availableUsers.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-gray-500 text-center">
                          No {currentUser.role === 'admin' ? 'developers' : 'admins'} available
                        </p>
                      ) : (
                        availableUsers.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => startConversation(user)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 text-left"
                          >
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm truncate">
                                {user.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {user.email}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
