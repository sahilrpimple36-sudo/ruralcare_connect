import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  CheckCircle,
  Video,
  Sparkles,
  Filter,
  Landmark,
  RotateCcw,
  Clock,
  Calendar,
  Building,
  Phone,
  ShieldCheck,
  Stethoscope,
  X
} from 'lucide-react';
import { Doctor, Hospital } from '../types';
import { dbService } from '../services/dbService';
import { SEED_SPECIALTIES } from '../services/seedData';
import { useLanguage } from '../services/i18n';

interface SpecialistSearchProps {
  setCurrentPage: (page: string, params?: any) => void;
  user: any;
  initialSpecialty?: string;
}

export const SpecialistSearch: React.FC<SpecialistSearchProps> = ({
  setCurrentPage,
  user,
  initialSpecialty = ''
}) => {
  const { t } = useLanguage();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(initialSpecialty || '');
  const [selectedHospital, setSelectedHospital] = useState<string>('');
  const [stateFilter, setStateFilter] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [teleAvailable, setTeleAvailable] = useState<boolean>(false);

  // Doctor Detail overlay modal state
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingType, setBookingType] = useState<'video' | 'audio'>('video');
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (initialSpecialty) {
      setSelectedSpecialty(initialSpecialty);
    }
  }, [initialSpecialty]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [docs, hosps] = await Promise.all([
          dbService.getDoctors(),
          dbService.getHospitals()
        ]);
        setDoctors(docs);
        setHospitals(hosps);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleResetFilters = () => {
    setSelectedSpecialty('');
    setSelectedHospital('');
    setStateFilter('');
    setCityFilter('');
    setTeleAvailable(false);
  };

  const getHospitalName = (hospId: string) => {
    const h = hospitals.find(h => h.id === hospId);
    return h ? h.name : 'Associated Partner Hospital';
  };

  // Filter Logic - Robust Case-Insensitive Matching
  const filteredDoctors = useMemo(() => {
    return doctors.filter(doc => {
      if (selectedSpecialty && doc.specialty.trim().toLowerCase() !== selectedSpecialty.trim().toLowerCase()) {
        return false;
      }
      if (selectedHospital && doc.hospitalId !== selectedHospital) {
        return false;
      }
      if (stateFilter && !doc.state.toLowerCase().includes(stateFilter.trim().toLowerCase())) {
        return false;
      }
      if (cityFilter && !doc.city.toLowerCase().includes(cityFilter.trim().toLowerCase())) {
        return false;
      }
      if (teleAvailable && !doc.teleconsultationAvailable) {
        return false;
      }
      return true;
    });
  }, [doctors, selectedSpecialty, selectedHospital, stateFilter, cityFilter, teleAvailable]);

  const openBookingModal = (doc: Doctor, slot?: string) => {
    setSelectedDoctor(doc);
    if (slot) setBookingTime(slot);
    setBookingDate(new Date().toISOString().split('T')[0]);
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

    if (!selectedDoctor) return;
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
        doctorId: selectedDoctor.id,
        hospitalId: selectedDoctor.hospitalId,
        specialty: selectedDoctor.specialty,
        date: bookingDate,
        time: bookingTime,
        consultationType: bookingType
      });

      setBookingSuccess('Appointment requested successfully! Redirecting to dashboard...');
      setTimeout(() => {
        setSelectedDoctor(null);
        setBookingSuccess('');
        setCurrentPage('patient-dashboard');
      }, 1500);
    } catch (err: any) {
      setBookingError(err.message || 'Failed to book appointment.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-left shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-teal-100">
              <Stethoscope className="h-3.5 w-3.5" />
              <span>{t.searchDirectoryTitle}</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-tight">
              {t.findSpecialist}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">
              {t.searchDirectorySubtitle}
            </p>
          </div>

          <button
            onClick={() => setCurrentPage('health-assessment')}
            className="py-3 px-5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-extrabold rounded-2xl border border-teal-200 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Sparkles className="h-4 w-4 text-teal-600" />
            <span>{t.triageTitle}</span>
          </button>
        </div>

        {/* Digital Triage Active Specialty Highlight Pill */}
        {selectedSpecialty && (
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-teal-600 flex-shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider block">
                  {t.recommendedForSpecialtyPill}
                </span>
                <strong className="text-xs sm:text-sm font-extrabold text-teal-950">
                  {selectedSpecialty} ({filteredDoctors.length} {t.verifiedSpecialist})
                </strong>
              </div>
            </div>

            <button
              onClick={() => setSelectedSpecialty('')}
              className="py-1 px-3 bg-white text-slate-600 hover:text-slate-900 border border-slate-200 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <span>{t.allSpecialties}</span>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* 4 Manual Filter Textboxes & Dropdowns */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 text-left shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <Filter className="h-4 w-4 text-teal-600" />
              <span>{t.filterHeading}</span>
            </h3>
            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-slate-400 hover:text-teal-600 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{t.resetAll}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            {/* Filter 1: Medical Specialty */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.specialty}</label>
              <select
                value={selectedSpecialty}
                onChange={e => setSelectedSpecialty(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-teal-500"
              >
                <option value="">{t.allSpecialties}</option>
                {SEED_SPECIALTIES.map(sp => (
                  <option key={sp} value={sp}>{sp}</option>
                ))}
              </select>
            </div>

            {/* Filter 2: Hospital */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.hospital}</label>
              <select
                value={selectedHospital}
                onChange={e => setSelectedHospital(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-teal-500"
              >
                <option value="">{t.allHospitals}</option>
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>

            {/* Filter 3: City / District Text Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.city} / {t.district}</label>
              <input
                type="text"
                placeholder={t.cityDistrictPlaceholder}
                value={cityFilter}
                onChange={e => setCityFilter(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Filter 4: State Text Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.state}</label>
              <input
                type="text"
                placeholder={t.statePlaceholder}
                value={stateFilter}
                onChange={e => setStateFilter(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="text-left space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              {t.showingDoctorsCount}: <strong>{filteredDoctors.length}</strong>
            </span>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400 py-12 text-center">Loading specialist directory...</p>
          ) : filteredDoctors.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-3">
              <Stethoscope className="h-8 w-8 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-700 text-sm">{t.noDoctorsFoundTitle}</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">{t.noDoctorsFoundDesc}</p>
              <button
                onClick={handleResetFilters}
                className="py-2 px-4 bg-teal-600 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                {t.clearFilters}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDoctors.map(doc => (
                <div
                  key={doc.id}
                  className="p-6 border border-slate-200 rounded-3xl bg-white hover:border-teal-500 hover:shadow-xl transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-4">
                      <img
                        src={doc.profileImage}
                        alt={doc.name}
                        className="h-16 w-16 rounded-2xl object-cover border border-slate-100 shadow-sm flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-black text-slate-800 text-sm truncate">{doc.name}</h3>
                          <CheckCircle className="h-4 w-4 text-teal-600 flex-shrink-0" />
                        </div>
                        <span className="inline-block bg-teal-50 text-teal-700 text-[10px] font-extrabold px-2 py-0.5 rounded border border-teal-100 uppercase tracking-wide mt-1">
                          {doc.specialty}
                        </span>
                        <p className="text-[11px] text-slate-500 font-medium mt-1 truncate">
                          {doc.qualifications} &bull; {doc.experience} {t.years} {t.experience}
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl text-xs space-y-1 text-slate-600">
                      <div className="flex items-center gap-2">
                        <Building className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate font-semibold">{getHospitalName(doc.hospitalId)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                        <span>{doc.city}, {doc.state}</span>
                        <strong className="text-teal-700 font-bold">₹{doc.consultationFee} {t.fee}</strong>
                      </div>
                    </div>

                    {/* Quick Slots on Doctor Card */}
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>Available Slots:</span>
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'].map(slot => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => openBookingModal(doc, slot)}
                            className="py-1 px-1 bg-slate-50 hover:bg-teal-600 hover:text-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-all text-center cursor-pointer"
                          >
                            {slot} IST
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => openBookingModal(doc)}
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-teal-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{t.bookConsultation} ({doc.name})</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Doctor Booking Overlay Modal */}
        {selectedDoctor && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 text-left shadow-2xl space-y-5 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">{t.bookConsultation}</h3>
                  <span className="text-xs text-teal-700 font-bold">{selectedDoctor.name} ({selectedDoctor.specialty})</span>
                </div>
                <button
                  onClick={() => setSelectedDoctor(null)}
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
                      onClick={() => setSelectedDoctor(null)}
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
