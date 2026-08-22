export type UserRole = 'patient' | 'doctor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  village?: string;
  district?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export type DoctorAvailabilityStatus = 'available' | 'busy' | 'offline';

export interface Doctor {
  id: string; // matches user.id
  name: string;
  specialty: string;
  qualifications: string;
  experience: number; // in years
  hospitalId: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
  consultationFee: number;
  teleconsultationAvailable: boolean;
  availabilityStatus?: DoctorAvailabilityStatus;
  verificationStatus: VerificationStatus;
  profileImage: string;
  areasOfSpecialization: string[];
}

export interface Hospital {
  id: string;
  name: string;
  city: string;
  district: string;
  state: string;
  latitude?: number;
  longitude?: number;
  address: string;
  specialties: string[];
  phone: string;
  teleconsultationAvailable: boolean;
}

export type AppointmentStatus = 'requested' | 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string; // e.g., RC-APT-2026-0001
  patientId: string;
  doctorId: string;
  hospitalId: string;
  specialty: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  consultationType: 'video' | 'audio';
  status: AppointmentStatus;
  createdAt: string;
}

export interface Availability {
  id: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  slots: string[]; // e.g. ["09:00", "10:00"]
}

export type FollowUpPriority = 'normal' | 'priority' | 'high';

export interface PhysicalReferral {
  hospitalId: string;
  hospitalName: string;
  specialty: string;
  location: string;
  reason: string;
  contactInfo: string;
}

export interface Consultation {
  id: string; // matches appointmentId
  appointmentId: string;
  patientId: string;
  doctorId: string;
  notes: string;
  recommendations: string;
  followUpRequired?: boolean;
  followUpDate?: string; // YYYY-MM-DD
  followUpPriority?: FollowUpPriority;
  followUpNote?: string;
  physicalReferral?: PhysicalReferral;
  completedAt: string;
}

export interface MedicalReport {
  id: string;
  patientId: string;
  appointmentId?: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

export type ReferralStatus =
  | 'created'
  | 'viewed'
  | 'accepted'
  | 'appointment_requested'
  | 'completed'
  | 'cancelled';

export interface Referral {
  id: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  doctorName?: string;
  appointmentId: string;
  hospitalId: string;
  hospitalName?: string;
  specialty: string;
  reason: string;
  status: ReferralStatus;
  createdAt: string;
  viewedAt?: string;
  acceptedAt?: string;
  appointmentRequestedAt?: string;
  completedAt?: string;
}

export interface HealthAssessment {
  id: string;
  patientId: string;
  mainConcern: string;
  duration: string;
  previousConsultation: boolean;
  hasMedicalReport: boolean;
  medicalReportUrl?: string;
  suggestedSpecialty: string;
  createdAt: string;
}

export type SupportedLanguage = 'en' | 'hi' | 'mr';

export type NotificationType =
  | 'appointment_requested'
  | 'appointment_confirmed'
  | 'appointment_cancelled'
  | 'consultation_reminder'
  | 'consultation_completed'
  | 'followup_scheduled'
  | 'priority_followup'
  | 'referral_created'
  | 'referral_updated'
  | 'new_appointment'
  | 'upcoming_consultation'
  | 'new_message'
  | 'incoming_call'
  | 'call_missed';

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

export interface Feedback {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

// REAL-TIME CHAT TYPES
export type MessageType = 'text' | 'image' | 'document' | 'prescription' | 'audio';

export interface ChatMessage {
  id: string;
  conversationId: string;
  chatId?: string; // alias for conversationId
  consultationId?: string;
  appointmentId?: string; // alias for consultationId
  patientId?: string;
  doctorId?: string;
  senderId: string;
  senderName: string;
  senderRole?: UserRole;
  receiverId: string;
  message: string;
  text?: string; // alias for message
  type: MessageType;
  attachmentUrl?: string;
  attachmentName?: string;
  read: boolean;
  createdAt: string;
}

export interface ConversationParticipant {
  name: string;
  role: UserRole;
  avatar?: string;
  specialty?: string;
  status?: DoctorAvailabilityStatus;
}

export interface Conversation {
  id: string; // usually `${patientId}_${doctorId}` or `${consultationId}`
  consultationId?: string;
  participants: string[]; // [patientId, doctorId]
  participantDetails: {
    [userId: string]: ConversationParticipant;
  };
  lastMessage?: string;
  lastMessageTimestamp?: string;
  lastMessageSenderId?: string;
  unreadCount?: {
    [userId: string]: number;
  };
  createdAt: string;
  updatedAt: string;
}

// WEBRTC CALL & SIGNALING TYPES
export type CallType = 'audio' | 'video';
export type CallStatus =
  | 'calling'
  | 'ringing'
  | 'accepted'
  | 'rejected'
  | 'ended'
  | 'missed'
  | 'failed'
  | 'reconnecting'
  | 'connected';

export interface IceCandidatePayload {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
}

export interface CallSignal {
  id: string;
  consultationId: string;
  callerId: string;
  callerName: string;
  callerRole: UserRole;
  callerAvatar?: string;
  calleeId: string;
  calleeName: string;
  calleeRole: UserRole;
  callType: CallType;
  status: CallStatus;
  offer?: {
    type: string;
    sdp: string;
  } | null;
  answer?: {
    type: string;
    sdp: string;
  } | null;
  callerCandidates?: IceCandidatePayload[];
  calleeCandidates?: IceCandidatePayload[];
  startedAt: string;
  acceptedAt?: string | null;
  endedAt?: string | null;
  duration?: number; // duration in seconds
}

export interface CallHistoryItem {
  id: string;
  consultationId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty?: string;
  callType: CallType;
  startTime: string;
  endTime?: string;
  duration: number; // in seconds
  status: 'completed' | 'declined' | 'missed' | 'cancelled' | 'failed';
  notes?: string;
}

