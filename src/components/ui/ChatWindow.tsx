/**
 * Chat Window Component
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * Displays the chat conversation window with messages.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  ArrowLeft,
  User,
  Loader2,
} from 'lucide-react';
import { ChatMessage, formatMessageTime } from '@/lib/chat';

interface ChatWindowProps {
  currentUserId: string;
  currentUserName: string;
  otherUserId: string | null;
  otherUserName: string;
  otherUserRole: string;
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<boolean>;
  onBack: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

export default function ChatWindow({
  currentUserId,
  currentUserName,
  otherUserId,
  otherUserName,
  otherUserRole,
  messages,
  onSendMessage,
  onBack,
  onClose,
  isLoading = false,
}: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when conversation opens
  useEffect(() => {
    if (otherUserId) {
      inputRef.current?.focus();
    }
  }, [otherUserId]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const success = await onSendMessage(newMessage.trim());
    if (success) {
      setNewMessage('');
    }
    setIsSending(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 rounded hover:bg-gray-100 text-gray-500"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-temetra-blue-100 flex items-center justify-center">
              <User className="h-4 w-4 text-temetra-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">{otherUserName}</p>
              <p className="text-xs text-gray-500 capitalize">{otherUserRole}</p>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 text-gray-500"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-temetra-blue-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Send a message to start the conversation</p>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isOwnMessage = message.sender_id === currentUserId;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      isOwnMessage
                        ? 'bg-temetra-blue-600 text-white'
                        : 'bg-white border text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-blue-100' : 'text-gray-400'
                      }`}
                    >
                      {formatMessageTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t bg-white">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-temetra-blue-500 disabled:bg-gray-50"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="p-2 rounded-lg bg-temetra-blue-600 text-white hover:bg-temetra-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
