import React, { useState, useEffect } from 'react';
import {
  Check,
  X,
  ShieldAlert,
  Edit,
  Landmark,
  FileText,
  MessageSquare,
  Video,
  Phone,
  Clock,
  AlertTriangle,
  UserCheck,
  Send,
  Calendar,
  ExternalLink,
  PlusCircle,
  Activity,
  Filter
} from 'lucide-react';
import {
  User,
  Doctor,
  Appointment,
  Hospital,
  MedicalReport,
  Referral,
  CallHistoryItem,
  DoctorAvailabilityStatus,
  FollowUpPriority
} from '../types';
import { dbService } from '../services/dbService';
import { callService } from '../services/callService';
import { ChatPanel } from '../components/ChatPanel';
import { useLanguage } from '../services/i18n';

interface DoctorDashboardProps {
  user: User;
  setCurrentPage: (page: string, params?: any) => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ user, setCurrentPage }) => {
  const { t } = useLanguage();

  const [profile, setProfile] = useState<Doctor | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [callHistory, setCallHistory] = useState<CallHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState<'consultations' | 'pending' | 'followups' | 'referrals' | 'profile'>('consultations');
  const [priorityFilter, setPriorityFilter] = useState<'all' | FollowUpPriority>('all');

  // Edit profile states
  const [isEditing, setIsEditing] = useState(false);
  const [qualifications, setQualifications] = useState('');
  const [experience, setExperience] = useState(5);
  const [fee, setFee] = useState(200);
  const [selectedHosp, setSelectedHosp] = useState('');
  const [specializations, setSpecializations] = useState('');
  const [teleAvailable, setTeleAvailable] = useState(true);
  const [availabilityStatus, setAvailabilityStatus] = useState<DoctorAvailabilityStatus>('available');
  const [saveLoading, setSaveLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Patient Reports viewer state
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string } | null>(null);
  const [patientReports, setPatientReports] = useState<MedicalReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Quick Schedule Follow-up Modal
  const [followUpModalApt, setFollowUpModalApt] = useState<Appointment | null>(null);
  const [fuDate, setFuDate] = useState('');
  const [fuPriority, setFuPriority] = useState<FollowUpPriority>('high');
  const [fuNote, setFuNote] = useState('');
  const [fuSaving, setFuSaving] = useState(false);

  // Quick Create Referral Modal
  const [referralModalApt, setReferralModalApt] = useState<Appointment | null>(null);
  const [refHospitalId, setRefHospitalId] = useState('');
  const [refSpecialty, setRefSpecialty] = useState('');
  const [refReason, setRefReason] = useState('');
  const [refSaving, setRefSaving] = useState(false);

  // Chat with Patient Modal state
  const [chatPatient, setChatPatient] = useState<{
    id: string;
    name: string;
    consultationId?: string;
  } | null>(null);

  const loadDoctorData = async () => {
    try {
      setLoading(true);
      const [hList, aptList, fUps, refs, callHist] = await Promise.all([
        dbService.getHospitals(),
        dbService.getAppointments(user.id, 'doctor'),
        dbService.getFollowUps(user.id, 'doctor'),
        dbService.getDoctorReferrals(user.id),
        callService.getCallHistory(user.id, 'doctor')
      ]);
      setHospitals(hList);
      setAppointments(aptList);
      setFollowUps(fUps);
      setReferrals(refs);
      setCallHistory(callHist);

      if (hList.length > 0 && !refHospitalId) {
        setRefHospitalId(hList[0].id);
      }

      const docProfile = await dbService.getDoctorProfile(user.id);
      if (docProfile) {
        setProfile(docProfile);
        setQualifications(docProfile.qualifications);
        setExperience(docProfile.experience);
        setFee(docProfile.consultationFee);
        setSelectedHosp(docProfile.hospitalId);
        setSpecializations(docProfile.areasOfSpecialization.join(', '));
        setTeleAvailable(docProfile.teleconsultationAvailable);
        setAvailabilityStatus(docProfile.availabilityStatus || 'available');
        setRefSpecialty(docProfile.specialty);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctorData();
    const handleUpdate = () => loadDoctorData();
    window.addEventListener('rc_mock_db_update', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    const interval = setInterval(loadDoctorData, 2500);
    return () => {
      window.removeEventListener('rc_mock_db_update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, [user]);

  const handleAvailabilityChange = async (newStatus: DoctorAvailabilityStatus) => {
    setStatusUpdating(true);
    try {
      await dbService.updateDoctorProfile(user.id, { availabilityStatus: newStatus });
      setAvailabilityStatus(newStatus);
      setProfile(prev => (prev ? { ...prev, availabilityStatus: newStatus } : null));
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaveLoading(true);
    try {
      const updates = {
        qualifications,
        experience,
        consultationFee: fee,
        hospitalId: selectedHosp,
        areasOfSpecialization: specializations.split(',').map(s => s.trim()).filter(Boolean),
        teleconsultationAvailable: teleAvailable
      };
      await dbService.updateDoctorProfile(user.id, updates);
      setProfile({ ...profile, ...updates });
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (err: any) {
      alert('Error updating profile: ' + err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleStatusUpdate = async (aptId: string, status: 'confirmed' | 'cancelled') => {
    try {
      await dbService.updateAppointmentStatus(aptId, status);
      const updated = await dbService.getAppointments(user.id, 'doctor');
      setAppointments(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenPatientReports = async (patientId: string, patientName: string) => {
    setSelectedPatient({ id: patientId, name: patientName });
    setReportsLoading(true);
    try {
      const reps = await dbService.getMedicalReports(patientId);
      setPatientReports(reps);
    } catch (err) {
      console.error(err);
    } finally {
      setReportsLoading(false);
    }
  };

  const handleSaveFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpModalApt || !fuDate) return;

    setFuSaving(true);
    try {
      await dbService.completeConsultation(followUpModalApt.id, {
        patientId: followUpModalApt.patientId,
        doctorId: user.id,
        notes: 'Follow-up consultation scheduled from doctor dashboard.',
        recommendations: fuNote || 'Follow-up clinical consultation.',
        followUpRequired: true,
        followUpDate: fuDate,
        followUpPriority: fuPriority,
        followUpNote: fuNote
      });

      alert(`Follow-up scheduled successfully for ${fuDate} (${fuPriority.toUpperCase()} PRIORITY).`);
      setFollowUpModalApt(null);
      setFuDate('');
      setFuNote('');
      loadDoctorData();
    } catch (err: any) {
      alert('Error scheduling follow-up: ' + err.message);
    } finally {
      setFuSaving(false);
    }
  };

  const handleSaveReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralModalApt || !refReason) return;

    setRefSaving(true);
    try {
      const targetHosp = hospitals.find(h => h.id === refHospitalId);
      await dbService.createReferral({
        patientId: referralModalApt.patientId,
        doctorId: user.id,
        appointmentId: referralModalApt.id,
        hospitalId: refHospitalId || (hospitals[0]?.id || 'hosp-1'),
        hospitalName: targetHosp?.name || 'Associated Tertiary Hospital',
        specialty: refSpecialty || profile?.specialty || 'Specialist Care',
        reason: refReason
      });

      alert('Referral created successfully! Patient has been notified.');
      setReferralModalApt(null);
      setRefReason('');
      loadDoctorData();
    } catch (err: any) {
      alert('Error creating referral: ' + err.message);
    } finally {
      setRefSaving(false);
    }
  };

  const todayConsultations = appointments.filter(a => a.status === 'confirmed');
  const pendingAppointments = appointments.filter(a => a.status === 'requested');
  const filteredFollowUps = priorityFilter === 'all'
    ? followUps
    : followUps.filter(f => (f.followUpPriority || 'normal') === priorityFilter);

  return (
    <div className="bg-slate-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Doctor Header & Verification Banner */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-left shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={profile?.profileImage || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200'}
              alt={user.name}
              className="h-16 w-16 rounded-2xl object-cover border border-slate-200 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">{user.name}</h1>
                {profile?.verificationStatus === 'verified' ? (
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase">
                    Verified Specialist
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-50 text-amber-700 font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200 uppercase">
                    Verification Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {profile?.specialty} &bull; {profile?.qualifications} &bull; {profile?.experience} Years Exp.
              </p>
            </div>
          </div>

          {/* Real-Time Availability Switcher */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-600 ml-2">Status:</span>
            {(['available', 'busy', 'offline'] as DoctorAvailabilityStatus[]).map(status => (
              <button
                key={status}
                onClick={() => handleAvailabilityChange(status)}
                disabled={statusUpdating}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                  availabilityStatus === status
                    ? status === 'available'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : status === 'busy'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-white/60'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Doctor Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 text-left">
          <button
            onClick={() => setActiveTab('consultations')}
            className={`py-2.5 px-5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'consultations'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-100'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Video className="h-4 w-4" />
            <span>Today's Consultations ({todayConsultations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2.5 px-5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-100'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Pending Requests ({pendingAppointments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('followups')}
            className={`py-2.5 px-5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'followups'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-100'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Follow-up Patients ({followUps.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('referrals')}
            className={`py-2.5 px-5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'referrals'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-100'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Landmark className="h-4 w-4" />
            <span>Referral Requests ({referrals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2.5 px-5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-100'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Edit className="h-4 w-4" />
            <span>Profile Settings</span>
          </button>
        </div>

        {/* TAB 1: TODAY'S CONSULTATIONS */}
        {activeTab === 'consultations' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-left shadow-sm space-y-6">
            <h3 className="font-extrabold text-slate-800 text-base">Confirmed Consultations</h3>

            {todayConsultations.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 text-xs text-slate-400 font-medium">
                No confirmed consultations for today.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todayConsultations.map(apt => (
                  <div key={apt.id} className="p-5 border border-slate-200 rounded-2xl bg-white hover:border-slate-300 transition-all space-y-4 shadow-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <strong className="text-xs font-black text-slate-800 block">Patient #{apt.patientId.slice(0, 8)}</strong>
                        <span className="text-[11px] text-slate-400 font-medium">{apt.date} @ {apt.time} ({apt.consultationType} Call)</span>
                      </div>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Confirmed
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage('consultation-room', {
                            appointmentId: apt.id,
                            initialCallType: apt.consultationType
                          })
                        }
                        className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Video className="h-3.5 w-3.5" />
                        <span>Start Consultation</span>
                      </button>

                      <button
                        onClick={() => handleOpenPatientReports(apt.patientId, `Patient #${apt.patientId.slice(0, 8)}`)}
                        className="py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1"
                        title="View Medical Reports"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Reports</span>
                      </button>

                      <button
                        onClick={() => setFollowUpModalApt(apt)}
                        className="py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold rounded-xl"
                        title="Schedule Follow-up"
                      >
                        Follow-up
                      </button>

                      <button
                        onClick={() => setReferralModalApt(apt)}
                        className="py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-xl"
                        title="Create Hospital Referral"
                      >
                        Refer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PENDING APPOINTMENTS */}
        {activeTab === 'pending' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-left shadow-sm space-y-6">
            <h3 className="font-extrabold text-slate-800 text-base">Pending Appointment Requests</h3>

            {pendingAppointments.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 text-xs text-slate-400 font-medium">
                No pending appointment requests.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingAppointments.map(apt => (
                  <div key={apt.id} className="p-5 border border-slate-200 rounded-2xl bg-white space-y-4 shadow-xs">
                    <div>
                      <strong className="text-xs font-black text-slate-800 block">Patient #{apt.patientId.slice(0, 8)}</strong>
                      <span className="text-[11px] text-slate-400 font-medium">Requested: {apt.date} at {apt.time} ({apt.consultationType})</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusUpdate(apt.id, 'confirmed')}
                        className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Accept Slot</span>
                      </button>

                      <button
                        onClick={() => handleStatusUpdate(apt.id, 'cancelled')}
                        className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FOLLOW-UP PATIENTS WITH PRIORITY FILTER */}
        {activeTab === 'followups' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-left shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Follow-up Continuity Care</h3>
                <span className="text-[11px] text-slate-400 font-medium">Patients assigned scheduled clinical re-evaluations</span>
              </div>

              {/* Priority Filter Bar */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 ml-2">Priority:</span>
                {(['all', 'normal', 'priority', 'high'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPriorityFilter(p)}
                    className={`py-1 px-3 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                      priorityFilter === p
                        ? p === 'high'
                          ? 'bg-red-600 text-white'
                          : p === 'priority'
                          ? 'bg-amber-500 text-white'
                          : 'bg-teal-600 text-white'
                        : 'text-slate-600 hover:bg-white/60'
                    }`}
                  >
                    {p === 'high' ? 'High Priority' : p}
                  </button>
                ))}
              </div>
            </div>

            {filteredFollowUps.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 text-xs text-slate-400 font-medium">
                No follow-up records found matching this filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFollowUps.map(fu => {
                  const isHigh = fu.followUpPriority === 'high';
                  return (
                    <div
                      key={fu.id}
                      className={`p-5 rounded-2xl border space-y-4 ${
                        isHigh ? 'bg-red-50/40 border-red-200' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <strong className="text-xs font-black text-slate-800 block">{fu.patientName}</strong>
                          <span className="text-[11px] text-slate-400">Appointment #{fu.appointmentId}</span>
                        </div>
                        <span
                          className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${
                            isHigh ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {fu.followUpPriority.toUpperCase()} PRIORITY
                        </span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">Scheduled Follow-up:</span>
                          <strong className="text-slate-800">{fu.followUpDate}</strong>
                        </div>
                        <p className="text-slate-600 italic mt-1">{fu.followUpNote}</p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenPatientReports(fu.patientId, fu.patientName)}
                          className="py-1.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          <span>View Reports</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REFERRAL REQUESTS */}
        {activeTab === 'referrals' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-left shadow-sm space-y-6">
            <h3 className="font-extrabold text-slate-800 text-base">Created Hospital Referrals</h3>

            {referrals.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 text-xs text-slate-400 font-medium">
                No hospital referrals created yet.
              </div>
            ) : (
              <div className="space-y-4">
                {referrals.map(ref => (
                  <div key={ref.id} className="p-5 border border-slate-200 rounded-2xl bg-white space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div>
                        <strong className="text-xs font-black text-slate-800 block">{ref.hospitalName || 'Associated Hospital'}</strong>
                        <span className="text-[11px] text-slate-400">Patient: {ref.patientName || ref.patientId} &bull; Specialty: {ref.specialty}</span>
                      </div>
                      <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 self-start sm:self-auto">
                        Status: {ref.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 italic">Reason: {ref.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PROFILE SETTINGS */}
        {activeTab === 'profile' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-left shadow-sm space-y-6 max-w-2xl">
            <h3 className="font-extrabold text-slate-800 text-base">Clinical Practice Profile</h3>
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Medical Qualifications</label>
                <input
                  type="text"
                  value={qualifications}
                  onChange={e => setQualifications(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Years of Experience</label>
                  <input
                    type="number"
                    value={experience}
                    onChange={e => setExperience(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    value={fee}
                    onChange={e => setFee(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Primary Associated Hospital</label>
                <select
                  value={selectedHosp}
                  onChange={e => setSelectedHosp(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                >
                  {hospitals.map(h => (
                    <option key={h.id} value={h.id}>{h.name} - {h.city}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Areas of Specialization (Comma Separated)</label>
                <input
                  type="text"
                  value={specializations}
                  onChange={e => setSpecializations(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={saveLoading}
                className="py-3 px-6 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl"
              >
                {saveLoading ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        )}

        {/* MODAL: Quick Schedule Follow-up */}
        {followUpModalApt && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 text-left shadow-2xl space-y-4 border border-slate-200">
              <h3 className="font-extrabold text-slate-800 text-base">Schedule Follow-up Consultation</h3>
              <p className="text-xs text-slate-400">Assign a mandatory continuity-of-care follow-up date and priority for Patient #{followUpModalApt.patientId.slice(0, 8)}.</p>

              <form onSubmit={handleSaveFollowUp} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Follow-up Priority</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['normal', 'priority', 'high'] as FollowUpPriority[]).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFuPriority(p)}
                        className={`py-2 rounded-xl font-bold uppercase text-[10px] border cursor-pointer ${
                          fuPriority === p
                            ? p === 'high'
                              ? 'bg-red-600 text-white border-red-600'
                              : p === 'priority'
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-teal-600 text-white border-teal-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Follow-up Date</label>
                  <input
                    type="date"
                    required
                    value={fuDate}
                    onChange={e => setFuDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Clinical Note / Reason for Follow-up</label>
                  <textarea
                    rows={3}
                    required
                    value={fuNote}
                    onChange={e => setFuNote(e.target.value)}
                    placeholder="e.g. Review updated biopsy scan and blood counts after 2 weeks..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={fuSaving}
                    className="flex-1 py-2.5 bg-teal-600 text-white font-bold rounded-xl cursor-pointer"
                  >
                    {fuSaving ? 'Scheduling...' : 'Schedule Follow-up'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFollowUpModalApt(null)}
                    className="py-2.5 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Quick Create Referral */}
        {referralModalApt && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 text-left shadow-2xl space-y-4 border border-slate-200">
              <h3 className="font-extrabold text-slate-800 text-base">Recommend Hospital Referral</h3>
              <p className="text-xs text-slate-400">Generate a formal tertiary hospital referral letter for physical consultation.</p>

              <form onSubmit={handleSaveReferral} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Recommended Hospital</label>
                  <select
                    value={refHospitalId}
                    onChange={e => setRefHospitalId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                  >
                    {hospitals.map(h => (
                      <option key={h.id} value={h.id}>{h.name} ({h.city})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Specialty</label>
                  <input
                    type="text"
                    value={refSpecialty}
                    onChange={e => setRefSpecialty(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reason for Referral</label>
                  <textarea
                    rows={3}
                    required
                    value={refReason}
                    onChange={e => setRefReason(e.target.value)}
                    placeholder="e.g. In-person biopsy, MRI scan, and surgical evaluation required..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={refSaving}
                    className="flex-1 py-2.5 bg-teal-600 text-white font-bold rounded-xl cursor-pointer"
                  >
                    {refSaving ? 'Creating...' : 'Create Referral'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReferralModalApt(null)}
                    className="py-2.5 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Patient Reports Viewer */}
        {selectedPatient && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 text-left shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Diagnostic Reports & History</h3>
                  <span className="text-xs text-slate-400 font-medium">{selectedPatient.name}</span>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>

              {reportsLoading ? (
                <p className="text-xs text-slate-400 py-6 text-center">Loading patient diagnostic records...</p>
              ) : patientReports.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No reports uploaded by this patient yet.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {patientReports.map(rep => (
                    <div key={rep.id} className="p-3 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                      <div className="truncate pr-2">
                        <strong className="block text-slate-800 truncate">{rep.fileName}</strong>
                        <span className="text-[10px] text-slate-400">{new Date(rep.uploadedAt).toLocaleDateString()}</span>
                      </div>
                      <a
                        href={rep.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1 px-3 bg-teal-50 text-teal-700 font-bold rounded-lg text-xs flex items-center gap-1"
                      >
                        <span>Open</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setSelectedPatient(null)}
                className="w-full py-2.5 bg-slate-800 text-white text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
