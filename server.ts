import express from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from './server/db.ts';
import {
  generateChatResponse,
  generateEmbedding,
  explainConcept,
  solveMathProblem,
  generateQuizQuestions,
  generateStudyPlan,
} from './server/gemini.ts';
import { chunkText, cleanDocumentText, rankChunks, buildCitations } from './server/rag.ts';
import mammoth from 'mammoth';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure upload directory exists
const UPLOADS_DIR = path.resolve(process.cwd(), '.uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const upload = multer({
  dest: UPLOADS_DIR,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

// Helper: Extract authenticated user from headers or default to primary active student
function getAuthUser(req: Request) {
  const userId = (req.headers['x-user-id'] as string) || 'user-student-1';
  return db.getUserById(userId) || db.getUsers()[0];
}

// -----------------------------------------------------------------------------
// AUTHENTICATION APIS
// -----------------------------------------------------------------------------
app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  res.json({ success: true, user });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { fullName, email, role, department, university } = req.body;
  if (!fullName || !email) {
    return res.status(400).json({ error: 'Full name and email are required' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'User with this email already exists' });
  }

  const newUser = db.createUser({
    fullName,
    email,
    role: role || 'student',
    department: department || 'General Studies',
    university: university || 'UniAssist Metropolitan University',
  });

  res.status(201).json({ success: true, user: newUser });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'No account found with this email' });
  }

  res.json({ success: true, user });
});

app.post('/api/auth/logout', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

app.post('/api/auth/switch-role', (req: Request, res: Response) => {
  const { role } = req.body;
  const user = getAuthUser(req);
  if (!['student', 'faculty', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const updated = db.updateUserRole(user.id, role);
  res.json({ success: true, user: updated });
});

// -----------------------------------------------------------------------------
// CONVERSATIONS & CHAT APIS
// -----------------------------------------------------------------------------
app.get('/api/conversations', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const convs = db.getConversations(user.id);
  res.json({ success: true, conversations: convs });
});

app.post('/api/conversations', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const { title } = req.body;
  const conv = db.createConversation(user.id, title || 'New Conversation');
  res.status(201).json({ success: true, conversation: conv });
});

app.get('/api/conversations/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const conv = db.getConversationById(id);
  if (!conv) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const messages = db.getMessages(id);
  res.json({ success: true, conversation: conv, messages });
});

app.patch('/api/conversations/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { title } = req.body;
  const updated = db.updateConversationTitle(id, title);
  if (!updated) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  res.json({ success: true, conversation: updated });
});

app.delete('/api/conversations/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = db.deleteConversation(id);
  res.json({ success: deleted });
});

// POST /api/chat - Standard Chat Completion with RAG
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    const { message, conversationId, language } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message content is required' });
    }

    let activeConvId = conversationId;
    if (!activeConvId) {
      // Create new conversation automatically
      const title = message.slice(0, 36) + (message.length > 36 ? '...' : '');
      const newConv = db.createConversation(user.id, title);
      activeConvId = newConv.id;
    }

    // Save user message
    const userMsg = db.addMessage({
      conversationId: activeConvId,
      role: 'user',
      content: message,
      language: language || 'en',
    });

    // 1. RAG Semantic & Keyword Retrieval
    const allChunks = db.getAllChunks();
    const queryEmbedding = await generateEmbedding(message);
    const ranked = rankChunks(message, queryEmbedding, allChunks, 4, 0.22);
    const citations = buildCitations(ranked);

    // 2. Fetch history for context
    const previousMessages = db.getMessages(activeConvId);
    const history = previousMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // 3. Generate AI Answer
    const aiResult = await generateChatResponse({
      userQuery: message,
      conversationHistory: history,
      citations,
      userRole: user.role,
      userName: user.fullName,
    });

    // 4. Save Assistant message
    const assistantMsg = db.addMessage({
      conversationId: activeConvId,
      role: 'assistant',
      content: aiResult.text,
      citations: citations.length > 0 ? citations : undefined,
      isVerifiedAcademic: aiResult.isVerifiedAcademic,
      language: language || 'en',
    });

    res.json({
      success: true,
      conversationId: activeConvId,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      citations,
    });
  } catch (err: any) {
    console.error('Chat API error:', err);
    res.status(500).json({ error: 'Internal server error while processing message' });
  }
});

