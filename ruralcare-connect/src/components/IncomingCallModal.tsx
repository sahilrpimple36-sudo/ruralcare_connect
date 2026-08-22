import React from 'react';
import { Phone, PhoneOff, Video, Mic } from 'lucide-react';
import { CallSignal } from '../types';

interface IncomingCallModalProps {
  incomingCall: CallSignal;
  onAccept: (call: CallSignal) => void;
  onDecline: (call: CallSignal) => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  incomingCall,
  onAccept,
  onDecline
}) => {
  const isVideo = incomingCall.callType === 'video';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-center p-6 sm:p-8 space-y-6">
        
        {/* Animated ring glow indicator */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-teal-500/20 animate-ping duration-1000"></div>
          <div className="absolute inset-2 rounded-full bg-teal-500/30 animate-pulse"></div>
          <div className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-tr from-teal-600 to-teal-500 shadow-xl flex items-center justify-center text-white text-2xl font-bold border-2 border-white">
            {incomingCall.callerAvatar ? (
              <img
                src={incomingCall.callerAvatar}
                alt={incomingCall.callerName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span>{incomingCall.callerName.charAt(0).toUpperCase()}</span>
            )}
          </div>
        </div>

        {/* Call description */}
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-teal-50 text-teal-700 border border-teal-100">
            {isVideo ? <Video className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            Incoming {isVideo ? 'Video' : 'Audio'} Consultation
          </span>
          <h3 className="text-xl font-extrabold text-slate-800 tracking-tight pt-2">
            {incomingCall.callerName}
          </h3>
          <p className="text-xs text-slate-500 font-medium capitalize">
            {incomingCall.callerRole} &bull; Appointment #{incomingCall.consultationId}
          </p>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed px-2">
          {incomingCall.callerRole === 'doctor'
            ? 'The specialist is calling to begin your teleconsultation.'
            : 'Patient has connected and requested to start the consultation.'}
        </p>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => onDecline(incomingCall)}
            className="w-full py-3 px-4 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs shadow-sm border border-slate-200 hover:border-red-200"
          >
            <PhoneOff className="h-4 w-4 text-red-600" />
            Decline
          </button>

          <button
            onClick={() => onAccept(incomingCall)}
            className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs shadow-lg shadow-teal-600/30 hover:scale-[1.02] active:scale-95"
          >
            {isVideo ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
            Accept Call
          </button>
        </div>

        <div className="text-[10px] text-slate-400 pt-1 select-none font-medium">
          RuralCare Connect Telemedicine System
        </div>
      </div>
    </div>
  );
};
