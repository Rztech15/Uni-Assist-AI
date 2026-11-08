# UniAssist AI — Professional Full-Stack AI University Assistant

> **Tagline:** *Your University. Your Knowledge. One AI Assistant.*

UniAssist AI is a production-grade academic intelligence platform designed to help university students, faculty members, and academic administrators access institutional information, understand exam policies, explore curricula, prepare for examinations, and query university documents through natural conversation.

---

## 🏛️ Core Features

1. **Retrieval-Augmented Generation (RAG) Engine**
   - Ingests university handbooks, grading policies, and course outlines (`.pdf`, `.docx`, `.txt`, `.md`).
   - Text normalization, paragraph chunking with sliding-window overlap, and page-level metadata.
   - Vector similarity using `@google/genai` embeddings (`gemini-embedding-2-preview`) combined with BM25 hybrid term scoring.
   - Interactive citations modal revealing exact source title, page number, section, and excerpt.
   - Strict hallucination prevention: Responds with a standard verification warning when institutional rules are not documented.

2. **Conversational AI Experience**
   - Powered server-side by Google Gemini `gemini-3.8-flash`.
   - Multi-turn conversational memory within active sessions.
   - Multilingual support: English, Urdu (اردو), and Roman Urdu.
   - Markdown formatting with code blocks, tables, and lists.
   - Message feedback (thumbs up / thumbs down with reason dialog), copy actions, and regeneration.

3. **Study Assistant Suite**
   - **Adaptive Concept Explainer:** Step-by-step breakdowns, worked examples, and misconceptions customized for Introductory, Undergraduate, or Advanced difficulty.
   - **Math Assistant:** Step-by-step mathematical problem solver, theorems, derivations, and sanity checks.
   - **Exam Preparation (MCQs):** Topic-wise practice quiz generator with instant answer verification and concept explanations.
   - **Study Planner:** Automated revision schedule generator with interactive progress tracking.

4. **University Knowledge Base**
   - Category-based document organization (Admissions, Academic Calendar, Examination Policies, Fee Structure, Scholarships, etc.).
   - Multi-format document upload (file upload or direct text paste).
   - Real-time indexing status monitoring (Pending, Processing, Indexed, Failed).
   - Ingestion inspector: view vector chunks, token counts, and page numbers.

5. **Role-Based Access Control (RBAC) & Admin Dashboard**
   - Roles: `Student`, `Faculty`, and `Administrator`.
   - Real database analytics: active users, total queries, indexed documents, and user satisfaction scores.
   - User and role management table with permission assignment.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide React icons, Marked.js.
- **Backend:** Node.js, Express REST API, Multer (file parsing), Mammoth (DOCX extraction).
- **AI / LLM:** Google Gemini API (`gemini-3.8-flash` & `gemini-embedding-2-preview`) via `@google/genai`.
- **Database Architecture:** PostgreSQL + pgvector schema with Row Level Security (RLS) located in `supabase/schema.sql`, backed by persistent JSON storage during local execution.

---

## 🚀 Quickstart & Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
GEMINI_API_KEY="your-gemini-api-key"
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Unit Tests
```bash
npx --yes tsx --test server/rag.test.ts
npx --yes tsx --test server/auth.test.ts
```

---

## 📡 API Reference

### Authentication
- `GET /api/auth/me` — Retrieve active session profile.
- `POST /api/auth/register` — Register a student, faculty, or admin account.
- `POST /api/auth/login` — Sign in via email.
- `POST /api/auth/switch-role` — Switch active role for RBAC testing.

### Chat & Dialogue
- `POST /api/chat` — Generate RAG-grounded response with citations.
- `POST /api/chat/stream` — Server-Sent Events (SSE) streaming tokens.
- `GET /api/conversations` — List conversation history.
- `GET /api/conversations/:id` — Retrieve conversation with messages.
- `PATCH /api/conversations/:id` — Rename conversation.
- `DELETE /api/conversations/:id` — Delete conversation.

### Knowledge Base & Documents
- `GET /api/documents` — List all official repository documents.
- `POST /api/documents/upload` — Multipart upload (`file` or `directContent`).
- `GET /api/documents/:id` — Retrieve document and vector chunks.
- `POST /api/documents/:id/reprocess` — Re-index and regenerate embeddings.
- `DELETE /api/documents/:id` — Remove document (Admin only).

### Study Assistant
- `POST /api/study/explain` — Topic explanation by difficulty.
- `POST /api/study/math` — Step-by-step math solver.
- `POST /api/study/quiz` — Generate 4 revision MCQs.
- `POST /api/study/plan` — Generate 5-day study plan.
- `GET /api/study/plans` — List user's study plans.
- `PATCH /api/study/plans/:id` — Update schedule progress.

### Administration
- `GET /api/admin/dashboard` — Live database telemetry and metrics.
- `GET /api/admin/users` — List registered users.
- `PATCH /api/admin/users/:id/role` — Update user role (Admin only).

---

## 🔒 Security & Academic Integrity

1. **Server-Side API Key Isolation:** `GEMINI_API_KEY` is strictly accessed within server routes and never exposed to the client bundle.
2. **Untrusted Document Boundary:** Ingested documents are sanitized and framed with rigid delimiter boundaries, preventing prompt injections from modifying system behavior.
3. **Institutional Grounding:** The assistant will never hallucinate fee amounts, examination deadlines, or passing criteria. Unverified inquiries return explicit guidance to consult the Registrar.
