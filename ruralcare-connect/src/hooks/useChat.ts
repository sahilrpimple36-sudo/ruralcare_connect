import { useState, useEffect, useCallback } from 'react';
import { ChatMessage, MessageType, UserRole } from '../types';
import { chatService } from '../services/chatService';

interface UseChatProps {
  conversationId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserRole?: UserRole;
  recipientId: string;
  consultationId?: string;
}

export const useChat = ({
  conversationId,
  currentUserId,
  currentUserName,
  currentUserRole = 'patient',
  recipientId,
  consultationId
}: UseChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = chatService.subscribeToMessages(conversationId, msgs => {
      setMessages(msgs);
      setLoading(false);

      // Auto mark unread messages as read
      chatService.markMessagesAsRead(conversationId, currentUserId);
    });

    return () => {
      unsubscribe();
    };
  }, [conversationId, currentUserId]);

  const sendMessage = useCallback(
    async (text: string, type: MessageType = 'text', attachmentUrl?: string, attachmentName?: string) => {
      if (!text.trim() && !attachmentUrl) return;

      setIsSending(true);
      setError(null);
      try {
        await chatService.sendMessage({
          conversationId,
          senderId: currentUserId,
          senderName: currentUserName,
          senderRole: currentUserRole,
          receiverId: recipientId,
          message: text.trim(),
          type,
          attachmentUrl,
          attachmentName,
          consultationId
        });
      } catch (err: any) {
        console.error('Failed to send message:', err);
        setError('Failed to send message. Please try again.');
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, currentUserId, currentUserName, currentUserRole, recipientId, consultationId]
  );

  return {
    messages,
    loading,
    error,
    isSending,
    sendMessage
  };
};
