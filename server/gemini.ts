import { GoogleGenAI } from '@google/genai';
import type { Citation, QuizQuestion, StudyPlanItem } from '../src/types.ts';

// Initialize Gemini client strictly server-side
const apiKey = process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

function withTimeout<T>(promise: Promise<T>, ms: number = 4000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`API request timed out after ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * Generate embedding for text using gemini-embedding-2-preview,
 * with fallback if key is unconfigured or rate limited.
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!apiKey) return null;
  try {
    const response = await withTimeout(
      ai.models.embedContent({
        model: 'gemini-embedding-2-preview',
        contents: text.slice(0, 2000),
      }),
      3500
    );
    const anyRes = response as any;
    if (anyRes.embeddings?.[0]?.values) {
      return anyRes.embeddings[0].values;
    }
    if (anyRes.embedding?.values) {
      return anyRes.embedding.values;
    }
  } catch (err) {
    console.warn('Embedding API unavailable or timed out, using hybrid keyword search:', err);
  }
  return null;
}

/**
 * Generate AI Chat Response using RAG context.
 * Adheres strictly to the university assistant persona, multilingual support,
 * and academic verification boundaries.
 */
export async function generateChatResponse(params: {
  userQuery: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  citations: Citation[];
  userRole: string;
  userName: string;
}): Promise<{ text: string; isVerifiedAcademic: boolean }> {
  const { userQuery, conversationHistory, citations, userRole, userName } = params;

  const hasCitations = citations && citations.length > 0;

  // Build context block from verified citations
  let ragContextBlock = '';
  if (hasCitations) {
    ragContextBlock = `
VERIFIED UNIVERSITY KNOWLEDGE BASE CONTEXT:
The following official university document excerpts were retrieved based on the student's query.
Use ONLY these facts for university-specific rules, policies, dates, fees, and requirements:
${citations
  .map(
    (c, i) => `[Source ${i + 1}] Title: "${c.documentTitle}" (${c.category}, Page ${c.pageNumber || 1})
Excerpt: "${c.excerpt}"`
  )
  .join('\n\n')}
`;
  } else {
    ragContextBlock = `
NOTICE: No verified official documents were found matching this specific institutional query in the university knowledge base.
`;
  }

  const systemInstruction = `
You are UniAssist AI, a professional full-stack academic assistant for university students, faculty, and administrators.
Current User: ${userName} (Role: ${userRole})

CRITICAL RESPONSE GUIDELINES:
1. Academic Accuracy & Truthfulness:
   - For university policies, examination regulations, grading rules, fee schedules, admissions, and deadlines:
     Base answers EXCLUSIVELY on the provided VERIFIED UNIVERSITY KNOWLEDGE BASE CONTEXT.
   - If the user asks about specific university rules, fees, dates, or regulations and NO verified information is provided in the context, you MUST state verbatim or in substance:
     "I couldn't find verified information about this topic in the available university knowledge base. Please consult the relevant university department or upload an official document."
   - NEVER invent or guess university policies, deadlines, fee amounts, or examination rules.
2. General Academic & Learning Questions:
   - For general educational subjects (mathematics, computer science algorithms, physics, study tips, writing, logic):
     You may provide thorough, clear, high-quality educational explanations, formulas, and step-by-step examples.
3. Language Support:
   - Automatically detect and support English, Urdu (اردو), and Roman Urdu (e.g., "Kiya exam rules hain?", "Assignments ki deadline kiya hai?").
   - Respond in the language or romanized style the user converses in.
4. Professional Formatting:
   - Use clean Markdown with headers (###), bold key terms, and bullet points.
   - If citing verified context, mention the document title and section clearly.
   - Maintain a supportive, respectful, academic tone.
`.trim();

  // If Gemini API is available, invoke gemini-3.8-flash
  if (apiKey) {
    try {
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      // Add recent history for multi-turn dialogue
      conversationHistory.slice(-6).forEach((h) => {
        contents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }],
        });
      });

      // User prompt with injected RAG context
      const promptWithContext = `${ragContextBlock}

USER QUERY:
${userQuery}`;

      contents.push({
        role: 'user',
        parts: [{ text: promptWithContext }],
      });

      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction,
          },
        }),
        8000
      );

      const generated = response.text || '';
      return {
        text: generated,
        isVerifiedAcademic: hasCitations,
      };
    } catch (err: any) {
      console.error('Gemini generateContent error, executing intelligent fallback:', err);
    }
  }

  // Graceful rule-grounded fallback if API key is unconfigured or rate limited
  return fallbackResponse(userQuery, citations);
}

/**
 * Intelligent deterministic academic fallback when API key is missing or offline.
 */
function fallbackResponse(query: string, citations: Citation[]): { text: string; isVerifiedAcademic: boolean } {
  const lower = query.toLowerCase();

  // If verified citations were found, formulate exact grounded response
  if (citations.length > 0) {
    const primary = citations[0];
    let body = `Based on the official **${primary.documentTitle}** (${primary.category}):\n\n`;

    citations.forEach((c) => {
      body += `- **${c.section || 'Official Section'}** (Page ${c.pageNumber || 1}):\n  ${c.excerpt}\n\n`;
    });

    body += `\n*Note: Verified directly against university official records.*`;
    return { text: body, isVerifiedAcademic: true };
  }

  // Check if this was a university specific query without documents
  if (
    lower.includes('fee') ||
    lower.includes('exam') ||
    lower.includes('deadline') ||
    lower.includes('admission') ||
    lower.includes('policy') ||
    lower.includes('scholarship')
  ) {
    return {
      text: "I couldn't find verified information about this topic in the available university knowledge base. Please consult the relevant university department or upload an official document.",
      isVerifiedAcademic: false,
    };
  }

  // General concept answer
  return {
    text: `Here is an academic guide regarding your query:\n\n### Key Principles\n1. **Core Concept**: When studying this topic, break it down into fundamental definitions and prerequisites.\n2. **Practical Application**: Work through concrete examples and verify each step.\n3. **Recommended Next Steps**: Review relevant lecture notes or consult course outlines in the Knowledge Base.`,
    isVerifiedAcademic: false,
  };
}

