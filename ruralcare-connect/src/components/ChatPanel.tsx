import React, { useState, useEffect, useRef } from 'react';
import { Send, Phone, Video, FileText, Check, CheckCheck, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { User, DoctorAvailabilityStatus, UserRole } from '../types';
import { useChat } from '../hooks/useChat';

interface ChatPanelProps {
  currentUser: User;
  recipientId: string;
  recipientName: string;
  recipientRole?: UserRole;
  recipientAvatar?: string;
  recipientSpecialty?: string;
  recipientStatus?: DoctorAvailabilityStatus;
  consultationId?: string;
  onStartCall?: (type: 'audio' | 'video') => void;
  activeCallInProgress?: boolean;
  onJoinActiveCall?: () => void;
  className?: string;
  showHeader?: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  currentUser,
  recipientId,
  recipientName,
  recipientRole = 'doctor',
  recipientAvatar,
  recipientSpecialty,
  recipientStatus = 'available',
  consultationId,
  onStartCall,
  activeCallInProgress,
  onJoinActiveCall,
  className = '',
  showHeader = true
}) => {
  const conversationId = `conv_${currentUser.role === 'patient' ? currentUser.id : recipientId}_${
    currentUser.role === 'doctor' ? currentUser.id : recipientId
  }`;

  const { messages, loading, error, isSending, sendMessage } = useChat({
    conversationId,
    currentUserId: currentUser.id,
    currentUserName: currentUser.name,
    currentUserRole: currentUser.role,
    recipientId,
    consultationId
  });

  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    const textToSend = inputMessage;
    setInputMessage('');
    await sendMessage(textToSend, 'text');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessageTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm text-left ${className}`}>
      
      {/* Chat Header */}
      {showHeader && (
        <div className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative">
              {recipientAvatar ? (
                <img
                  src={recipientAvatar}
                  alt={recipientName}
                  className="w-10 h-10 rounded-full object-cover border border-slate-700 bg-slate-800"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-sm border border-slate-700">
                  {recipientName.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Doctor Availability status dot */}
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-slate-900 ${
                  recipientStatus === 'available'
                    ? 'bg-emerald-500'
                    : recipientStatus === 'busy'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
                title={`Status: ${recipientStatus}`}
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm text-slate-100">{recipientName}</h3>
                {recipientSpecialty && (
                  <span className="text-[10px] bg-teal-500/20 text-teal-300 font-bold px-2 py-0.2 rounded border border-teal-500/30">
                    {recipientSpecialty}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium capitalize">
                <span>{recipientRole}</span>
                <span>&bull;</span>
                <span
                  className={
                    recipientStatus === 'available'
                      ? 'text-emerald-400 font-semibold'
                      : recipientStatus === 'busy'
                      ? 'text-amber-400 font-semibold'
                      : 'text-slate-400'
                  }
                >
                  {recipientStatus === 'available'
                    ? 'Available for Call'
                    : recipientStatus === 'busy'
                    ? 'Busy in Consultation'
                    : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Call Action Buttons in Chat Header */}
          {onStartCall && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onStartCall('audio')}
                className="p-2 bg-slate-800 hover:bg-teal-600 text-slate-200 hover:text-white rounded-xl transition-all cursor-pointer shadow-sm text-xs flex items-center gap-1 font-semibold"
                title="Start Audio Consultation"
              >
                <Phone className="h-4 w-4" />
                <span className="hidden sm:inline">Audio</span>
              </button>

              <button
                onClick={() => onStartCall('video')}
                className="p-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl transition-all cursor-pointer shadow-sm text-xs flex items-center gap-1 font-semibold"
                title="Start Video Consultation"
              >
                <Video className="h-4 w-4" />
                <span className="hidden sm:inline">Video Call</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active Call In Progress Banner */}
      {activeCallInProgress && (
        <div className="bg-teal-50 border-b border-teal-200 px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-teal-800 font-bold">
            <span className="h-2 w-2 rounded-full bg-teal-500 animate-ping" />
            <span>Consultation call is currently active</span>
          </div>
          {onJoinActiveCall && (
            <button
              onClick={onJoinActiveCall}
              className="py-1 px-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition-colors cursor-pointer text-[11px]"
            >
              Join Consultation Room
            </button>
          )}
        </div>
      )}

      {/* Messages List Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
            <span className="text-xs font-semibold">Loading conversation history...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
            <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center">
              <Sparkles className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-slate-700 text-sm">Start your consultation chat</h4>
            <p className="text-xs max-w-xs text-slate-500 leading-relaxed">
              Send a message to {recipientName} to discuss symptoms, share details, or begin teleconsultation.
            </p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.senderId === currentUser.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[82%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-xs text-xs break-words ${
                    isMe
                      ? 'bg-teal-600 text-white rounded-br-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  {!isMe && (
                    <span className="block text-[10px] font-bold text-teal-600 mb-0.5">
                      {msg.senderName} ({msg.senderRole || 'Specialist'})
                    </span>
                  )}

                  <p className="leading-relaxed whitespace-pre-wrap font-medium">{msg.message}</p>

                  {msg.attachmentUrl && (
                    <div className="mt-2 pt-2 border-t border-slate-100/30">
                      <a
                        href={msg.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex items-center gap-1.5 font-bold underline ${
                          isMe ? 'text-teal-100 hover:text-white' : 'text-teal-600 hover:text-teal-700'
                        }`}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {msg.attachmentName || 'View Document'}
                      </a>
                    </div>
                  )}

                  <div
                    className={`flex items-center justify-end gap-1 text-[9px] mt-1 ${
                      isMe ? 'text-teal-100' : 'text-slate-400'
                    }`}
                  >
                    <span>{formatMessageTime(msg.createdAt)}</span>
                    {isMe && (
                      <span>
                        {msg.read ? (
                          <CheckCheck className="h-3.5 w-3.5 text-teal-200" />
                        ) : (
                          <Check className="h-3.5 w-3.5 text-teal-300" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="bg-red-50 border-t border-red-200 px-4 py-2 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Message Input Footer */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={e => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Type a message to ${recipientName}...`}
          className="flex-1 text-xs py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white text-slate-800 transition-colors"
        />

        <button
          type="submit"
          disabled={!inputMessage.trim() || isSending}
          className="p-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer shadow-sm shadow-teal-500/20 flex-shrink-0"
          title="Send message (Enter)"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>
    </div>
  );
};
