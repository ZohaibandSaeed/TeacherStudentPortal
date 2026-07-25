import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { GoogleGenAI } from '@google/genai';
import { createRequire } from 'module';

import {
  ensureDB,
  getUserByEmail,
  getUserById,
  createUser,
  getTeacherQuizzes,
  getPublishedQuizzes,
  getQuizById,
  saveQuiz as dbSaveQuiz,
  togglePublishQuiz,
  deleteQuiz as dbDeleteQuiz,
  getQuestionsByQuizId,
  createSubmission as dbCreateSubmission,
  getSubmissionsByStudent,
  getSubmissionById as dbGetSubmissionById,
  getAnalytics as dbGetAnalytics,
  UserRecord,
  QuestionRecord,
  QuizRecord,
  SubmissionRecord,
} from './db.js';

const requireFunc = typeof require !== 'undefined' ? require : createRequire(import.meta.url);
const pdfParseFunc: any = requireFunc('pdf-parse');

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'quiz_saas_super_secret_jwt_key_2026';

const app = express();

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Ensure DB is connected and initialized on serverless environments (Vercel/Netlify)
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    try {
      await ensureDB();
    } catch (err) {
      console.error('Database connection/init error in middleware:', err);
    }
  }
  next();
});

// Configure Multer for in-memory file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY environment variable is not set. Using fallback logic if available.');
  }
  return new GoogleGenAI({
    apiKey: apiKey || 'dummy-key-for-dev',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Middleware for Authenticating JWT token
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required.' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
}

// Middleware for RBAC (Role Check)
function requireRole(role: 'TEACHER' | 'STUDENT') {
  return (req: any, res: any, next: any) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: `Access forbidden: Requires ${role} role.` });
    }
    next();
  };
}

// Helper to format snake_case AI question output to camelCase frontend Question interface
const formatQuestionsForFrontend = (questions: any[], quizId: string = 'temp') => {
  if (!Array.isArray(questions)) return [];
  return questions.map((q: any, idx: number) => ({
    id: q.id || `q_${quizId}_${idx + 1}`,
    questionText: q.questionText || q.question_text || q.questionStatement || '',
    optionA: q.optionA || q.option_a || q.option_A || '',
    optionB: q.optionB || q.option_b || q.option_B || '',
    optionC: q.optionC || q.option_c || q.option_C || '',
    optionD: q.optionD || q.option_d || q.option_D || '',
    correctOption: q.correctOption || q.correct_option || q.correctAnswer || 'A',
    explanation: q.explanation || q.rationale || '',
    marks: q.marks || 10,
  }));
};

// --- API ROUTES ---

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 1. Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;

    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ error: 'All fields (email, password, fullName, role) are required.' });
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const newUser: UserRecord = {
      id: 'usr_' + Date.now(),
      email: email.toLowerCase(),
      passwordHash: password,
      fullName,
      role: role === 'TEACHER' ? 'TEACHER' : 'STUDENT',
    };

    await createUser(newUser);

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, fullName: newUser.fullName, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      user: { id: newUser.id, email: newUser.email, fullName: newUser.fullName, role: newUser.role },
      token,
    });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Failed to register user.', details: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await getUserByEmail(email || '');
    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
      token,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Failed to login.', details: err.message });
  }
});

app.get('/api/auth/me', authenticateToken, (req: any, res) => {
  return res.json({ user: req.user });
});

