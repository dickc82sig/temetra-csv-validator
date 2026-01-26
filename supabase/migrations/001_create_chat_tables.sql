-- Chat Messages Table
-- Copyright (c) 2024 Vanzora, LLC. All rights reserved.
--
-- Run this SQL in your Supabase SQL Editor to create the chat tables.

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_recipient ON chat_messages(recipient_id);
CREATE INDEX idx_chat_messages_project ON chat_messages(project_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_unread ON chat_messages(recipient_id, is_read) WHERE is_read = FALSE;

-- Create chat_notifications table for email digest tracking
CREATE TABLE IF NOT EXISTS chat_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  last_email_sent TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER DEFAULT 0,
  email_enabled BOOLEAN DEFAULT TRUE,
  sound_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user_id
CREATE INDEX idx_chat_notifications_user ON chat_notifications(user_id);

-- Enable Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_messages
-- Users can see messages they sent or received
CREATE POLICY "Users can view their own messages" ON chat_messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
  );

-- Users can insert messages where they are the sender
CREATE POLICY "Users can send messages" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
  );

-- Users can update messages they received (to mark as read)
CREATE POLICY "Recipients can mark messages as read" ON chat_messages
  FOR UPDATE USING (
    auth.uid() = recipient_id
  );

-- RLS Policies for chat_notifications
-- Users can only see and modify their own notification settings
CREATE POLICY "Users can view their notifications" ON chat_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" ON chat_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their notifications" ON chat_notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_chat_notifications_updated_at
  BEFORE UPDATE ON chat_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
