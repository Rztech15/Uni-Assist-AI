import React, { useState, useRef, useEffect } from 'react';
import { Message, Conversation, Citation, User, UserStats } from '../types';
import { ChatMessageItem } from './ChatMessageItem';
import { KPICards } from './KPICards';
import {
  Send,
  Square,
  Sparkles,
  ShieldCheck,
  BookOpen,
  Calendar,
  AlertCircle,
  Menu,
  GraduationCap,
  FileQuestion,
  ChevronRight,
  Globe,
  Bell,
  PanelRightClose,
  PanelRightOpen,
  LogIn,
  RotateCw,
} from 'lucide-react';

interface ChatWorkspaceProps {
  conversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string, language?: 'en' | 'ur' | 'roman_ur') => void;
  onStopGeneration?: () => void;
  onRegenerate?: () => void;
  onSaveMessage?: (message: Message) => void;
  onOpenCitations?: (citations: Citation[]) => void;
  onFeedback?: (messageId: string, rating: 'like' | 'dislike', comment?: string) => void;
  savedMessageIds: Set<string>;
  currentUser: User;
  userStats: UserStats | null;
  isLoadingStats?: boolean;
  onOpenMobileMenu: () => void;
  onToggleDesktopSidebar?: () => void;
  onSelectPrompt: (promptText: string) => void;
  onNavigateTab: (tab: string) => void;
  onOpenAuth?: () => void;
  onRefreshStats?: () => void;
}

const SUGGESTED_PROMPTS = [
  {
    title: 'Examination Rules',
    query: 'What are the official examination rules and passing percentage at the university?',
    icon: ShieldCheck,
    tag: 'Policy',
  },
  {
    title: 'Explain Syllabus',
    query: 'Explain the Computer Science BSCS curriculum and credit hour requirements.',
    icon: GraduationCap,
    tag: 'Curriculum',
  },
  {
    title: 'Tuition & Scholarships',
    query: 'What is the tuition fee per credit hour and how can I qualify for a merit scholarship?',
    icon: BookOpen,
    tag: 'Financial',
  },
  {
    title: 'Exam Preparation',
    query: 'Help me prepare for my upcoming exam by summarizing key study strategies.',
    icon: Calendar,
    tag: 'Study Help',
  },
  {
    title: 'Algorithm Tracing',
    query: 'Explain Dijkstra shortest path algorithm with a step-by-step example.',
    icon: Sparkles,
    tag: 'Math & CS',
  },
  {
    title: 'Admission Requirements',
    query: 'Find information about undergraduate admission requirements and deadlines.',
    icon: FileQuestion,
    tag: 'Admissions',
  },
];

