import React from 'react';
import { Citation } from '../types';
import { FileText, X, ExternalLink, ShieldCheck, Bookmark } from 'lucide-react';

interface CitationsModalProps {
  citations: Citation[];
  isOpen: boolean;
  onClose: () => void;
  onSaveCitation?: (citation: Citation) => void;
}

export const CitationsModal: React.FC<CitationsModalProps> = ({
  citations,
  isOpen,
  onClose,
}) => {
  if (!isOpen || citations.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="citations-modal-title"
    >
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="citations-modal-title" className="text-base font-semibold text-white">
                Verified University Citations ({citations.length})
              </h2>
              <p className="text-xs text-slate-400">
                Grounded in official institutional documentation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close citations modal"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Citations List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {citations.map((c, idx) => (
            <div
              key={`${c.documentId}-${idx}`}
              className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-blue-500/50 transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600/30 text-blue-300 text-xs font-semibold border border-blue-500/40">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      {c.documentTitle}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                        {c.category}
                      </span>
                      {c.pageNumber && (
                        <span className="text-[11px] text-slate-400">
                          Page {c.pageNumber}
                        </span>
                      )}
                      {c.section && (
                        <span className="text-[11px] text-cyan-300/80">
                          • {c.section}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                    {Math.round(c.relevanceScore * 100)}% match
                  </span>
                </div>
              </div>

              {/* Excerpt */}
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed font-mono">
                "{c.excerpt}"
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-700/40">
                <span className="flex items-center gap-1 text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  Verified Repository Record
                </span>
                <span className="text-[11px] text-slate-500">ID: {c.documentId}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>UniAssist AI uses RAG to ground answers in official university texts.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
