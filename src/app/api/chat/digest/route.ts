/**
 * Chat Email Digest API Route
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * This API route sends email digests for unread chat messages.
 * It should be called by a cron job (e.g., Vercel Cron) every 5-15 minutes.
 *
 * Example Vercel cron configuration in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/chat/digest",
 *     "schedule": "0/15 * * * *"
 *   }]
 * }
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service role for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Minimum minutes between email notifications per user
const EMAIL_COOLDOWN_MINUTES = 15;

interface UnreadSummary {
  userId: string;
  userName: string;
  userEmail: string;
  unreadCount: number;
  senders: { name: string; count: number }[];
}

export async function GET(request: Request) {
  try {
    // Verify cron secret (optional security measure)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get users with unread messages who haven't received an email recently
    const cutoffTime = new Date(Date.now() - EMAIL_COOLDOWN_MINUTES * 60 * 1000).toISOString();

    // Find users with unread messages
    const { data: usersWithUnread, error: unreadError } = await supabaseAdmin
      .from('chat_messages')
      .select(`
        recipient_id,
        recipient:users!chat_messages_recipient_id_fkey(id, name, email),
        sender:users!chat_messages_sender_id_fkey(name)
      `)
      .eq('is_read', false);

    if (unreadError) {
      console.error('Error fetching unread messages:', unreadError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!usersWithUnread || usersWithUnread.length === 0) {
      return NextResponse.json({ message: 'No unread messages', emailsSent: 0 });
    }

    // Group by recipient
    const summaryMap = new Map<string, UnreadSummary>();

    for (const msg of usersWithUnread) {
      const recipientId = msg.recipient_id;
      // Supabase returns the relation as an object (not array) when using single FK
      const recipient = msg.recipient as unknown as { id: string; name: string; email: string } | null;
      const sender = msg.sender as unknown as { name: string } | null;

      if (!recipient || !sender) continue;

      if (!summaryMap.has(recipientId)) {
        summaryMap.set(recipientId, {
          userId: recipientId,
          userName: recipient.name,
          userEmail: recipient.email,
          unreadCount: 0,
          senders: [],
        });
      }

      const summary = summaryMap.get(recipientId)!;
      summary.unreadCount++;

      // Track sender
      const existingSender = summary.senders.find(s => s.name === sender.name);
      if (existingSender) {
        existingSender.count++;
      } else {
        summary.senders.push({ name: sender.name, count: 1 });
      }
    }

    // Check notification settings and cooldown for each user
    const emailsToSend: UnreadSummary[] = [];

    for (const [userId, summary] of Array.from(summaryMap.entries())) {
      // Check if user has email notifications enabled and cooldown has passed
      const { data: settings } = await supabaseAdmin
        .from('chat_notifications')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Default to enabled if no settings exist
      const emailEnabled = settings?.email_enabled !== false;
      const lastEmailSent = settings?.last_email_sent;

      // Check cooldown
      if (lastEmailSent && new Date(lastEmailSent) > new Date(cutoffTime)) {
        continue; // Skip - too soon since last email
      }

      if (emailEnabled) {
        emailsToSend.push(summary);
      }
    }

    // Send emails
    let emailsSent = 0;
    const emailErrors: string[] = [];

    for (const summary of emailsToSend) {
      try {
        const sent = await sendDigestEmail(summary);
        if (sent) {
          emailsSent++;

          // Update last_email_sent
          await supabaseAdmin
            .from('chat_notifications')
            .upsert({
              user_id: summary.userId,
              last_email_sent: new Date().toISOString(),
            }, {
              onConflict: 'user_id',
            });
        }
      } catch (err) {
        emailErrors.push(`Failed to send to ${summary.userEmail}: ${err}`);
      }
    }

    return NextResponse.json({
      message: 'Digest processing complete',
      usersWithUnread: summaryMap.size,
      emailsSent,
      errors: emailErrors.length > 0 ? emailErrors : undefined,
    });
  } catch (error) {
    console.error('Chat digest error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Send a digest email to a user
 * This is a placeholder - integrate with your email provider (Resend, SendGrid, etc.)
 */
async function sendDigestEmail(summary: UnreadSummary): Promise<boolean> {
  // Build email content
  const senderList = summary.senders
    .map(s => `${s.name} (${s.count} message${s.count > 1 ? 's' : ''})`)
    .join(', ');

  const subject = `You have ${summary.unreadCount} unread chat message${summary.unreadCount > 1 ? 's' : ''}`;
  const body = `
    Hi ${summary.userName},

    You have ${summary.unreadCount} unread chat message${summary.unreadCount > 1 ? 's' : ''} from:
    ${senderList}

    Log in to Temetra Validator to view and respond to your messages:
    ${process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app'}

    ---
    To stop receiving these notifications, update your settings in the app.
  `.trim();

  // Option 1: Use Resend (recommended)
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'Temetra Validator <noreply@temetra.com>',
          to: summary.userEmail,
          subject,
          text: body,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Resend error:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Resend fetch error:', err);
      return false;
    }
  }

  // Option 2: Use SendGrid
  if (process.env.SENDGRID_API_KEY) {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: summary.userEmail }] }],
          from: { email: process.env.EMAIL_FROM || 'noreply@temetra.com' },
          subject,
          content: [{ type: 'text/plain', value: body }],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('SendGrid error:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('SendGrid fetch error:', err);
      return false;
    }
  }

  // No email provider configured - log the email instead
  console.log('Email digest (no provider configured):');
  console.log('To:', summary.userEmail);
  console.log('Subject:', subject);
  console.log('Body:', body);
  console.log('---');

  // Return true in development to simulate success
  return process.env.NODE_ENV === 'development';
}

// Also support POST for manual triggers
export async function POST(request: Request) {
  return GET(request);
}
