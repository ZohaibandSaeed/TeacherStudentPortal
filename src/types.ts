export type UserRole = 'TEACHER' | 'STUDENT';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface Question {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  marks?: number;
}

export interface Quiz {
  id: string;
  teacherId: string;
  teacherName?: string;
  title: string;
  description?: string;
  durationMinutes: number;
  totalMarks: number;
  isPublished: boolean;
  language: 'eng' | 'fra' | 'both';
  createdAt: string;
  questionsCount?: number;
  questions?: Question[];
}

export interface QuestionAnswer {
  questionId: string;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  isCorrect?: boolean;
  correctOption?: 'A' | 'B' | 'C' | 'D';
  questionText?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  explanation?: string;
}

export interface QuizSubmission {
  id: string;
  quizId: string;
  quizTitle: string;
  studentId: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  maxScore: number;
  percentage: number;
  answers: QuestionAnswer[];
  submittedAt: string;
  timeTakenSeconds: number;
}

export interface ClassAnalytics {
  totalQuizzes: number;
  publishedQuizzes: number;
  totalSubmissions: number;
  totalStudents: number;
  classAveragePercentage: number;
  topScorePercentage: number;
  scoreDistribution: {
    grade: string;
    range: string;
    count: number;
  }[];
  recentSubmissions: QuizSubmission[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
