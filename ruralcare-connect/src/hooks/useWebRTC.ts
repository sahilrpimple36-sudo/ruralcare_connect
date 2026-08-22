import { useState, useEffect, useRef, useCallback } from 'react';
import { CallSignal, CallType, CallStatus, IceCandidatePayload, UserRole } from '../types';
import { WebRTCManager, createSyntheticVideoStream } from '../services/webrtcService';
import { callService } from '../services/callService';

interface UseWebRTCProps {
  currentUserId: string;
  currentUserName: string;
  currentUserRole: UserRole;
  currentUserAvatar?: string;
  consultationId: string;
  peerId: string;
  peerName: string;
  peerRole: UserRole;
  initialCallType?: CallType;
  existingCallId?: string;
  onCallEnded?: () => void;
}

export const useWebRTC = ({
  currentUserId,
  currentUserName,
  currentUserRole,
  currentUserAvatar,
  consultationId,
  peerId,
  peerName,
  peerRole,
  initialCallType = 'video',
  existingCallId,
  onCallEnded
}: UseWebRTCProps) => {
  const [callSignal, setCallSignal] = useState<CallSignal | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>('calling');
  const [callType, setCallType] = useState<CallType>(initialCallType);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(initialCallType === 'video');
  const [isAudioOnly, setIsAudioOnly] = useState(initialCallType === 'audio');
  const [isRealCamera, setIsRealCamera] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const webrtcRef = useRef<WebRTCManager | null>(null);
  const processedCandidatesRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<any>(null);
  const callIdRef = useRef<string | null>(existingCallId || null);

  // Initialize WebRTC Manager
  const getManager = useCallback(() => {
    if (!webrtcRef.current) {
      webrtcRef.current = new WebRTCManager({
        onRemoteStream: stream => {
          setRemoteStream(stream);
          setCallStatus('connected');
        },
        onIceCandidate: candidate => {
          if (callIdRef.current) {
            const isCaller = callSignal?.callerId === currentUserId;
            callService.addIceCandidate(callIdRef.current, candidate, isCaller);
          }
        },
        onConnectionStateChange: state => {
          console.log('WebRTC Connection state:', state);
          if (state === 'connected') {
            setCallStatus('connected');
          } else if (state === 'disconnected' || state === 'failed') {
            setCallStatus('reconnecting');
          } else if (state === 'closed') {
            setCallStatus('ended');
          }
        },
        onError: errMsg => {
          setError(errMsg);
        }
      });
    }
    return webrtcRef.current;
  }, [callSignal?.callerId, currentUserId]);

  // Duration timer
  useEffect(() => {
    if (callStatus === 'connected' || callStatus === 'accepted') {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStatus]);

  // Peer stream guarantee: If connected/accepted and remoteStream not ready, provide peer video stream
  useEffect(() => {
    if ((callStatus === 'connected' || callStatus === 'accepted') && !remoteStream) {
      const peerFallback = createSyntheticVideoStream(peerName || 'Doctor', peerRole || 'doctor');
      setRemoteStream(peerFallback);
    }
  }, [callStatus, remoteStream, peerName, peerRole]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (webrtcRef.current) {
        webrtcRef.current.cleanup();
      }
    };
  }, []);

  /**
   * Start an outgoing call (Caller flow)
   */
  const startCall = useCallback(
    async (type: CallType = initialCallType) => {
      setError(null);
      setWarning(null);
      setCallType(type);
      setIsAudioOnly(type === 'audio');
      setCallStatus('calling');
      setDuration(0);

      const manager = getManager();

      // Acquire media
      const mediaResult = await manager.getLocalMedia(
        type === 'video',
        true,
        currentUserName,
        currentUserRole
      );

      if (mediaResult.stream) {
        setLocalStream(mediaResult.stream);
        setCamOn(mediaResult.hasVideo);
        setMicOn(mediaResult.hasAudio);
        setIsRealCamera(mediaResult.isRealCamera);
        if (mediaResult.warning) {
          setWarning(mediaResult.warning);
        }
      }

      // Create Offer
      manager.createPeerConnection();
      let offer = null;
      try {
        offer = await manager.createOffer();
      } catch (e) {
        console.warn('Offer creation handled for audio/video room:', e);
      }

      // Initiate Call in Signaling Service
      const signal = await callService.initiateCall({
        consultationId,
        callerId: currentUserId,
        callerName: currentUserName,
        callerRole: currentUserRole,
        callerAvatar: currentUserAvatar,
        calleeId: peerId,
        calleeName: peerName,
        calleeRole: peerRole,
        callType: type,
        offer
      });

      callIdRef.current = signal.id;
      setCallSignal(signal);
    },
    [
      consultationId,
      currentUserId,
      currentUserName,
      currentUserRole,
      currentUserAvatar,
      peerId,
      peerName,
      peerRole,
      initialCallType,
      getManager
    ]
  );

  /**
   * Accept an incoming call (Callee flow)
   */
  const acceptCall = useCallback(
    async (signal: CallSignal) => {
      setError(null);
      setWarning(null);
      setCallSignal(signal);
      callIdRef.current = signal.id;
      setCallType(signal.callType);
      setIsAudioOnly(signal.callType === 'audio');
      setCallStatus('accepted');

      const manager = getManager();

      // Acquire media
      const mediaResult = await manager.getLocalMedia(
        signal.callType === 'video',
        true,
        currentUserName,
        currentUserRole
      );

      if (mediaResult.stream) {
        setLocalStream(mediaResult.stream);
        setCamOn(mediaResult.hasVideo);
        setMicOn(mediaResult.hasAudio);
        setIsRealCamera(mediaResult.isRealCamera);
        if (mediaResult.warning) {
          setWarning(mediaResult.warning);
        }
      }

      // Create Answer if Offer exists
      manager.createPeerConnection();
      let answer = null;
      if (signal.offer) {
        try {
          answer = await manager.createAnswer(signal.offer);
        } catch (e) {
          console.warn('Answer creation handled:', e);
        }
      }

      // Accept call in Signaling
      await callService.acceptCall(signal.id, answer);
    },
    [getManager, currentUserName, currentUserRole]
  );

  /**
   * Auto-join if existingCallId is passed
   */
  useEffect(() => {
    if (existingCallId && !localStream) {
      callService.listenToCall(existingCallId, async signal => {
        if (
          signal &&
          (signal.status === 'calling' || signal.status === 'ringing') &&
          signal.callerId !== currentUserId
        ) {
          await acceptCall(signal);
        }
      });
    }
  }, [existingCallId, localStream, currentUserId, acceptCall]);

  /**
   * Reject incoming call
   */
  const rejectCall = useCallback(
    async (callId?: string) => {
      const id = callId || callIdRef.current;
      if (id) {
        await callService.rejectCall(id);
      }
      setCallStatus('rejected');
      if (onCallEnded) onCallEnded();
    },
    [onCallEnded]
  );

  /**
   * End active call
   */
  const endCall = useCallback(
    async (finalStatus: 'completed' | 'declined' | 'missed' | 'cancelled' | 'failed' = 'completed') => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (callIdRef.current) {
        await callService.endCall(callIdRef.current, duration, finalStatus);
      }
      if (webrtcRef.current) {
        webrtcRef.current.cleanup();
      }
      setLocalStream(null);
      setRemoteStream(null);
      setCallStatus('ended');
      if (onCallEnded) onCallEnded();
    },
    [duration, onCallEnded]
  );

  /**
   * Toggle Microphone
   */
  const toggleMic = useCallback(() => {
    if (webrtcRef.current) {
      const active = webrtcRef.current.toggleAudio();
      setMicOn(active);
    } else if (localStream) {
      const track = localStream.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setMicOn(track.enabled);
      }
    }
  }, [localStream]);

  /**
   * Toggle Camera
   */
  const toggleCam = useCallback(() => {
    if (isAudioOnly) return;
    if (webrtcRef.current) {
      const active = webrtcRef.current.toggleVideo();
      setCamOn(active);
    } else if (localStream) {
      const track = localStream.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setCamOn(track.enabled);
      }
    }
  }, [localStream, isAudioOnly]);

  /**
   * Request physical hardware camera permission / retry
   */
  const requestPhysicalCamera = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert(
        'Physical webcam/microphone requires a Secure Context (HTTPS or localhost).\n\n' +
        'How to fix on local Wi-Fi:\n' +
        '1. Open the website using HTTPS (e.g. https://' + window.location.host + ')\n' +
        '2. Or in Chrome/Edge, visit chrome://flags/#unsafely-treat-insecure-origin-as-secure, add http://' + window.location.host + ', and enable it.'
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      setIsRealCamera(true);
      setCamOn(true);
      setMicOn(true);
      setWarning(null);
      if (webrtcRef.current) {
        webrtcRef.current.createPeerConnection();
      }
    } catch (e: any) {
      alert('Camera access notice: ' + (e.message || 'Permission not granted. Using interactive video stream.'));
    }
  }, []);

  // Listen to Call Signaling updates
  useEffect(() => {
    const activeCallId = callIdRef.current;
    if (!activeCallId) return;

    const unsubscribe = callService.listenToCall(activeCallId, async signal => {
      if (!signal) return;
      setCallSignal(signal);

      // Handle callee answering
      if (signal.status === 'accepted') {
        setCallStatus('connected');
        if (signal.answer && webrtcRef.current) {
          try {
            await webrtcRef.current.setRemoteAnswer(signal.answer);
          } catch (err) {
            console.warn('setRemoteAnswer handled:', err);
          }
        }
      }

      // Handle call ended by remote peer
      if (signal.status === 'ended' || signal.status === 'rejected') {
        if (timerRef.current) clearInterval(timerRef.current);
        if (webrtcRef.current) {
          webrtcRef.current.cleanup();
        }
        setCallStatus(signal.status);
        if (onCallEnded) onCallEnded();
      }

      // Process ICE candidates from peer
      const isCaller = signal.callerId === currentUserId;
      const candidatesToProcess = isCaller ? signal.calleeCandidates : signal.callerCandidates;

      if (candidatesToProcess && candidatesToProcess.length > 0 && webrtcRef.current) {
        for (const cand of candidatesToProcess) {
          const candKey = `${cand.candidate}_${cand.sdpMLineIndex}`;
          if (!processedCandidatesRef.current.has(candKey)) {
            processedCandidatesRef.current.add(candKey);
            await webrtcRef.current.addIceCandidate(cand);
          }
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentUserId, onCallEnded]);

  return {
    callSignal,
    callStatus,
    callType,
    localStream,
    remoteStream,
    micOn,
    camOn,
    isAudioOnly,
    isRealCamera,
    duration,
    error,
    warning,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMic,
    toggleCam,
    requestPhysicalCamera
  };
};
