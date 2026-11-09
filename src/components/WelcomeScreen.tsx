import React from 'react';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  FileText,
  Bookmark,
  Shield,
  ArrowRight,
  LogIn,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  Users,
} from 'lucide-react';

interface WelcomeScreenProps {
  onOpenSignIn: () => void;
  onOpenRegister: () => void;
  onQuickDemoLogin: (email: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onOpenSignIn,
  onOpenRegister,
  onQuickDemoLogin,
}) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Top Simple Brand Bar */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white tracking-tight">UniAssist AI</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                Institutional RAG
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Metropolitan University Intelligence Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSignIn}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={onOpenRegister}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>
        </div>
      </header>

      {/* Main Welcome Hero */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 flex flex-col items-center justify-center text-center">
        {/* Verification Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Official University AI Portal & Knowledge Engine</span>
        </div>

        {/* Primary Required Welcome Heading */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-3xl">
          Welcome to UniAssist AI
        </h1>

        <p className="text-base md:text-lg text-slate-300 max-w-2xl mt-4 leading-relaxed">
          Your University. Your Knowledge. One AI Assistant. Intelligent academic assistant for students, faculty, and administrators with verified institutional knowledge retrieval, personalized study tools, and step-by-step problem solving.
        </p>

        {/* Two Clear Options: Sign In & Register */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 w-full max-w-md">
          <button
            onClick={onOpenSignIn}
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/25 transition-all group"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={onOpenRegister}
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700/80 text-white font-semibold text-sm border border-slate-700 shadow-md transition-all"
          >
            <UserPlus className="w-4 h-4 text-cyan-400" />
            <span>Register</span>
          </button>
        </div>

        {/* Quick Demo Access Bar for seamless verification */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 w-full max-w-xl">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Instant Demo Access (Single-Click Sign In)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              onClick={() => onQuickDemoLogin('bilal.student@uniassist.edu')}
              className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/50 text-left transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Student Demo</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold">Student</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">Bilal Ahmed</p>
            </button>

            <button
              onClick={() => onQuickDemoLogin('s.mitchell@uniassist.edu')}
              className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 text-left transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Faculty Demo</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">Faculty</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">Dr. Sarah Mitchell</p>
            </button>

            <button
              onClick={() => onQuickDemoLogin('admin@uniassist.edu')}
              className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-rose-500/50 text-left transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Admin Demo</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold">Admin</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">Registrar Office</p>
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-12 w-full text-left">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Conversational AI</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ask any institutional question. Powered by Gemini 3.8 and verified RAG against official regulations.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Study Assistant</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Step-by-step problem solver, interactive quiz generator, concept explainer, and personalized study planner.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Knowledge Base</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Search institutional documents, examination rules, fee schedules, curriculum syllabi, and handbooks.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Bookmark className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Saved Responses</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bookmark useful AI explanations with source citations and export research notes to Markdown.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
