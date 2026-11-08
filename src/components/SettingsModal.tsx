import React, { useState } from 'react';
import { X, Globe, Cpu, ShieldCheck, Database, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'ur' | 'roman_ur';
  onLanguageChange: (lang: 'en' | 'ur' | 'roman_ur') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  language,
  onLanguageChange,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <h2 className="text-base font-semibold text-white">System & Language Preferences</h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {/* Language Selection */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-200 flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              Primary AI Dialogue Language
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'en', label: 'English' },
                { id: 'roman_ur', label: 'Roman Urdu' },
                { id: 'ur', label: 'اردو (Urdu)' },
              ].map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => onLanguageChange(lang.id as any)}
                  className={`py-2 px-3 rounded-xl border text-center transition-colors ${
                    language === lang.id
                      ? 'bg-blue-600 border-blue-500 text-white font-semibold'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Model Architecture Info */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-slate-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-400" />
                AI Inference Engine
              </span>
              <span className="text-[10px] text-cyan-300 bg-cyan-950/40 border border-cyan-800 px-2 py-0.5 rounded-md font-mono">
                gemini-3.8-flash
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-400" />
                Vector Embeddings
              </span>
              <span className="text-[10px] text-emerald-300 bg-emerald-950/40 border border-emerald-800 px-2 py-0.5 rounded-md font-mono">
                text-embedding-004
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                RAG Pipeline
              </span>
              <span className="text-[10px] text-amber-300 bg-amber-950/40 border border-amber-800 px-2 py-0.5 rounded-md">
                Hybrid (Vector + BM25)
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-900/30 text-[11px] text-slate-400 leading-relaxed">
            API keys and credentials are maintained securely server-side. No sensitive tokens or secrets are exposed in browser runtime.
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
