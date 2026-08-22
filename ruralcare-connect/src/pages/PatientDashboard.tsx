import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  FileUp,
  Landmark,
  Star,
  StarOff,
  Video,
  Phone,
  Clock,
  MessageSquare,
  History,
  CheckCircle2,
  AlertCircle,
  Activity,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import {
  User,
  Appointment,
  Consultation,
  MedicalReport,
  Referral,
  ReferralStatus,
  CallHistoryItem,
  Doctor,
  FollowUpPriority,
  HealthAssessment as HealthAssessmentType
} from '../types';
import { dbService } from '../services/dbService';
import { storageService } from '../services/storageService';
import { callService } from '../services/callService';
import { ChatPanel } from '../components/ChatPanel';
import { useLanguage } from '../services/i18n';

interface PatientDashboardProps {
  user: User;
  setCurrentPage: (page: string, params?: any) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ user, setCurrentPage }) => {
  const { t } = useLanguage();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [healthAssessments, setHealthAssessments] = useState<HealthAssessmentType[]>([]);
  const [callHistory, setCallHistory] = useState<CallHistoryItem[]>([]);
  const [doctorsMap, setDoctorsMap] = useState<{ [docId: string]: Doctor }>({});
  const [loading, setLoading] = useState(true);

  // Upload report state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Selected consultation overlay for notes
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [consultDocName, setConsultDocName] = useState('');

  // Feedback modal state
  const [feedbackApt, setFeedbackApt] = useState<Appointment | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  // Active Chat Modal state
  const [chatDoctor, setChatDoctor] = useState<{
    id: string;
    name: string;
    specialty?: string;
    avatar?: string;
    status?: 'available' | 'busy' | 'offline';
    consultationId?: string;
  } | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [apts, reps, refs, fUps, assessments, hist, allDocs] = await Promise.all([
        dbService.getAppointments(user.id, 'patient'),
        dbService.getMedicalReports(user.id),
        dbService.getReferrals(user.id),
        dbService.getFollowUps(user.id, 'patient'),
        dbService.getHealthAssessments(user.id),
        callService.getCallHistory(user.id, 'patient'),
        dbService.getDoctors()
      ]);

      setAppointments(apts);
      setReports(reps);
      setReferrals(refs);
      setFollowUps(fUps);
      setHealthAssessments(assessments);
      setCallHistory(hist);

      const dMap: { [id: string]: Doctor } = {};
      allDocs.forEach(d => {
        dMap[d.id] = d;
      });
      setDoctorsMap(dMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const handleUpdate = () => loadDashboardData();
    window.addEventListener('rc_mock_db_update', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    const interval = setInterval(loadDashboardData, 2000);
    return () => {
      window.removeEventListener('rc_mock_db_update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, [user]);

  const handleUploadReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const downloadUrl = await storageService.uploadReport(user.id, uploadFile);
      await dbService.addMedicalReportMetadata({
        patientId: user.id,
        fileName: uploadFile.name,
        fileUrl: downloadUrl
      });

      setUploadSuccess('Medical report uploaded successfully!');
      setUploadFile(null);
      const updatedReps = await dbService.getMedicalReports(user.id);
      setReports(updatedReps);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload report.');
    } finally {
      setUploading(false);
    }
  };

  const handleOpenConsultationNotes = async (apt: Appointment) => {
    try {
      const consult = await dbService.getConsultation(apt.id);
      if (consult) {
        setSelectedConsultation(consult);
        const doc = doctorsMap[apt.doctorId];
        setConsultDocName(doc ? doc.name : 'Specialist Doctor');
      } else {
        alert('No clinical consultation notes recorded yet.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateReferralStatus = async (referralId: string, nextStatus: ReferralStatus) => {
    try {
      await dbService.updateReferralStatus(referralId, nextStatus);
      const updatedRefs = await dbService.getReferrals(user.id);
      setReferrals(updatedRefs);
    } catch (err: any) {
      alert('Error updating referral: ' + err.message);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackApt) return;

    setFeedbackLoading(true);
    try {
      await dbService.addFeedback({
        patientId: user.id,
        doctorId: feedbackApt.doctorId,
        appointmentId: feedbackApt.id,
        rating,
        comment
      });

      setFeedbackSuccess('Thank you for rating your consultation experience!');
      setTimeout(() => {
        setFeedbackApt(null);
        setFeedbackSuccess('');
        setComment('');
      }, 1800);
    } catch (err) {
      console.error(err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const getDoctorName = (docId: string) => {
    return doctorsMap[docId]?.name || 'Specialist Doctor';
  };

  const getDoctorSpecialty = (docId: string) => {
    return doctorsMap[docId]?.specialty || 'General Medicine';
  };

  const REFERRAL_STEPS: { key: ReferralStatus; label: string }[] = [
    { key: 'created', label: 'Created' },
    { key: 'viewed', label: 'Viewed' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'appointment_requested', label: 'Appointment Requested' },
    { key: 'completed', label: 'Completed' }
  ];

  const getStepIndex = (status: ReferralStatus) => {
    switch (status) {
      case 'created':
        return 0;
      case 'viewed':
        return 1;
      case 'accepted':
        return 2;
      case 'appointment_requested':
        return 3;
      case 'completed':
        return 4;
      default:
        return 0;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Header */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-left shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 text-xs font-extrabold px-3 py-1 rounded-full mb-3 border border-teal-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{t.welcome}, {user.name}</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-tight">
              Patient Care & Health Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">
              Manage teleconsultations, track hospital referral letters, review doctor prescriptions, and perform digital health assessments.
            </p>
          </div>

          {/* Quick Action Button to Triage */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setCurrentPage('health-assessment')}
              className="py-3 px-5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-extrabold rounded-2xl shadow-lg shadow-teal-100 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Activity className="h-4 w-4" />
              <span>{t.startAssessment}</span>
            </button>

            <button
              onClick={() => setCurrentPage('specialist-search')}
              className="py-3 px-5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <span>{t.findSpecialist}</span>
            </button>
          </div>
        </div>

        {/* 1. DIGITAL HEALTH ASSESSMENT BANNER CARD */}
        <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 text-left shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="relative z-10 max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 bg-teal-500/20 text-teal-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-teal-500/30 uppercase tracking-wide">
              <Sparkles className="h-3 w-3" /> Preliminary Triage Guide
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Unsure which doctor you need?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Answer 4 basic health questions in our <strong>Digital Health Assessment</strong> to identify the appropriate medical specialty (Cardiology, Oncology, Orthopedics, etc.) before booking.
            </p>
          </div>

          <button
            onClick={() => setCurrentPage('health-assessment')}
            className="relative z-10 py-3 px-6 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-2xl transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer shadow-lg shadow-teal-500/20"
          >
            <span>{t.triageTitle}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* 2. UPCOMING APPOINTMENTS SECTION */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-left shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">{t.upcomingAppointments}</h3>
                <span className="text-[11px] text-slate-400 font-medium">Your scheduled specialist teleconsultations</span>
              </div>
            </div>

            <button
              onClick={() => setCurrentPage('specialist-search')}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 cursor-pointer"
            >
              + Book New
            </button>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400 py-6">Loading appointments...</p>
          ) : appointments.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-3">
              <Calendar className="h-8 w-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-600">No appointments scheduled yet</p>
              <button
                onClick={() => setCurrentPage('specialist-search')}
                className="py-2 px-4 bg-teal-600 text-white text-xs font-bold rounded-xl"
              >
                {t.findSpecialist}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {appointments.map(apt => {
                const doc = doctorsMap[apt.doctorId];
                return (
                  <div
                    key={apt.id}
                    className="p-5 border border-slate-200 rounded-2xl bg-white hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={doc?.profileImage || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200'}
                            alt={getDoctorName(apt.doctorId)}
                            className="h-12 w-12 rounded-xl object-cover bg-slate-100 border border-slate-100 flex-shrink-0"
                          />
                          <div>
                            <h4 className="font-extrabold text-slate-800 text-xs truncate max-w-[150px]">
                              {getDoctorName(apt.doctorId)}
                            </h4>
                            <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-2 py-0.5 rounded border border-teal-100 uppercase block mt-0.5 w-max">
                              {apt.specialty}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            apt.status === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : apt.status === 'completed'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : apt.status === 'cancelled'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>

                      <div className="bg-slate-50/70 p-3 rounded-xl text-xs space-y-1 text-slate-600">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Date & Slot:</span>
                          <strong className="text-slate-700">{apt.date} @ {apt.time}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Type:</span>
                          <span className="capitalize font-semibold text-slate-700">{apt.consultationType} Call</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex gap-2">
                      {apt.status === 'confirmed' || apt.status === 'requested' ? (
                        <>
                          <button
                            onClick={() =>
                              setCurrentPage('consultation-room', {
                                appointmentId: apt.id,
                                initialCallType: apt.consultationType
                              })
                            }
                            className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shadow-teal-100"
                          >
                            <Video className="h-3.5 w-3.5" />
                            <span>{t.joinRoom}</span>
                          </button>

                          <button
                            onClick={() =>
                              setChatDoctor({
                                id: apt.doctorId,
                                name: getDoctorName(apt.doctorId),
                                specialty: apt.specialty,
                                avatar: doc?.profileImage,
                                status: doc?.availabilityStatus,
                                consultationId: apt.id
                              })
                            }
                            className="py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                            title="Open Chat"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : apt.status === 'completed' ? (
                        <>
                          <button
                            onClick={() => handleOpenConsultationNotes(apt)}
                            className="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-200"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>Rx & Notes</span>
                          </button>
                          <button
                            onClick={() => setFeedbackApt(apt)}
                            className="py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer border border-amber-200"
                            title="Give Feedback"
                          >
                            <Star className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. PRIORITY FOLLOW-UP CARE SECTION */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-left shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">{t.followUpCare}</h3>
                <span className="text-[11px] text-slate-400 font-medium">Scheduled continuity-of-care consultations assigned by doctors</span>
              </div>
            </div>
          </div>

          {followUps.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 text-xs text-slate-400 font-medium">
              {t.noFollowUps}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {followUps.map(fu => {
                const isHigh = fu.followUpPriority === 'high';
                const isPriority = fu.followUpPriority === 'priority';
                return (
                  <div
                    key={fu.id}
                    className={`p-5 rounded-2xl border transition-all space-y-4 ${
                      isHigh
                        ? 'bg-red-50/40 border-red-200 ring-1 ring-red-200'
                        : isPriority
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-slate-50/50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm">{fu.doctorName}</h4>
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">
                            {fu.specialty}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                          Appointment #{fu.appointmentId}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                          isHigh
                            ? 'bg-red-600 text-white border-red-600 shadow-sm shadow-red-200'
                            : isPriority
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                      >
                        {isHigh ? '🚨 High Priority' : isPriority ? '⚡ Priority' : 'Normal Priority'}
                      </span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold">Follow-up Date:</span>
                        <strong className="text-slate-800">{fu.followUpDate}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-bold uppercase block mb-0.5">Doctor Guidance Note:</span>
                        <p className="text-slate-700 italic">{fu.followUpNote}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage('specialist-search', { specialty: fu.specialty })}
                        className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                      >
                        Book Follow-up Slot
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. REFERRAL TRACKING SECTION ("My Referrals") */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-left shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">{t.myReferrals}</h3>
                <span className="text-[11px] text-slate-400 font-medium">Physical tertiary hospital transfer letters and lifecycle tracking</span>
              </div>
            </div>
          </div>

          {referrals.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 text-xs text-slate-400 font-medium">
              {t.noReferrals}
            </div>
          ) : (
            <div className="space-y-6">
              {referrals.map(ref => {
                const stepIdx = getStepIndex(ref.status);
                return (
                  <div
                    key={ref.id}
                    className="p-6 border border-slate-200 rounded-2xl bg-white hover:border-slate-300 transition-all space-y-5 shadow-xs"
                  >
                    {/* Header Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-800 text-sm">
                            {ref.hospitalName || 'Associated Tertiary Hospital'}
                          </h4>
                          <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded border border-blue-100 uppercase">
                            {ref.specialty}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Referred by: {ref.doctorName || 'Doctor'} &bull; Created: {new Date(ref.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <span className="text-xs font-black px-3 py-1 rounded-full bg-slate-100 text-slate-700 capitalize self-start sm:self-auto">
                        Status: {ref.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Reason Box */}
                    <div className="p-3.5 bg-slate-50 rounded-xl text-xs space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Clinical Reason for Transfer:</span>
                      <p className="text-slate-700 font-medium">{ref.reason}</p>
                    </div>

                    {/* Progress Stepper */}
                    <div className="pt-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
                        {t.referralProgress}:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {REFERRAL_STEPS.map((step, idx) => {
                          const isDone = idx <= stepIdx;
                          const isCurrent = idx === stepIdx;
                          return (
                            <div
                              key={step.key}
                              className={`p-2.5 rounded-xl border text-center text-[10px] font-bold transition-all ${
                                isCurrent
                                  ? 'bg-teal-600 text-white border-teal-600 ring-2 ring-teal-200'
                                  : isDone
                                  ? 'bg-teal-50 text-teal-800 border-teal-200'
                                  : 'bg-slate-50 text-slate-400 border-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-center gap-1 mb-0.5">
                                {isDone ? (
                                  <CheckCircle2 className="h-3 w-3" />
                                ) : (
                                  <span className="h-3 w-3 rounded-full bg-slate-200 text-slate-500 text-[8px] flex items-center justify-center">
                                    {idx + 1}
                                  </span>
                                )}
                              </div>
                              <span>{step.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Interactive Action Triggers for Patient */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                      {(ref.status === 'created' || ref.status === 'viewed') && (
                        <button
                          onClick={() => handleUpdateReferralStatus(ref.id, 'accepted')}
                          className="py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          {t.acceptReferral}
                        </button>
                      )}

                      {ref.status === 'accepted' && (
                        <button
                          onClick={() => handleUpdateReferralStatus(ref.id, 'appointment_requested')}
                          className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          {t.requestHospitalAppointment}
                        </button>
                      )}

                      {ref.status === 'appointment_requested' && (
                        <button
                          onClick={() => handleUpdateReferralStatus(ref.id, 'completed')}
                          className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          {t.markCompleted}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. MEDICAL REPORTS UPLOAD & VAULT */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-left shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">{t.medicalReports}</h3>
                <span className="text-[11px] text-slate-400 font-medium">Securely store lab tests, radiology scans, and prescriptions</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleUploadReport} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-700">Upload New Diagnostic Scan / PDF</label>
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                required
                onChange={e => setUploadFile(e.target.files ? e.target.files[0] : null)}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-600 file:text-white hover:file:bg-teal-700 cursor-pointer"
              />
              <button
                type="submit"
                disabled={uploading || !uploadFile}
                className="w-full sm:w-auto py-2 px-5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>{uploading ? 'Uploading...' : t.uploadReport}</span>
              </button>
            </div>
            {uploadSuccess && <p className="text-xs text-emerald-600 font-bold">{uploadSuccess}</p>}
            {uploadError && <p className="text-xs text-red-600 font-bold">{uploadError}</p>}
          </form>

          {reports.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No reports uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {reports.map(rep => (
                <div key={rep.id} className="p-3.5 border border-slate-200 rounded-2xl bg-white flex items-center justify-between text-xs">
                  <div className="truncate pr-2">
                    <strong className="block text-slate-800 truncate">{rep.fileName}</strong>
                    <span className="text-[10px] text-slate-400">{new Date(rep.uploadedAt).toLocaleDateString()}</span>
                  </div>
                  <a
                    href={rep.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-1.5 px-3 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1"
                  >
                    <span>View</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prescription & Clinical Notes Modal Overlay */}
        {selectedConsultation && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 text-left shadow-2xl space-y-5 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Prescription & Clinical Sheet</h3>
                  <span className="text-xs text-slate-400 font-medium">{consultDocName}</span>
                </div>
                <button
                  onClick={() => setSelectedConsultation(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs text-slate-700">
                <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
                  <strong className="text-slate-500 uppercase text-[10px] block">Doctor Clinical Observations:</strong>
                  <p className="leading-relaxed">{selectedConsultation.notes || 'No specific notes recorded.'}</p>
                </div>

                <div className="p-3.5 bg-teal-50/60 border border-teal-100 rounded-xl space-y-1">
                  <strong className="text-teal-800 uppercase text-[10px] block">Prescriptions & Medical Guidance:</strong>
                  <p className="leading-relaxed font-semibold text-teal-950">{selectedConsultation.recommendations}</p>
                </div>

                {selectedConsultation.followUpDate && (
                  <div className="p-3.5 bg-purple-50/60 border border-purple-100 rounded-xl space-y-1">
                    <strong className="text-purple-800 uppercase text-[10px] block">Scheduled Follow-up Care:</strong>
                    <p className="font-bold text-purple-950">Recommended Date: {selectedConsultation.followUpDate}</p>
                    {selectedConsultation.followUpNote && (
                      <p className="text-purple-800 text-[11px] mt-0.5">{selectedConsultation.followUpNote}</p>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedConsultation(null)}
                className="w-full py-2.5 bg-slate-800 text-white text-xs font-bold rounded-xl"
              >
                Close Sheet
              </button>
            </div>
          </div>
        )}

        {/* Feedback Modal */}
        {feedbackApt && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 text-left shadow-2xl space-y-4 border border-slate-200">
              <h3 className="font-extrabold text-slate-800 text-base">Rate Your Teleconsultation</h3>
              <p className="text-xs text-slate-400">Share your feedback to help us maintain quality rural specialist care.</p>

              {feedbackSuccess ? (
                <p className="text-xs text-emerald-600 font-bold py-4">{feedbackSuccess}</p>
              ) : (
                <form onSubmit={handleSubmitFeedback} className="space-y-4">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-2xl cursor-pointer ${star <= rating ? 'text-amber-400' : 'text-slate-200'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={3}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Optional comments about doctor consultation..."
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                  />

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={feedbackLoading}
                      className="flex-1 py-2.5 bg-teal-600 text-white text-xs font-bold rounded-xl"
                    >
                      {feedbackLoading ? 'Submitting...' : 'Submit Review'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedbackApt(null)}
                      className="py-2.5 px-4 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* 1-on-1 Direct Chat Panel Modal */}
        {chatDoctor && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full h-[580px] shadow-2xl overflow-hidden flex flex-col border border-slate-200">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <img
                    src={chatDoctor.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200'}
                    alt={chatDoctor.name}
                    className="h-9 w-9 rounded-xl object-cover"
                  />
                  <div>
                    <strong className="text-xs font-bold text-slate-800 block">{chatDoctor.name}</strong>
                    <span className="text-[10px] text-teal-600 font-semibold">{chatDoctor.specialty}</span>
                  </div>
                </div>
                <button
                  onClick={() => setChatDoctor(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-hidden">
                <ChatPanel
                  currentUser={user}
                  recipientId={chatDoctor.id}
                  recipientName={chatDoctor.name}
                  recipientRole="doctor"
                  recipientAvatar={chatDoctor.avatar}
                  recipientSpecialty={chatDoctor.specialty}
                  consultationId={chatDoctor.consultationId}
                  showHeader={false}
                  className="h-full border-none rounded-none"
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
