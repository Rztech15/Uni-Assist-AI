export type UserRole = 'student' | 'faculty' | 'admin';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  department: string;
  university: string;
  createdAt: string;
}

export interface UserStats {
  totalConversations: number;
  questionsAnswered: number;
  savedResponses: number;
  studyProgress: number;
  activeStudyPlans: number;
  completedTasks: number;
  totalTasks: number;
}

export interface Citation {
  documentId: string;
  documentTitle: string;
  category: string;
  pageNumber?: number;
  section?: string;
  excerpt: string;
  relevanceScore: number;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  citations?: Citation[];
  isVerifiedAcademic?: boolean;
  language?: 'en' | 'ur' | 'roman_ur';
  rating?: 'like' | 'dislike';
  feedbackComment?: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
  lastMessageSnippet?: string;
}

export type DocumentStatus = 'pending' | 'processing' | 'indexed' | 'failed';

export type DocumentCategory =
  | 'Admissions'
  | 'Academic Calendar'
  | 'Examination Policies'
  | 'Fee Structure'
  | 'Scholarships'
  | 'Course Outlines'
  | 'Department Information'
  | 'Student Handbook'
  | 'University Notices'
  | 'General Academic Resources';

export interface DocumentItem {
  id: string;
  title: string;
  category: DocumentCategory;
  fileName: string;
  fileSize: number;
  status: DocumentStatus;
  version: number;
  chunkCount: number;
  uploadedBy: string;
  uploaderName?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  category: DocumentCategory;
  chunkIndex: number;
  chunkText: string;
  pageNumber: number;
  section?: string;
  embedding?: number[];
}

export interface SavedResponse {
  id: string;
  userId: string;
  messageId: string;
  query: string;
  answer: string;
  citations?: Citation[];
  createdAt: string;
}

export interface StudyPlanItem {
  id: string;
  userId: string;
  title: string;
  subject: string;
  targetExamDate?: string;
  schedule: Array<{
    day: string;
    topic: string;
    hours: number;
    completed: boolean;
  }>;
  progress: number;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  concept: string;
}

export interface AdminAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalConversations: number;
  totalMessages: number;
  totalDocuments: number;
  indexedDocuments: number;
  failedDocuments: number;
  totalChunks: number;
  queriesCount: number;
  averageRatingScore: number;
  categoryBreakdown: Record<string, number>;
}