const VERIFIED_ANNOUNCEMENTS = [
  {
    id: 'ann-1',
    title: 'Fall 2026 Final Examination Regulations Active',
    date: 'Academic Affairs • Active',
    summary: 'Minimum 75% attendance mandatory. Makeup exam petitions must be filed within 7 days of missed exams.',
  },
  {
    id: 'ann-2',
    title: 'Merit Scholarship Renewal Deadline',
    date: 'Office of the Registrar • Fall 2026',
    summary: 'Students with CGPA 3.75+ qualify for up to 50% tuition waiver upon registrar transcript verification.',
  },
];

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({
  conversation,
  messages,
  isLoading,
  onSendMessage,
  onStopGeneration,
  onRegenerate,
  onSaveMessage,
  onOpenCitations,
  onFeedback,
  savedMessageIds,
  currentUser,
  userStats,
  isLoadingStats = false,
  onOpenMobileMenu,
  onToggleDesktopSidebar,
  onSelectPrompt,
  onNavigateTab,
  onOpenAuth,
  onRefreshStats,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ur' | 'roman_ur'>('en');
  const [showSidePanel, setShowSidePanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim(), selectedLanguage);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Derive personalized welcome name dynamically
  const firstName = currentUser?.fullName ? currentUser.fullName.split(' ')[0] : 'Scholar';

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Navbar with Collapsible Hamburger Menu */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger menu */}
          <button
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop hamburger toggle */}
          {onToggleDesktopSidebar && (
            <button
              onClick={onToggleDesktopSidebar}
              aria-label="Toggle navigation menu"
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Toggle sidebar menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          <div>
            <h2 className="text-sm font-semibold text-white truncate max-w-xs md:max-w-md">
              {conversation ? conversation.title : 'UniAssist Academic Assistant'}
            </h2>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Gemini 3.8 RAG Engine
              </span>
              <span className="text-[10px] text-slate-500">•</span>
              <span className="text-[11px] text-slate-400">
                Role: <strong className="text-slate-200 capitalize">{currentUser?.role || 'student'}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="flex items-center bg-slate-800/80 border border-slate-700/80 rounded-lg p-0.5 text-xs">
            <Globe className="w-3.5 h-3.5 text-cyan-400 ml-1.5 mr-1" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as any)}
              className="bg-transparent text-slate-200 text-xs pr-1 py-1 focus:outline-hidden cursor-pointer"
              title="Select language response mode"
            >
              <option value="en" className="bg-slate-900 text-white">English</option>
              <option value="roman_ur" className="bg-slate-900 text-white">Roman Urdu</option>
              <option value="ur" className="bg-slate-900 text-white">اردو (Urdu)</option>
            </select>
          </div>

          {/* Toggle Announcements Side Panel */}
          <button
            onClick={() => setShowSidePanel(!showSidePanel)}
            aria-label={showSidePanel ? 'Close contextual panel' : 'Open contextual panel'}
            className="hidden lg:flex p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Toggle university notices panel"
          >
            {showSidePanel ? (
              <PanelRightClose className="w-4 h-4 text-cyan-400" />
            ) : (
              <PanelRightOpen className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* Main Container: Chat + Optional Context Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Stream Section */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-4">
            {messages.length === 0 ? (
              /* Authenticated Dashboard Welcome State with Real Dynamic KPI Cards */
              <div className="max-w-4xl mx-auto py-4 space-y-6 animate-in fade-in duration-300">
                {/* Personalized Welcome Header using the authenticated user's actual name */}
                <div className="p-6 md:p-8 rounded-3xl bg-linear-to-b from-blue-950/40 via-slate-900/60 to-slate-900/40 border border-blue-900/40 relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 text-xs font-semibold w-fit">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      Verified Institutional Knowledge Base
                    </div>
                    {onRefreshStats && (
                      <button
                        onClick={onRefreshStats}
                        className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white transition-colors w-fit"
                        title="Refresh live user metrics"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Live Sync</span>
                      </button>
                    )}
                  </div>

                  <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                    Welcome, {firstName}!
                  </h1>
                  
                  <p className="text-xs md:text-sm text-slate-300 max-w-2xl mt-2 leading-relaxed">
                    Your University. Your Knowledge. One AI Assistant. Ask questions grounded in official handbooks, exam policies, and course outlines, or explore study tools.
                  </p>

                  {/* Feature Quick Launch */}
                  <div className="flex flex-wrap items-center gap-3 mt-5">
                    <button
                      onClick={() => onNavigateTab('study')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Study Assistant</span>
                    </button>
                    <button
                      onClick={() => onNavigateTab('knowledge')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Knowledge Base</span>
                    </button>
                    <button
                      onClick={() => onNavigateTab('saved')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Saved Notes</span>
                    </button>
                  </div>
                </div>

                {/* KPI Cards Section */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1 mb-2.5">
                    <span>YOUR ACADEMIC ACTIVITY & METRICS</span>
                    <span className="text-[11px] text-cyan-400 font-normal">Real-time database analytics</span>
                  </div>
                  <KPICards stats={userStats} isLoading={isLoadingStats} onNavigateTab={onNavigateTab} />
                </div>

                {/* Suggested Prompts Grid */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
                    <span>SUGGESTED ACADEMIC QUERIES</span>
                    <span className="text-[11px] text-cyan-400 font-normal">Click to query verified documents</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {SUGGESTED_PROMPTS.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => onSelectPrompt(item.query)}
                          className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/60 text-left transition-all group"
                        >
                          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <h3 className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                                {item.title}
                              </h3>
                              <span className="text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                {item.tag}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-normal">
                              {item.query}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* Active Chat Messages */
              <div className="max-w-4xl mx-auto space-y-4">
                {messages.map((msg, idx) => (
                  <ChatMessageItem
                    key={msg.id}
                    message={msg}
                    isLastAssistant={
                      !isLoading &&
                      msg.role === 'assistant' &&
                      idx === messages.length - 1
                    }
                    onRegenerate={onRegenerate}
                    onSave={onSaveMessage}
                    onOpenCitations={onOpenCitations}
                    onFeedback={onFeedback}
                    isSaved={savedMessageIds.has(msg.id)}
                  />
                ))}

                {/* Loading typing indicator */}
                {isLoading && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse">
                    <div className="w-7 h-7 rounded-lg bg-blue-600/30 flex items-center justify-center text-blue-400">
                      <Sparkles className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-300">
                        UniAssist AI is retrieving verified documents & thinking...
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]" />
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md shrink-0">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleSubmit} className="relative">
                <div className="flex items-end gap-2 p-2 rounded-2xl bg-slate-950 border border-slate-800 focus-within:border-blue-500/80 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                  <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      selectedLanguage === 'ur'
                        ? 'اپنا سوال یہاں لکھیں...'
                        : selectedLanguage === 'roman_ur'
                        ? 'Apna academic sawal yahan type karein...'
                        : 'Ask about university policies, exams, grading, fees, or study topics...'
                    }
                    rows={1}
                    className="flex-1 bg-transparent border-0 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden resize-none max-h-36 min-h-[44px]"
                  />

                  {/* Send or Stop button */}
                  {isLoading ? (
                    <button
                      type="button"
                      onClick={onStopGeneration}
                      className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                      title="Stop generation"
                    >
                      <Square className="w-4 h-4 fill-white" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!inputText.trim()}
                      className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white transition-colors shadow-md shadow-blue-600/30"
                      title="Send question (Enter)"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Subtext info */}
                <div className="flex items-center justify-between px-2 pt-2 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-cyan-400" />
                    Strictly grounded in verified university documents.
                  </span>
                  <span>Shift + Enter for new line</span>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Contextual Information Panel */}
        {showSidePanel && (
          <aside className="hidden lg:flex w-80 flex-col border-l border-slate-800 bg-slate-900/40 p-4 space-y-5 overflow-y-auto shrink-0">
            {/* Announcements */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                  <Bell className="w-3.5 h-3.5 text-cyan-400" />
                  Verified Notices
                </span>
                <span className="text-[10px] text-slate-500">Live</span>
              </div>
              <div className="space-y-2.5">
                {VERIFIED_ANNOUNCEMENTS.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 space-y-1.5"
                  >
                    <div className="text-xs font-semibold text-slate-200">{ann.title}</div>
                    <div className="text-[10px] text-cyan-400 font-medium">{ann.date}</div>
                    <div className="text-[11px] text-slate-400 leading-relaxed">
                      {ann.summary}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Repository Links */}
            <div className="space-y-2 pt-3 border-t border-slate-800">
              <div className="text-xs font-semibold text-slate-200">Active Handbooks</div>
              <div className="space-y-1.5 text-xs">
                <div
                  onClick={() => onSelectPrompt('What are the grading percentages for A, B, and C grades?')}
                  className="p-2.5 rounded-lg bg-slate-950/50 hover:bg-slate-800/60 border border-slate-800/80 cursor-pointer flex items-center justify-between text-slate-300 hover:text-white"
                >
                  <span className="truncate">Grading Scale & Attendance</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div
                  onClick={() => onSelectPrompt('What are the semester tuition fees and installment due dates?')}
                  className="p-2.5 rounded-lg bg-slate-950/50 hover:bg-slate-800/60 border border-slate-800/80 cursor-pointer flex items-center justify-between text-slate-300 hover:text-white"
                >
                  <span className="truncate">Fee Deadlines & Installments</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div
                  onClick={() => onSelectPrompt('What are the prerequisite courses for CS305 Operating Systems?')}
                  className="p-2.5 rounded-lg bg-slate-950/50 hover:bg-slate-800/60 border border-slate-800/80 cursor-pointer flex items-center justify-between text-slate-300 hover:text-white"
                >
                  <span className="truncate">BSCS Course Prerequisites</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </div>
            </div>

            {/* Institutional Compliance Notice */}
            <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/40 text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-blue-300 block mb-1">Academic Integrity Note</strong>
              UniAssist AI does not hallucinate university policies. When no official document is present, the assistant directs you to the Registrar.
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
