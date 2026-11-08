-- ==============================================================================
-- UNIASSIST AI - PostgreSQL + pgvector Database Schema (Supabase Production Ready)
-- ==============================================================================

-- 1. Enable pgvector extension for high-performance semantic retrieval
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Roles Enum
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('student', 'faculty', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE document_status AS ENUM ('pending', 'processing', 'indexed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3. Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  department TEXT NOT NULL,
  university TEXT NOT NULL DEFAULT 'UniAssist Metropolitan University',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Index for fast user lookups by email and role
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 4. Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- 5. Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  citations JSONB DEFAULT '[]'::jsonb,
  is_verified_academic BOOLEAN DEFAULT false,
  language TEXT DEFAULT 'en',
  rating TEXT CHECK (rating IN ('like', 'dislike')),
  feedback_comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at ASC);

-- 6. Documents Table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status document_status NOT NULL DEFAULT 'pending',
  version INT NOT NULL DEFAULT 1,
  chunk_count INT NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);

-- 7. Document Chunks Table with Vector Embeddings (768 dimensions for Gemini Embeddings)
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  chunk_text TEXT NOT NULL,
  page_number INT NOT NULL DEFAULT 1,
  section TEXT,
  embedding vector(768),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_document_chunks_doc_id ON document_chunks(document_id);

-- Cosine distance vector index (HNSW for blazing-fast similarity search)
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding 
ON document_chunks USING hnsw (embedding vector_cosine_ops);

-- Full-text search index for hybrid retrieval
CREATE INDEX IF NOT EXISTS idx_document_chunks_text_search 
ON document_chunks USING gin(to_tsvector('english', chunk_text));

-- 8. Saved Responses Table
CREATE TABLE IF NOT EXISTS saved_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  query TEXT NOT NULL,
  answer TEXT NOT NULL,
  citations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_saved_responses_user ON saved_responses(user_id);

-- 9. Study Plans Table
CREATE TABLE IF NOT EXISTS study_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  target_exam_date DATE,
  schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
  progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_study_plans_user ON study_plans(user_id);

-- 10. Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  rating TEXT NOT NULL CHECK (rating IN ('like', 'dislike')),
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_feedback_message ON feedback(message_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if current user is an Admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "Admins can update user roles" ON users FOR UPDATE USING (is_admin());

-- Conversations policies
CREATE POLICY "Users manage own conversations" ON conversations
  FOR ALL USING (auth.uid() = user_id OR is_admin());

-- Messages policies
CREATE POLICY "Users manage own messages via conversation" ON messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id AND (c.user_id = auth.uid() OR is_admin())
    )
  );

-- Documents: All authenticated users can view indexed documents; only Admins can insert/update/delete
CREATE POLICY "Anyone can view indexed documents" ON documents
  FOR SELECT USING (status = 'indexed' OR is_admin());

CREATE POLICY "Admins manage all documents" ON documents
  FOR ALL USING (is_admin());

CREATE POLICY "Anyone can read indexed chunks" ON document_chunks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_chunks.document_id AND (d.status = 'indexed' OR is_admin())
    )
  );

CREATE POLICY "Admins manage document chunks" ON document_chunks
  FOR ALL USING (is_admin());

-- Saved Responses
CREATE POLICY "Users manage own saved responses" ON saved_responses
  FOR ALL USING (auth.uid() = user_id);

-- Study Plans
CREATE POLICY "Users manage own study plans" ON study_plans
  FOR ALL USING (auth.uid() = user_id);

-- Feedback
CREATE POLICY "Users submit feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins review feedback" ON feedback
  FOR SELECT USING (is_admin());

-- ==============================================================================
-- SEMANTIC VECTOR SEARCH RPC FUNCTION FOR POSTGRES / SUPABASE
-- ==============================================================================
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_category text DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  document_title TEXT,
  category TEXT,
  chunk_index INT,
  chunk_text TEXT,
  page_number INT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    d.title AS document_title,
    d.category,
    dc.chunk_index,
    dc.chunk_text,
    dc.page_number,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  JOIN documents d ON d.id = dc.document_id
  WHERE d.status = 'indexed'
    AND (filter_category IS NULL OR d.category = filter_category)
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
