import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db, isMockMode } from './firebase';
import { mockDb } from './mockDb';
import { ChatMessage, Conversation, ConversationParticipant, MessageType, UserRole } from '../types';
import { dbService } from './dbService';

// Event dispatch for mock reactivity across tabs / components
const MOCK_CHAT_EVENT = 'rc_mock_chat_update';
const notifyMockChatUpdate = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(MOCK_CHAT_EVENT));
  }
};

export const chatService = {
  /**
   * Get or create a conversation between patient and doctor
   */
  getOrCreateConversation: async (
    patientId: string,
    doctorId: string,
    consultationId?: string,
    participantDetails?: {
      patient?: { name: string; avatar?: string };
      doctor?: { name: string; avatar?: string; specialty?: string; status?: 'available' | 'busy' | 'offline' };
    }
  ): Promise<Conversation> => {
    const convId = `conv_${patientId}_${doctorId}`;

    const defaultParticipants: { [key: string]: ConversationParticipant } = {
      [patientId]: {
        name: participantDetails?.patient?.name || 'Patient',
        role: 'patient',
        avatar: participantDetails?.patient?.avatar
      },
      [doctorId]: {
        name: participantDetails?.doctor?.name || 'Doctor',
        role: 'doctor',
        specialty: participantDetails?.doctor?.specialty || 'General Medicine',
        avatar: participantDetails?.doctor?.avatar,
        status: participantDetails?.doctor?.status || 'available'
      }
    };

    if (isMockMode) {
      let conv = mockDb.getDoc<Conversation>('conversations', convId);
      if (!conv) {
        conv = {
          id: convId,
          consultationId: consultationId || '',
          participants: [patientId, doctorId],
          participantDetails: defaultParticipants,
          unreadCount: { [patientId]: 0, [doctorId]: 0 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        mockDb.setDoc('conversations', convId, conv);
        notifyMockChatUpdate();
      } else if (participantDetails) {
        // update participant details if provided
        conv.participantDetails = {
          ...conv.participantDetails,
          ...defaultParticipants
        };
        if (consultationId) conv.consultationId = consultationId;
        mockDb.setDoc('conversations', convId, conv);
      }
      return conv;
    }

    // Live Firestore
    const convRef = doc(db, 'conversations', convId);
    const snap = await getDoc(convRef);

    if (snap.exists()) {
      const data = snap.data() as Conversation;
      if (participantDetails || consultationId) {
        await updateDoc(convRef, {
          ...(consultationId ? { consultationId } : {}),
          participantDetails: {
            ...data.participantDetails,
            ...defaultParticipants
          },
          updatedAt: new Date().toISOString()
        });
      }
      return { ...data, id: snap.id };
    } else {
      const newConv: Conversation = {
        id: convId,
        consultationId: consultationId || '',
        participants: [patientId, doctorId],
        participantDetails: defaultParticipants,
        unreadCount: { [patientId]: 0, [doctorId]: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(convRef, newConv);
      return newConv;
    }
  },

  /**
   * Send a chat message
   */
  sendMessage: async (params: {
    conversationId: string;
    senderId: string;
    senderName: string;
    senderRole?: UserRole;
    receiverId: string;
    message: string;
    type?: MessageType;
    attachmentUrl?: string;
    attachmentName?: string;
    consultationId?: string;
  }): Promise<ChatMessage> => {
    const {
      conversationId,
      senderId,
      senderName,
      senderRole = 'patient',
      receiverId,
      message,
      type = 'text',
      attachmentUrl,
      attachmentName,
      consultationId
    } = params;

    const timestamp = new Date().toISOString();

    const newMsgData: Omit<ChatMessage, 'id'> = {
      conversationId,
      consultationId,
      senderId,
      senderName,
      senderRole,
      receiverId,
      message,
      type,
      attachmentUrl,
      attachmentName,
      read: false,
      createdAt: timestamp
    };

    if (isMockMode) {
      const createdMsg = mockDb.addDoc<ChatMessage>('messages', newMsgData);

      // Update conversation last message & unread count
      const conv = mockDb.getDoc<Conversation>('conversations', conversationId);
      if (conv) {
        const currentUnread = conv.unreadCount?.[receiverId] || 0;
        conv.lastMessage = type === 'text' ? message : `[Sent a ${type}]`;
        conv.lastMessageTimestamp = timestamp;
        conv.lastMessageSenderId = senderId;
        conv.unreadCount = {
          ...(conv.unreadCount || {}),
          [receiverId]: currentUnread + 1
        };
        conv.updatedAt = timestamp;
        mockDb.setDoc('conversations', conversationId, conv);
      }

      // Add in-app notification for recipient
      await dbService.addNotification(
        receiverId,
        `New message from ${senderName}: "${message.length > 40 ? message.slice(0, 37) + '...' : message}"`,
        'new_message'
      );

      notifyMockChatUpdate();
      return createdMsg;
    }

    // Live Firebase
    const docRef = await addDoc(collection(db, 'messages'), newMsgData);
    const createdMsg: ChatMessage = { id: docRef.id, ...newMsgData };

    // Update conversation metadata
    const convRef = doc(db, 'conversations', conversationId);
    const convSnap = await getDoc(convRef);
    if (convSnap.exists()) {
      const convData = convSnap.data() as Conversation;
      const currentUnread = convData.unreadCount?.[receiverId] || 0;
      await updateDoc(convRef, {
        lastMessage: type === 'text' ? message : `[Sent a ${type}]`,
        lastMessageTimestamp: timestamp,
        lastMessageSenderId: senderId,
        unreadCount: {
          ...(convData.unreadCount || {}),
          [receiverId]: currentUnread + 1
        },
        updatedAt: timestamp
      });
    }

    // Trigger Notification
    await dbService.addNotification(
      receiverId,
      `New message from ${senderName}: "${message.length > 40 ? message.slice(0, 37) + '...' : message}"`,
      'new_message'
    );

    return createdMsg;
  },

  /**
   * Subscribe to messages in a conversation (Real-Time)
   */
  subscribeToMessages: (
    conversationId: string,
    callback: (messages: ChatMessage[]) => void
  ): (() => void) => {
    if (isMockMode) {
      const fetchLocal = () => {
        const allMsgs = mockDb.getCollection<ChatMessage>('messages');
        const convMsgs = allMsgs
          .filter(m => m.conversationId === conversationId)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        callback(convMsgs);
      };

      fetchLocal();

      const listener = () => fetchLocal();
      window.addEventListener(MOCK_CHAT_EVENT, listener);
      window.addEventListener('storage', listener);
      const interval = setInterval(fetchLocal, 2000);

      return () => {
        window.removeEventListener(MOCK_CHAT_EVENT, listener);
        window.removeEventListener('storage', listener);
        clearInterval(interval);
      };
    }

    // Live Firestore Subscription
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
        callback(msgs);
      },
      error => {
        console.error('Firestore messages subscription error:', error);
      }
    );

    return unsubscribe;
  },

  /**
   * Subscribe to all conversations for a user
   */
  subscribeToConversations: (
    userId: string,
    callback: (conversations: Conversation[]) => void
  ): (() => void) => {
    if (isMockMode) {
      const fetchLocal = () => {
        const list = mockDb.getCollection<Conversation>('conversations');
        const userConvs = list
          .filter(c => c.participants.includes(userId))
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        callback(userConvs);
      };

      fetchLocal();

      const listener = () => fetchLocal();
      window.addEventListener(MOCK_CHAT_EVENT, listener);
      window.addEventListener('storage', listener);
      const interval = setInterval(fetchLocal, 3000);

      return () => {
        window.removeEventListener(MOCK_CHAT_EVENT, listener);
        window.removeEventListener('storage', listener);
        clearInterval(interval);
      };
    }

    // Live Firestore
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Conversation));
        callback(list);
      },
      error => {
        console.error('Firestore conversations subscription error:', error);
      }
    );

    return unsubscribe;
  },

  /**
   * Mark messages in conversation as read for the current user
   */
  markMessagesAsRead: async (conversationId: string, currentUserId: string): Promise<void> => {
    if (isMockMode) {
      const messages = mockDb.getCollection<ChatMessage>('messages');
      let changed = false;
      messages.forEach(m => {
        if (m.conversationId === conversationId && m.receiverId === currentUserId && !m.read) {
          m.read = true;
          changed = true;
        }
      });
      if (changed) {
        mockDb.saveCollection('messages', messages);
      }

      const conv = mockDb.getDoc<Conversation>('conversations', conversationId);
      if (conv && conv.unreadCount && conv.unreadCount[currentUserId] > 0) {
        conv.unreadCount[currentUserId] = 0;
        mockDb.setDoc('conversations', conversationId, conv);
      }
      notifyMockChatUpdate();
      return;
    }

    // Live Firebase
    const convRef = doc(db, 'conversations', conversationId);
    const convSnap = await getDoc(convRef);
    if (convSnap.exists()) {
      const convData = convSnap.data() as Conversation;
      if (convData.unreadCount && convData.unreadCount[currentUserId] > 0) {
        await updateDoc(convRef, {
          [`unreadCount.${currentUserId}`]: 0
        });
      }
    }

    // Update unread messages where receiver is current user
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      where('receiverId', '==', currentUserId),
      where('read', '==', false)
    );
    const snap = await getDocs(q);
    const updates = snap.docs.map(d => updateDoc(doc(db, 'messages', d.id), { read: true }));
    await Promise.all(updates);
  }
};