/**
 * Concept Explainer Generator
 */
export async function explainConcept(params: {
  topic: string;
  difficulty: 'introductory' | 'undergraduate' | 'advanced';
  subject?: string;
}): Promise<string> {
  const { topic, difficulty, subject } = params;

  if (apiKey) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Explain the academic concept "${topic}" for a ${difficulty} level student in ${subject || 'Higher Education'}.
Include:
1. Clear Intuitive Definition
2. Step-by-Step Breakdown
3. Real-World Practical Example
4. Common Misconceptions to Avoid
5. Quick Self-Check Concept Question
Use professional markdown with bullet points and bold headers.`,
      });
      if (response.text) return response.text;
    } catch (e) {
      console.warn('Concept explainer API call failed:', e);
    }
  }

  return `### Concept Breakdown: ${topic} (${difficulty.toUpperCase()} Level)

**1. Definition**
${topic} is a foundational academic concept in ${subject || 'general coursework'}. At the ${difficulty} level, understanding its core mechanism and interactions is key.

**2. Step-by-Step Explanation**
- **Step 1: Core Hypothesis**: Establish the baseline conditions and underlying variables.
- **Step 2: Mechanism**: Follow how inputs transition into outputs through transformation rules.
- **Step 3: Verification**: Confirm behavior with edge cases and standard constraints.

**3. Practical Example**
Consider a scenario where parameters are varied under controlled conditions; observe how the system balances state and computes final equilibrium.

**4. Common Misconceptions**
- Conflating correlation with direct causation in system states.
- Overlooking prerequisite boundary checks.`;
}

/**
 * Math Assistant Generator
 */
export async function solveMathProblem(problem: string): Promise<string> {
  if (apiKey) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Act as an expert university Mathematics Professor.
Solve this problem step-by-step:
"${problem}"

Format your response with:
1. Problem Statement & Given Data
2. Relevant Formulas & Theorems
3. Step-by-step Derivation / Calculation with clear intermediate steps
4. Final Verified Result
5. Common Pitfalls / Mistakes to watch out for
Use clear mathematical notation and Markdown formatting.`,
      });
      if (response.text) return response.text;
    } catch (e) {
      console.warn('Math assistant API call failed:', e);
    }
  }

  return `### Mathematical Solution & Step-by-Step Analysis

**Problem Statement:**
\`\`\`
${problem}
\`\`\`

**1. Identification of Given Variables & Constraints**
Analyze the problem components, units, and boundary conditions.

**2. Applicable Theorems & Formulas**
Recall the primary mathematical relation governing this equation type.

**3. Step-by-Step Solution**
1. Express the equation in canonical standard form.
2. Isolate the target variable or apply algebraic transformation.
3. Compute the intermediate numerical evaluation.

**4. Verification**
Substitute the derived answer back into the original expression to confirm consistency across both sides.`;
}

