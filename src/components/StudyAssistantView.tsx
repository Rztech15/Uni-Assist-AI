import React, { useState, useEffect } from 'react';
import { User, QuizQuestion, StudyPlanItem } from '../types';
import { safeFetchJson } from '../utils/api';
import {
  BookOpen,
  Calculator,
  CheckCircle,
  Clock,
  Sparkles,
  HelpCircle,
  Plus,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Check,
  ChevronRight,
  ListOrdered,
  Calendar,
  Menu,
} from 'lucide-react';
import { marked } from 'marked';

interface StudyAssistantViewProps {
  currentUser: User;
  onPlanUpdated?: () => void;
  onOpenMobileMenu?: () => void;
  onToggleDesktopSidebar?: () => void;
}

export const StudyAssistantView: React.FC<StudyAssistantViewProps> = ({
  currentUser,
  onPlanUpdated,
  onOpenMobileMenu,
  onToggleDesktopSidebar,
}) => {
  const [activeTab, setActiveTab] = useState<'explain' | 'math' | 'exam' | 'planner'>('explain');

  // Concept Explainer state
  const [topic, setTopic] = useState('Dynamic Programming Memoization vs Tabulation');
  const [difficulty, setDifficulty] = useState<'introductory' | 'undergraduate' | 'advanced'>('undergraduate');
  const [subject, setSubject] = useState('Data Structures & Algorithms');
  const [explanationResult, setExplanationResult] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  // Math Assistant state
  const [mathProblem, setMathProblem] = useState(
    'Find the eigenvalues and eigenvectors of the matrix: A = [[4, 2], [1, 3]]'
  );
  const [mathSolution, setMathSolution] = useState<string | null>(null);
  const [isSolvingMath, setIsSolvingMath] = useState(false);

  // Exam Preparation / Quiz state
  const [quizTopic, setQuizTopic] = useState('Operating Systems: Process Scheduling & Concurrency');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showExplanations, setShowExplanations] = useState<Record<string, boolean>>({});

  // Study Planner state
  const [plans, setPlans] = useState<StudyPlanItem[]>([]);
  const [newPlanSubject, setNewPlanSubject] = useState('');
  const [newPlanTargetDate, setNewPlanTargetDate] = useState('2026-12-05');
  const [newPlanHours, setNewPlanHours] = useState(3);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);

  // Load existing study plans
  const fetchPlans = async () => {
    try {
      const data = await safeFetchJson<{ plans: StudyPlanItem[] }>('/api/study/plans', {
        headers: { 'x-user-id': currentUser.id },
      });
      if (data.plans) setPlans(data.plans);
    } catch (e) {
      console.error('Failed to load study plans:', e);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [currentUser.id]);

  // Concept Explainer handler
  const handleExplain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setIsExplaining(true);
    try {
      const data = await safeFetchJson<{ explanation: string }>('/api/study/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, difficulty, subject }),
      });
      setExplanationResult(data.explanation);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExplaining(false);
    }
  };

  // Math Assistant handler
  const handleSolveMath = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mathProblem.trim()) return;
    setIsSolvingMath(true);
    try {
      const data = await safeFetchJson<{ solution: string }>('/api/study/math', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem: mathProblem }),
      });
      setMathSolution(data.solution);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSolvingMath(false);
    }
  };

  // Quiz generator handler
  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTopic.trim()) return;
    setIsGeneratingQuiz(true);
    setSelectedAnswers({});
    setShowExplanations({});
    try {
      const data = await safeFetchJson<{ questions: QuizQuestion[] }>('/api/study/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: quizTopic, count: 4 }),
      });
      if (data.questions) setQuestions(data.questions);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // Select quiz answer
  const handleSelectAnswer = (qId: string, optionIdx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
    setShowExplanations((prev) => ({ ...prev, [qId]: true }));
  };

  // Create Study Plan
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanSubject.trim()) return;
    setIsCreatingPlan(true);
    try {
      const data = await safeFetchJson<{ plan: StudyPlanItem }>('/api/study/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          subject: newPlanSubject,
          targetDate: newPlanTargetDate,
          dailyHours: newPlanHours,
        }),
      });
      if (data.plan) {
        setPlans((prev) => [data.plan, ...prev]);
        setNewPlanSubject('');
        if (onPlanUpdated) onPlanUpdated();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingPlan(false);
    }
  };

  // Toggle study plan item completed
  const handleToggleScheduleItem = async (plan: StudyPlanItem, itemIdx: number) => {
    const updatedSchedule = [...plan.schedule];
    updatedSchedule[itemIdx] = {
      ...updatedSchedule[itemIdx],
      completed: !updatedSchedule[itemIdx].completed,
    };

    const completedCount = updatedSchedule.filter((s) => s.completed).length;
    const newProgress = Math.round((completedCount / updatedSchedule.length) * 100);

    // Optimistic update
    setPlans((prev) =>
      prev.map((p) =>
        p.id === plan.id ? { ...p, schedule: updatedSchedule, progress: newProgress } : p
      )
    );

    if (onPlanUpdated) onPlanUpdated();

    try {
      await fetch(`/api/study/plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progress: newProgress,
          schedule: updatedSchedule,
        }),
      });
    } catch (e) {
      console.error('Failed to sync plan progress:', e);
    }
  };

  // Delete plan
  const handleDeletePlan = async (planId: string) => {
    try {
      await fetch(`/api/study/plans/${planId}`, { method: 'DELETE' });
      setPlans((prev) => prev.filter((p) => p.id !== planId));
      if (onPlanUpdated) onPlanUpdated();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="p-4 md:p-6 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onOpenMobileMenu && (
              <button
                onClick={onOpenMobileMenu}
                aria-label="Open navigation menu"
                className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
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
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Study Assistant & Academic Accelerator
                </h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  AI Learning Suite
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Deep concept explanations, step-by-step mathematical problem solving, practice MCQs, and custom revision planners.
              </p>
            </div>
          </div>

          {/* Module Tabs */}
          <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
            <button
              onClick={() => setActiveTab('explain')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'explain'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Concept Explainer
            </button>
            <button
              onClick={() => setActiveTab('math')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'math'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              Math Assistant
            </button>
            <button
              onClick={() => setActiveTab('exam')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'exam'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Exam Practice (MCQs)
            </button>
            <button
              onClick={() => setActiveTab('planner')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'planner'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Study Planner
            </button>
          </div>
        </div>
      </header>

      {/* Tab Content Container */}
      <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
        {/* 1. CONCEPT EXPLAINER */}
        {activeTab === 'explain' && (
          <div className="space-y-6">
            <form onSubmit={handleExplain} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                Adaptive Concept Explainer
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Concept or Topic
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Fourier Transform, Bayes Theorem, TCP Handshake"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="introductory">Introductory (Beginner)</option>
                    <option value="undergraduate">Undergraduate (College)</option>
                    <option value="advanced">Advanced (Graduate/Research)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  Includes intuitive breakdown, worked examples, and misconceptions.
                </span>
                <button
                  type="submit"
                  disabled={isExplaining}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isExplaining ? 'Analyzing Concept...' : 'Explain Topic'}
                </button>
              </div>
            </form>

            {explanationResult && (
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-cyan-300">{topic}</h3>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                    {difficulty} Level
                  </span>
                </div>
                <div
                  className="text-sm text-slate-200 leading-relaxed prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: marked.parse(explanationResult) as string }}
                />
              </div>
            )}
          </div>
        )}

        {/* 2. MATH ASSISTANT */}
        {activeTab === 'math' && (
          <div className="space-y-6">
            <form onSubmit={handleSolveMath} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                Step-by-Step Mathematical Solver
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mathematical Problem / Proof / Equation
                </label>
                <textarea
                  rows={3}
                  value={mathProblem}
                  onChange={(e) => setMathProblem(e.target.value)}
                  placeholder="e.g. Solve the second order ODE: y'' + 4y' + 4y = 0 with initial conditions y(0)=1, y'(0)=0"
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  Explains applicable theorems, algebraic steps, and sanity checks.
                </span>
                <button
                  type="submit"
                  disabled={isSolvingMath}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  {isSolvingMath ? 'Deriving Solution...' : 'Solve Step-by-Step'}
                </button>
              </div>
            </form>

            {mathSolution && (
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-emerald-400">Mathematical Derivation</h3>
                  <span className="text-[11px] text-slate-400 font-medium">Verified by Gemini</span>
                </div>
                <div
                  className="text-sm text-slate-200 leading-relaxed prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: marked.parse(mathSolution) as string }}
                />
              </div>
            )}
          </div>
        )}

        {/* 3. EXAM PREP / QUIZ */}
        {activeTab === 'exam' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>Notice:</strong> These are AI-generated practice questions designed for revision and concept reinforcement. They do not represent official leaked university exam papers.
              </div>
            </div>

            <form onSubmit={handleGenerateQuiz} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-amber-400" />
                Practice MCQ & Quiz Generator
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Exam Revision Topic
                </label>
                <input
                  type="text"
                  value={quizTopic}
                  onChange={(e) => setQuizTopic(e.target.value)}
                  placeholder="e.g. Database Transactions & ACID Properties, Computer Networks Subnetting"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isGeneratingQuiz}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isGeneratingQuiz ? 'Creating Practice Quiz...' : 'Generate 4 Practice MCQs'}
                </button>
              </div>
            </form>

            {/* Quiz Questions Display */}
            {questions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
                  <span>PRACTICE QUESTIONS ({questions.length})</span>
                  <span>Click any option to reveal the verified academic explanation</span>
                </div>

                {questions.map((q, qIdx) => {
                  const selectedOpt = selectedAnswers[q.id];
                  const isAnswered = selectedOpt !== undefined;
                  const isCorrect = isAnswered && selectedOpt === q.correctIndex;

                  return (
                    <div
                      key={q.id}
                      className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-semibold text-slate-100">
                          {qIdx + 1}. {q.question}
                        </h3>
                        <span className="text-[10px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded-full shrink-0">
                          {q.concept}
                        </span>
                      </div>

                      {/* Options */}
                      <div className="space-y-2 pt-1">
                        {q.options.map((opt, optIdx) => {
                          let optStyle =
                            'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60';

                          if (isAnswered) {
                            if (optIdx === q.correctIndex) {
                              optStyle = 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 font-semibold';
                            } else if (optIdx === selectedOpt) {
                              optStyle = 'bg-rose-950/40 border-rose-500/60 text-rose-200 font-semibold';
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleSelectAnswer(q.id, optIdx)}
                              className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs text-left transition-all ${optStyle}`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-semibold text-slate-400">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span>{opt}</span>
                              </div>
                              {isAnswered && optIdx === q.correctIndex && (
                                <Check className="w-4 h-4 text-emerald-400" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation box */}
                      {showExplanations[q.id] && (
                        <div
                          className={`p-3.5 rounded-xl border text-xs leading-relaxed mt-2 ${
                            isCorrect
                              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                              : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                          }`}
                        >
                          <strong className="block mb-1">
                            {isCorrect ? 'Correct! ' : 'Incorrect: '} Explanation
                          </strong>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 4. STUDY PLANNER */}
        {activeTab === 'planner' && (
          <div className="space-y-6">
            {/* Create Plan Form */}
            <form onSubmit={handleCreatePlan} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                Generate Personalized Revision Schedule
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Subject / Course
                  </label>
                  <input
                    type="text"
                    value={newPlanSubject}
                    onChange={(e) => setNewPlanSubject(e.target.value)}
                    placeholder="e.g. CS201 Data Structures"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Target Exam Date
                  </label>
                  <input
                    type="date"
                    value={newPlanTargetDate}
                    onChange={(e) => setNewPlanTargetDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Daily Study Target (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.5"
                    value={newPlanHours}
                    onChange={(e) => setNewPlanHours(parseFloat(e.target.value) || 2)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isCreatingPlan}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isCreatingPlan ? 'Generating Schedule...' : 'Create Study Plan'}
                </button>
              </div>
            </form>

            {/* Existing Plans */}
            <div className="space-y-4">
              <div className="text-xs font-semibold text-slate-400 px-1">
                ACTIVE REVISION SCHEDULES ({plans.length})
              </div>

              {plans.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500">
                  No active study plans yet. Generate one above to track daily topics!
                </div>
              ) : (
                plans.map((p) => (
                  <div
                    key={p.id}
                    className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-white">{p.title}</h3>
                        <p className="text-xs text-cyan-400 font-medium">{p.subject}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                          {p.progress}% Completed
                        </span>
                        <button
                          onClick={() => handleDeletePlan(p.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg"
                          title="Delete plan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-blue-500 to-cyan-400 transition-all duration-300"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>

                    {/* Checklist */}
                    <div className="space-y-2 pt-2">
                      {p.schedule.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleToggleScheduleItem(p, idx)}
                          className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                            item.completed
                              ? 'bg-slate-950/40 border-slate-800 text-slate-400 line-through'
                              : 'bg-slate-950/80 border-slate-800/80 text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={item.completed}
                              onChange={() => {}} // handled by parent div onClick
                              className="rounded border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                            />
                            <span>
                              <strong className="text-slate-300 mr-2">{item.day}:</strong>
                              {item.topic}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 shrink-0">
                            {item.hours} hrs
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
