import React from 'react';
import { X, HelpCircle, Phone, Mail, MapPin, Clock, ShieldCheck } from 'lucide-react';

interface HelpSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpSupportModal: React.FC<HelpSupportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-semibold text-white">University Help & Academic Support</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close help"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[70vh]">
          {/* Institutional Contacts */}
          <div className="space-y-2.5">
            <h3 className="font-semibold text-slate-200">Key Institutional Contacts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="font-semibold text-blue-300 block">Office of the Registrar</span>
                <p className="text-slate-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" /> registrar@uniassist.edu
                </p>
                <p className="text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" /> +1 (555) 234-8900
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="font-semibold text-emerald-300 block">Examination Branch</span>
                <p className="text-slate-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" /> exams@uniassist.edu
                </p>
                <p className="text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" /> +1 (555) 234-8905
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="font-semibold text-amber-300 block">Financial Aid & Accounts</span>
                <p className="text-slate-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" /> finaid@uniassist.edu
                </p>
                <p className="text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" /> +1 (555) 234-8920
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="font-semibold text-rose-300 block">Campus Security (24/7)</span>
                <p className="text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-rose-400" /> Emergency: ext. 911
                </p>
                <p className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" /> 24 Hours / 7 Days
                </p>
              </div>
            </div>
          </div>

          {/* Quick FAQ */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h3 className="font-semibold text-slate-200">Frequently Asked Questions</h3>
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80">
                <strong className="text-slate-200 block mb-0.5">
                  How does UniAssist AI verify university policies?
                </strong>
                <p className="text-slate-400 leading-normal">
                  UniAssist AI uses Retrieval-Augmented Generation (RAG) to index official university PDF/DOCX handbooks into pgvector embeddings. When you ask about rules, it retrieves exact excerpts and displays citations.
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80">
                <strong className="text-slate-200 block mb-0.5">
                  What if a document or policy is not in the system?
                </strong>
                <p className="text-slate-400 leading-normal">
                  The AI is instructed to never fabricate policy numbers, dates, or fees. It will notify you that the information is unverified and suggest contacting the relevant department or having an administrator upload the handbook.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
