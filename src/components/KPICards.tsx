import React from 'react';
import { UserStats } from '../types';
import {
  MessageSquare,
  Sparkles,
  Bookmark,
  GraduationCap,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';

interface KPICardsProps {
  stats: UserStats | null;
  isLoading?: boolean;
  onNavigateTab: (tab: string) => void;
}

export const KPICards: React.FC<KPICardsProps> = ({
  stats,
  isLoading = false,
  onNavigateTab,
}) => {
  const totalConversations = stats?.totalConversations ?? 0;
  const questionsAnswered = stats?.questionsAnswered ?? 0;
  const savedResponses = stats?.savedResponses ?? 0;
  const studyProgress = stats?.studyProgress ?? 0;
  const completedTasks = stats?.completedTasks ?? 0;
  const totalTasks = stats?.totalTasks ?? 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full">
      {/* 1. Total Conversations */}
      <div
        onClick={() => onNavigateTab('chat')}
        className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 hover:bg-slate-900 cursor-pointer transition-all group shadow-sm"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Conversations
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <MessageSquare className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">
            {isLoading ? '...' : totalConversations}
          </span>
          <span className="text-[11px] text-slate-400">threads</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 truncate">
          Active academic dialogues
        </p>
      </div>

      {/* 2. Questions Answered */}
      <div
        onClick={() => onNavigateTab('chat')}
        className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900 cursor-pointer transition-all group shadow-sm"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Questions Answered
          </span>
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-colors">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">
            {isLoading ? '...' : questionsAnswered}
          </span>
          <span className="text-[11px] text-emerald-400 flex items-center gap-0.5">
            <CheckCircle2 className="w-3 h-3" />
            Verified
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 truncate">
          Grounded institutional answers
        </p>
      </div>

      {/* 3. Saved Responses */}
      <div
        onClick={() => onNavigateTab('saved')}
        className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900 cursor-pointer transition-all group shadow-sm"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Saved Responses
          </span>
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Bookmark className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">
            {isLoading ? '...' : savedResponses}
          </span>
          <span className="text-[11px] text-slate-400">bookmarks</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 truncate">
          Research notes & explanations
        </p>
      </div>

      {/* 4. Study Progress */}
      <div
        onClick={() => onNavigateTab('study')}
        className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-900 cursor-pointer transition-all group shadow-sm"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Study Progress
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <GraduationCap className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-amber-300 tracking-tight">
            {isLoading ? '...' : `${studyProgress}%`}
          </span>
          <span className="text-[11px] text-slate-400">
            {totalTasks > 0 ? `${completedTasks}/${totalTasks} tasks` : 'active plans'}
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
          <div
            className="bg-linear-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(studyProgress, 4))}%` }}
          />
        </div>
      </div>
    </div>
  );
};
