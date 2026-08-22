import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { SpecialistSearch } from './pages/SpecialistSearch';
import { HealthAssessment } from './pages/HealthAssessment';
import { PatientDashboard } from './pages/PatientDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ConsultationRoom } from './pages/ConsultationRoom';
import { IncomingCallModal } from './components/IncomingCallModal';
import { User, CallSignal } from './types';
import { authService } from './services/authService';
import { callService } from './services/callService';
import { LanguageProvider } from './services/i18n';

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [pageParams, setPageParams] = useState<any>({});
  const [authLoading, setAuthLoading] = useState(true);
  const [incomingCall, setIncomingCall] = useState<CallSignal | null>(null);

  useEffect(() => {
    const unsubscribe = authService.subscribe(u => {
      setUser(u);
      setAuthLoading(false);

      if (u && currentPage === 'auth') {
        if (u.role === 'patient') setCurrentPage('patient-dashboard');
        else if (u.role === 'doctor') setCurrentPage('doctor-dashboard');
        else if (u.role === 'admin') setCurrentPage('admin-dashboard');
      }
    });
    return () => unsubscribe();
  }, [currentPage]);

  useEffect(() => {
    if (!user) {
      setIncomingCall(null);
      return;
    }

    const unsubscribe = callService.listenForIncomingCalls(user.id, call => {
      if (call && currentPage !== 'consultation-room') {
        setIncomingCall(call);
      } else {
        setIncomingCall(null);
      }
    });

    return () => unsubscribe();
  }, [user, currentPage]);

  const handleAcceptIncomingCall = (call: CallSignal) => {
    setIncomingCall(null);
    handleNavigate('consultation-room', {
      appointmentId: call.consultationId,
      incomingCallId: call.id,
      initialCallType: call.callType
    });
  };

  const handleDeclineIncomingCall = async (call: CallSignal) => {
    setIncomingCall(null);
    await callService.rejectCall(call.id);
  };

  const handleNavigate = (page: string, params: any = {}) => {
    setCurrentPage(page);
    setPageParams(params);
    window.scrollTo(0, 0);
  };

  const handleAuthSuccess = () => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      if (currentUser.role === 'patient') handleNavigate('patient-dashboard');
      else if (currentUser.role === 'doctor') handleNavigate('doctor-dashboard');
      else if (currentUser.role === 'admin') handleNavigate('admin-dashboard');
    } else {
      handleNavigate('landing');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar
        user={user}
        currentPage={currentPage}
        setCurrentPage={handleNavigate}
      />

      <main className="flex-grow">
        {authLoading ? (
          <div className="py-24 text-slate-400 text-sm font-semibold flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            <span>Loading profile credentials...</span>
          </div>
        ) : (
          <>
            {currentPage === 'landing' && (
              <LandingPage setCurrentPage={handleNavigate} user={user} />
            )}

            {currentPage === 'auth' && (
              <AuthPage
                setCurrentPage={handleNavigate}
                onAuthSuccess={handleAuthSuccess}
              />
            )}

            {currentPage === 'health-assessment' && (
              <HealthAssessment user={user} setCurrentPage={handleNavigate} />
            )}

            {currentPage === 'specialist-search' && (
              <SpecialistSearch
                setCurrentPage={handleNavigate}
                user={user}
                initialSpecialty={pageParams?.specialty}
              />
            )}

            {currentPage === 'patient-dashboard' && user && user.role === 'patient' && (
              <PatientDashboard user={user} setCurrentPage={handleNavigate} />
            )}

            {currentPage === 'doctor-dashboard' && user && user.role === 'doctor' && (
              <DoctorDashboard user={user} setCurrentPage={handleNavigate} />
            )}

            {currentPage === 'admin-dashboard' && user && user.role === 'admin' && (
              <AdminDashboard />
            )}

            {currentPage === 'consultation-room' && user && (
              <ConsultationRoom
                user={user}
                appointmentId={pageParams.appointmentId}
                initialCallType={pageParams.initialCallType}
                incomingCallId={pageParams.incomingCallId}
                setCurrentPage={handleNavigate}
              />
            )}
          </>
        )}
      </main>

      {incomingCall && (
        <IncomingCallModal
          incomingCall={incomingCall}
          onAccept={handleAcceptIncomingCall}
          onDecline={handleDeclineIncomingCall}
        />
      )}

      <Footer />
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
