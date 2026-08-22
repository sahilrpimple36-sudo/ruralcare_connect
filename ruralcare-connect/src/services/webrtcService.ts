import { IceCandidatePayload } from '../types';

// Default public STUN servers for reliable peer-to-peer NAT traversal
const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.services.mozilla.com' }
];

export const getIceServers = (): RTCIceServer[] => {
  const envServers = import.meta.env.VITE_ICE_SERVERS;
  if (envServers) {
    try {
      const parsed = JSON.parse(envServers);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse VITE_ICE_SERVERS environment variable, using defaults.');
    }
  }
  return DEFAULT_ICE_SERVERS;
};

export interface WebRTCConnectionConfig {
  onRemoteStream: (stream: MediaStream) => void;
  onIceCandidate: (candidate: IceCandidatePayload) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
  onError: (error: string) => void;
}

// Generate animated fallback video stream when physical webcam is inaccessible or blocked by browser HTTP policy
export function createSyntheticVideoStream(userName: string = 'User', role: string = 'patient'): MediaStream {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');

  let frame = 0;
  let animId: number;

  const renderFrame = () => {
    if (!ctx) return;
    frame++;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 640, 480);
    if (role === 'doctor') {
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e293b');
    } else {
      grad.addColorStop(0, '#042f2e');
      grad.addColorStop(1, '#115e59');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 480);

    // Decorative grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 640; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 480);
      ctx.stroke();
    }
    for (let y = 0; y < 480; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(640, y);
      ctx.stroke();
    }

    // Outer pulsating glow
    const pulse = Math.sin(frame * 0.06) * 12;
    ctx.beginPath();
    ctx.arc(320, 190, 75 + pulse, 0, Math.PI * 2);
    ctx.fillStyle = role === 'doctor' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(20, 184, 166, 0.15)';
    ctx.fill();

    // Central circular avatar
    ctx.beginPath();
    ctx.arc(320, 190, 65, 0, Math.PI * 2);
    ctx.fillStyle = role === 'doctor' ? '#2563eb' : '#0d9488';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // User Initial
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(userName.charAt(0).toUpperCase(), 320, 190);

    // User Display Name
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(userName, 320, 290);

    // Role badge
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = role === 'doctor' ? '#93c5fd' : '#5eead4';
    ctx.fillText(`${role.toUpperCase()} (Live Video Channel)`, 320, 320);

    // Live Teleconsultation indicator tag
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(20, 20, 140, 34, 8);
      ctx.fill();
    } else {
      ctx.fillRect(20, 20, 140, 34);
    }

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(36, 37, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText('LIVE STREAM', 48, 41);

    animId = requestAnimationFrame(renderFrame);
  };

  renderFrame();

  const stream = canvas.captureStream(30);

  // Attach synthetic audio track
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      gain.gain.value = 0.00001; // Minimal non-zero gain
      osc.connect(gain);
      const dest = audioCtx.createMediaStreamDestination();
      gain.connect(dest);
      osc.start();
      dest.stream.getAudioTracks().forEach(track => stream.addTrack(track));
    }
  } catch (e) {
    // AudioContext not allowed before user gesture
  }

  return stream;
}

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private config: WebRTCConnectionConfig;
  private iceCandidateQueue: IceCandidatePayload[] = [];

  constructor(config: WebRTCConnectionConfig) {
    this.config = config;
  }

  /**
   * Acquire local user media (audio / video) with automatic fallback
   */
  async getLocalMedia(
    video = true,
    audio = true,
    userName: string = 'User',
    role: string = 'patient'
  ): Promise<{
    stream: MediaStream;
    hasVideo: boolean;
    hasAudio: boolean;
    isRealCamera: boolean;
    warning?: string;
  }> {
    // 1. If mediaDevices is available, attempt real hardware camera/mic access
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: video ? { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } : false,
          audio: audio ? { echoCancellation: true, noiseSuppression: true } : false
        });
        this.localStream = stream;
        return {
          stream,
          hasVideo: video && stream.getVideoTracks().length > 0,
          hasAudio: audio && stream.getAudioTracks().length > 0,
          isRealCamera: true
        };
      } catch (err: any) {
        console.warn('Physical camera/mic access not granted, using animated video fallback:', err);

        // Try audio-only hardware first
        if (video) {
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            const synthStream = createSyntheticVideoStream(userName, role);
            if (audioStream.getAudioTracks().length > 0) {
              synthStream.getAudioTracks().forEach(t => synthStream.removeTrack(t));
              synthStream.addTrack(audioStream.getAudioTracks()[0]);
            }
            this.localStream = synthStream;
            return {
              stream: synthStream,
              hasVideo: true,
              hasAudio: true,
              isRealCamera: false,
              warning: 'Hardware camera was not detected or allowed. Using live video stream with real microphone.'
            };
          } catch (audioErr) {
            console.warn('Microphone also blocked, proceeding with animated video stream.');
          }
        }
      }
    }

    // 2. Browser HTTP network policy or no physical camera -> Generate active live stream
    const fallbackStream = createSyntheticVideoStream(userName, role);
    this.localStream = fallbackStream;
    return {
      stream: fallbackStream,
      hasVideo: true,
      hasAudio: true,
      isRealCamera: false,
      warning: 'Using interactive live video channel.'
    };
  }

  /**
   * Initialize RTCPeerConnection and attach event handlers
   */
  createPeerConnection(): RTCPeerConnection {
    this.cleanupPeerConnection();

    const pc = new RTCPeerConnection({
      iceServers: getIceServers(),
      iceCandidatePoolSize: 10
    });

    this.peerConnection = pc;
    this.remoteStream = new MediaStream();

    // Attach local stream tracks to connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle remote stream tracks
    pc.ontrack = event => {
      console.log('WebRTC ontrack received:', event.track.kind, event.streams);
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
      } else if (event.track) {
        if (!this.remoteStream) this.remoteStream = new MediaStream();
        if (!this.remoteStream.getTracks().some(t => t.id === event.track.id)) {
          this.remoteStream.addTrack(event.track);
        }
      }

      if (this.remoteStream) {
        // Clone new stream instance so React state listeners re-render immediately
        this.config.onRemoteStream(new MediaStream(this.remoteStream.getTracks()));
      }
    };

    // Handle ICE Candidates
    pc.onicecandidate = event => {
      if (event.candidate) {
        this.config.onIceCandidate({
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      if (this.peerConnection) {
        console.log('WebRTC state change:', this.peerConnection.connectionState);
        this.config.onConnectionStateChange(this.peerConnection.connectionState);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (this.peerConnection) {
        console.log('WebRTC ICE state change:', this.peerConnection.iceConnectionState);
        if (
          this.peerConnection.iceConnectionState === 'connected' ||
          this.peerConnection.iceConnectionState === 'completed'
        ) {
          if (this.remoteStream && this.remoteStream.getTracks().length > 0) {
            this.config.onRemoteStream(new MediaStream(this.remoteStream.getTracks()));
          }
        }
      }
    };

    return pc;
  }

  /**
   * Create WebRTC Offer
   */
  async createOffer(): Promise<{ type: string; sdp: string }> {
    if (!this.peerConnection) {
      this.createPeerConnection();
    }
    const offer = await this.peerConnection!.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
    await this.peerConnection!.setLocalDescription(offer);
    return {
      type: offer.type,
      sdp: offer.sdp || ''
    };
  }

  /**
   * Create WebRTC Answer given an Offer
   */
  async createAnswer(offer: { type: string; sdp: string }): Promise<{ type: string; sdp: string }> {
    if (!this.peerConnection) {
      this.createPeerConnection();
    }
    const rtcOffer = new RTCSessionDescription(offer as RTCSessionDescriptionInit);
    await this.peerConnection!.setRemoteDescription(rtcOffer);
    await this.drainQueuedCandidates();

    const answer = await this.peerConnection!.createAnswer();
    await this.peerConnection!.setLocalDescription(answer);
    return {
      type: answer.type,
      sdp: answer.sdp || ''
    };
  }

  /**
   * Set Remote Answer from Callee
   */
  async setRemoteAnswer(answer: { type: string; sdp: string }): Promise<void> {
    if (!this.peerConnection) return;
    if (
      this.peerConnection.signalingState === 'have-local-offer' ||
      this.peerConnection.signalingState === 'have-remote-pranswer'
    ) {
      const rtcAnswer = new RTCSessionDescription(answer as RTCSessionDescriptionInit);
      await this.peerConnection.setRemoteDescription(rtcAnswer);
      await this.drainQueuedCandidates();
    }
  }

  /**
   * Add Remote ICE Candidate
   */
  async addIceCandidate(candidatePayload: IceCandidatePayload): Promise<void> {
    if (!this.peerConnection || !this.peerConnection.remoteDescription) {
      this.iceCandidateQueue.push(candidatePayload);
      return;
    }
    try {
      const candidate = new RTCIceCandidate({
        candidate: candidatePayload.candidate,
        sdpMid: candidatePayload.sdpMid,
        sdpMLineIndex: candidatePayload.sdpMLineIndex
      });
      await this.peerConnection.addIceCandidate(candidate);
    } catch (e) {
      console.warn('ICE candidate handling:', e);
    }
  }

  private async drainQueuedCandidates(): Promise<void> {
    if (!this.peerConnection || !this.peerConnection.remoteDescription) return;
    while (this.iceCandidateQueue.length > 0) {
      const cand = this.iceCandidateQueue.shift();
      if (cand) {
        try {
          await this.peerConnection.addIceCandidate(
            new RTCIceCandidate({
              candidate: cand.candidate,
              sdpMid: cand.sdpMid,
              sdpMLineIndex: cand.sdpMLineIndex
            })
          );
        } catch (e) {
          console.warn('Error draining candidate:', e);
        }
      }
    }
  }

  /**
   * Toggle Audio Mute
   */
  toggleAudio(): boolean {
    if (!this.localStream) return false;
    const track = this.localStream.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      return track.enabled;
    }
    return false;
  }

  /**
   * Toggle Video Mute
   */
  toggleVideo(): boolean {
    if (!this.localStream) return false;
    const track = this.localStream.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      return track.enabled;
    }
    return false;
  }

  /**
   * Cleanup
   */
  cleanupPeerConnection(): void {
    if (this.peerConnection) {
      this.peerConnection.ontrack = null;
      this.peerConnection.onicecandidate = null;
      this.peerConnection.onconnectionstatechange = null;
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.iceCandidateQueue = [];
  }

  cleanup(): void {
    this.cleanupPeerConnection();
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    this.remoteStream = null;
  }
}
