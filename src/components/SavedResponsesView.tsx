import React, { useState, useEffect } from 'react';
import { SavedResponse, User, Citation } from '../types';
import {
  Bookmark,
  Search,
  Trash2,
  Copy,
  Check,
  Download,
  ExternalLink,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { marked } from 'marked';

interface SavedResponsesViewProps {
  currentUser: User;
  onOpenCitations?: (citations: Citation[]) => void;
}

export const SavedResponsesView: React.FC<SavedResponsesViewProps> = ({
  currentUser,
  onOpenCitations,
}) => {
  const [savedItems, setSavedItems] = useState<SavedResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchSaved = async () => {
    try {
      const res = await fetch('/api/saved', {
        headers: { 'x-user-id': currentUser.id },
      });
      const data = await res.json();
      if (data.savedResponses) setSavedItems(data.savedResponses);
    } catch (e) {
      console.error('Failed to load saved responses:', e);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, [currentUser.id]);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/saved/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': currentUser.id },
      });
      setSavedItems((prev) => prev.filter((item) => item.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExport = () => {
    if (savedItems.length === 0) return;
    const content = savedItems
      .map(
        (s, i) => `# ${i + 1}. Query: ${s.query}\n\n${s.answer}\n\nDate: ${new Date(
          s.createdAt
        ).toLocaleString()}\n\n---\n`
      )
      .join('\n');

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `UniAssist_Saved_Responses_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = savedItems.filter(
    (item) =>
      item.query.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="p-6 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Saved Responses & Research Notes
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
              {savedItems.length} Bookmarks
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Access verified institutional answers and academic explanations you previously bookmarked.
          </p>
        </div>

        {savedItems.length > 0 && (
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
          >
            <Download className="w-4 h-4" />
            Export as Markdown (.md)
          </button>
        )}
      </header>

      {/* Search */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/40">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved responses..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
              <Bookmark className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-300">No saved responses</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Bookmark useful academic answers in the chat workspace by clicking the bookmark icon on any message.
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 space-y-3 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                  {item.query}
                </h3>
                <span className="text-[10px] text-slate-500 shrink-0">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Answer content */}
              <div
                className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: marked.parse(item.answer) as string }}
              />

              {/* Citations link */}
              {item.citations && item.citations.length > 0 && (
                <div className="pt-1">
                  <button
                    onClick={() => onOpenCitations && onOpenCitations(item.citations!)}
                    className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    View {item.citations.length} Grounded Citations
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs text-slate-400">
                <span>Bookmarked answer</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(item.id, item.answer)}
                    className="p-1.5 hover:text-white rounded-lg"
                    title="Copy response"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 hover:text-rose-400 rounded-lg"
                    title="Remove bookmark"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
