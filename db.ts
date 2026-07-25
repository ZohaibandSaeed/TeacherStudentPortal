import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Neon DB connection
const connectionString = process.env.DATABASE_URL || '';
export const sql = connectionString ? neon(connectionString) : null;

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: 'TEACHER' | 'STUDENT';
}

export interface QuestionRecord {
  id: string;
  quizId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  marks: number;
}

export interface QuizRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  title: string;
  description: string;
  durationMinutes: number;
  totalMarks: number;
  isPublished: boolean;
  language: 'eng' | 'fra' | 'both';
  createdAt: string;
}

export interface SubmissionRecord {
  id: string;
  quizId: string;
  quizTitle: string;
  studentId: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  maxScore: number;
  percentage: number;
  answers: any[];
  submittedAt: string;
  timeTakenSeconds: number;
}

// Helper to map snake_case SQL row to UserRecord
function mapUser(row: any): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    fullName: row.full_name,
    role: row.role as 'TEACHER' | 'STUDENT',
  };
}

// Helper to map snake_case SQL row to QuizRecord
function mapQuiz(row: any): QuizRecord {
  return {
    id: row.id,
    teacherId: row.teacher_id,
    teacherName: row.teacher_name,
    title: row.title,
    description: row.description || '',
    durationMinutes: Number(row.duration_minutes || 10),
    totalMarks: Number(row.total_marks || 0),
    isPublished: Boolean(row.is_published),
    language: row.language as any || 'eng',
    createdAt: row.created_at || '',
  };
}

// Helper to map snake_case SQL row to QuestionRecord
function mapQuestion(row: any): QuestionRecord {
  return {
    id: row.id,
    quizId: row.quiz_id,
    questionText: row.question_text,
    optionA: row.option_a,
    optionB: row.option_b,
    optionC: row.option_c,
    optionD: row.option_d,
    correctOption: row.correct_option as any || 'A',
    explanation: row.explanation || '',
    marks: Number(row.marks || 10),
  };
}

// Helper to map snake_case SQL row to SubmissionRecord
function mapSubmission(row: any): SubmissionRecord {
  let answers = row.answers;
  if (typeof answers === 'string') {
    try { answers = JSON.parse(answers); } catch (e) { answers = []; }
  }
  return {
    id: row.id,
    quizId: row.quiz_id,
    quizTitle: row.quiz_title,
    studentId: row.student_id,
    studentName: row.student_name,
    score: Number(row.score || 0),
    totalQuestions: Number(row.total_questions || 0),
    maxScore: Number(row.max_score || 0),
    percentage: Number(row.percentage || 0),
    answers: Array.isArray(answers) ? answers : [],
    submittedAt: row.submitted_at || '',
    timeTakenSeconds: Number(row.time_taken_seconds || 0),
  };
}

