import fs from 'fs';
import path from 'path';
import type {
  User,
  Conversation,
  Message,
  DocumentItem,
  DocumentChunk,
  SavedResponse,
  StudyPlanItem,
  AdminAnalytics,
} from '../src/types.ts';
import { chunkText, cleanDocumentText } from './rag.ts';

interface DatabaseSchema {
  users: User[];
  conversations: Conversation[];
  messages: Message[];
  documents: DocumentItem[];
  documentChunks: DocumentChunk[];
  savedResponses: SavedResponse[];
  studyPlans: StudyPlanItem[];
  feedback: Array<{
    id: string;
    userId: string;
    messageId: string;
    rating: 'like' | 'dislike';
    comments?: string;
    createdAt: string;
  }>;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Initial seed documents
const SEED_DOCUMENTS: Array<{
  title: string;
  category: any;
  fileName: string;
  content: string;
}> = [
  {
    title: 'University Examination Regulations & Grading Policy (Fall 2026)',
    category: 'Examination Policies',
    fileName: 'examination_regulations_2026.pdf',
    content: `
UNIVERSITY EXAMINATION & GRADING REGULATIONS - ACADEMIC YEAR 2026

Page 1 - Section 1: Grading Scale & Grade Point Average (GPA)
The University adheres to a 4.0 grading scale:
- Grade A: 85% and above (GPA 4.00, Excellent)
- Grade B+: 80% to 84% (GPA 3.50, Very Good)
- Grade B: 70% to 79% (GPA 3.00, Good)
- Grade C+: 65% to 69% (GPA 2.50, Above Average)
- Grade C: 60% to 64% (GPA 2.00, Average)
- Grade D: 50% to 59% (GPA 1.00, Minimum Passing)
- Grade F: Below 50% (GPA 0.00, Fail)

A cumulative GPA (CGPA) of at least 2.00 is required for undergraduate degree conferral, and 3.00 for graduate degree conferral.

Page 2 - Section 2: Attendance Requirements & Barred Students
Students must maintain a minimum attendance of 75% in lectures and laboratory sessions for each registered course.
Any student whose attendance falls below 75% without authorized medical leave will be barred from appearing in the final examination and will receive an automatic 'F' grade for that course.

Page 3 - Section 3: Missed Examinations & Makeup Policy
Missed midterm or final exams are not automatically rescheduled.
A student who missed an examination due to documented emergency or acute hospitalization must submit a formal petition along with medical proof to the Controller of Examinations and Department Chairperson within 7 calendar days of the missed exam.
Makeup exams carry a 10% penalty unless waived by the University Academic Board for extraordinary circumstances.

Page 4 - Section 4: Academic Integrity, Cheating & Plagiarism
The University maintains a strict zero-tolerance policy against academic dishonesty.
Possession of unauthorized electronic devices, notes, or whispering during examinations results in immediate confiscation of materials, expulsion from the exam hall, and referral to the Disciplinary Committee.
Penalties range from cancellation of the paper to suspension for two semesters or permanent expulsion.
    `.trim(),
  },
  {
    title: 'Tuition Fee Structure, Payment Schedules & Merit Scholarships (2026-2027)',
    category: 'Fee Structure',
    fileName: 'tuition_scholarships_2026.pdf',
    content: `
OFFICIAL TUITION FEE SCHEDULE & SCHOLARSHIP POLICIES 2026-2027

Page 1 - Section 1: Undergraduate & Graduate Tuition Rates
Undergraduate Programs:
- Engineering & Computing: $3,200 (or PKR 480,000) per semester (up to 18 credit hours).
- Business Administration & Social Sciences: $2,800 per semester.
- Laboratory fee (Computing/Eng): $150 per lab course.
- Health insurance and student activity levy: $85 per semester.

Page 2 - Section 2: Payment Deadlines & Installment Options
Fall Semester:
- First installment (60%): Due by September 15, 2026.
- Second installment (40%): Due by October 30, 2026.
Late Fee Penalty: A flat fine of $50 is applied after the deadline. Accounts unpaid by mid-terms will result in withholding of LMS and exam access.

Page 3 - Section 3: Merit-Based Scholarships
The University rewards academic excellence:
- Chancellor's Honor Scholarship: 100% tuition waiver for semester GPA of 3.90 or above (minimum 15 credits).
- Dean's Merit Scholarship: 50% tuition waiver for semester GPA of 3.75 - 3.89.
- Departmental Honors: 25% tuition waiver for semester GPA of 3.50 - 3.74.
Merit scholarships are evaluated and renewed at the end of each semester automatically based on official registrar transcripts.

Page 4 - Section 4: Need-Based Financial Assistance
Students facing genuine financial distress may apply for Need-Based Financial Aid through the Financial Aid Office before August 25 for Fall semester, and December 20 for Spring semester. Proof of family income and bank statements are required.
    `.trim(),
  },
  {
    title: 'Department of Computer Science - BSCS Curriculum & Course Outlines',
    category: 'Course Outlines',
    fileName: 'bscs_curriculum_outline_2026.pdf',
    content: `
DEPARTMENT OF COMPUTER SCIENCE - BSCS DEGREE CURRICULUM

Page 1 - Section 1: Degree Overview & Credit Hour Requirements
The Bachelor of Science in Computer Science (BSCS) is a 4-year (8 semesters) accredited degree program requiring completion of 134 credit hours.
Categories:
- Computing Core: 42 credit hours
- CS Major Core: 24 credit hours
- CS Technical Electives: 18 credit hours
- General Education & Humanities: 30 credit hours
- Final Year Project (FYP): 6 credit hours (FYP-I in 7th semester, FYP-II in 8th semester)

Page 2 - Section 2: Core Course Descriptions & Prerequisites
- CS101 Introduction to Computing & Programming (3 Cr, Pre-req: None): Variables, control structures, loops, functions, Python syntax, basic algorithmic complexity.
- CS201 Data Structures & Algorithms (4 Cr, Pre-req: CS101): Linked lists, stacks, queues, binary search trees, AVL trees, graphs, sorting algorithms, big-O notation.
- CS305 Operating Systems (3 Cr, Pre-req: CS201): Process scheduling, concurrency, semaphores, deadlocks, virtual memory management, file systems.
- CS410 Artificial Intelligence & Machine Learning (3 Cr, Pre-req: CS201, MATH202 Linear Algebra): Search algorithms (A*, minimax), supervised learning, neural networks, loss functions, prompt engineering, and RAG concepts.

Page 3 - Section 3: Final Year Project (FYP) Regulations
Students must form groups of 2 to 3 members.
Eligibility: Must have completed at least 95 credit hours with a minimum CGPA of 2.20.
Proposal Defense takes place by week 3 of the 7th semester. Final demonstration and external thesis defense occur in the last week of the 8th semester.
    `.trim(),
  },
  {
    title: 'Undergraduate Admissions Guidelines & Eligibility Requirements (2026)',
    category: 'Admissions',
    fileName: 'admissions_guidelines_2026.pdf',
    content: `
UNDERGRADUATE ADMISSIONS POLICIES & ELIGIBILITY CRITERIA 2026-2027

Page 1 - Section 1: General Eligibility Requirements
Applicants seeking admission to undergraduate programs must satisfy the following:
- Minimum 60% unadjusted marks in Higher Secondary School Certificate (HSSC / Intermediate) or equivalent British A-Levels (with at least 3 principal subjects).
- For Engineering and Computer Science: Mathematics and Physics are mandatory prerequisites at intermediate/A-Level.

Page 2 - Section 2: Standardized Entrance Testing
Applicants must take either:
- The University Entrance Assessment (UEA) with a minimum qualifying score of 50%.
- National Aptitude Test (NAT) with a composite score of 60 or above.
- SAT-I with a minimum score of 1150 (Math minimum 600).

Page 3 - Section 3: Key Admission Dates & Deadlines
- Online Application Portal Opens: June 1, 2026
- Application Submission Deadline: July 15, 2026 at 11:59 PM
- Entrance Test Dates: July 22 to July 26, 2026
- First Merit List Declaration: August 5, 2026
- Fee Payment for 1st Merit List: August 12, 2026
- Orientation Week: September 1 to September 5, 2026
- Commencement of Classes: September 8, 2026

Page 4 - Section 4: Required Documentation
Candidates must upload scanned copies of: Matric/O-Level certificate, HSSC/A-Level transcripts, National Identity Card or Form-B, 4 recent passport photos with blue background, and Entrance Test admit card.
    `.trim(),
  },
  {
    title: 'Campus Code of Conduct, Library Rules & Student Services Guide',
    category: 'Student Handbook',
    fileName: 'student_handbook_campus_guide_2026.pdf',
    content: `
CAMPUS CODE OF CONDUCT, STUDENT FACILITIES & SERVICES GUIDE

Page 1 - Section 1: Central Library Regulations
- Library Operating Hours: Monday to Friday 08:00 AM - 10:00 PM; Saturday & Sunday 10:00 AM - 06:00 PM.
- Extended 24/7 study halls operate during midterm and final exam weeks.
- Undergraduate students may borrow up to 4 books for a duration of 14 days. Renewal is permitted twice if no holds are placed.
- Overdue fine: $1 per book per day.
- Quiet zones are designated on the 2nd and 3rd floors; mobile phone calls are strictly prohibited inside study zones.

Page 2 - Section 2: Campus Safety & ID Card Policy
Every student, faculty member, and staff must visibly wear the University Smart Identity Card at all entry checkpoints and on campus premises.
Loss of card must be reported to Campus Security immediately. Replacement card fee is $20.

Page 3 - Section 3: Harassment, Discrimination & Grievance Redressal
The University enforces a Zero-Tolerance Harassment Policy under national higher education guidelines.
Any form of physical, verbal, digital, or sexual harassment is subject to immediate inquiry by the Harassment Redressal Cell.
Anonymous reporting is accessible via the student portal or by emailing anti-harassment@uniassist.edu.
All investigations are concluded within 30 working days with strict confidentiality.
    `.trim(),
  },
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(content);
      }
    } catch (err) {
      console.warn('Could not read persistent DB file, initializing fresh:', err);
    }

    return this.initSeedData();
  }

  private save(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database file:', err);
    }
  }

  private initSeedData(): DatabaseSchema {
    const now = new Date().toISOString();

    const users: User[] = [
      {
        id: 'user-student-1',
        fullName: 'Bilal Ahmed',
        email: 'bilal.student@uniassist.edu',
        role: 'student',
        department: 'Computer Science',
        university: 'UniAssist Metropolitan University',
        createdAt: now,
      },
      {
        id: 'user-faculty-1',
        fullName: 'Dr. Sarah Mitchell',
        email: 's.mitchell@uniassist.edu',
        role: 'faculty',
        department: 'Electrical & Computer Engineering',
        university: 'UniAssist Metropolitan University',
        createdAt: now,
      },
      {
        id: 'user-admin-1',
        fullName: 'Academic Affairs Admin',
        email: 'admin@uniassist.edu',
        role: 'admin',
        department: 'Office of the Registrar',
        university: 'UniAssist Metropolitan University',
        createdAt: now,
      },
    ];

    const documents: DocumentItem[] = [];
    const documentChunks: DocumentChunk[] = [];

    SEED_DOCUMENTS.forEach((doc, idx) => {
      const docId = `doc-${idx + 1}`;
      const cleaned = cleanDocumentText(doc.content);
      const chunks = chunkText(cleaned, docId, doc.title, doc.category, 300, 50);

      documents.push({
        id: docId,
        title: doc.title,
        category: doc.category,
        fileName: doc.fileName,
        fileSize: Buffer.byteLength(doc.content, 'utf-8'),
        status: 'indexed',
        version: 1,
        chunkCount: chunks.length,
        uploadedBy: 'user-admin-1',
        uploaderName: 'Office of the Registrar',
        createdAt: now,
        updatedAt: now,
      });

      documentChunks.push(...chunks);
    });

    const conversations: Conversation[] = [
      {
        id: 'conv-sample-1',
        userId: 'user-student-1',
        title: 'Fall 2026 Examination & Grading Policy',
        createdAt: now,
        updatedAt: now,
        messageCount: 2,
        lastMessageSnippet: 'Here are the official grading rules and passing threshold...',
      },
    ];

    const messages: Message[] = [
      {
        id: 'msg-1',
        conversationId: 'conv-sample-1',
        role: 'user',
        content: 'What are the examination rules and the passing percentage for my courses?',
        createdAt: now,
      },
      {
        id: 'msg-2',
        conversationId: 'conv-sample-1',
        role: 'assistant',
        content: `According to the official **University Examination Regulations & Grading Policy (Fall 2026)**:

1. **Passing Grade**: The minimum passing grade is **Grade D** (50% to 59%, GPA 1.00). Marks below 50% result in an **F** grade (GPA 0.00).
2. **Attendance Rule**: You must maintain at least **75% attendance** in lectures and laboratory sessions. Falling below 75% without authorized medical leave leads to being barred from the final exam and receiving an automatic 'F'.
3. **Missed Exams**: Missed exams are not automatically rescheduled. A formal petition along with medical proof must be submitted to the Controller of Examinations within **7 calendar days**.
4. **Academic Integrity**: Cheating or carrying unauthorized electronics leads to paper cancellation and potential suspension or expulsion.`,
        createdAt: now,
        isVerifiedAcademic: true,
        citations: [
          {
            documentId: 'doc-1',
            documentTitle: 'University Examination Regulations & Grading Policy (Fall 2026)',
            category: 'Examination Policies',
            pageNumber: 1,
            section: 'Section 1: Grading Scale',
            excerpt: 'Grade D: 50% to 59% (GPA 1.00, Minimum Passing). Grade F: Below 50% (GPA 0.00, Fail)...',
            relevanceScore: 0.94,
          },
          {
            documentId: 'doc-1',
            documentTitle: 'University Examination Regulations & Grading Policy (Fall 2026)',
            category: 'Examination Policies',
            pageNumber: 2,
            section: 'Section 2: Attendance Requirements',
            excerpt: 'Students must maintain a minimum attendance of 75% in lectures and laboratory sessions...',
            relevanceScore: 0.88,
          },
        ],
      },
    ];

    const studyPlans: StudyPlanItem[] = [
      {
        id: 'plan-1',
        userId: 'user-student-1',
        title: 'Midterm Preparation: Data Structures & Algorithms',
        subject: 'Computer Science (CS201)',
        targetExamDate: '2026-11-20',
        progress: 40,
        schedule: [
          { day: 'Monday', topic: 'Binary Search Trees & Tree Traversals', hours: 2.5, completed: true },
          { day: 'Tuesday', topic: 'AVL Tree Rotations & Balance Factors', hours: 3, completed: true },
          { day: 'Wednesday', topic: 'Graph Representations (Adjacency Matrix vs List)', hours: 2, completed: false },
          { day: 'Thursday', topic: 'BFS & DFS Algorithm Tracing', hours: 2.5, completed: false },
          { day: 'Friday', topic: 'Dijkstra Shortest Path & Review Past Papers', hours: 3, completed: false },
        ],
        createdAt: now,
      },
    ];

    const savedResponses: SavedResponse[] = [
      {
        id: 'saved-1',
        userId: 'user-student-1',
        messageId: 'msg-2',
        query: 'What are the examination rules and the passing percentage for my courses?',
        answer: 'The minimum passing grade is Grade D (50% to 59%, GPA 1.00)...',
        citations: messages[1].citations,
        createdAt: now,
      },
    ];

    const initial: DatabaseSchema = {
      users,
      conversations,
      messages,
      documents,
      documentChunks,
      savedResponses,
      studyPlans,
      feedback: [],
    };

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing initial seed DB:', e);
    }

    return initial;
  }

  // User Operations
  getUsers(): User[] {
    return this.data.users;
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...user,
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  updateUserRole(userId: string, role: any): User | null {
    const user = this.getUserById(userId);
    if (!user) return null;
    user.role = role;
    this.save();
    return user;
  }

  // Conversation Operations
  getConversations(userId: string): Conversation[] {
    return this.data.conversations
      .filter((c) => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  getConversationById(id: string): Conversation | undefined {
    return this.data.conversations.find((c) => c.id === id);
  }

  createConversation(userId: string, title: string): Conversation {
    const now = new Date().toISOString();
    const newConv: Conversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      title: title || 'New Conversation',
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
      lastMessageSnippet: '',
    };
    this.data.conversations.unshift(newConv);
    this.save();
    return newConv;
  }

  updateConversationTitle(id: string, title: string): Conversation | null {
    const conv = this.getConversationById(id);
    if (!conv) return null;
    conv.title = title;
    conv.updatedAt = new Date().toISOString();
    this.save();
    return conv;
  }

  deleteConversation(id: string): boolean {
    const initialLen = this.data.conversations.length;
    this.data.conversations = this.data.conversations.filter((c) => c.id !== id);
    this.data.messages = this.data.messages.filter((m) => m.conversationId !== id);
    this.save();
    return this.data.conversations.length < initialLen;
  }

  // Message Operations
  getMessages(conversationId: string): Message[] {
    return this.data.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  addMessage(msg: Omit<Message, 'id' | 'createdAt'>): Message {
    const newMsg: Message = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.messages.push(newMsg);

    // Update conversation metadata
    const conv = this.getConversationById(msg.conversationId);
    if (conv) {
      conv.updatedAt = newMsg.createdAt;
      conv.messageCount = (conv.messageCount || 0) + 1;
      conv.lastMessageSnippet = msg.content.slice(0, 70);
    }

    this.save();
    return newMsg;
  }

  // Document Operations
  getDocuments(): DocumentItem[] {
    return this.data.documents.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getDocumentById(id: string): DocumentItem | undefined {
    return this.data.documents.find((d) => d.id === id);
  }

  addDocument(doc: Omit<DocumentItem, 'id' | 'createdAt' | 'updatedAt'>): DocumentItem {
    const now = new Date().toISOString();
    const newDoc: DocumentItem = {
      ...doc,
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };
    this.data.documents.unshift(newDoc);
    this.save();
    return newDoc;
  }

  updateDocumentStatus(
    id: string,
    status: any,
    chunkCount?: number,
    errorMessage?: string
  ): DocumentItem | null {
    const doc = this.getDocumentById(id);
    if (!doc) return null;
    doc.status = status;
    doc.updatedAt = new Date().toISOString();
    if (chunkCount !== undefined) doc.chunkCount = chunkCount;
    if (errorMessage !== undefined) doc.errorMessage = errorMessage;
    this.save();
    return doc;
  }

  deleteDocument(id: string): boolean {
    const initialLen = this.data.documents.length;
    this.data.documents = this.data.documents.filter((d) => d.id !== id);
    this.data.documentChunks = this.data.documentChunks.filter((c) => c.documentId !== id);
    this.save();
    return this.data.documents.length < initialLen;
  }

  // Document Chunks Operations
  getAllChunks(): DocumentChunk[] {
    // Only return chunks belonging to indexed documents
    const indexedDocIds = new Set(
      this.data.documents.filter((d) => d.status === 'indexed').map((d) => d.id)
    );
    return this.data.documentChunks.filter((c) => indexedDocIds.has(c.documentId));
  }

  getChunksByDocumentId(documentId: string): DocumentChunk[] {
    return this.data.documentChunks.filter((c) => c.documentId === documentId);
  }

  saveChunks(chunks: DocumentChunk[]): void {
    // Replace existing chunks for these documents if any
    const docIds = new Set(chunks.map((c) => c.documentId));
    this.data.documentChunks = this.data.documentChunks.filter((c) => !docIds.has(c.documentId));
    this.data.documentChunks.push(...chunks);
    this.save();
  }

  // Saved Responses
  getSavedResponses(userId: string): SavedResponse[] {
    return this.data.savedResponses.filter((s) => s.userId === userId);
  }

  saveResponse(item: Omit<SavedResponse, 'id' | 'createdAt'>): SavedResponse {
    const newSaved: SavedResponse = {
      ...item,
      id: `saved-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.savedResponses.unshift(newSaved);
    this.save();
    return newSaved;
  }

  removeSavedResponse(id: string, userId: string): boolean {
    const prev = this.data.savedResponses.length;
    this.data.savedResponses = this.data.savedResponses.filter(
      (s) => !(s.id === id && s.userId === userId)
    );
    this.save();
    return this.data.savedResponses.length < prev;
  }

  // Study Plans
  getStudyPlans(userId: string): StudyPlanItem[] {
    return this.data.studyPlans.filter((p) => p.userId === userId);
  }

  saveStudyPlan(plan: Omit<StudyPlanItem, 'id' | 'createdAt'>): StudyPlanItem {
    const newPlan: StudyPlanItem = {
      ...plan,
      id: `plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.studyPlans.unshift(newPlan);
    this.save();
    return newPlan;
  }

  updateStudyPlan(id: string, progress: number, schedule: any[]): StudyPlanItem | null {
    const plan = this.data.studyPlans.find((p) => p.id === id);
    if (!plan) return null;
    plan.progress = progress;
    plan.schedule = schedule;
    this.save();
    return plan;
  }

  deleteStudyPlan(id: string): boolean {
    const prev = this.data.studyPlans.length;
    this.data.studyPlans = this.data.studyPlans.filter((p) => p.id !== id);
    this.save();
    return this.data.studyPlans.length < prev;
  }

  // Feedback
  addFeedback(feedback: {
    userId: string;
    messageId: string;
    rating: 'like' | 'dislike';
    comments?: string;
  }) {
    const item = {
      id: `fb-${Date.now()}`,
      ...feedback,
      createdAt: new Date().toISOString(),
    };
    this.data.feedback.push(item);

    // Also update message rating
    const msg = this.data.messages.find((m) => m.id === feedback.messageId);
    if (msg) {
      msg.rating = feedback.rating;
      if (feedback.comments) msg.feedbackComment = feedback.comments;
    }

    this.save();
    return item;
  }

  // User-specific KPI Statistics
  getUserStats(userId: string): {
    totalConversations: number;
    questionsAnswered: number;
    savedResponses: number;
    studyProgress: number;
    activeStudyPlans: number;
    completedTasks: number;
    totalTasks: number;
  } {
    const userConvs = this.data.conversations.filter((c) => c.userId === userId);
    const userConvIds = new Set(userConvs.map((c) => c.id));
    
    // Total user conversations
    const totalConversations = userConvs.length;

    // Questions answered by AI in user's conversations
    const questionsAnswered = this.data.messages.filter(
      (m) => userConvIds.has(m.conversationId) && m.role === 'assistant'
    ).length;

    // Saved responses bookmarked by user
    const savedResponses = this.data.savedResponses.filter((s) => s.userId === userId).length;

    // Study plans and aggregate progress
    const userPlans = this.data.studyPlans.filter((p) => p.userId === userId);
    let totalProgress = 0;
    let completedTasks = 0;
    let totalTasks = 0;

    userPlans.forEach((plan) => {
      totalProgress += plan.progress || 0;
      if (plan.schedule && Array.isArray(plan.schedule)) {
        totalTasks += plan.schedule.length;
        completedTasks += plan.schedule.filter((item) => item.completed).length;
      }
    });

    const studyProgress =
      userPlans.length > 0 ? Math.round(totalProgress / userPlans.length) : 0;

    return {
      totalConversations,
      questionsAnswered,
      savedResponses,
      studyProgress,
      activeStudyPlans: userPlans.length,
      completedTasks,
      totalTasks,
    };
  }

  // Analytics for Admin Dashboard
  getAnalytics(): AdminAnalytics {
    const totalUsers = this.data.users.length;
    const activeUsers = this.data.users.length; // all registered accounts
    const totalConversations = this.data.conversations.length;
    const totalMessages = this.data.messages.length;
    const totalDocuments = this.data.documents.length;
    const indexedDocuments = this.data.documents.filter((d) => d.status === 'indexed').length;
    const failedDocuments = this.data.documents.filter((d) => d.status === 'failed').length;
    const totalChunks = this.data.documentChunks.length;
    const queriesCount = this.data.messages.filter((m) => m.role === 'user').length;

    const likes = this.data.feedback.filter((f) => f.rating === 'like').length;
    const totalRatings = this.data.feedback.length;
    const averageRatingScore = totalRatings > 0 ? Math.round((likes / totalRatings) * 100) : 96;

    const categoryBreakdown: Record<string, number> = {};
    for (const doc of this.data.documents) {
      categoryBreakdown[doc.category] = (categoryBreakdown[doc.category] || 0) + 1;
    }

    return {
      totalUsers,
      activeUsers,
      totalConversations,
      totalMessages,
      totalDocuments,
      indexedDocuments,
      failedDocuments,
      totalChunks,
      queriesCount,
      averageRatingScore,
      categoryBreakdown,
    };
  }
}

export const db = new Database();
