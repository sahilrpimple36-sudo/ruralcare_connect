import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  FileText,
  ClipboardList,
  Calendar,
  Landmark,
  AlertCircle,
  Maximize2,
  Minimize2,
  Clock,
  ShieldCheck,
  CheckCircle
} from 'lucide-react';
import { User, Appointment, Hospital, MedicalReport, CallType, FollowUpPriority } from '../types';
import { dbService } from '../services/dbService';
import { callService } from '../services/callService';
import { useWebRTC } from '../hooks/useWebRTC';
import { ChatPanel } from '../components/ChatPanel';

interface ConsultationRoomProps {
  user: User;
  appointmentId: string;
  initialCallType?: CallType;
  incomingCallId?: string;
  setCurrentPage: (page: string, params?: any) => void;
}

export const ConsultationRoom: React.FC<ConsultationRoomProps> = ({
  user,
  appointmentId,
  initialCallType = 'video',
  incomingCallId,
  setCurrentPage
}) => {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [patientProfile, setPatientProfile] = useState<any>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Side Panel state
  const [sidePanelOpen, setSidePanelOpen] = useState(true);
  const [activeSideTab, setActiveSideTab] = useState<'chat' | 'notes' | 'reports'>('chat');

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);

  // Doctor recommendations form states
  const [notes, setNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpPriority, setFollowUpPriority] = useState<FollowUpPriority>('high');
  const [followUpNote, setFollowUpNote] = useState('');

  const [referralRequired, setReferralRequired] = useState(false);
  const [selectedHospId, setSelectedHospId] = useState('');
  const [referralReason, setReferralReason] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [peerFrame, setPeerFrame] = useState<string | null>(null);
  const [peerCamOff, setPeerCamOff] = useState(false);

  // Video & Audio Element Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Determine peer
  const isDoctor = user.role === 'doctor';
  const peerId = appointment ? (isDoctor ? appointment.patientId : appointment.doctorId) : '';
  const peerName = appointment
    ? isDoctor
      ? patientProfile?.name || `Patient (${appointment.patientId.slice(0, 8)})`
      : doctorProfile?.name || 'Dr. Specialist'
    : 'Peer';
  const peerRole = isDoctor ? 'patient' : 'doctor';

  // WebRTC Hook
  const {
    callStatus,
    localStream,
    remoteStream,
    micOn,
    camOn,
    isAudioOnly,
    isRealCamera,
    duration,
    warning: webrtcWarning,
    startCall,
    acceptCall,
    endCall,
    toggleMic,
    toggleCam,
    requestPhysicalCamera
  } = useWebRTC({
    currentUserId: user.id,
    currentUserName: user.name,
    currentUserRole: user.role,
    currentUserAvatar: isDoctor ? doctorProfile?.profileImage : undefined,
    consultationId: appointmentId,
    peerId,
    peerName,
    peerRole,
    initialCallType: appointment?.consultationType || initialCallType,
    existingCallId: incomingCallId,
    onCallEnded: () => {
      // If doctor, prompt to finish notes
      if (isDoctor) {
        setActiveSideTab('notes');
      }
    }
  });

  // Load Consultation & User data
  useEffect(() => {
    const loadConsultationData = async () => {
      try {
        setLoadingData(true);
        const [apts, hosps, userReports, patients] = await Promise.all([
          dbService.getAppointments('', 'admin'),
          dbService.getHospitals(),
          dbService.getMedicalReports(user.role === 'patient' ? user.id : ''),
          dbService.getPatientsForAdmin()
        ]);

        const apt = apts.find(a => a.id === appointmentId);
        if (!apt) {
          alert('Appointment consultation record not found.');
          setCurrentPage(user.role === 'doctor' ? 'doctor-dashboard' : 'patient-dashboard');
          return;
        }

        setAppointment(apt);
        setHospitals(hosps);
        setReports(userReports);
        if (hosps.length > 0) {
          setSelectedHospId(hosps[0].id);
        }

        // Fetch connected peer details
        if (user.role === 'doctor') {
          const patientUser = patients.find(p => p.id === apt.patientId);
          setPatientProfile(patientUser);
        } else {
          const docUser = await dbService.getDoctorProfile(apt.doctorId);
          setDoctorProfile(docUser);
        }
      } catch (err) {
        console.error('Failed loading consultation room:', err);
      } finally {
        setLoadingData(false);
      }
    };
    loadConsultationData();
  }, [appointmentId]);

  // Auto-initiate / join call once appointment is loaded
  useEffect(() => {
    let isMounted = true;
    const initCallSession = async () => {
      if (!appointment || localStream) return;

      if (incomingCallId) {
        // Handled by useWebRTC auto-join
        return;
      }

      // Check if peer has already initiated an active call for this appointment
      const activeCall = await callService.getActiveCallForConsultation(appointment.id);
      if (!isMounted) return;

      if (
        activeCall &&
        activeCall.callerId !== user.id &&
        (activeCall.status === 'calling' || activeCall.status === 'ringing')
      ) {
        await acceptCall(activeCall);
      } else if (!activeCall && callStatus === 'calling') {
        await startCall(appointment.consultationType || initialCallType);
      }
    };

    initCallSession();
    return () => {
      isMounted = false;
    };
  }, [appointment, incomingCallId, callStatus, localStream, startCall, acceptCall, initialCallType, user.id]);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      if (localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
      }
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream, loadingData, camOn]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      if (remoteVideoRef.current.srcObject !== remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [remoteStream, loadingData, callStatus]);

  // Attach remote stream to dedicated audio element
  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      if (remoteAudioRef.current.srcObject !== remoteStream) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
      remoteAudioRef.current.play().catch(e => console.warn('Remote audio play:', e));
    }
  }, [remoteStream, loadingData, callStatus]);

  // Real-time video frame relay across devices over local network (Rural Low-Bandwidth Optimized)
  useEffect(() => {
    if (!appointment || !user || callStatus === 'ended' || callStatus === 'rejected') return;

    let isMounted = true;
    let isBroadcasting = false;
    let isPolling = false;
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = 240;
    offscreenCanvas.height = 180;
    const offscreenCtx = offscreenCanvas.getContext('2d');

    // 1. Broadcast local video frame (or camOff status)
    const broadcastInterval = setInterval(async () => {
      if (!isMounted || isBroadcasting) return;
      if (!camOn) {
        isBroadcasting = true;
        try {
          await fetch(`/api/stream/${appointment.id}/${user.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ camOff: true })
          });
        } catch (e) {} finally {
          isBroadcasting = false;
        }
        return;
      }

      if (localVideoRef.current && localVideoRef.current.videoWidth > 0 && offscreenCtx) {
        isBroadcasting = true;
        try {
          offscreenCtx.drawImage(localVideoRef.current, 0, 0, 240, 180);
          const base64Frame = offscreenCanvas.toDataURL('image/jpeg', 0.3);
          await fetch(`/api/stream/${appointment.id}/${user.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ frame: base64Frame, camOff: false })
          });
        } catch (e) {} finally {
          isBroadcasting = false;
        }
      }
    }, 240);

    // 2. Poll peer's video frame (every 240ms)
    const pollPeerInterval = setInterval(async () => {
      if (!isMounted || isPolling) return;
      isPolling = true;
      try {
        const res = await fetch(`/api/stream/${appointment.id}/${peerId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.camOff) {
              setPeerCamOff(true);
              setPeerFrame(null);
            } else if (data.frame) {
              setPeerCamOff(false);
              setPeerFrame(data.frame);
            }
          }
        }
      } catch (e) {} finally {
        isPolling = false;
      }
    }, 240);

    return () => {
      isMounted = false;
      clearInterval(broadcastInterval);
      clearInterval(pollPeerInterval);
    };
  }, [appointment, user, peerId, callStatus, camOn]);

  // Real-time zero-lag audio stream relay across devices over local network (16kHz Ultra-Low Bandwidth)
  useEffect(() => {
    if (!appointment || !user || !localStream || !peerId || callStatus === 'ended' || callStatus === 'rejected') return;

    let isMounted = true;
    let isBroadcastingAudio = false;
    let isPollingAudio = false;
    let captureAudioCtx: AudioContext | null = null;
    let playbackAudioCtx: AudioContext | null = null;
    let scriptNode: ScriptProcessorNode | null = null;
    let sourceNode: MediaStreamAudioSourceNode | null = null;
    let silentGain: GainNode | null = null;
    let nextScheduledTime = 0;
    let lastAudioId = 0;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    // Helper: ensure AudioContext is active
    const resumeAudio = () => {
      if (playbackAudioCtx && playbackAudioCtx.state === 'suspended') {
        playbackAudioCtx.resume().catch(() => {});
      }
      if (captureAudioCtx && captureAudioCtx.state === 'suspended') {
        captureAudioCtx.resume().catch(() => {});
      }
    };
    window.addEventListener('click', resumeAudio);
    window.addEventListener('touchstart', resumeAudio);

    // Keep AudioContexts active via periodic heartbeat
    const audioKeepAlive = setInterval(resumeAudio, 500);

    // 1. Audio Capture: Read & Downsample Float32 samples from microphone stream
    try {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0 && micOn) {
        captureAudioCtx = new AudioContextClass();
        if (captureAudioCtx.state === 'suspended') {
          captureAudioCtx.resume().catch(() => {});
        }

        sourceNode = captureAudioCtx.createMediaStreamSource(localStream);
        scriptNode = captureAudioCtx.createScriptProcessor(2048, 1, 1);
        silentGain = captureAudioCtx.createGain();
        silentGain.gain.value = 0; // Prevent local mic echo in speakers

        scriptNode.onaudioprocess = async e => {
          if (!isMounted || !micOn || isBroadcastingAudio) return;
          const input = e.inputBuffer.getChannelData(0);
          let sum = 0;
          for (let i = 0; i < input.length; i++) sum += Math.abs(input[i]);
          if (sum < 0.001) return; // Sensitive voice activity detection threshold

          // Downsample to ~16kHz for 75% reduced bandwidth
          const factor = Math.max(1, Math.round((captureAudioCtx?.sampleRate || 44100) / 16000));
          const downsampledLength = Math.floor(input.length / factor);
          const int16 = new Int16Array(downsampledLength);
          
          for (let i = 0; i < downsampledLength; i++) {
            const sample = input[i * factor];
            const s = Math.max(-1, Math.min(1, sample));
            int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }

          const bytes = new Uint8Array(int16.buffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64Pcm = btoa(binary);

          isBroadcastingAudio = true;
          try {
            await fetch(`/api/audio/${appointment.id}/${user.id}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pcm: base64Pcm, sampleRate: Math.round((captureAudioCtx?.sampleRate || 44100) / factor) })
            });
          } catch (err) {} finally {
            isBroadcastingAudio = false;
          }
        };

        sourceNode.connect(scriptNode);
        scriptNode.connect(silentGain);
        silentGain.connect(captureAudioCtx.destination);
      }
    } catch (e) {
      console.warn('Audio capture setup:', e);
    }

    // 2. Audio Playback: Receive peer PCM and schedule with real-time drift prevention
    try {
      playbackAudioCtx = new AudioContextClass();
      if (playbackAudioCtx.state === 'suspended') {
        playbackAudioCtx.resume().catch(() => {});
      }
    } catch (e) {}

    const audioPollInterval = setInterval(async () => {
      if (!isMounted || !playbackAudioCtx || isPollingAudio) return;
      isPollingAudio = true;
      try {
        if (playbackAudioCtx.state === 'suspended') {
          playbackAudioCtx.resume().catch(() => {});
        }

        const res = await fetch(`/api/audio/${appointment.id}/${peerId}?since=${lastAudioId}`);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.chunks) && data.chunks.length > 0 && isMounted) {
            for (const chunk of data.chunks) {
              if (chunk.id > lastAudioId) {
                lastAudioId = chunk.id;
                if (chunk.pcm) {
                  try {
                    const binary = atob(chunk.pcm);
                    const bytes = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) {
                      bytes[i] = binary.charCodeAt(i);
                    }
                    const int16 = new Int16Array(bytes.buffer);
                    const float32 = new Float32Array(int16.length);
                    for (let i = 0; i < int16.length; i++) {
                      float32[i] = int16[i] / 32768.0;
                    }

                    const sampleRate = chunk.sampleRate || 16000;
                    const audioBuffer = playbackAudioCtx.createBuffer(1, float32.length, sampleRate);
                    audioBuffer.copyToChannel(float32, 0);

                    const bufferSource = playbackAudioCtx.createBufferSource();
                    bufferSource.buffer = audioBuffer;
                    bufferSource.connect(playbackAudioCtx.destination);

                    const now = playbackAudioCtx.currentTime;
                    // Strict zero-lag drift cap: max 60ms ahead
                    if (nextScheduledTime > now + 0.06 || nextScheduledTime < now) {
                      nextScheduledTime = now;
                    }
                    const startTime = nextScheduledTime;
                    bufferSource.start(startTime);
                    nextScheduledTime = startTime + audioBuffer.duration;
                  } catch (pcmErr) {
                    console.warn('PCM decode error:', pcmErr);
                  }
                }
              }
            }
          }
        }
      } catch (e) {} finally {
        isPollingAudio = false;
      }
    }, 100);

    return () => {
      isMounted = false;
      window.removeEventListener('click', resumeAudio);
      window.removeEventListener('touchstart', resumeAudio);
      clearInterval(audioKeepAlive);
      if (scriptNode) scriptNode.disconnect();
      if (sourceNode) sourceNode.disconnect();
      if (silentGain) silentGain.disconnect();
      if (captureAudioCtx) captureAudioCtx.close().catch(() => {});
      if (playbackAudioCtx) playbackAudioCtx.close().catch(() => {});
      clearInterval(audioPollInterval);
    };
  }, [appointment, user, localStream, peerId, callStatus, micOn]);

  // Format Call Duration Seconds -> HH:MM:SS
  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch(err => {
        console.warn(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleCompleteConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment) return;

    setSubmitting(true);
    try {
      let physicalReferral = undefined;

      if (referralRequired && selectedHospId) {
        const hosp = hospitals.find(h => h.id === selectedHospId);
        physicalReferral = {
          hospitalId: selectedHospId,
          hospitalName: hosp?.name || 'Recommended Hospital',
          specialty: appointment.specialty,
          location: hosp ? `${hosp.city}, ${hosp.state}` : '',
          reason: referralReason,
          contactInfo: hosp?.phone || ''
        };
      }

      await dbService.completeConsultation(appointment.id, {
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        notes,
        recommendations,
        followUpRequired,
        followUpDate: followUpRequired ? followUpDate : undefined,
        followUpPriority: followUpRequired ? followUpPriority : undefined,
        followUpNote: followUpRequired ? followUpNote : undefined,
        physicalReferral
      });

      // Also end call in call service if not already ended
      await endCall('completed');

      setSubmitSuccess(true);
      setTimeout(() => {
        setCurrentPage(user.role === 'doctor' ? 'doctor-dashboard' : 'patient-dashboard');
      }, 2000);
    } catch (err: any) {
      alert('Failed to submit consultation record: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisconnect = async () => {
    if (user.role === 'doctor') {
      const confirmEnd = window.confirm(
        'Disconnect current call? You will remain in the room to finish and save the consultation sheet.'
      );
      if (confirmEnd) {
        await endCall('completed');
        setActiveSideTab('notes');
      }
    } else {
      if (window.confirm('Are you sure you want to disconnect and return to your Patient Dashboard?')) {
        await endCall('completed');
        setCurrentPage('patient-dashboard');
      }
    }
  };

  if (loadingData || !appointment) {
    return (
      <div className="bg-slate-950 text-white min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500"></div>
        <p className="text-sm font-semibold text-slate-400">Connecting to secure consultation room...</p>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (callStatus) {
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            Live {isAudioOnly ? 'Audio' : 'Video'} Call
          </span>
        );
      case 'accepted':
      case 'calling':
      case 'ringing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping"></span>
            Connecting to {peerName}...
          </span>
        );
      case 'reconnecting':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
            <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></span>
            Reconnecting...
          </span>
        );
      case 'ended':
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-slate-800 text-slate-400 border border-slate-700">
            Call Ended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-teal-500/20 text-teal-300 border border-teal-500/30">
            Room Active
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-950 text-white min-h-[calc(100vh-4rem)] flex flex-col">
      
      {/* Top Header Bar */}
      <header className="bg-slate-900/90 backdrop-blur-md px-6 py-3 border-b border-slate-800 flex flex-wrap justify-between items-center text-left gap-4 z-20">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-teal-500/20">
            RC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-white">
                {isDoctor ? `Consulting: ${peerName}` : `Consulting: ${doctorProfile?.name || 'Doctor'}`}
              </h2>
              {doctorProfile?.specialty && (
                <span className="text-[10px] bg-teal-500/20 text-teal-300 font-bold px-2 py-0.2 rounded border border-teal-500/30">
                  {doctorProfile.specialty}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-semibold block">
              Appointment #{appointment.id} &bull; Scheduled: {appointment.date} @ {appointment.time}
            </span>
          </div>
        </div>

        {/* Center & Right indicators */}
        <div className="flex items-center gap-3">
          {getStatusBadge()}

          {/* Call Duration counter */}
          <div className="bg-slate-800/80 border border-slate-700/60 px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300">
            <Clock className="h-3.5 w-3.5 text-teal-400" />
            <span>{formatDuration(duration)}</span>
          </div>

          <button
            onClick={() => setSidePanelOpen(!sidePanelOpen)}
            className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              sidePanelOpen
                ? 'bg-teal-600 border-teal-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title="Toggle Side Panel"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Workspace</span>
          </button>
        </div>
      </header>

      {/* Warning banner if camera permission fallback occurred */}
      {webrtcWarning && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-2 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{webrtcWarning}</span>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
        
        {/* Main Left Stage: Video / Audio Teleconsultation Room */}
        <div
          ref={videoContainerRef}
          className={`${
            sidePanelOpen ? 'lg:col-span-2' : 'lg:col-span-3'
          } p-4 sm:p-6 flex flex-col justify-between bg-slate-950/90 relative select-none transition-all duration-300`}
        >
          {/* Media Feed Container */}
          <div className="relative flex-1 rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl flex items-center justify-center min-h-[380px]">
            
            {/* Remote Feed Display */}
            {isAudioOnly ? (
              /* Audio Consultation Visualizer */
              <div className="w-full h-full flex flex-col items-center justify-center p-8 space-y-6 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-teal-500/20 animate-ping duration-1000"></div>
                  <div className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-teal-500/40 shadow-2xl bg-slate-800">
                    <img
                      src={
                        isDoctor
                          ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400'
                          : doctorProfile?.profileImage ||
                            'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400'
                      }
                      alt={peerName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <h3 className="text-lg sm:text-xl font-extrabold text-white">{peerName}</h3>
                  <p className="text-xs text-teal-400 font-semibold uppercase tracking-wider">
                    {isDoctor ? 'Patient Audio Feed' : `${doctorProfile?.specialty || 'Specialist'} Audio Feed`}
                  </p>
                  <p className="text-xs text-slate-400">
                    {callStatus === 'connected' ? 'Audio consultation in progress' : 'Establishing audio connection...'}
                  </p>
                </div>

                {/* Animated Voice Waveform bars */}
                <div className="flex items-center gap-1.5 h-8">
                  {[40, 75, 55, 90, 60, 80, 45, 70, 85, 50, 65].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${callStatus === 'connected' ? h : 20}%` }}
                      className={`w-1.5 rounded-full bg-teal-500 transition-all duration-300 ${
                        callStatus === 'connected' ? 'animate-pulse' : 'opacity-30'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* Video Consultation Stage */
              <div className="w-full h-full relative flex items-center justify-center bg-black">
                {/* Dedicated Remote Audio Player */}
                <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

                {/* Main Remote Video display: Real-time LAN Relay Frame, WebRTC Direct Feed, or Camera Off state */}
                {peerCamOff ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-6 text-center space-y-3">
                    <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shadow-inner">
                      <VideoOff className="h-9 w-9 text-slate-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200 text-sm">{peerName}</h4>
                      <span className="text-xs text-slate-400 block mt-0.5">Camera is turned off</span>
                    </div>
                  </div>
                ) : peerFrame ? (
                  <img
                    src={peerFrame}
                    alt={peerName}
                    className="w-full h-full object-cover select-none"
                  />
                ) : (
                  <video
                    ref={el => {
                      remoteVideoRef.current = el;
                      if (el && remoteStream && el.srcObject !== remoteStream) {
                        el.srcObject = remoteStream;
                        el.play().catch(() => {});
                      }
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Fallback overlay when waiting for peer to accept */}
                {callStatus !== 'connected' && callStatus !== 'accepted' && !peerFrame && !peerCamOff && (
                  <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
                    <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-2xl shadow-inner">
                      {peerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200 text-sm">{peerName}</h4>
                      <span className="text-xs text-slate-400 block mt-0.5">
                        {callStatus === 'calling' || callStatus === 'ringing'
                          ? 'Waiting for peer to accept video call...'
                          : 'Connecting peer video feed...'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Peer Name Tag */}
                <div className="absolute bottom-4 left-4 z-10 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2 text-xs font-semibold text-white shadow-lg">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span>{peerName}</span>
                </div>
              </div>
            )}

            {/* Local Video Stream Preview (Picture-in-Picture) */}
            {!isAudioOnly && (
              <div className="absolute top-4 right-4 z-20 w-32 sm:w-44 aspect-video bg-slate-950 border-2 border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center group">
                <video
                  ref={el => {
                    localVideoRef.current = el;
                    if (el && localStream && el.srcObject !== localStream) {
                      el.srcObject = localStream;
                      el.play().catch(() => {});
                    }
                  }}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full object-cover mirror ${camOn ? 'block' : 'hidden'}`}
                />
                {!camOn && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 p-2 text-center">
                    <VideoOff className="h-5 w-5 text-slate-500 mb-1" />
                    <span className="text-[10px] text-slate-400 font-semibold">Camera Off</span>
                  </div>
                )}
                <div className="absolute bottom-1.5 left-2 bg-slate-950/80 px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-300">
                  You ({user.role})
                </div>
                {!micOn && (
                  <div className="absolute top-1.5 right-1.5 bg-red-600/90 p-1 rounded-full">
                    <MicOff className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Call Controllers Toolbar */}
          <div className="mt-4 sm:mt-6 flex flex-wrap justify-center items-center gap-3 sm:gap-4 z-20">
            {/* Microphone Toggle */}
            <button
              onClick={toggleMic}
              className={`p-3.5 rounded-2xl shadow-xl transition-all cursor-pointer ${
                micOn
                  ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30'
              }`}
              title={micOn ? 'Mute Microphone' : 'Unmute Microphone'}
            >
              {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>

            {/* Camera Toggle */}
            {!isAudioOnly && (
              <button
                onClick={toggleCam}
                className={`p-3.5 rounded-2xl shadow-xl transition-all cursor-pointer ${
                  camOn
                    ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30'
                }`}
                title={camOn ? 'Turn Off Camera' : 'Turn On Camera'}
              >
                {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </button>
            )}

            {/* Physical Camera Access button if running simulated */}
            {!isAudioOnly && !isRealCamera && (
              <button
                onClick={requestPhysicalCamera}
                className="py-2 px-3.5 rounded-2xl bg-teal-600/30 hover:bg-teal-600/50 text-teal-300 border border-teal-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
                title="Attempt to switch from animated stream to real hardware camera"
              >
                <Video className="h-3.5 w-3.5" />
                <span>Use Real Webcam</span>
              </button>
            )}

            {/* End Call / Disconnect Button */}
            <button
              onClick={handleDisconnect}
              className="p-3.5 px-6 bg-red-600 hover:bg-red-700 hover:scale-105 active:scale-95 rounded-2xl text-white shadow-xl shadow-red-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer font-bold text-xs"
              title="End Consultation"
            >
              <PhoneOff className="h-5 w-5" />
              <span>Disconnect</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 shadow-xl transition-all cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Right Stage: Side Panel (Chat, Notes, Reports) */}
        {sidePanelOpen && (
          <div className="border-l border-slate-800 bg-slate-900 flex flex-col justify-between text-left h-[calc(100vh-8rem)]">
            
            {/* Tab navigation */}
            <div className="flex border-b border-slate-800 bg-slate-950/80 px-4 pt-3">
              <button
                onClick={() => setActiveSideTab('chat')}
                className={`flex-1 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeSideTab === 'chat'
                    ? 'border-teal-500 text-teal-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Chat
              </button>

              <button
                onClick={() => setActiveSideTab('notes')}
                className={`flex-1 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeSideTab === 'notes'
                    ? 'border-teal-500 text-teal-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ClipboardList className="h-3.5 w-3.5" />
                Rx & Notes
              </button>

              <button
                onClick={() => setActiveSideTab('reports')}
                className={`flex-1 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeSideTab === 'reports'
                    ? 'border-teal-500 text-teal-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Reports ({reports.length})
              </button>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto">
              
              {/* 1. Integrated Chat Tab */}
              {activeSideTab === 'chat' && (
                <div className="h-full">
                  <ChatPanel
                    currentUser={user}
                    recipientId={peerId}
                    recipientName={peerName}
                    recipientRole={peerRole}
                    recipientAvatar={isDoctor ? undefined : doctorProfile?.profileImage}
                    recipientSpecialty={doctorProfile?.specialty}
                    consultationId={appointment.id}
                    showHeader={false}
                    className="border-none rounded-none h-full bg-slate-900"
                  />
                </div>
              )}

              {/* 2. Doctor Notes & Recommendations Tab */}
              {activeSideTab === 'notes' && (
                <div className="p-5 space-y-4 text-xs font-semibold text-slate-400">
                  <div className="flex items-center gap-2 text-slate-200 border-b border-slate-800 pb-3">
                    <ClipboardList className="h-4 w-4 text-teal-400" />
                    <h3 className="font-bold text-sm">Consultation Record Sheet</h3>
                  </div>

                  {submitSuccess && (
                    <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 p-3.5 rounded-xl text-center font-bold space-y-1">
                      <CheckCircle className="h-5 w-5 mx-auto text-emerald-400" />
                      <p>Consultation record saved successfully!</p>
                      <span className="text-[10px] text-emerald-400/80 font-normal">Returning to workspace...</span>
                    </div>
                  )}

                  {user.role === 'doctor' ? (
                    <form onSubmit={handleCompleteConsultation} className="space-y-4">
                      {/* Clinical notes */}
                      <div>
                        <label className="block mb-1.5 uppercase text-[9px] tracking-wider font-bold text-slate-300">
                          Clinical Notes / Observed Symptoms
                        </label>
                        <textarea
                          required
                          rows={3}
                          value={notes}
                          onChange={e => setNotes(e.target.value)}
                          placeholder="Type clinical diagnosis & symptoms..."
                          className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      {/* Recommendations */}
                      <div>
                        <label className="block mb-1.5 uppercase text-[9px] tracking-wider font-bold text-slate-300">
                          Prescriptions & Medical Guidance
                        </label>
                        <textarea
                          required
                          rows={3}
                          value={recommendations}
                          onChange={e => setRecommendations(e.target.value)}
                          placeholder="Type medicines, dosage, dietary advice..."
                          className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      {/* Follow-up toggle */}
                      <div className="border-t border-slate-800 pt-3 space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-[10px] text-slate-300">
                          <input
                            type="checkbox"
                            checked={followUpRequired}
                            onChange={e => setFollowUpRequired(e.target.checked)}
                            className="rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-teal-500"
                          />
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" /> Follow-up consultation required
                          </span>
                        </label>

                        {followUpRequired && (
                          <div className="space-y-2.5 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                            <div>
                              <label className="block mb-1 text-[9px] text-slate-400">Follow-up Priority</label>
                              <div className="grid grid-cols-3 gap-1.5">
                                {(['normal', 'priority', 'high'] as FollowUpPriority[]).map(p => (
                                  <button
                                    key={p}
                                    type="button"
                                    onClick={() => setFollowUpPriority(p)}
                                    className={`py-1 rounded text-[9px] font-bold uppercase transition-all cursor-pointer ${
                                      followUpPriority === p
                                        ? p === 'high'
                                          ? 'bg-red-600 text-white'
                                          : p === 'priority'
                                          ? 'bg-amber-500 text-white'
                                          : 'bg-teal-600 text-white'
                                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                                    }`}
                                  >
                                    {p}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className="block mb-1 text-[9px] text-slate-400">Follow-up Date</label>
                              <input
                                type="date"
                                required
                                min={new Date().toISOString().split('T')[0]}
                                value={followUpDate}
                                onChange={e => setFollowUpDate(e.target.value)}
                                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none text-xs"
                              />
                            </div>

                            <div>
                              <label className="block mb-1 text-[9px] text-slate-400">Follow-up Clinical Note</label>
                              <input
                                type="text"
                                placeholder="e.g. Review blood count and symptoms..."
                                value={followUpNote}
                                onChange={e => setFollowUpNote(e.target.value)}
                                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none text-xs"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Physical Hospital Referral toggle */}
                      <div className="border-t border-slate-800 pt-3 space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-[10px] text-slate-300">
                          <input
                            type="checkbox"
                            checked={referralRequired}
                            onChange={e => setReferralRequired(e.target.checked)}
                            className="rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-teal-500"
                          />
                          <span className="flex items-center gap-1">
                            <Landmark className="h-3.5 w-3.5" /> Physical hospital referral recommended
                          </span>
                        </label>

                        {referralRequired && (
                          <div className="space-y-2 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                            <div>
                              <label className="block mb-1 text-[9px] text-slate-400">Select Care Facility</label>
                              <select
                                value={selectedHospId}
                                onChange={e => setSelectedHospId(e.target.value)}
                                className="w-full p-2 bg-slate-900 border border-slate-800 rounded text-white focus:outline-none text-xs"
                              >
                                {hospitals.map(h => (
                                  <option key={h.id} value={h.id}>
                                    {h.name} ({h.city})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block mb-1 text-[9px] text-slate-400">Referral Reason</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Advanced physical oncology staging required"
                                value={referralReason}
                                onChange={e => setReferralReason(e.target.value)}
                                className="w-full p-2 bg-slate-900 border border-slate-800 rounded text-white focus:outline-none text-xs"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-teal-600/20 text-xs mt-4"
                      >
                        {submitting ? 'Saving Records...' : 'Complete & Close Consultation'}
                      </button>
                    </form>
                  ) : (
                    /* Patient Read-Only View */
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs">
                        <div className="flex items-center gap-1.5 text-teal-400">
                          <ShieldCheck className="h-4 w-4 flex-shrink-0" />
                          <h4 className="font-bold text-slate-200">Patient Live Consultation Mode</h4>
                        </div>
                        <p className="text-slate-400 leading-relaxed font-medium">
                          The doctor is recording clinical notes and prescriptions in real-time. Once the consultation is concluded, your digital prescription slip will be saved to your dashboard.
                        </p>
                      </div>

                      {notes && (
                        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
                          <strong className="text-slate-300">Live Observation Notes:</strong>
                          <p className="text-slate-400 italic font-medium">{notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Patient Reports Tab */}
              {activeSideTab === 'reports' && (
                <div className="p-5 space-y-4">
                  <h3 className="font-bold text-slate-200 text-xs flex items-center gap-2 border-b border-slate-800 pb-3">
                    <FileText className="h-4 w-4 text-teal-400" />
                    Patient Medical Scans & Files
                  </h3>

                  {reports.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500 italic">
                      No reports uploaded by patient for this consultation.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {reports.map(rep => (
                        <div
                          key={rep.id}
                          className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs hover:border-slate-700"
                        >
                          <span className="truncate text-slate-300 max-w-[170px]" title={rep.fileName}>
                            {rep.fileName}
                          </span>
                          <a
                            href={rep.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-teal-400 hover:text-teal-300 font-bold ml-2"
                          >
                            Open Link
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer encryption badge */}
            <div className="text-[10px] text-slate-500 text-center border-t border-slate-800 py-3 select-none">
              Telemedicine Consultation &bull; Encrypted Communication Stream
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