// POST /api/chat/stream - Server-Sent Events (SSE) Streaming
app.post('/api/chat/stream', async (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    const { message, conversationId, language } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let activeConvId = conversationId;
    if (!activeConvId) {
      const title = message.slice(0, 36) + (message.length > 36 ? '...' : '');
      const newConv = db.createConversation(user.id, title);
      activeConvId = newConv.id;
    }

    db.addMessage({
      conversationId: activeConvId,
      role: 'user',
      content: message,
      language: language || 'en',
    });

    // Setup SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // RAG Retrieval
    const allChunks = db.getAllChunks();
    const queryEmbedding = await generateEmbedding(message);
    const ranked = rankChunks(message, queryEmbedding, allChunks, 4, 0.22);
    const citations = buildCitations(ranked);

    // Send metadata event
    res.write(`event: meta\ndata: ${JSON.stringify({ conversationId: activeConvId, citations })}\n\n`);

    const previousMessages = db.getMessages(activeConvId);
    const history = previousMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const aiResult = await generateChatResponse({
      userQuery: message,
      conversationHistory: history,
      citations,
      userRole: user.role,
      userName: user.fullName,
    });

    // Stream text in small chunks for smooth typing effect
    const fullText = aiResult.text;
    const words = fullText.split(' ');
    for (let i = 0; i < words.length; i += 3) {
      const chunk = words.slice(i, i + 3).join(' ') + (i + 3 < words.length ? ' ' : '');
      res.write(`event: chunk\ndata: ${JSON.stringify({ text: chunk })}\n\n`);
      await new Promise((r) => setTimeout(r, 20));
    }

    // Save final message in database
    const assistantMsg = db.addMessage({
      conversationId: activeConvId,
      role: 'assistant',
      content: fullText,
      citations: citations.length > 0 ? citations : undefined,
      isVerifiedAcademic: aiResult.isVerifiedAcademic,
      language: language || 'en',
    });

    res.write(`event: done\ndata: ${JSON.stringify({ message: assistantMsg })}\n\n`);
    res.end();
  } catch (err: any) {
    console.error('Chat stream error:', err);
    res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// -----------------------------------------------------------------------------
// DOCUMENT MANAGEMENT & RAG INGESTION APIS
// -----------------------------------------------------------------------------
app.get('/api/documents', (_req: Request, res: Response) => {
  const documents = db.getDocuments();
  res.json({ success: true, documents });
});

app.get('/api/documents/:id', (req: Request, res: Response) => {
  const doc = db.getDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }
  const chunks = db.getChunksByDocumentId(req.params.id);
  res.json({ success: true, document: doc, chunks });
});

// POST /api/documents/upload
app.post('/api/documents/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    const { title, category, directContent } = req.body;
    const file = req.file;

    if (!title) {
      return res.status(400).json({ error: 'Document title is required' });
    }

    let extractedText = '';
    let fileName = 'pasted_document.txt';
    let fileSize = 0;

    if (file) {
      fileName = file.originalname;
      fileSize = file.size;
      const ext = path.extname(file.originalname).toLowerCase();

      if (ext === '.docx') {
        const result = await mammoth.extractRawText({ path: file.path });
        extractedText = result.value;
      } else {
        // Plain text, markdown, or csv
        extractedText = fs.readFileSync(file.path, 'utf-8');
      }

      // Cleanup temp uploaded file
      try {
        fs.unlinkSync(file.path);
      } catch (e) {}
    } else if (directContent) {
      extractedText = directContent;
      fileSize = Buffer.byteLength(directContent, 'utf-8');
    } else {
      return res.status(400).json({ error: 'Please provide either a file or text content' });
    }

    const cleaned = cleanDocumentText(extractedText);
    if (!cleaned) {
      return res.status(400).json({ error: 'Could not extract readable text from document' });
    }

    // Create document record in database
    const newDoc = db.addDocument({
      title,
      category: category || 'General Academic Resources',
      fileName,
      fileSize,
      status: 'processing',
      version: 1,
      chunkCount: 0,
      uploadedBy: user.id,
      uploaderName: user.fullName,
    });

    // Chunking text
    const chunks = chunkText(cleaned, newDoc.id, newDoc.title, newDoc.category, 300, 50);

    // Generate embeddings in background or inline
    for (const chunk of chunks) {
      const emb = await generateEmbedding(chunk.chunkText);
      if (emb) chunk.embedding = emb;
    }

    // Save chunks to database
    db.saveChunks(chunks);

    // Update document status to indexed
    const updated = db.updateDocumentStatus(newDoc.id, 'indexed', chunks.length);

    res.status(201).json({
      success: true,
      document: updated,
      chunksCount: chunks.length,
    });
  } catch (err: any) {
    console.error('Document upload error:', err);
    res.status(500).json({ error: 'Failed to process and index document: ' + err.message });
  }
});