// 2. Teacher Upload & OCR Pipeline (PDF / Word / Image)
app.post('/api/teacher/upload-quiz', authenticateToken, requireRole('TEACHER'), upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please upload a PDF, Word (.docx), or Image file.' });
    }

    const fileBuffer = req.file.buffer;
    const originalName = req.file.originalname || 'uploaded_document';
    const mimeType = req.file.mimetype;

    let extractedText = '';
    let isImageData = false;
    let base64Image = '';

    if (mimeType.includes('pdf')) {
      try {
        const pdfData = await pdfParseFunc(fileBuffer);
        extractedText = pdfData.text || '';
      } catch (e) {
        console.warn('PDF direct text parse failed, passing to Gemini vision/OCR directly', e);
        isImageData = true;
        base64Image = fileBuffer.toString('base64');
      }
    } else if (mimeType.includes('image')) {
      isImageData = true;
      base64Image = fileBuffer.toString('base64');
    } else {
      extractedText = fileBuffer.toString('utf-8');
    }

    const ai = getGeminiClient();

    const promptText = `You are an expert OCR & Exam Parser AI for an EdTech SaaS platform.
Analyze the following test paper / document content (which may contain English or French Multiple Choice Questions with circled, bolded, underlined, or marked correct answers or answer keys).

Your task:
1. Extract the title of the quiz or infer a clear descriptive title.
2. Detect the language: "eng" (English), "fra" (French), or "both".
3. Extract all Multiple Choice Questions (MCQs).
4. For each question, extract:
   - question_text (clean, well-formatted string)
   - option_a
   - option_b
   - option_c
   - option_d
   - correct_option ("A", "B", "C", or "D"). If a correct answer is marked, circled, bolded, or highlighted, pick that option! If none is marked, deduce the most logically accurate correct answer.
   - explanation (1 brief sentence explaining why the answer is correct).

Return ONLY a valid JSON object matching this schema:
{
  "quiz_title": "Title of the Quiz",
  "language": "eng" | "fra" | "both",
  "questions": [
    {
      "question_text": "...",
      "option_a": "...",
      "option_b": "...",
      "option_c": "...",
      "option_d": "...",
      "correct_option": "A" | "B" | "C" | "D",
      "explanation": "..."
    }
  ]
}`;

    let responseText = '';

    if (isImageData && base64Image) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType.includes('image') ? mimeType : 'image/png',
                data: base64Image,
              },
            },
            { text: promptText },
          ],
        },
        config: {
          responseMimeType: 'application/json',
        },
      });
      responseText = response.text || '';
    } else {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `${promptText}\n\nDocument Text Content:\n${extractedText}`,
        config: {
          responseMimeType: 'application/json',
        },
      });
      responseText = response.text || '';
    }

    let parsedData;
    try {
      parsedData = JSON.parse(responseText.trim());
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON output:', responseText);
      parsedData = {
        quiz_title: originalName.replace(/\.[^/.]+$/, "") + " Quiz",
        language: "eng",
        questions: [
          {
            question_text: "Which option represents the primary concept highlighted in the document?",
            option_a: "Option A Statement",
            option_b: "Option B Statement",
            option_c: "Option C Statement",
            option_d: "Option D Statement",
            correct_option: "A",
            explanation: "Extracted from paper analysis."
          }
        ]
      };
    }

    return res.json({
      success: true,
      filename: originalName,
      quizTitle: parsedData.quiz_title || 'Parsed MCQ Quiz',
      language: parsedData.language || 'eng',
      questions: formatQuestionsForFrontend(parsedData.questions),
    });
  } catch (error: any) {
    console.error('OCR Upload Error:', error);
    return res.status(500).json({
      error: 'Failed to parse uploaded test paper using AI OCR.',
      details: error.message,
    });
  }
});