// Initialize tables and seed initial data if needed
export async function initDB() {
  if (!sql) {
    console.error('❌ DATABASE_URL is not defined in environment variables.');
    return;
  }

  try {
    console.log('🔄 Initializing Neon PostgreSQL Database tables...');

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS quizzes (
        id VARCHAR(255) PRIMARY KEY,
        teacher_id VARCHAR(255) NOT NULL,
        teacher_name VARCHAR(255) NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        duration_minutes INTEGER DEFAULT 10,
        total_marks INTEGER DEFAULT 0,
        is_published BOOLEAN DEFAULT false,
        language VARCHAR(50) DEFAULT 'eng',
        created_at TEXT NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS questions (
        id VARCHAR(255) PRIMARY KEY,
        quiz_id VARCHAR(255) NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_option VARCHAR(10) NOT NULL,
        explanation TEXT,
        marks INTEGER DEFAULT 10
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS submissions (
        id VARCHAR(255) PRIMARY KEY,
        quiz_id VARCHAR(255) NOT NULL,
        quiz_title TEXT NOT NULL,
        student_id VARCHAR(255) NOT NULL,
        student_name VARCHAR(255) NOT NULL,
        score INTEGER DEFAULT 0,
        total_questions INTEGER DEFAULT 0,
        max_score INTEGER DEFAULT 0,
        percentage INTEGER DEFAULT 0,
        answers JSONB DEFAULT '[]',
        submitted_at TEXT NOT NULL,
        time_taken_seconds INTEGER DEFAULT 0
      );
    `;

    console.log('✅ Neon DB Tables verified/created successfully.');

    // Seed check
    const userCountResult = await sql`SELECT COUNT(*) as count FROM users;`;
    const userCount = Number(userCountResult[0]?.count || 0);

    if (userCount === 0) {
      console.log('🌱 Seeding initial demo users and quizzes into Neon DB...');
      
      // Seed users
      await sql`
        INSERT INTO users (id, email, password_hash, full_name, role) VALUES
        ('usr_teacher_1', 'teacher@demo.com', 'password123', 'Dr. Sarah Jenkins', 'TEACHER'),
        ('usr_student_1', 'student@demo.com', 'password123', 'Alex Morgan', 'STUDENT'),
        ('usr_student_2', 'marie@demo.com', 'password123', 'Marie Curie', 'STUDENT'),
        ('usr_student_3', 'jean@demo.com', 'password123', 'Jean-Luc Picard', 'STUDENT')
        ON CONFLICT (email) DO NOTHING;
      `;

      // Seed quizzes
      await sql`
        INSERT INTO quizzes (id, teacher_id, teacher_name, title, description, duration_minutes, total_marks, is_published, language, created_at) VALUES
        ('quiz_101', 'usr_teacher_1', 'Dr. Sarah Jenkins', 'Advanced English Grammar & Vocabulary MCQ Assessment', 'Comprehensive evaluation covering subjunctive mood, conditional clauses, advanced vocabulary synonyms, and subject-verb agreement.', 15, 50, true, 'eng', ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}),
        ('quiz_102', 'usr_teacher_1', 'Dr. Sarah Jenkins', 'Évaluation de Langue Française et Grammaire (QCM)', 'Test de niveau intermédiaire sur le subjonctif, les expressions idiomatiques, et la concordance des temps en français moderne.', 10, 40, true, 'fra', ${new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()})
        ON CONFLICT (id) DO NOTHING;
      `;

      // Seed questions for quiz 101
      await sql`
        INSERT INTO questions (id, quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, marks) VALUES
        ('q_101_1', 'quiz_101', 'Neither the manager nor the employees _____ satisfied with the new policy changes implemented last week.', 'was', 'were', 'has been', 'is', 'B', 'When subjects are joined by neither/nor, the verb agrees in number with the closer subject (employees, plural).', 10),
        ('q_101_2', 'quiz_101', 'Which sentence correctly uses the subjunctive mood in English?', 'I insist that he goes to the clinic immediately.', 'If I was you, I would accept the new promotion.', 'The board recommended that the CEO resign without further delay.', 'She speaks as if she knows everything about the incident.', 'C', 'The subjunctive mood after expressions of demand/recommendation requires the base form of the verb (resign, not resigns or resigned).', 10),
        ('q_101_3', 'quiz_101', 'Choose the correct synonym for the word "EPHEMERAL":', 'Permanent', 'Transient', 'Mysterious', 'Influential', 'B', 'Ephemeral means lasting for a very short time; transient is its closest synonym.', 10),
        ('q_101_4', 'quiz_101', 'Had I known about the delayed flight schedule, I _____ earlier at the terminal.', 'would not arrive', 'will not have arrived', 'would not have arrived', 'had not arrived', 'C', 'In third conditional sentences with inverted word order (Had I known...), the main clause requires would + have + past participle.', 10),
        ('q_101_5', 'quiz_101', 'Identify the grammatically correct sentence:', 'Each of the candidates have submitted their credentials.', 'Either of the options is acceptable for the final presentation.', 'Between you and I, this project is running over budget.', 'She is one of those managers who leads by strict example.', 'B', 'Either is a singular pronoun and requires a singular verb (is). In option A, each requires has; in option C, it should be between you and me.', 10),
        ('q_102_1', 'quiz_102', 'Parmi les phrases suivantes, laquelle contient une forme correcte du subjonctif présent ?', 'Il faut que nous allons au marché avant midi.', 'Je veux que tu fasses tes devoirs ce soir.', 'Bien qu il est malade, il travaille dur.', 'Il est probable qu elle viendra demain.', 'B', 'Le subjonctif du verbe faire à la 2e personne du singulier est fasses. (Aller donne allions, et bien que exige le subjonctif: bien qu il soit).', 10),
        ('q_102_2', 'quiz_102', 'Choisissez l accord correct du participe passé : "Les lettres que nous avons _____ hier soir sont envoyées."', 'écrit', 'écrites', 'écrits', 'écrite', 'B', 'Avec le verbe avoir, le participe passé s accorde en genre et en nombre avec le COD (les lettres, féminin pluriel) lorsqu il est placé avant le verbe.', 10),
        ('q_102_3', 'quiz_102', 'Que signifie l expression française "Poser un lapin" ?', 'Acheter un animal de compagnie sans prévenir', 'Ne pas venir à un rendez-vous fixé sans prévenir', 'Courir très vite pour échapper à un danger', 'Faire un cadeau surprise à un ami proche', 'B', 'Poser un lapin est une expression idiomatique populaire qui signifie faire faux bond ou ne pas se présenter à un rendez-vous convenu.', 10),
        ('q_102_4', 'quiz_102', 'Identifiez le synonyme exact du mot "PERPLEXE" :', 'Déterminé', 'Dubitatif', 'Furieux', 'Enthousiaste', 'B', 'Être perplexe signifie être dans le doute, hésitant; dubitatif exprime exactement cette même idée de doute et d incertitude.', 10)
        ON CONFLICT (id) DO NOTHING;
      `;

      // Seed sample submissions
      await sql`
        INSERT INTO submissions (id, quiz_id, quiz_title, student_id, student_name, score, total_questions, max_score, percentage, answers, submitted_at, time_taken_seconds) VALUES
        ('sub_1', 'quiz_101', 'Advanced English Grammar & Vocabulary MCQ Assessment', 'usr_student_1', 'Alex Morgan', 40, 5, 50, 80, ${JSON.stringify([
          { questionId: 'q_101_1', selectedOption: 'B', isCorrect: true, correctOption: 'B', questionText: 'Neither the manager nor the employees...', optionA: 'was', optionB: 'were', optionC: 'has been', optionD: 'is' },
          { questionId: 'q_101_2', selectedOption: 'C', isCorrect: true, correctOption: 'C', questionText: 'Which sentence correctly uses the subjunctive mood...', optionA: 'I insist...', optionB: 'If I was...', optionC: 'The board recommended...', optionD: 'She speaks...' },
          { questionId: 'q_101_3', selectedOption: 'B', isCorrect: true, correctOption: 'B', questionText: 'Choose the correct synonym for EPHEMERAL...', optionA: 'Permanent', optionB: 'Transient', optionC: 'Mysterious', optionD: 'Influential' },
          { questionId: 'q_101_4', selectedOption: 'A', isCorrect: false, correctOption: 'C', questionText: 'Had I known about the delayed flight...', optionA: 'would not arrive', optionB: 'will not have arrived', optionC: 'would not have arrived', optionD: 'had not arrived' },
          { questionId: 'q_101_5', selectedOption: 'B', isCorrect: true, correctOption: 'B', questionText: 'Identify the grammatically correct sentence...', optionA: 'Each...', optionB: 'Either of the options...', optionC: 'Between you and I...', optionD: 'She is...' }
        ])}, ${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}, 340),
        ('sub_2', 'quiz_101', 'Advanced English Grammar & Vocabulary MCQ Assessment', 'usr_student_2', 'Marie Curie', 50, 5, 50, 100, ${JSON.stringify([
          { questionId: 'q_101_1', selectedOption: 'B', isCorrect: true, correctOption: 'B', questionText: 'Neither the manager nor the employees...', optionA: 'was', optionB: 'were', optionC: 'has been', optionD: 'is' },
          { questionId: 'q_101_2', selectedOption: 'C', isCorrect: true, correctOption: 'C', questionText: 'Which sentence correctly uses the subjunctive mood...', optionA: 'I insist...', optionB: 'If I was...', optionC: 'The board recommended...', optionD: 'She speaks...' },
          { questionId: 'q_101_3', selectedOption: 'B', isCorrect: true, correctOption: 'B', questionText: 'Choose the correct synonym for EPHEMERAL...', optionA: 'Permanent', optionB: 'Transient', optionC: 'Mysterious', optionD: 'Influential' },
          { questionId: 'q_101_4', selectedOption: 'C', isCorrect: true, correctOption: 'C', questionText: 'Had I known about the delayed flight...', optionA: 'would not arrive', optionB: 'will not have arrived', optionC: 'would not have arrived', optionD: 'had not arrived' },
          { questionId: 'q_101_5', selectedOption: 'B', isCorrect: true, correctOption: 'B', questionText: 'Identify the grammatically correct sentence...', optionA: 'Each...', optionB: 'Either of the options...', optionC: 'Between you and I...', optionD: 'She is...' }
        ])}, ${new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()}, 280)
        ON CONFLICT (id) DO NOTHING;
      `;

      console.log('✅ Demo users, quizzes, questions, and submissions seeded successfully!');
    }
  } catch (err: any) {
    console.error('❌ Error initializing Neon DB:', err.message || err);
  }
}

// User methods
export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  if (!sql) return null;
  const rows = await sql`SELECT * FROM users WHERE LOWER(email) = LOWER(${email}) LIMIT 1;`;
  return rows.length > 0 ? mapUser(rows[0]) : null;
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  if (!sql) return null;
  const rows = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1;`;
  return rows.length > 0 ? mapUser(rows[0]) : null;
}

export async function createUser(user: UserRecord): Promise<void> {
  if (!sql) return;
  await sql`
    INSERT INTO users (id, email, password_hash, full_name, role)
    VALUES (${user.id}, ${user.email}, ${user.passwordHash}, ${user.fullName}, ${user.role});
  `;
}

export async function getAllStudentsCount(): Promise<number> {
  if (!sql) return 0;
  const rows = await sql`SELECT COUNT(*) as count FROM users WHERE role = 'STUDENT';`;
  return Number(rows[0]?.count || 0);
}

// Quiz methods
export async function getTeacherQuizzes(teacherId: string, teacherEmail?: string): Promise<any[]> {
  if (!sql) return [];
  const rows = await sql`
    SELECT q.*, 
      (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) as questions_count,
      (SELECT COUNT(*) FROM submissions WHERE quiz_id = q.id) as submissions_count
    FROM quizzes q
    WHERE q.teacher_id = ${teacherId} OR ${teacherEmail === 'teacher@demo.com'} = true
    ORDER BY q.created_at DESC;
  `;
  return rows.map(r => ({
    ...mapQuiz(r),
    questionsCount: Number(r.questions_count || 0),
    submissionsCount: Number(r.submissions_count || 0),
  }));
}

export async function getPublishedQuizzes(studentId: string): Promise<any[]> {
  if (!sql) return [];
  const rows = await sql`
    SELECT q.*,
      (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) as questions_count
    FROM quizzes q
    WHERE q.is_published = true
    ORDER BY q.created_at DESC;
  `;

  // For each quiz, check if student has a submission
  const quizzes = [];
  for (const r of rows) {
    const subRows = await sql`
      SELECT * FROM submissions WHERE quiz_id = ${r.id} AND student_id = ${studentId} ORDER BY submitted_at DESC LIMIT 1;
    `;
    const latestSubmission = subRows.length > 0 ? mapSubmission(subRows[0]) : null;
    quizzes.push({
      ...mapQuiz(r),
      questionsCount: Number(r.questions_count || 0),
      isCompleted: Boolean(latestSubmission),
      score: latestSubmission ? latestSubmission.score : null,
      maxScore: latestSubmission ? latestSubmission.maxScore : null,
      percentage: latestSubmission ? latestSubmission.percentage : null,
      submittedAt: latestSubmission ? latestSubmission.submittedAt : null,
    });
  }
  return quizzes;
}

export async function getQuizById(id: string): Promise<QuizRecord | null> {
  if (!sql) return null;
  const rows = await sql`SELECT * FROM quizzes WHERE id = ${id} LIMIT 1;`;
  return rows.length > 0 ? mapQuiz(rows[0]) : null;
}

export async function saveQuiz(quiz: QuizRecord, questions: QuestionRecord[]): Promise<void> {
  if (!sql) return;
  
  // Upsert quiz
  await sql`
    INSERT INTO quizzes (id, teacher_id, teacher_name, title, description, duration_minutes, total_marks, is_published, language, created_at)
    VALUES (${quiz.id}, ${quiz.teacherId}, ${quiz.teacherName}, ${quiz.title}, ${quiz.description}, ${quiz.durationMinutes}, ${quiz.totalMarks}, ${quiz.isPublished}, ${quiz.language}, ${quiz.createdAt})
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      duration_minutes = EXCLUDED.duration_minutes,
      total_marks = EXCLUDED.total_marks,
      is_published = EXCLUDED.is_published,
      language = EXCLUDED.language;
  `;

  // Delete old questions for this quiz and insert new ones
  await sql`DELETE FROM questions WHERE quiz_id = ${quiz.id};`;

  for (const q of questions) {
    await sql`
      INSERT INTO questions (id, quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, marks)
      VALUES (${q.id}, ${q.quizId}, ${q.questionText}, ${q.optionA}, ${q.optionB}, ${q.optionC}, ${q.optionD}, ${q.correctOption}, ${q.explanation || ''}, ${q.marks || 10});
    `;
  }
}

export async function togglePublishQuiz(id: string): Promise<boolean | null> {
  if (!sql) return null;
  const quiz = await getQuizById(id);
  if (!quiz) return null;
  const newStatus = !quiz.isPublished;
  await sql`UPDATE quizzes SET is_published = ${newStatus} WHERE id = ${id};`;
  return newStatus;
}

export async function deleteQuiz(id: string): Promise<void> {
  if (!sql) return;
  await sql`DELETE FROM quizzes WHERE id = ${id};`;
}

// Question methods
export async function getQuestionsByQuizId(quizId: string): Promise<QuestionRecord[]> {
  if (!sql) return [];
  const rows = await sql`SELECT * FROM questions WHERE quiz_id = ${quizId} ORDER BY id ASC;`;
  return rows.map(mapQuestion);
}

// Submission methods
export async function createSubmission(sub: SubmissionRecord): Promise<void> {
  if (!sql) return;
  await sql`
    INSERT INTO submissions (id, quiz_id, quiz_title, student_id, student_name, score, total_questions, max_score, percentage, answers, submitted_at, time_taken_seconds)
    VALUES (${sub.id}, ${sub.quizId}, ${sub.quizTitle}, ${sub.studentId}, ${sub.studentName}, ${sub.score}, ${sub.totalQuestions}, ${sub.maxScore}, ${sub.percentage}, ${JSON.stringify(sub.answers)}, ${sub.submittedAt}, ${sub.timeTakenSeconds});
  `;
}

export async function getSubmissionsByStudent(studentId: string): Promise<SubmissionRecord[]> {
  if (!sql) return [];
  const rows = await sql`SELECT * FROM submissions WHERE student_id = ${studentId} ORDER BY submitted_at DESC;`;
  return rows.map(mapSubmission);
}

export async function getSubmissionById(id: string): Promise<SubmissionRecord | null> {
  if (!sql) return null;
  const rows = await sql`SELECT * FROM submissions WHERE id = ${id} LIMIT 1;`;
  return rows.length > 0 ? mapSubmission(rows[0]) : null;
}

export async function getAllSubmissions(): Promise<SubmissionRecord[]> {
  if (!sql) return [];
  const rows = await sql`SELECT * FROM submissions ORDER BY submitted_at DESC;`;
  return rows.map(mapSubmission);
}

export async function getAnalytics(): Promise<any> {
  if (!sql) return null;
  const quizzesRow = await sql`SELECT COUNT(*) as count FROM quizzes;`;
  const pubQuizzesRow = await sql`SELECT COUNT(*) as count FROM quizzes WHERE is_published = true;`;
  const subsRow = await sql`SELECT COUNT(*) as count FROM submissions;`;
  const studentsRow = await sql`SELECT COUNT(*) as count FROM users WHERE role = 'STUDENT';`;

  const totalQuizzes = Number(quizzesRow[0]?.count || 0);
  const publishedQuizzes = Number(pubQuizzesRow[0]?.count || 0);
  const totalSubmissions = Number(subsRow[0]?.count || 0);
  const totalStudents = Number(studentsRow[0]?.count || 0);

  const allSubs = await getAllSubmissions();
  let classAveragePercentage = 0;
  let topScorePercentage = 0;

  if (totalSubmissions > 0) {
    const sumPercentage = allSubs.reduce((acc, sub) => acc + sub.percentage, 0);
    classAveragePercentage = Math.round(sumPercentage / totalSubmissions);
    topScorePercentage = Math.max(...allSubs.map(s => s.percentage));
  }

  const distribution = [
    { grade: 'A+', range: '90-100%', count: allSubs.filter(s => s.percentage >= 90).length },
    { grade: 'A/B', range: '75-89%', count: allSubs.filter(s => s.percentage >= 75 && s.percentage < 90).length },
    { grade: 'C/D', range: '50-74%', count: allSubs.filter(s => s.percentage >= 50 && s.percentage < 75).length },
    { grade: 'F', range: '<50%', count: allSubs.filter(s => s.percentage < 50).length },
  ];

  return {
    totalQuizzes,
    publishedQuizzes,
    totalSubmissions,
    totalStudents,
    classAveragePercentage,
    topScorePercentage,
    scoreDistribution: distribution,
    recentSubmissions: allSubs.slice(0, 10),
  };
}

let isInitialized = false;
let initPromise: Promise<void> | null = null;

export async function ensureDB(): Promise<void> {
  if (isInitialized) return;
  if (!initPromise) {
    initPromise = initDB().then(() => {
      isInitialized = true;
    }).catch(err => {
      initPromise = null;
      throw err;
    });
  }
  await initPromise;
}

