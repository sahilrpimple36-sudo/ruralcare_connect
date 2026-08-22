import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Activity,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Upload,
  RotateCcw,
  Sparkles,
  Search,
  FileCheck,
  HelpCircle,
  Clock,
  UserCheck,
  Building,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { dbService } from '../services/dbService';
import { storageService } from '../services/storageService';
import { useLanguage } from '../services/i18n';
import { User, Doctor, Hospital } from '../types';

interface HealthAssessmentProps {
  user: User | null;
  setCurrentPage: (page: string, params?: any) => void;
}

interface ConcernOption {
  label: string;
  specialty: string;
  iconText: string;
  description: string;
}

const CONCERN_OPTIONS: ConcernOption[] = [
  { label: 'Chest / Heart', specialty: 'Cardiology', iconText: '❤️', description: 'Chest discomfort, heart palpitations, blood pressure concerns' },
  { label: 'Skin', specialty: 'Dermatology', iconText: '🧴', description: 'Rashes, skin infections, itching, eczema, allergies' },
  { label: 'Bone / Joint', specialty: 'Orthopedics', iconText: '🦴', description: 'Joint pain, fractures, arthritis, back or spine discomfort' },
  { label: 'Head / Nervous System', specialty: 'Neurology', iconText: '🧠', description: 'Headaches, migraines, dizziness, numbness, tremors' },
  { label: 'Child Health', specialty: 'Pediatrics', iconText: '👶', description: 'Infant care, childhood fever, growth, vaccinations' },
  { label: 'Women\'s Health', specialty: 'Gynecology', iconText: '🌸', description: 'Pregnancy, menstrual concerns, hormonal balance, maternal care' },
  { label: 'Ear / Nose / Throat', specialty: 'ENT', iconText: '👂', description: 'Sinusitis, ear infections, throat pain, hearing or nasal issues' },
  { label: 'Cancer-related concern', specialty: 'Oncology', iconText: '🎗️', description: 'Unexplained lumps, abnormal biopsies, tumor follow-ups' },
  { label: 'Mental Health', specialty: 'Psychiatry', iconText: '🌱', description: 'Anxiety, stress, mood changes, sleep difficulties' },
  { label: 'General Health', specialty: 'General Medicine', iconText: '🩺', description: 'General fever, weakness, digestive issues, chronic wellness' },
  { label: 'Other', specialty: 'General Medicine', iconText: '📋', description: 'Other symptoms or overall health consultation' }
];

const DURATION_OPTIONS = [
  'Less than 1 day',
  '1–7 days',
  '1–4 weeks',
  'More than 1 month',
  'Long-term / recurring'
];

