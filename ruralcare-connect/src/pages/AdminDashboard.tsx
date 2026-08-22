import React, { useState, useEffect } from 'react';
import {
  Users,
  Landmark,
  Calendar,
  ShieldCheck,
  Heart,
  UserPlus,
  Building,
  BarChart2,
  Check,
  X,
  ShieldAlert,
  CloudUpload,
  Download,
  Database,
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { User, Doctor, Hospital, Appointment, Referral, FollowUpPriority } from '../types';
import { dbService } from '../services/dbService';
import { migrationService } from '../services/migrationService';
import { isMockMode } from '../services/firebase';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    verifiedDoctors: 0,
    totalHospitals: 0,
    totalAppointments: 0,
    completedConsultations: 0,
    pendingAppointments: 0,
    totalFollowUps: 0,
    highPriorityFollowUps: 0,
    activeReferrals: 0,
    completedReferrals: 0
  });

  const [pendingDoctors, setPendingDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Hospital Form states
  const [showAddHosp, setShowAddHosp] = useState(false);
  const [hospName, setHospName] = useState('');
  const [hospCity, setHospCity] = useState('');
  const [hospState, setHospState] = useState('Maharashtra');
  const [hospAddress, setHospAddress] = useState('');
  const [hospPhone, setHospPhone] = useState('');
  const [hospSpecialties, setHospSpecialties] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Cloud Database Migration states
  const [migrating, setMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState('');
  const [migrationError, setMigrationError] = useState('');
  const [migrationSuccess, setMigrationSuccess] = useState('');

  const handleTransferToFirebase = async () => {
    if (!window.confirm('Are you sure you want to upload all local records to Cloud Firestore?')) {
      return;
    }
    setMigrating(true);
    setMigrationError('');
    setMigrationSuccess('');
    setMigrationStatus('Connecting to Cloud Firestore...');

    try {
      const result = await migrationService.transferLocalDataToCloudFirebase(msg => {
        setMigrationStatus(msg);
      });
      setMigrationSuccess(`Successfully transferred ${result.totalUploaded} records to Cloud Firestore!`);
      setMigrationStatus('');
    } catch (err: any) {
      setMigrationError(err.message || 'Failed to upload to Cloud Firestore.');
      setMigrationStatus('');
    } finally {
      setMigrating(false);
    }
  };

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [platformStats, allDocs, allHosps, allApts, allRefs, allFUps] = await Promise.all([
        dbService.getPlatformStats(),
        dbService.getAllDoctorsForAdmin(),
        dbService.getHospitals(),
        dbService.getAppointments('', 'admin'),
        dbService.getReferrals(),
        dbService.getFollowUps('', 'admin')
      ]);

      setStats(platformStats);
      setPendingDoctors(allDocs.filter(d => d.verificationStatus === 'pending'));
      setHospitals(allHosps);
      setAppointments(allApts.slice(0, 10)); // recent 10
      setReferrals(allRefs.slice(0, 10));
      setFollowUps(allFUps.slice(0, 10));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleVerifyDoctor = async (doctorId: string, action: 'verified' | 'rejected') => {
    try {
      await dbService.verifyDoctor(doctorId, action);
      setPendingDoctors(prev => prev.filter(d => d.id !== doctorId));
      const platformStats = await dbService.getPlatformStats();
      setStats(platformStats);
      alert(`Doctor credentials updated to: ${action}`);
    } catch (err: any) {
      alert('Verification update failed: ' + err.message);
    }
  };

  const handleAddHospitalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospName || !hospCity || !hospPhone) {
      alert('Please fill in required hospital fields.');
      return;
    }

    setFormLoading(true);
    try {
      const newHosp = await dbService.addHospital({
        name: hospName,
        city: hospCity,
        district: hospCity,
        state: hospState,
        address: hospAddress,
        phone: hospPhone,
        specialties: hospSpecialties.split(',').map(s => s.trim()).filter(Boolean),
        teleconsultationAvailable: true
      });

      setHospitals(prev => [...prev, newHosp]);
      setShowAddHosp(false);

      setHospName('');
      setHospCity('');
      setHospAddress('');
      setHospPhone('');
      setHospSpecialties('');

      const platformStats = await dbService.getPlatformStats();
      setStats(platformStats);
      alert('Hospital registered successfully!');
    } catch (err: any) {
      alert('Failed to add hospital: ' + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Title */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-left shadow-sm">
          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs font-bold px-2.5 py-0.5 rounded-full mb-3 border border-purple-100">
            🛡️ Administrative Operations
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-none mb-2">
            Platform Operations & Operational Oversight
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Verify medical credentials, register partner health nodes, monitor high-priority follow-up loads, and track tertiary hospital referrals.
          </p>
        </div>

        {/* Primary Stats Grid Counters (8 Cards) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Patients</span>
              <Users className="h-5 w-5 text-teal-600" />
            </div>
            <strong className="text-2xl font-black text-slate-800">{stats.totalPatients}</strong>
            <span className="block text-[10px] text-slate-400 font-medium mt-0.5">Active registrations</span>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Doctors</span>
              <ShieldCheck className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <strong className="text-2xl font-black text-slate-800">{stats.totalDoctors}</strong>
              <span className="text-xs text-emerald-600 font-bold">({stats.verifiedDoctors} Verified)</span>
            </div>
            <span className="block text-[10px] text-slate-400 font-medium mt-0.5">Specialist roster</span>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Hospitals</span>
              <Building className="h-5 w-5 text-purple-600" />
            </div>
            <strong className="text-2xl font-black text-slate-800">{stats.totalHospitals}</strong>
            <span className="block text-[10px] text-slate-400 font-medium mt-0.5">Partner facilities</span>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Appointments</span>
              <Calendar className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <strong className="text-2xl font-black text-slate-800">{stats.totalAppointments}</strong>
              <span className="text-[10px] text-teal-600 font-bold">({stats.completedConsultations} Done)</span>
            </div>
            <span className="block text-[10px] text-slate-400 font-medium mt-0.5">Total booked</span>
          </div>

          {/* Follow-up & Referral operational stats */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Follow-ups</span>
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <strong className="text-2xl font-black text-slate-800">{stats.totalFollowUps}</strong>
            <span className="block text-[10px] text-slate-400 font-medium mt-0.5">Continuity cases</span>
          </div>

          <div className="bg-white border border-red-200 p-5 rounded-2xl shadow-sm bg-red-50/20">
            <div className="flex justify-between items-center mb-2">
              <span className="text-red-700 text-xs font-black uppercase tracking-wider">High-Priority Cases</span>
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <strong className="text-2xl font-black text-red-700">{stats.highPriorityFollowUps}</strong>
            <span className="block text-[10px] text-red-600 font-bold mt-0.5">Requires prompt check</span>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Referrals</span>
              <Landmark className="h-5 w-5 text-blue-600" />
            </div>
            <strong className="text-2xl font-black text-slate-800">{stats.activeReferrals}</strong>
            <span className="block text-[10px] text-slate-400 font-medium mt-0.5">In-transit to hospitals</span>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Completed Referrals</span>
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <strong className="text-2xl font-black text-slate-800">{stats.completedReferrals}</strong>
            <span className="block text-[10px] text-slate-400 font-medium mt-0.5">Hospital visits completed</span>
          </div>

        </div>

        {/* Database Management & Cloud Sync Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-left shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-800 text-base">Database Operations & Cloud Firestore Sync</h3>
                  <span
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${
                      isMockMode
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {isMockMode ? 'Local Storage Sync' : 'Live Firebase Connected'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  1-Click push all local assessments, appointments, referrals, and users to Google Cloud Firestore or export JSON.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => migrationService.exportLocalDataAsJSON()}
                className="py-2 px-3.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="h-4 w-4 text-slate-500" />
                <span>Export JSON Backup</span>
              </button>

              <button
                type="button"
                onClick={handleTransferToFirebase}
                disabled={migrating}
                className="py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <CloudUpload className="h-4 w-4" />
                <span>{migrating ? 'Transferring...' : 'Transfer to Cloud Firestore'}</span>
              </button>
            </div>
          </div>

          {migrationStatus && <p className="text-xs text-teal-600 font-bold">{migrationStatus}</p>}
          {migrationSuccess && <p className="text-xs text-emerald-600 font-bold">{migrationSuccess}</p>}
          {migrationError && <p className="text-xs text-red-600 font-bold">{migrationError}</p>}
        </div>

        {/* Operational Tables: Referrals & Follow-ups */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
          
          {/* Recent Referrals Table */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Landmark className="h-4 w-4 text-blue-600" />
                Recent Hospital Referrals ({referrals.length})
              </h3>
            </div>

            {referrals.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No hospital referrals recorded.</p>
            ) : (
              <div className="overflow-x-auto text-xs">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead>
                    <tr className="text-slate-400 uppercase text-[10px] font-bold">
                      <th className="py-2">Hospital</th>
                      <th className="py-2">Specialty</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {referrals.map(r => (
                      <tr key={r.id}>
                        <td className="py-2.5 font-bold text-slate-800 truncate max-w-[140px]">
                          {r.hospitalName || r.hospitalId}
                        </td>
                        <td className="py-2.5">{r.specialty}</td>
                        <td className="py-2.5">
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {r.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-400 text-[11px]">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Upcoming Follow-ups Table */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-600" />
                Scheduled Follow-up Care ({followUps.length})
              </h3>
            </div>

            {followUps.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No scheduled follow-up records.</p>
            ) : (
              <div className="overflow-x-auto text-xs">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead>
                    <tr className="text-slate-400 uppercase text-[10px] font-bold">
                      <th className="py-2">Doctor</th>
                      <th className="py-2">Follow-up Date</th>
                      <th className="py-2">Priority</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {followUps.map(fu => {
                      const isHigh = fu.followUpPriority === 'high';
                      return (
                        <tr key={fu.id}>
                          <td className="py-2.5 font-bold text-slate-800">{fu.doctorName}</td>
                          <td className="py-2.5 text-slate-600">{fu.followUpDate}</td>
                          <td className="py-2.5">
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                isHigh ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {fu.followUpPriority}
                            </span>
                          </td>
                          <td className="py-2.5 uppercase text-[10px] font-bold text-slate-500">{fu.status}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Doctor Verification & Hospital Management Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
          
          {/* Pending Doctor Verifications */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              Pending Doctor Credentials Review ({pendingDoctors.length})
            </h3>

            {pendingDoctors.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">All doctor accounts verified.</p>
            ) : (
              <div className="space-y-3">
                {pendingDoctors.map(doc => (
                  <div key={doc.id} className="p-3.5 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <strong className="font-extrabold text-slate-800 block">{doc.name}</strong>
                      <span className="text-[11px] text-teal-600 font-bold">{doc.specialty} ({doc.qualifications})</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVerifyDoctor(doc.id, 'verified')}
                        className="py-1 px-3 bg-teal-600 text-white font-bold rounded-lg text-xs"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => handleVerifyDoctor(doc.id, 'rejected')}
                        className="py-1 px-3 bg-red-50 text-red-700 font-bold rounded-lg text-xs"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Partner Hospitals */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Landmark className="h-4 w-4 text-teal-600" />
                Partner Hospitals ({hospitals.length})
              </h3>
              <button
                onClick={() => setShowAddHosp(!showAddHosp)}
                className="text-xs font-bold text-teal-600 hover:text-teal-700 cursor-pointer"
              >
                {showAddHosp ? 'Hide' : '+ Add Node'}
              </button>
            </div>

            {showAddHosp && (
              <form onSubmit={handleAddHospitalSubmit} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hospital Name</label>
                  <input
                    type="text"
                    required
                    value={hospName}
                    onChange={e => setHospName(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={hospCity}
                      onChange={e => setHospCity(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={hospState}
                      onChange={e => setHospState(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full py-2 bg-teal-600 text-white font-bold rounded-xl"
                >
                  Register Node
                </button>
              </form>
            )}

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {hospitals.map(h => (
                <div key={h.id} className="p-3 border border-slate-100 rounded-xl text-xs flex justify-between items-center">
                  <div>
                    <strong className="block text-slate-800 font-bold">{h.name}</strong>
                    <span className="text-[10px] text-slate-400">{h.city}, {h.state}</span>
                  </div>
                  <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                    {h.specialties.length} Specialties
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