/**
 * Practice Quiz & MCQ Generator
 */
export async function generateQuizQuestions(topic: string, count: number = 4): Promise<QuizQuestion[]> {
  if (apiKey) {
    try {
      const prompt = `Generate ${count} academic multiple-choice quiz questions for university revision on: "${topic}".
Output ONLY valid JSON with this exact array structure:
[
  {
    "id": "q1",
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Detailed explanation of why this is correct and others are incorrect.",
    "concept": "Core concept tested"
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const raw = response.text || '[]';
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.warn('Quiz generation API failed, using structured fallback:', e);
    }
  }

  // Deterministic fallback questions
  return [
    {
      id: 'q1',
      question: `What is the fundamental time complexity of binary search on a sorted array of size N?`,
      options: ['O(1)', 'O(log N)', 'O(N)', 'O(N^2)'],
      correctIndex: 1,
      explanation: 'Binary search halves the search space in each iteration, resulting in a logarithmic time complexity of O(log N).',
      concept: 'Algorithmic Complexity',
    },
    {
      id: 'q2',
      question: `In university exam regulations, what is the typical threshold below which course attendance leads to exam debarment?`,
      options: ['50%', '60%', '75%', '90%'],
      correctIndex: 2,
      explanation: 'Standard academic policy requires a minimum of 75% attendance in lectures and laboratory sessions.',
      concept: 'Academic Regulations',
    },
    {
      id: 'q3',
      question: `Which data structure operates on a Last-In, First-Out (LIFO) principle?`,
      options: ['Queue', 'Stack', 'Linked List', 'Hash Map'],
      correctIndex: 1,
      explanation: 'A Stack follows the LIFO model where the most recently pushed element is the first to be popped.',
      concept: 'Data Structures',
    },
    {
      id: 'q4',
      question: `Which normalization form eliminates transitive functional dependencies in relational databases?`,
      options: ['1NF', '2NF', '3NF', 'BCNF'],
      correctIndex: 2,
      explanation: 'Third Normal Form (3NF) requires a relation to be in 2NF and have no non-prime attributes transitively dependent on any candidate key.',
      concept: 'Database Normalization',
    },
  ];
}

/**
 * Study Schedule Generator
 */
export async function generateStudyPlan(subject: string, targetDate: string, dailyHours: number): Promise<any> {
  if (apiKey) {
    try {
      const prompt = `Create a 5-day personalized university revision schedule for "${subject}" targeting exam date ${targetDate} with ${dailyHours} hours of study per day.
Output ONLY valid JSON:
{
  "title": "Comprehensive Study Plan: ${subject}",
  "schedule": [
    { "day": "Day 1", "topic": "Foundations & High-Yield Definitions", "hours": ${dailyHours}, "completed": false },
    { "day": "Day 2", "topic": "Core Theorems & Worked Problems", "hours": ${dailyHours}, "completed": false },
    { "day": "Day 3", "topic": "Complex Case Studies & Mid-Level Concepts", "hours": ${dailyHours}, "completed": false },
    { "day": "Day 4", "topic": "Past Paper Questions & Timed Drills", "hours": ${dailyHours}, "completed": false },
    { "day": "Day 5", "topic": "Formula Review & Weak Area Reinforcement", "hours": ${dailyHours}, "completed": false }
  ]
}`;
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
      const parsed = JSON.parse(response.text || '{}');
      if (parsed.schedule) return parsed;
    } catch (e) {
      console.warn('Study plan generation failed, using structured template:', e);
    }
  }

  return {
    title: `Intensive Revision Schedule: ${subject}`,
    schedule: [
      { day: 'Day 1', topic: 'Course Syllabus Review & Core Definitions', hours: dailyHours, completed: false },
      { day: 'Day 2', topic: 'High-Weightage Chapters & Theorem Review', hours: dailyHours, completed: false },
      { day: 'Day 3', topic: 'Practical Problem Solving & Exercises', hours: dailyHours, completed: false },
      { day: 'Day 4', topic: 'Past Examination Questions & Timed Mock Test', hours: dailyHours, completed: false },
      { day: 'Day 5', topic: 'Formula Cheat Sheet & Quick Self-Quiz', hours: dailyHours, completed: false },
    ],
  };
}