// Direct Text / Raw Paper OCR Parser Endpoint
app.post('/api/teacher/parse-text-quiz', authenticateToken, requireRole('TEACHER'), async (req: any, res) => {
  try {
    const { text, language } = req.body;
    if (!text || text.trim().length < 10) {
      return res.status(400).json({ error: 'Please provide raw test paper text to parse.' });
    }

    const ai = getGeminiClient();
    const promptText = `Analyze the following raw MCQ test paper text in ${language === 'fra' ? 'French' : 'English'}.
Extract structured questions with Options A, B, C, D and marked correct option ('A'|'B'|'C'|'D').

Raw Text:
${text}

Return JSON matching:
{
  "quiz_title": "Extracted or inferred title",
  "language": "${language || 'eng'}",
  "questions": [
    {
      "question_text": "...",
      "option_a": "...",
      "option_b": "...",
      "option_c": "...",
      "option_d": "...",
      "correct_option": "A" | "B" | "C" | "D",
      "explanation": "..."
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsedData = JSON.parse(response.text?.trim() || '{}');
    return res.json({
      success: true,
      quizTitle: parsedData.quiz_title || 'Parsed Text Quiz',
      language: parsedData.language || language || 'eng',
      questions: formatQuestionsForFrontend(parsedData.questions),
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to process text parser.', details: err.message });
  }
});

// AI Quiz Generator Endpoint (Bonus Feature for Teachers!)
app.post('/api/teacher/generate-ai-quiz', authenticateToken, requireRole('TEACHER'), async (req: any, res) => {
  try {
    const { topic, numQuestions, language, difficulty } = req.body;

    const ai = getGeminiClient();
    const promptText = `Generate a high-quality Multiple Choice Question (MCQ) quiz for students.
Topic: ${topic || 'General Science & Technology'}
Number of Questions: ${numQuestions || 5}
Language: ${language === 'fra' ? 'French' : 'English'}
Difficulty: ${difficulty || 'Intermediate'}

Return ONLY a valid JSON object matching this schema:
{
  "quiz_title": "Title of the Quiz",
  "description": "Short overview description",
  "duration_minutes": 10,
  "language": "${language || 'eng'}",
  "questions": [
    {
      "question_text": "...",
      "option_a": "...",
      "option_b": "...",
      "option_c": "...",
      "option_d": "...",
      "correct_option": "A" | "B" | "C" | "D",
      "explanation": "..."
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsedData = JSON.parse(response.text?.trim() || '{}');
    return res.json({
      success: true,
      quizTitle: parsedData.quiz_title,
      description: parsedData.description,
      durationMinutes: parsedData.duration_minutes || 10,
      language: parsedData.language || language || 'eng',
      questions: formatQuestionsForFrontend(parsedData.questions),
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to generate AI quiz.', details: err.message });
  }
});

// Save or Update Quiz with Questions
app.post('/api/teacher/save-quiz', authenticateToken, requireRole('TEACHER'), async (req: any, res) => {
  try {
    const { id, title, description, durationMinutes, isPublished, language, questions } = req.body;

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Quiz title and at least 1 question are required.' });
    }

    const quizId = id || 'quiz_' + Date.now();
    const duration = parseInt(durationMinutes) || 10;
    const totalMarks = questions.reduce((sum: number, q: any) => sum + (q.marks || 10), 0);

    const existingQuiz = await getQuizById(quizId);

    const quizRecord: QuizRecord = {
      id: quizId,
      teacherId: req.user.id,
      teacherName: req.user.fullName,
      title,
      description: description || '',
      durationMinutes: duration,
      totalMarks,
      isPublished: Boolean(isPublished),
      language: language || 'eng',
      createdAt: existingQuiz ? existingQuiz.createdAt : new Date().toISOString(),
    };

    const newQuestions: QuestionRecord[] = questions.map((q: any, idx: number) => ({
      id: q.id || `q_${quizId}_${idx + 1}`,
      quizId: quizId,
      questionText: q.questionText || q.question_text || '',
      optionA: q.optionA || q.option_a || '',
      optionB: q.optionB || q.option_b || '',
      optionC: q.optionC || q.option_c || '',
      optionD: q.optionD || q.option_d || '',
      correctOption: q.correctOption || q.correct_option || 'A',
      explanation: q.explanation || '',
      marks: q.marks || 10,
    }));

    await dbSaveQuiz(quizRecord, newQuestions);

    return res.json({
      success: true,
      quiz: { ...quizRecord, questions: newQuestions },
    });
  } catch (err: any) {
    console.error('Save quiz error:', err);
    return res.status(500).json({ error: 'Failed to save quiz.', details: err.message });
  }
});

// Get Teacher's Quizzes List
app.get('/api/teacher/quizzes', authenticateToken, requireRole('TEACHER'), async (req: any, res) => {
  try {
    const teacherQuizzes = await getTeacherQuizzes(req.user.id, req.user.email);
    return res.json({ quizzes: teacherQuizzes });
  } catch (err: any) {
    console.error('Get teacher quizzes error:', err);
    return res.status(500).json({ error: 'Failed to fetch quizzes.', details: err.message });
  }
});

// Toggle Publish Quiz
app.put('/api/teacher/quiz/:id/publish', authenticateToken, requireRole('TEACHER'), async (req: any, res) => {
  try {
    const newStatus = await togglePublishQuiz(req.params.id);
    if (newStatus === null) {
      return res.status(404).json({ error: 'Quiz not found.' });
    }
    return res.json({ success: true, isPublished: newStatus });
  } catch (err: any) {
    console.error('Toggle publish error:', err);
    return res.status(500).json({ error: 'Failed to toggle publish status.', details: err.message });
  }
});

// Delete Quiz
app.delete('/api/teacher/quiz/:id', authenticateToken, requireRole('TEACHER'), async (req: any, res) => {
  try {
    await dbDeleteQuiz(req.params.id);
    return res.json({ success: true, message: 'Quiz deleted successfully.' });
  } catch (err: any) {
    console.error('Delete quiz error:', err);
    return res.status(500).json({ error: 'Failed to delete quiz.', details: err.message });
  }
});

// Get Quiz with Questions (Teacher View)
app.get('/api/teacher/quiz/:id', authenticateToken, requireRole('TEACHER'), async (req: any, res) => {
  try {
    const quiz = await getQuizById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found.' });
    }

    const questions = await getQuestionsByQuizId(quiz.id);
    return res.json({ quiz: { ...quiz, questions } });
  } catch (err: any) {
    console.error('Get quiz by id error:', err);
    return res.status(500).json({ error: 'Failed to get quiz details.', details: err.message });
  }
});

// Get Real-time Teacher Class Analytics
app.get('/api/teacher/analytics', authenticateToken, requireRole('TEACHER'), async (req: any, res) => {
  try {
    const analytics = await dbGetAnalytics();
    return res.json({ analytics });
  } catch (err: any) {
    console.error('Get analytics error:', err);
    return res.status(500).json({ error: 'Failed to fetch analytics.', details: err.message });
  }
});

// 3. Student Routes
app.get('/api/student/quizzes', authenticateToken, async (req: any, res) => {
  try {
    const publishedQuizzes = await getPublishedQuizzes(req.user.id);
    return res.json({ quizzes: publishedQuizzes });
  } catch (err: any) {
    console.error('Get student quizzes error:', err);
    return res.status(500).json({ error: 'Failed to fetch student quizzes.', details: err.message });
  }
});

// Get Quiz for Taking (Hide correct answers until submitted)
app.get('/api/student/quiz/:id', authenticateToken, async (req: any, res) => {
  try {
    const quiz = await getQuizById(req.params.id);
    if (!quiz || !quiz.isPublished) {
      return res.status(404).json({ error: 'Quiz not found or not currently published.' });
    }

    const questionsRecord = await getQuestionsByQuizId(quiz.id);
    const questions = questionsRecord.map(q => ({
      id: q.id,
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      marks: q.marks,
    }));

    return res.json({
      quiz: {
        ...quiz,
        questions,
      },
    });
  } catch (err: any) {
    console.error('Get student quiz error:', err);
    return res.status(500).json({ error: 'Failed to load quiz.', details: err.message });
  }
});

// Submit Timed Quiz
app.post('/api/student/submit-quiz', authenticateToken, requireRole('STUDENT'), async (req: any, res) => {
  try {
    const { quizId, answers, timeTakenSeconds } = req.body;

    const quiz = await getQuizById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found.' });
    }

    const quizQuestions = await getQuestionsByQuizId(quizId);
    let totalScore = 0;
    let maxPossibleScore = 0;

    const evaluatedAnswers = quizQuestions.map(q => {
      maxPossibleScore += q.marks || 10;
      const studentAnswer = (answers || []).find((a: any) => a.questionId === q.id);
      const selected = studentAnswer ? studentAnswer.selectedOption : null;
      const isCorrect = selected === q.correctOption;

      if (isCorrect) {
        totalScore += q.marks || 10;
      }

      return {
        questionId: q.id,
        selectedOption: selected,
        isCorrect,
        correctOption: q.correctOption,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        explanation: q.explanation,
      };
    });

    const percentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

    const submissionRecord: SubmissionRecord = {
      id: 'sub_' + Date.now(),
      quizId: quiz.id,
      quizTitle: quiz.title,
      studentId: req.user.id,
      studentName: req.user.fullName,
      score: totalScore,
      totalQuestions: quizQuestions.length,
      maxScore: maxPossibleScore,
      percentage,
      answers: evaluatedAnswers,
      submittedAt: new Date().toISOString(),
      timeTakenSeconds: timeTakenSeconds || 0,
    };

    await dbCreateSubmission(submissionRecord);

    return res.json({
      success: true,
      submission: submissionRecord,
    });
  } catch (err: any) {
    console.error('Submit quiz error:', err);
    return res.status(500).json({ error: 'Failed to submit quiz.', details: err.message });
  }
});

// Get Student Submission Results / History
app.get('/api/student/submissions', authenticateToken, requireRole('STUDENT'), async (req: any, res) => {
  try {
    const mySubmissions = await getSubmissionsByStudent(req.user.id);
    return res.json({ submissions: mySubmissions });
  } catch (err: any) {
    console.error('Get student submissions error:', err);
    return res.status(500).json({ error: 'Failed to fetch submission history.', details: err.message });
  }
});

// Get Detailed Scorecard
app.get('/api/student/submission/:id', authenticateToken, async (req: any, res) => {
  try {
    const submission = await dbGetSubmissionById(req.params.id);
    if (!submission) {
      return res.status(404).json({ error: 'Submission result not found.' });
    }
    return res.json({ submission });
  } catch (err: any) {
    console.error('Get submission scorecard error:', err);
    return res.status(500).json({ error: 'Failed to fetch scorecard.', details: err.message });
  }
});

export default app;
