import React, { useState, useEffect } from 'react';
import {
  DocumentItem,
  DocumentCategory,
  DocumentChunk,
  User,
} from '../types';
import { safeFetchJson } from '../utils/api';
import {
  FileText,
  Upload,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCw,
  Trash2,
  Eye,
  Plus,
  ShieldCheck,
  ChevronRight,
  X,
  FileCode,
} from 'lucide-react';

interface KnowledgeBaseViewProps {
  currentUser: User;
  onRefreshDocs?: () => void;
}

const CATEGORIES: DocumentCategory[] = [
  'Admissions',
  'Academic Calendar',
  'Examination Policies',
  'Fee Structure',
  'Scholarships',
  'Course Outlines',
  'Department Information',
  'Student Handbook',
  'University Notices',
  'General Academic Resources',
];

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({
  currentUser,
}) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [inspectingDoc, setInspectingDoc] = useState<{
    doc: DocumentItem;
    chunks: DocumentChunk[];
  } | null>(null);

  // Upload Form state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('General Academic Resources');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [directContent, setDirectContent] = useState('');
  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      const data = await safeFetchJson<{ documents: DocumentItem[] }>('/api/documents');
      if (data.documents) {
        setDocuments(data.documents);
      }
    } catch (e) {
      console.error('Failed to load documents:', e);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (!uploadTitle.trim()) {
      setUploadError('Document title is required');
      return;
    }

    if (uploadMode === 'file' && !uploadFile) {
      setUploadError('Please select a file to upload');
      return;
    }

    if (uploadMode === 'text' && !directContent.trim()) {
      setUploadError('Please provide document text content');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', uploadTitle.trim());
      formData.append('category', uploadCategory);

      if (uploadMode === 'file' && uploadFile) {
        formData.append('file', uploadFile);
      } else {
        formData.append('directContent', directContent.trim());
      }

      await safeFetchJson('/api/documents/upload', {
        method: 'POST',
        headers: {
          'x-user-id': currentUser.id,
        },
        body: formData,
      });

      // Reset form
      setUploadTitle('');
      setUploadFile(null);
      setDirectContent('');
      setShowUploadModal(false);
      await fetchDocuments();
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReprocess = async (docId: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}/reprocess`, {
        method: 'POST',
        headers: { 'x-user-id': currentUser.id },
      });
      if (res.ok) fetchDocuments();
    } catch (e) {
      console.error('Failed to reprocess:', e);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this university document?')) return;
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': currentUser.id },
      });
      if (res.ok) {
        fetchDocuments();
        if (inspectingDoc?.doc.id === docId) setInspectingDoc(null);
      }
    } catch (e) {
      console.error('Failed to delete:', e);
    }
  };

  const inspectChunks = async (doc: DocumentItem) => {
    try {
      const data = await safeFetchJson<{ chunks: DocumentChunk[] }>(`/api/documents/${doc.id}`);
      if (data.chunks) {
        setInspectingDoc({ doc, chunks: data.chunks });
      }
    } catch (e) {
      console.error('Failed to inspect document:', e);
    }
  };

  // Filter documents
  const filtered = documents.filter((doc) => {
    const matchesCategory =
      selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden text-slate-100">
      {/* Header */}
      <header className="p-6 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">
              University Knowledge Base
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {documents.filter((d) => d.status === 'indexed').length} Verified Indexed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative institutional repository used by UniAssist AI for grounded RAG generation.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all"
        >
          <Upload className="w-4 h-4" />
          Upload Official Document
        </button>
      </header>

      {/* Filter and Search Bar */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents by title or category..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Categories ({documents.length})
          </button>
          {CATEGORIES.slice(0, 5).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Table or Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-300">No documents found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No institutional documents match your search or category filter. Upload new official files above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col justify-between p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition-all space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-950/60 text-blue-300 border border-blue-900/60">
                      {doc.category}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        doc.status === 'indexed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : doc.status === 'processing'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {doc.status === 'indexed' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Indexed
                        </>
                      ) : doc.status === 'processing' ? (
                        <>
                          <Clock className="w-3 h-3 text-amber-400 animate-spin" />
                          Processing
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 text-rose-400" />
                          Failed
                        </>
                      )}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-white mt-2.5 line-clamp-2 leading-snug">
                    {doc.title}
                  </h3>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                    <span>{doc.chunkCount} vector chunks</span>
                    <span>•</span>
                    <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                    <span>•</span>
                    <span>v{doc.version}</span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="truncate max-w-[120px]">
                    {doc.uploaderName || 'Administrator'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => inspectChunks(doc)}
                      className="p-1.5 rounded-lg hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                      title="Inspect extracted RAG chunks"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReprocess(doc.id)}
                      className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition-colors"
                      title="Reprocess & regenerate embeddings"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                    {(currentUser.role === 'admin' || currentUser.id === doc.uploadedBy) && (
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 rounded-lg hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Delete document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-400" />
                Upload University Document
              </h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                  {uploadError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g., Computer Engineering Course Catalog Fall 2026"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Category *
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-blue-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mode Toggle */}
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
                    uploadMode === 'file'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  File Upload (.pdf, .docx, .txt, .md)
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('text')}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
                    uploadMode === 'text'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Direct Text Paste
                </button>
              </div>

              {uploadMode === 'file' ? (
                <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-2xl p-6 text-center transition-colors">
                  <input
                    type="file"
                    id="doc-file-input"
                    accept=".pdf,.docx,.doc,.txt,.md"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label htmlFor="doc-file-input" className="cursor-pointer block">
                    <FileText className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <span className="text-xs font-semibold text-slate-200 block">
                      {uploadFile ? uploadFile.name : 'Click to select document'}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Supports PDF, DOCX, TXT, Markdown (Max 15MB)
                    </span>
                  </label>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Document Text Content
                  </label>
                  <textarea
                    rows={6}
                    value={directContent}
                    onChange={(e) => setDirectContent(e.target.value)}
                    placeholder="Paste the full policy or handbook text here..."
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-semibold text-white shadow-md"
                >
                  {isUploading ? 'Ingesting & Chunking...' : 'Upload & Index'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Document Chunks Modal */}
      {inspectingDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
              <div>
                <h2 className="text-base font-semibold text-white">
                  RAG Chunks: {inspectingDoc.doc.title}
                </h2>
                <p className="text-xs text-slate-400">
                  {inspectingDoc.chunks.length} semantically indexed chunks stored in vector memory
                </p>
              </div>
              <button
                onClick={() => setInspectingDoc(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {inspectingDoc.chunks.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-cyan-300">
                      Chunk #{c.chunkIndex + 1}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Est. Page {c.pageNumber} • {c.chunkText.split(/\s+/).length} words
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                    {c.chunkText}
                  </p>
                </div>
              ))}
            </div>

            <div className="px-6 py-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectingDoc(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