export const HealthAssessment: React.FC<HealthAssessmentProps> = ({ user, setCurrentPage }) => {
  const { t } = useLanguage();

  const [selectedConcern, setSelectedConcern] = useState<ConcernOption | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string>('');
  const [previousConsultation, setPreviousConsultation] = useState<boolean | null>(null);
  const [hasReport, setHasReport] = useState<boolean | null>(null);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [reportUrl, setReportUrl] = useState<string>('');

  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  // Doctors & Hospitals data
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [matchedDoctors, setMatchedDoctors] = useState<Doctor[]>([]);

  // Direct Booking Modal state
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingType, setBookingType] = useState<'video' | 'audio'>('video');
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const loadDoctorsAndHospitals = async () => {
      try {
        const [docs, hosps] = await Promise.all([
          dbService.getDoctors(),
          dbService.getHospitals()
        ]);
        setAllDoctors(docs);
        setHospitals(hosps);
      } catch (err) {
        console.error('Failed loading doctors:', err);
      }
    };
    loadDoctorsAndHospitals();
  }, []);

  const isFormComplete =
    selectedConcern !== null &&
    selectedDuration !== '' &&
    previousConsultation !== null &&
    hasReport !== null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReportFile(file);
      if (user) {
        setUploadingReport(true);
        try {
          const url = await storageService.uploadReport(user.id, file);
          setReportUrl(url);
        } catch (err) {
          console.warn('File upload simulation handled:', err);
        } finally {
          setUploadingReport(false);
        }
      }
    }
  };

  const handleSubmitAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormComplete || !selectedConcern) return;

    setSaving(true);
    try {
      if (user) {
        await dbService.saveHealthAssessment({
          patientId: user.id,
          mainConcern: selectedConcern.label,
          duration: selectedDuration,
          previousConsultation: !!previousConsultation,
          hasMedicalReport: !!hasReport,
          medicalReportUrl: reportUrl || undefined,
          suggestedSpecialty: selectedConcern.specialty
        });
      }

      // Filter matched doctors for this specialty
      const matched = allDoctors.filter(
        d => d.specialty.trim().toLowerCase() === selectedConcern.specialty.trim().toLowerCase()
      );
      setMatchedDoctors(matched.length > 0 ? matched : allDoctors.slice(0, 3));
    } catch (err) {
      console.warn('Assessment save handled:', err);
    } finally {
      setSaving(false);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleReset = () => {
    setSelectedConcern(null);
    setSelectedDuration('');
    setPreviousConsultation(null);
    setHasReport(null);
    setReportFile(null);
    setReportUrl('');
    setSubmitted(false);
    setMatchedDoctors([]);
  };

  const handleNavigateToSpecialists = () => {
    if (selectedConcern) {
      setCurrentPage('specialist-search', { specialty: selectedConcern.specialty });
    } else {
      setCurrentPage('specialist-search');
    }
  };

  const getHospitalName = (hospId: string) => {
    const h = hospitals.find(h => h.id === hospId);
    return h ? h.name : 'Associated Medical Hospital';
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in as a Patient to book a consultation.');
      setCurrentPage('auth');
      return;
    }

    if (user.role !== 'patient') {
      alert('Only registered Patients can book consultations.');
      return;
    }

    if (!bookingDoctor) return;
    if (!bookingDate || !bookingTime) {
      setBookingError('Please select both a date and time slot.');
      return;
    }

    setBookingError('');
    setBookingSuccess('');
    setBookingLoading(true);

    try {
      await dbService.bookAppointment({
        patientId: user.id,
        doctorId: bookingDoctor.id,
        hospitalId: bookingDoctor.hospitalId,
        specialty: bookingDoctor.specialty,
        date: bookingDate,
        time: bookingTime,
        consultationType: bookingType
      });

      setBookingSuccess('Appointment requested successfully! Redirecting to dashboard...');
      setTimeout(() => {
        setBookingDoctor(null);
        setBookingSuccess('');
        setCurrentPage('patient-dashboard');
      }, 1500);
    } catch (err: any) {
      setBookingError(err.message || 'Failed to book appointment.');
    } finally {
      setBookingLoading(false);
    }
  };

  const openBookingModalForDoctor = (doc: Doctor, slot?: string) => {
    setBookingDoctor(doc);
    if (slot) setBookingTime(slot);
    setBookingDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header Title */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-left shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 text-xs font-bold px-3 py-1 rounded-full border border-teal-100">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t.triageBadge}</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-tight">
            {t.triageTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {t.triageSubtitle}
          </p>
        </div>

        {/* Assessment Card Form or Result */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          {!submitted ? (
            <form onSubmit={handleSubmitAssessment} className="space-y-8 text-left">
              
              {/* Question 1: Main Concern */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-teal-600 text-white text-xs font-black flex items-center justify-center">
                    1
                  </span>
                  <label className="text-sm font-extrabold text-slate-800">
                    {t.questionConcern}
                  </label>
                </div>
                <p className="text-xs text-slate-500 ml-8">
                  {t.questionConcernSub}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ml-0 sm:ml-8 pt-1">
                  {CONCERN_OPTIONS.map(opt => {
                    const isSelected = selectedConcern?.label === opt.label;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setSelectedConcern(opt)}
                        className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 cursor-pointer ${
                          isSelected
                            ? 'bg-teal-50 border-teal-600 shadow-md shadow-teal-100 ring-2 ring-teal-500'
                            : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50/80 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{opt.iconText}</span>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-teal-600" />}
                        </div>
                        <div>
                          <strong className="text-xs font-extrabold text-slate-800 block">{opt.label}</strong>
                          <span className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{opt.description}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question 2: Duration */}
              <div className="space-y-3 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-teal-600 text-white text-xs font-black flex items-center justify-center">
                    2
                  </span>
                  <label className="text-sm font-extrabold text-slate-800">
                    {t.questionDuration}
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 ml-0 sm:ml-8 pt-1">
                  {DURATION_OPTIONS.map(dur => {
                    const isSelected = selectedDuration === dur;
                    return (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setSelectedDuration(dur)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50 bg-white'
                        }`}
                      >
                        {dur}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question 3: Previous Consultation */}
              <div className="space-y-3 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-teal-600 text-white text-xs font-black flex items-center justify-center">
                    3
                  </span>
                  <label className="text-sm font-extrabold text-slate-800">
                    {t.questionPreviousConsult}
                  </label>
                </div>

                <div className="flex items-center gap-3 ml-0 sm:ml-8 pt-1">
                  <button
                    type="button"
                    onClick={() => setPreviousConsultation(true)}
                    className={`py-2.5 px-6 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      previousConsultation === true
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50 bg-white'
                    }`}
                  >
                    {t.yes}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviousConsultation(false)}
                    className={`py-2.5 px-6 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      previousConsultation === false
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50 bg-white'
                    }`}
                  >
                    {t.no}
                  </button>
                </div>
              </div>

              {/* Question 4: Medical Report */}
              <div className="space-y-3 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-teal-600 text-white text-xs font-black flex items-center justify-center">
                    4
                  </span>
                  <label className="text-sm font-extrabold text-slate-800">
                    {t.questionReport}
                  </label>
                </div>

                <div className="flex items-center gap-3 ml-0 sm:ml-8 pt-1">
                  <button
                    type="button"
                    onClick={() => setHasReport(true)}
                    className={`py-2.5 px-6 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      hasReport === true
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50 bg-white'
                    }`}
                  >
                    {t.yes}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHasReport(false);
                      setReportFile(null);
                    }}
                    className={`py-2.5 px-6 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      hasReport === false
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50 bg-white'
                    }`}
                  >
                    {t.no}
                  </button>
                </div>

                {hasReport && (
                  <div className="ml-0 sm:ml-8 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <label className="block font-bold text-slate-700">
                      {t.reportUploadOptional}
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileUpload}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-600 file:text-white hover:file:bg-teal-700 cursor-pointer"
                    />
                    <p className="text-[11px] text-slate-400">
                      {t.reportUploadNotice}
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="submit"
                  disabled={!isFormComplete || saving}
                  className="w-full sm:w-auto py-3.5 px-8 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-teal-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{saving ? 'Processing...' : t.getRecommendation}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                
                <span className="text-[11px] text-slate-400 font-medium text-center sm:text-right">
                  {t.ruleBasedNotice}
                </span>
              </div>
            </form>
          ) : (
            /* Result Screen */
            <div className="space-y-8 animate-fadeIn text-left">
              
              {/* Recommendation Card */}
              <div className="bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-white border-2 border-teal-500/30 rounded-3xl p-6 sm:p-8 space-y-6 text-left">
                <div className="flex items-center gap-2 text-teal-700 font-bold text-xs uppercase tracking-wider">
                  <Stethoscope className="h-4 w-4" />
                  <span>{t.suggestedSpecialty}</span>
                </div>

                <div>
                  <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                    {selectedConcern?.specialty}
                  </h2>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    {t.triageResultExplanation} (<strong>{selectedConcern?.label}</strong> &rarr; <strong>{selectedConcern?.specialty}</strong>)
                  </p>
                </div>

                {/* Summary Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-white/90 border border-slate-200/80 p-3.5 rounded-2xl text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.symptomDuration}</span>
                    <strong className="text-slate-800 text-xs mt-0.5 block">{selectedDuration}</strong>
                  </div>

                  <div className="bg-white/90 border border-slate-200/80 p-3.5 rounded-2xl text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.priorConsultation}</span>
                    <strong className="text-slate-800 text-xs mt-0.5 block">
                      {previousConsultation ? t.yes : t.no}
                    </strong>
                  </div>

                  <div className="bg-white/90 border border-slate-200/80 p-3.5 rounded-2xl text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.attachedReport}</span>
                    <strong className="text-slate-800 text-xs mt-0.5 block">
                      {hasReport ? (reportFile ? `${reportFile.name.slice(0, 15)}...` : t.yes) : t.no}
                    </strong>
                  </div>
                </div>

                {/* Mandatory Disclaimer Box */}
                <div className="bg-white/90 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    <span>{t.disclaimerTitle}:</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {t.assessmentDisclaimer}
                  </p>
                </div>
              </div>

              {/* Verified Doctors & Available Booking Slots Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                      <Stethoscope className="h-5 w-5 text-teal-600" />
                      <span>Available {selectedConcern?.specialty} Specialists & Booking Slots</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Select a doctor below and pick an open time slot to book your teleconsultation.
                    </p>
                  </div>
                </div>

                {matchedDoctors.length === 0 ? (
                  <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-2">
                    <p className="text-xs text-slate-500 font-bold">No specialist found matching this criteria.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {matchedDoctors.map(doc => (
                      <div
                        key={doc.id}
                        className="p-5 border border-slate-200 rounded-3xl bg-white hover:border-teal-500 hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start gap-3.5">
                            <img
                              src={doc.profileImage}
                              alt={doc.name}
                              className="h-16 w-16 rounded-2xl object-cover border border-slate-100 shadow-xs flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-black text-slate-800 text-sm truncate">{doc.name}</h4>
                                <CheckCircle className="h-4 w-4 text-teal-600 flex-shrink-0" />
                              </div>
                              <span className="inline-block bg-teal-50 text-teal-700 text-[10px] font-extrabold px-2 py-0.5 rounded border border-teal-100 uppercase tracking-wide mt-0.5">
                                {doc.specialty}
                              </span>
                              <p className="text-[11px] text-slate-500 font-medium mt-1 truncate">
                                {doc.qualifications} &bull; {doc.experience} {t.years} {t.experience}
                              </p>
                            </div>
                          </div>

                          <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1 text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <Building className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                              <span className="truncate font-semibold">{getHospitalName(doc.hospitalId)}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                              <span>{doc.city}, {doc.state}</span>
                              <strong className="text-teal-700 font-bold">₹{doc.consultationFee} {t.fee}</strong>
                            </div>
                          </div>

                          {/* Quick Time Slots Preview */}
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5 flex items-center gap-1">
                              <Clock className="h-3 w-3 text-slate-400" />
                              <span>Select Time Slot:</span>
                            </span>
                            <div className="grid grid-cols-3 gap-1.5">
                              {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'].map(slot => (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => openBookingModalForDoctor(doc, slot)}
                                  className="py-1 px-1.5 bg-slate-50 hover:bg-teal-600 hover:text-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 transition-all text-center cursor-pointer"
                                >
                                  {slot} IST
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => openBookingModalForDoctor(doc)}
                          className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-teal-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{t.bookSlot} ({doc.name})</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons: Full directory explore or Retake */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleNavigateToSpecialists}
                  className="w-full sm:flex-1 py-3.5 px-6 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-teal-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Search className="h-4 w-4" />
                  <span>{t.findSpecialist}: Explore All {selectedConcern?.specialty} Specialists</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto py-3.5 px-6 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm rounded-2xl border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4 text-slate-400" />
                  <span>{t.retakeAssessment}</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Doctor Direct Booking Modal */}
        {bookingDoctor && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 text-left shadow-2xl space-y-5 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">{t.bookConsultation}</h3>
                  <span className="text-xs text-teal-700 font-bold">{bookingDoctor.name} ({bookingDoctor.specialty})</span>
                </div>
                <button
                  onClick={() => setBookingDoctor(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {bookingSuccess ? (
                <div className="py-8 text-center space-y-2 text-emerald-600">
                  <CheckCircle className="h-8 w-8 mx-auto" />
                  <p className="font-extrabold text-sm">{bookingSuccess}</p>
                </div>
              ) : (
                <form onSubmit={handleBookAppointment} className="space-y-4 text-xs">
                  {bookingError && <p className="text-xs text-red-600 font-bold">{bookingError}</p>}

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">{t.date}</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={bookingDate}
                      onChange={e => setBookingDate(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">{t.time}</label>
                    <select
                      value={bookingTime}
                      required
                      onChange={e => setBookingTime(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                    >
                      <option value="">{t.selectSlot}</option>
                      {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'].map(slot => (
                        <option key={slot} value={slot}>{slot} IST</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">{t.consultationMode}</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setBookingType('video')}
                        className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                          bookingType === 'video' ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-50 text-slate-700'
                        }`}
                      >
                        Video Call
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingType('audio')}
                        className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                          bookingType === 'audio' ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-50 text-slate-700'
                        }`}
                      >
                        Audio Call
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={bookingLoading}
                      className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl cursor-pointer"
                    >
                      {bookingLoading ? 'Requesting...' : t.bookSlot}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingDoctor(null)}
                      className="py-2.5 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                    >
                      {t.cancel}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