// Reprocess document
app.post('/api/documents/:id/reprocess', async (req: Request, res: Response) => {
  const { id } = req.params;
  const doc = db.getDocumentById(id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const chunks = db.getChunksByDocumentId(id);
  for (const chunk of chunks) {
    if (!chunk.embedding) {
      const emb = await generateEmbedding(chunk.chunkText);
      if (emb) chunk.embedding = emb;
    }
  }
  db.saveChunks(chunks);
  const updated = db.updateDocumentStatus(id, 'indexed', chunks.length);
  res.json({ success: true, document: updated });
});

// Delete document (Admins or Uploader only)
app.delete('/api/documents/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const { id } = req.params;
  const doc = db.getDocumentById(id);

  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  // Permission check
  if (user.role !== 'admin' && doc.uploadedBy !== user.id) {
    return res.status(403).json({ error: 'Unauthorized: Only administrators can delete university documents' });
  }

  const success = db.deleteDocument(id);
  res.json({ success });
});

// -----------------------------------------------------------------------------
// STUDY ASSISTANT MODULE APIS
// -----------------------------------------------------------------------------
app.post('/api/study/explain', async (req: Request, res: Response) => {
  try {
    const { topic, difficulty, subject } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    const explanation = await explainConcept({
      topic,
      difficulty: difficulty || 'undergraduate',
      subject,
    });

    res.json({ success: true, explanation });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/study/math', async (req: Request, res: Response) => {
  try {
    const { problem } = req.body;
    if (!problem) return res.status(400).json({ error: 'Mathematical problem is required' });

    const solution = await solveMathProblem(problem);
    res.json({ success: true, solution });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/study/quiz', async (req: Request, res: Response) => {
  try {
    const { topic, count } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    const questions = await generateQuizQuestions(topic, count || 4);
    res.json({ success: true, questions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/study/plan', async (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    const { subject, targetDate, dailyHours } = req.body;
    if (!subject) return res.status(400).json({ error: 'Subject is required' });

    const generated = await generateStudyPlan(subject, targetDate || '2026-12-01', dailyHours || 2.5);

    const savedPlan = db.saveStudyPlan({
      userId: user.id,
      title: generated.title || `Study Plan: ${subject}`,
      subject,
      targetExamDate: targetDate,
      schedule: generated.schedule,
      progress: 0,
    });

    res.status(201).json({ success: true, plan: savedPlan });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/study/plans', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const plans = db.getStudyPlans(user.id);
  res.json({ success: true, plans });
});

app.patch('/api/study/plans/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { progress, schedule } = req.body;
  const updated = db.updateStudyPlan(id, progress, schedule);
  if (!updated) return res.status(404).json({ error: 'Study plan not found' });
  res.json({ success: true, plan: updated });
});

app.delete('/api/study/plans/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const success = db.deleteStudyPlan(id);
  res.json({ success });
});

// -----------------------------------------------------------------------------
// SAVED RESPONSES & BOOKMARKS
// -----------------------------------------------------------------------------
app.get('/api/saved', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const saved = db.getSavedResponses(user.id);
  res.json({ success: true, savedResponses: saved });
});

app.post('/api/saved', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const { messageId, query, answer, citations } = req.body;
  if (!query || !answer) {
    return res.status(400).json({ error: 'Query and answer are required' });
  }

  const saved = db.saveResponse({
    userId: user.id,
    messageId: messageId || `ext-${Date.now()}`,
    query,
    answer,
    citations,
  });

  res.status(201).json({ success: true, savedResponse: saved });
});

app.delete('/api/saved/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const success = db.removeSavedResponse(req.params.id, user.id);
  res.json({ success });
});

// -----------------------------------------------------------------------------
// FEEDBACK API
// -----------------------------------------------------------------------------
app.post('/api/feedback', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const { messageId, rating, comments } = req.body;
  if (!messageId || !['like', 'dislike'].includes(rating)) {
    return res.status(400).json({ error: 'Valid messageId and rating (like/dislike) required' });
  }

  const result = db.addFeedback({
    userId: user.id,
    messageId,
    rating,
    comments,
  });

  res.json({ success: true, feedback: result });
});

// -----------------------------------------------------------------------------
// ADMIN DASHBOARD & ANALYTICS APIS
// -----------------------------------------------------------------------------
app.get('/api/admin/dashboard', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Access forbidden: Administrator privileges required' });
  }

  const analytics = db.getAnalytics();
  res.json({ success: true, analytics });
});

app.get('/api/admin/users', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Access forbidden: Administrator privileges required' });
  }

  const users = db.getUsers();
  res.json({ success: true, users });
});

app.patch('/api/admin/users/:id/role', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Access forbidden: Administrator privileges required' });
  }

  const { role } = req.body;
  const updated = db.updateUserRole(req.params.id, role);
  if (!updated) return res.status(404).json({ error: 'User not found' });
  res.json({ success: true, user: updated });
});

// -----------------------------------------------------------------------------
// VITE INTEGRATION FOR FULL-STACK APPLICATION
// -----------------------------------------------------------------------------
async function startServer() {
  const distPath = path.resolve(process.cwd(), 'dist');
  if (process.env.NODE_ENV === 'production' && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Vite dev server middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`UniAssist AI server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start UniAssist AI server:', err);
});
