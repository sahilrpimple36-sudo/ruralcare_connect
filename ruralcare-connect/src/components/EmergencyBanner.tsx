import React from 'react';
import { AlertOctagon, PhoneCall } from 'lucide-react';
import { useLanguage } from '../services/i18n';

export const EmergencyBanner: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-red-50 border-b border-red-200 text-red-700 py-3 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3 text-xs sm:text-sm font-medium">
        <div className="flex items-center gap-2.5 flex-1 text-left">
          <AlertOctagon className="h-5 w-5 text-red-600 flex-shrink-0 animate-pulse" />
          <span className="leading-snug text-slate-800 text-xs sm:text-sm">
            <strong className="text-red-700">{t.emergencyTitle}: </strong>
            {t.emergencyWarning}
          </span>
        </div>
        <a
          href="tel:108"
          className="text-[11px] font-extrabold bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-1 flex items-center gap-1.5 shadow-sm transition-all"
        >
          <PhoneCall className="h-3 w-3" />
          <span>{t.emergencyAction}</span>
        </a>
      </div>
    </div>
  );
};
