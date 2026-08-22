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
import { CallSignal, CallHistoryItem, CallStatus, CallType, IceCandidatePayload, UserRole } from '../types';
import { dbService } from './dbService';

const MOCK_CALL_EVENT = 'rc_mock_call_update';
const notifyMockCallUpdate = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(MOCK_CALL_EVENT));
  }
};

export const callService = {
  /**
   * Initiate an audio or video call
   */
  initiateCall: async (params: {
    consultationId: string;
    callerId: string;
    callerName: string;
    callerRole: UserRole;
    callerAvatar?: string;
    calleeId: string;
    calleeName: string;
    calleeRole: UserRole;
    callType: CallType;
    offer?: { type: string; sdp: string } | null;
  }): Promise<CallSignal> => {
    const callId = `call_${params.consultationId}_${Date.now()}`;
    const startedAt = new Date().toISOString();

    const callData: CallSignal = {
      id: callId,
      consultationId: params.consultationId,
      callerId: params.callerId,
      callerName: params.callerName,
      callerRole: params.callerRole,
      callerAvatar: params.callerAvatar,
      calleeId: params.calleeId,
      calleeName: params.calleeName,
      calleeRole: params.calleeRole,
      callType: params.callType,
      status: 'calling',
      offer: params.offer || null,
      answer: null,
      callerCandidates: [],
      calleeCandidates: [],
      startedAt,
      acceptedAt: null,
      endedAt: null,
      duration: 0
    };

    if (isMockMode) {
      mockDb.setDoc('calls', callId, callData);

      // Notification for callee
      await dbService.addNotification(
        params.calleeId,
        `Incoming ${params.callType} consultation call from ${params.callerName}.`,
        'incoming_call'
      );

      notifyMockCallUpdate();
      return callData;
    }

    // Live Firebase
    await setDoc(doc(db, 'calls', callId), callData);

    // Notification for callee
    await dbService.addNotification(
      params.calleeId,
      `Incoming ${params.callType} consultation call from ${params.callerName}.`,
      'incoming_call'
    );

    return callData;
  },

  /**
   * Get any active call for a specific consultation
   */
  getActiveCallForConsultation: async (consultationId: string): Promise<CallSignal | null> => {
    if (isMockMode) {
      const calls = mockDb.getCollection<CallSignal>('calls');
      const active = calls.find(
        c => c.consultationId === consultationId && (c.status === 'calling' || c.status === 'ringing' || c.status === 'accepted')
      );
      return active || null;
    }
    try {
      const q = query(
        collection(db, 'calls'),
        where('consultationId', '==', consultationId),
        where('status', 'in', ['calling', 'ringing', 'accepted'])
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return { id: snap.docs[0].id, ...snap.docs[0].data() } as CallSignal;
      }
    } catch (e) {
      console.warn('getActiveCallForConsultation error:', e);
    }
    return null;
  },

  /**
   * Listen for incoming calls targeted at the current user
   */
  listenForIncomingCalls: (
    userId: string,
    callback: (call: CallSignal | null) => void
  ): (() => void) => {
    if (isMockMode) {
      const checkLocal = () => {
        const calls = mockDb.getCollection<CallSignal>('calls');
        // Find active call for this user where they are callee and status is calling or ringing
        const incoming = calls.find(
          c => c.calleeId === userId && (c.status === 'calling' || c.status === 'ringing')
        );
        callback(incoming || null);
      };

      checkLocal();

      const listener = () => checkLocal();
      window.addEventListener(MOCK_CALL_EVENT, listener);
      window.addEventListener('storage', listener);
      const interval = setInterval(checkLocal, 500);

      return () => {
        window.removeEventListener(MOCK_CALL_EVENT, listener);
        window.removeEventListener('storage', listener);
        clearInterval(interval);
      };
    }

    // Live Firestore
    const q = query(
      collection(db, 'calls'),
      where('calleeId', '==', userId),
      where('status', 'in', ['calling', 'ringing'])
    );

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          callback({ id: docSnap.id, ...docSnap.data() } as CallSignal);
        } else {
          callback(null);
        }
      },
      error => {
        console.error('Incoming call listener error:', error);
      }
    );

    return unsubscribe;
  },

  /**
   * Listen to a specific call's signaling state changes
   */
  listenToCall: (
    callId: string,
    callback: (call: CallSignal | null) => void
  ): (() => void) => {
    if (isMockMode) {
      const checkLocal = () => {
        const call = mockDb.getDoc<CallSignal>('calls', callId);
        callback(call || null);
      };

      checkLocal();

      const listener = () => checkLocal();
      window.addEventListener(MOCK_CALL_EVENT, listener);
      window.addEventListener('storage', listener);
      const interval = setInterval(checkLocal, 250);

      return () => {
        window.removeEventListener(MOCK_CALL_EVENT, listener);
        window.removeEventListener('storage', listener);
        clearInterval(interval);
      };
    }

    // Live Firestore
    const callRef = doc(db, 'calls', callId);
    const unsubscribe = onSnapshot(
      callRef,
      snapshot => {
        if (snapshot.exists()) {
          callback({ id: snapshot.id, ...snapshot.data() } as CallSignal);
        } else {
          callback(null);
        }
      },
      error => {
        console.error('Call signaling listener error:', error);
      }
    );

    return unsubscribe;
  },

  /**
   * Accept an incoming call
   */
  acceptCall: async (callId: string, answer?: { type: string; sdp: string } | null): Promise<void> => {
    const acceptedAt = new Date().toISOString();
    const updates: Partial<CallSignal> = {
      status: 'accepted',
      acceptedAt,
      ...(answer ? { answer } : {})
    };

    if (isMockMode) {
      mockDb.updateDoc<CallSignal>('calls', callId, updates);
      notifyMockCallUpdate();
      return;
    }

    await updateDoc(doc(db, 'calls', callId), updates);
  },

  /**
   * Reject an incoming call
   */
  rejectCall: async (callId: string): Promise<void> => {
    const endedAt = new Date().toISOString();
    const updates: Partial<CallSignal> = {
      status: 'rejected',
      endedAt
    };

    if (isMockMode) {
      const call = mockDb.getDoc<CallSignal>('calls', callId);
      if (call) {
        mockDb.updateDoc<CallSignal>('calls', callId, updates);
        // Save to call history
        await callService.saveCallHistory({
          consultationId: call.consultationId,
          patientId: call.callerRole === 'patient' ? call.callerId : call.calleeId,
          patientName: call.callerRole === 'patient' ? call.callerName : call.calleeName,
          doctorId: call.callerRole === 'doctor' ? call.callerId : call.calleeId,
          doctorName: call.callerRole === 'doctor' ? call.callerName : call.calleeName,
          callType: call.callType,
          startTime: call.startedAt,
          endTime: endedAt,
          duration: 0,
          status: 'declined',
          notes: 'Consultation call was declined by user.'
        });
      }
      notifyMockCallUpdate();
      return;
    }

    const callRef = doc(db, 'calls', callId);
    const snap = await getDoc(callRef);
    if (snap.exists()) {
      const call = snap.data() as CallSignal;
      await updateDoc(callRef, updates);
      await callService.saveCallHistory({
        consultationId: call.consultationId,
        patientId: call.callerRole === 'patient' ? call.callerId : call.calleeId,
        patientName: call.callerRole === 'patient' ? call.callerName : call.calleeName,
        doctorId: call.callerRole === 'doctor' ? call.callerId : call.calleeId,
        doctorName: call.callerRole === 'doctor' ? call.callerName : call.calleeName,
        callType: call.callType,
        startTime: call.startedAt,
        endTime: endedAt,
        duration: 0,
        status: 'declined',
        notes: 'Consultation call was declined.'
      });
    }
  },

  /**
   * End an active call
   */
  endCall: async (
    callId: string,
    durationSeconds = 0,
    status: 'completed' | 'declined' | 'missed' | 'cancelled' | 'failed' = 'completed'
  ): Promise<void> => {
    const endedAt = new Date().toISOString();
    const updates: Partial<CallSignal> = {
      status: 'ended',
      endedAt,
      duration: durationSeconds
    };

    if (isMockMode) {
      const call = mockDb.getDoc<CallSignal>('calls', callId);
      if (call) {
        mockDb.updateDoc<CallSignal>('calls', callId, updates);
        await callService.saveCallHistory({
          consultationId: call.consultationId,
          patientId: call.callerRole === 'patient' ? call.callerId : call.calleeId,
          patientName: call.callerRole === 'patient' ? call.callerName : call.calleeName,
          doctorId: call.callerRole === 'doctor' ? call.callerId : call.calleeId,
          doctorName: call.callerRole === 'doctor' ? call.callerName : call.calleeName,
          callType: call.callType,
          startTime: call.startedAt,
          endTime: endedAt,
          duration: durationSeconds,
          status,
          notes: `${call.callType === 'video' ? 'Video' : 'Audio'} consultation ended. Duration: ${Math.round(durationSeconds / 60)} min.`
        });
      }
      notifyMockCallUpdate();
      return;
    }

    const callRef = doc(db, 'calls', callId);
    const snap = await getDoc(callRef);
    if (snap.exists()) {
      const call = snap.data() as CallSignal;
      await updateDoc(callRef, updates);
      await callService.saveCallHistory({
        consultationId: call.consultationId,
        patientId: call.callerRole === 'patient' ? call.callerId : call.calleeId,
        patientName: call.callerRole === 'patient' ? call.callerName : call.calleeName,
        doctorId: call.callerRole === 'doctor' ? call.callerId : call.calleeId,
        doctorName: call.callerRole === 'doctor' ? call.callerName : call.calleeName,
        callType: call.callType,
        startTime: call.startedAt,
        endTime: endedAt,
        duration: durationSeconds,
        status,
        notes: `${call.callType === 'video' ? 'Video' : 'Audio'} consultation completed.`
      });
    }
  },

  /**
   * Set Offer SDP for WebRTC
   */
  setOffer: async (callId: string, offer: { type: string; sdp: string }): Promise<void> => {
    if (isMockMode) {
      mockDb.updateDoc<CallSignal>('calls', callId, { offer });
      notifyMockCallUpdate();
      return;
    }
    await updateDoc(doc(db, 'calls', callId), { offer });
  },

  /**
   * Set Answer SDP for WebRTC
   */
  setAnswer: async (callId: string, answer: { type: string; sdp: string }): Promise<void> => {
    if (isMockMode) {
      mockDb.updateDoc<CallSignal>('calls', callId, { answer, status: 'accepted' });
      notifyMockCallUpdate();
      return;
    }
    await updateDoc(doc(db, 'calls', callId), { answer, status: 'accepted' });
  },

  /**
   * Add ICE candidate to signaling document
   */
  addIceCandidate: async (
    callId: string,
    candidate: IceCandidatePayload,
    isCaller: boolean
  ): Promise<void> => {
    if (isMockMode) {
      const call = mockDb.getDoc<CallSignal>('calls', callId);
      if (call) {
        if (isCaller) {
          const list = call.callerCandidates || [];
          list.push(candidate);
          mockDb.updateDoc<CallSignal>('calls', callId, { callerCandidates: list });
        } else {
          const list = call.calleeCandidates || [];
          list.push(candidate);
          mockDb.updateDoc<CallSignal>('calls', callId, { calleeCandidates: list });
        }
        notifyMockCallUpdate();
      }
      return;
    }

    const callRef = doc(db, 'calls', callId);
    const snap = await getDoc(callRef);
    if (snap.exists()) {
      const call = snap.data() as CallSignal;
      if (isCaller) {
        const list = call.callerCandidates || [];
        list.push(candidate);
        await updateDoc(callRef, { callerCandidates: list });
      } else {
        const list = call.calleeCandidates || [];
        list.push(candidate);
        await updateDoc(callRef, { calleeCandidates: list });
      }
    }
  },

  /**
   * Fetch Consultation / Call History
   */
  getCallHistory: async (userId: string, role: UserRole): Promise<CallHistoryItem[]> => {
    if (isMockMode) {
      const list = mockDb.getCollection<CallHistoryItem>('callHistory');
      if (role === 'patient') {
        return list
          .filter(h => h.patientId === userId)
          .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      } else if (role === 'doctor') {
        return list
          .filter(h => h.doctorId === userId)
          .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      }
      return list.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    }

    let q;
    if (role === 'patient') {
      q = query(collection(db, 'callHistory'), where('patientId', '==', userId), orderBy('startTime', 'desc'));
    } else if (role === 'doctor') {
      q = query(collection(db, 'callHistory'), where('doctorId', '==', userId), orderBy('startTime', 'desc'));
    } else {
      q = query(collection(db, 'callHistory'), orderBy('startTime', 'desc'));
    }

    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CallHistoryItem));
  },

  /**
   * Save a call to Call History
   */
  saveCallHistory: async (historyData: Omit<CallHistoryItem, 'id'>): Promise<CallHistoryItem> => {
    if (isMockMode) {
      return mockDb.addDoc<CallHistoryItem>('callHistory', historyData);
    }
    const docRef = await addDoc(collection(db, 'callHistory'), historyData);
    return { id: docRef.id, ...historyData } as CallHistoryItem;
  }
};
