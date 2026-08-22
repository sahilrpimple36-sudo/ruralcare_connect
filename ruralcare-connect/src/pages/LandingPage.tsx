import React from 'react';
import { Search, MapPin, Calendar, Video, FileText, Landmark, RefreshCw, ArrowRight, Sparkles, Activity, ShieldCheck, PhoneCall } from 'lucide-react';
import { useLanguage } from '../services/i18n';

interface LandingPageProps {
  setCurrentPage: (page: string, params?: any) => void;
  user: any;
}

export const LandingPage: React.FC<LandingPageProps> = ({ setCurrentPage, user }) => {
  const { t } = useLanguage();

  const features = [
    {
      icon: <Activity className="h-6 w-6 text-teal-600" />,
      title: t.triageBadge,
      description: t.triageHeroSubtitle
    },
    {
      icon: <Search className="h-6 w-6 text-teal-600" />,
      title: t.findSpecialist,
      description: t.searchDirectorySubtitle
    },
    {
      icon: <Video className="h-6 w-6 text-teal-600" />,
      title: t.startVideoCall,
      description: t.step3Desc
    },
    {
      icon: <FileText className="h-6 w-6 text-teal-600" />,
      title: t.medicalReports,
      description: 'Upload PDF and image scans. Protected and shared securely with consulting physicians.'
    },
    {
      icon: <Landmark className="h-6 w-6 text-teal-600" />,
      title: t.myReferrals,
      description: '5-stage trackable hospital referral letters for seamless transfer to tertiary medical centers.'
    },
    {
      icon: <RefreshCw className="h-6 w-6 text-teal-600" />,
      title: t.followUpCare,
      description: 'Doctor-scheduled continuity care with normal, priority, and high-priority alerts.'
    }
  ];

  const steps = [
    {
      num: '1',
      title: t.step1Title,
      desc: t.step1Desc
    },
    {
      num: '2',
      title: t.step2Title,
      desc: t.step2Desc
    },
    {
      num: '3',
      title: t.step3Title,
      desc: t.step3Desc
    },
    {
      num: '4',
      title: t.step4Title,
      desc: t.step4Desc
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-teal-800 via-teal-900 to-slate-950 text-white py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(20,184,166,0.15),transparent)] pointer-events-none"></div>
        <div className="max-w-4xl mx-auto relative z-10 space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold bg-teal-500/20 text-teal-300 border border-teal-500/30">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t.brandTagline}</span>
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            {t.heroTitle}
            <span className="block text-teal-400">{t.heroHighlight}</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-200 max-w-2xl mx-auto leading-relaxed font-normal">
            {t.heroSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => setCurrentPage('health-assessment')}
              className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-2xl text-xs font-black text-slate-950 bg-teal-400 hover:bg-teal-300 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-teal-500/20 cursor-pointer"
            >
              <Activity className="mr-2 h-4 w-4" />
              <span>{t.triageCta}</span>
            </button>

            <button
              onClick={() => {
                if (user) {
                  if (user.role === 'patient') setCurrentPage('specialist-search');
                  else if (user.role === 'doctor') setCurrentPage('doctor-dashboard');
                  else setCurrentPage('admin-dashboard');
                } else {
                  setCurrentPage('specialist-search');
                }
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 border border-slate-600 rounded-2xl text-xs font-bold text-white hover:bg-white/10 hover:border-white transition-all cursor-pointer"
            >
              <span>{t.findSpecialistCta}</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Emergency Alert Section */}
      <section className="max-w-4xl mx-auto -mt-8 px-4 sm:px-6 relative z-20">
        <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 text-left">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0 text-red-600 font-bold text-xl">
              ⚠️
            </div>
            <div>
              <h3 className="font-extrabold text-red-900 text-sm sm:text-base">
                {t.emergencyTitle}
              </h3>
              <p className="text-xs text-red-700 mt-1 leading-relaxed">
                {t.emergencyWarning}
              </p>
            </div>
          </div>
          <a
            href="tel:108"
            className="flex-shrink-0 py-2.5 px-5 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center gap-1.5"
          >
            <PhoneCall className="h-3.5 w-3.5" />
            <span>{t.emergencyAction}</span>
          </a>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-12">
        <div>
          <span className="text-teal-600 text-xs font-black uppercase tracking-wider block mb-2">Step-by-Step Flow</span>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">{t.howItWorksTitle}</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl mx-auto">{t.howItWorksSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {steps.map(step => (
            <div key={step.num} className="bg-white border border-slate-200 p-6 rounded-3xl space-y-3 shadow-xs hover:border-teal-500 transition-all">
              <span className="h-8 w-8 rounded-xl bg-teal-100 text-teal-700 text-xs font-black flex items-center justify-center">
                {step.num}
              </span>
              <h3 className="font-extrabold text-slate-800 text-sm">{step.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="bg-white border-y border-slate-200 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12 text-center">
          <div>
            <span className="text-teal-600 text-xs font-black uppercase tracking-wider block mb-2">Capabilities</span>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">{t.coreFeaturesTitle}</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl mx-auto">{t.coreFeaturesSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {features.map((feat, idx) => (
              <div key={idx} className="p-6 rounded-3xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-teal-500 hover:shadow-lg transition-all space-y-3">
                <div className="p-3 bg-teal-50 rounded-2xl w-max">{feat.icon}</div>
                <h3 className="font-extrabold text-slate-800 text-sm">{feat.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs">
            <strong className="text-3xl font-black text-teal-600 block">5,000+</strong>
            <span className="text-xs font-bold text-slate-500 mt-1 block">{t.statsPatients}</span>
          </div>
          <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs">
            <strong className="text-3xl font-black text-blue-600 block">50+</strong>
            <span className="text-xs font-bold text-slate-500 mt-1 block">{t.statsDoctors}</span>
          </div>
          <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs">
            <strong className="text-3xl font-black text-purple-600 block">12+</strong>
            <span className="text-xs font-bold text-slate-500 mt-1 block">{t.statsHospitals}</span>
          </div>
          <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs">
            <strong className="text-3xl font-black text-emerald-600 block">120+</strong>
            <span className="text-xs font-bold text-slate-500 mt-1 block">{t.statsVillages}</span>
          </div>
        </div>
      </section>
    </div>
  );
};
