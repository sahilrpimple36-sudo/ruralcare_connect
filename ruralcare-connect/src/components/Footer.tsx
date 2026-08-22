import React from 'react';
import { useLanguage } from '../services/i18n';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-900 text-slate-400 py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800 text-left">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 bg-teal-500 rounded-xl flex items-center justify-center text-slate-900 font-bold text-sm">
              RC
            </div>
            <span className="font-extrabold text-lg text-white tracking-tight">
              {t.brandName}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-slate-400 max-w-sm">
            "{t.brandTagline}"
          </p>
        </div>

        {/* Prototype info */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Prototype Status
          </h4>
          <span className="inline-block bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold rounded px-2.5 py-0.5 uppercase tracking-wide mb-2">
            DEMO DATA — NOT REAL HEALTHCARE
          </span>
          <p className="text-xs leading-relaxed text-slate-400">
            This platform contains simulated medical specialists, hospitals, and records for rural healthcare demonstration.
          </p>
        </div>

        {/* Emergency Alert */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-red-400 mb-2">
            {t.emergencyTitle}
          </h4>
          <p className="text-xs leading-relaxed text-red-400/90 font-medium">
            {t.emergencyWarning}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <span>&copy; {new Date().getFullYear()} {t.brandName}. Prototype Platform.</span>
        <div className="flex gap-4">
          <span className="hover:text-teal-400 cursor-pointer">Privacy Protocol</span>
          <span className="hover:text-teal-400 cursor-pointer">Clinical Guidelines</span>
          <span className="hover:text-teal-400 cursor-pointer">HIPAA/ABDM Conformance</span>
        </div>
      </div>
    </footer>
  );
};
