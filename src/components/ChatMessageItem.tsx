import React, { useState } from 'react';
import { Message, Citation } from '../types';
import {
  Copy,
  Check,
  ShieldCheck,
  RotateCw,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  GraduationCap,
  Sparkles,
  Info,
} from 'lucide-react';
import { marked } from 'marked';

interface ChatMessageItemProps {
  message: Message;
  isLastAssistant?: boolean;
  onRegenerate?: () => void;
  onSave?: (message: Message) => void;
  onOpenCitations?: (citations: Citation[]) => void;
  onFeedback?: (messageId: string, rating: 'like' | 'dislike', comment?: string) => void;
  isSaved?: boolean;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  isLastAssistant,
  onRegenerate,
  onSave,
  onOpenCitations,
  onFeedback,
  isSaved = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [rated, setRated] = useState<'like' | 'dislike' | null>(message.rating || null);
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState('');

  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedbackClick = (rating: 'like' | 'dislike') => {
    setRated(rating);
    if (rating === 'dislike') {
      setShowFeedbackInput(true);
    } else {
      if (onFeedback) onFeedback(message.id, 'like');
    }
  };

  const submitFeedbackComment = () => {
    if (onFeedback && rated) {
      onFeedback(message.id, rated, feedbackComment);
    }
    setShowFeedbackInput(false);
  };

  // Safe parse Markdown
  const renderedContent = React.useMemo(() => {
    try {
      return marked.parse(message.content) as string;
    } catch {
      return message.content;
    }
  }, [message.content]);

  return (
    <div
      className={`group relative flex gap-4 px-4 py-5 rounded-2xl transition-all duration-200 ${
        isUser
          ? 'bg-slate-800/30 border border-slate-700/30 hover:border-slate-700/60 ml-auto max-w-2xl'
          : 'bg-slate-900/60 border border-slate-800 hover:border-slate-700/70 w-full'
      }`}
    >
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        {isUser ? (
          <div className="w-8 h-8 rounded-xl bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-xs font-semibold shadow-md shadow-blue-900/30">
            You
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-linear-to-br from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <GraduationCap className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Header meta */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-200">
              {isUser ? 'You' : 'UniAssist AI'}
            </span>
            {!isUser && message.isVerifiedAcademic && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Verified Academic Source
              </span>
            )}
            {!isUser && !message.isVerifiedAcademic && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Academic Guidance
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* Message Text with HTML/Markdown */}
        <div
          className="text-sm text-slate-200 leading-relaxed space-y-2 prose prose-invert max-w-none prose-p:my-1.5 prose-headings:text-slate-100 prose-headings:font-semibold prose-strong:text-cyan-200 prose-ul:my-1 prose-li:my-0.5 prose-code:text-cyan-300 prose-code:bg-slate-950/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800"
          dangerouslySetInnerHTML={{ __html: renderedContent }}
        />

        {/* Citations Snippets / Badge */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => onOpenCitations && onOpenCitations(message.citations!)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 border border-blue-500/30 hover:border-blue-400/60 text-xs text-blue-200 font-medium transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {message.citations.length} Verified Document{' '}
                {message.citations.length > 1 ? 'Citations' : 'Citation'}
              </span>
              <ExternalLink className="w-3 h-3 text-slate-400 ml-1" />
            </button>
          </div>
        )}

        {/* Action Toolbar for Assistant Messages */}
        {!isUser && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-slate-400">
            <div className="flex items-center gap-1">
              {/* Copy */}
              <button
                onClick={handleCopy}
                aria-label="Copy response"
                className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800/80 transition-colors"
                title="Copy response"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Bookmark */}
              {onSave && (
                <button
                  onClick={() => onSave(message)}
                  aria-label="Bookmark response"
                  className={`p-1.5 rounded-lg transition-colors ${
                    isSaved
                      ? 'text-cyan-400 bg-cyan-950/40'
                      : 'hover:text-white hover:bg-slate-800/80'
                  }`}
                  title={isSaved ? 'Saved in Saved Responses' : 'Save response'}
                >
                  {isSaved ? (
                    <BookmarkCheck className="w-3.5 h-3.5 text-cyan-400" />
                  ) : (
                    <Bookmark className="w-3.5 h-3.5" />
                  )}
                </button>
              )}

              {/* Regenerate if last assistant */}
              {isLastAssistant && onRegenerate && (
                <button
                  onClick={onRegenerate}
                  aria-label="Regenerate response"
                  className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800/80 transition-colors"
                  title="Regenerate answer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Thumbs up / down feedback */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleFeedbackClick('like')}
                aria-label="Helpful response"
                className={`p-1.5 rounded-lg transition-colors ${
                  rated === 'like'
                    ? 'text-emerald-400 bg-emerald-950/30'
                    : 'hover:text-emerald-400 hover:bg-slate-800/80'
                }`}
                title="Accurate and helpful"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleFeedbackClick('dislike')}
                aria-label="Inaccurate or unhelpful"
                className={`p-1.5 rounded-lg transition-colors ${
                  rated === 'dislike'
                    ? 'text-rose-400 bg-rose-950/30'
                    : 'hover:text-rose-400 hover:bg-slate-800/80'
                }`}
                title="Report issue or inaccuracy"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Feedback Reason Dialog */}
        {showFeedbackInput && (
          <div className="p-3 mt-2 rounded-xl bg-slate-950/90 border border-slate-700/80 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">How can we improve this answer?</span>
              <button
                onClick={() => setShowFeedbackInput(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <textarea
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="e.g., Policy detail was incomplete or needs newer semester handbook..."
              className="w-full h-16 p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-hidden focus:border-blue-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowFeedbackInput(false)}
                className="px-3 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={submitFeedbackComment}
                className="px-3 py-1 rounded bg-blue-600 text-white font-medium hover:bg-blue-500 text-xs"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
