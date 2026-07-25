import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { TeacherDashboard } from './components/TeacherPortal/TeacherDashboard';
import { QuizUploader } from './components/TeacherPortal/QuizUploader';
import { QuizEditor } from './components/TeacherPortal/QuizEditor';
import { QuizList } from './components/TeacherPortal/QuizList';
import { AnalyticsDashboard } from './components/TeacherPortal/AnalyticsDashboard';
import { AIQuizGeneratorModal } from './components/TeacherPortal/AIQuizGeneratorModal';
import { StudentDashboard } from './components/StudentPortal/StudentDashboard';
import { TimedQuizEngine } from './components/StudentPortal/TimedQuizEngine';
import { StudentHistory } from './components/StudentPortal/StudentHistory';
import { ScorecardModal } from './components/StudentPortal/ScorecardModal';
import { QuizSubmission } from './types';

function MainAppContent() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'TEACHER';

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Selected Quiz ID for Editing / Running
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);

  // Data passed into Quiz Editor after OCR parse or AI generation
  const [editorData, setEditorData] = useState<any>(null);

  // AI Quiz Generator Modal state
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);

  // Scorecard Modal state
  const [latestSubmission, setLatestSubmission] = useState<QuizSubmission | null>(null);
  const [isScorecardOpen, setIsScorecardOpen] = useState(false);

  // Handlers for Teacher Navigation
  const handleOCRSuccess = (data: { title: string; language: 'eng' | 'fra' | 'both'; questions: any[] }) => {
    setEditorData({
      title: data.title,
      language: data.language,
      questions: data.questions,
    });
    setActiveTab('editor');
  };

  const handleAIGenerateSuccess = (data: any) => {
    setEditorData(data);
    setActiveTab('editor');
  };

  const handleEditExistingQuiz = async (quizId: string) => {
    try {
      const savedToken = localStorage.getItem('quiz_app_token');
      const res = await fetch(`/api/teacher/quiz/${quizId}`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEditorData(data.quiz);
        setActiveTab('editor');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handlers for Student Navigation
  const handleStartQuiz = (quizId: string) => {
    setSelectedQuizId(quizId);
    setActiveTab('quiz_runner');
  };

  const handleSubmissionComplete = (submission: QuizSubmission) => {
    setLatestSubmission(submission);
    setIsScorecardOpen(true);
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB] text-zinc-900 flex flex-col font-sans selection:bg-orange-500 selection:text-white antialiased">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isTeacher ? (
          /* TEACHER PORTAL VIEWS */
          <>
            {activeTab === 'dashboard' && (
              <TeacherDashboard
                onNavigateToUpload={() => setActiveTab('upload')}
                onNavigateToQuizzes={() => setActiveTab('quizzes')}
                onNavigateToAnalytics={() => setActiveTab('analytics')}
                onOpenAIGenerator={() => setIsAIGeneratorOpen(true)}
                onSelectQuizToEdit={handleEditExistingQuiz}
              />
            )}

            {activeTab === 'upload' && (
              <QuizUploader
                onParsedSuccess={handleOCRSuccess}
                onOpenAIGenerator={() => setIsAIGeneratorOpen(true)}
              />
            )}

            {activeTab === 'editor' && (
              <QuizEditor
                initialQuiz={editorData}
                onBack={() => setActiveTab('quizzes')}
                onSaveSuccess={() => {
                  setEditorData(null);
                  setActiveTab('quizzes');
                }}
              />
            )}

            {activeTab === 'quizzes' && (
              <QuizList
                onSelectQuizToEdit={handleEditExistingQuiz}
                onNavigateToUpload={() => setActiveTab('upload')}
                onOpenAIGenerator={() => setIsAIGeneratorOpen(true)}
              />
            )}

            {activeTab === 'analytics' && <AnalyticsDashboard />}
          </>
        ) : (
          /* STUDENT PORTAL VIEWS */
          <>
            {activeTab === 'dashboard' && (
              <StudentDashboard
                onStartQuiz={handleStartQuiz}
                onViewScorecard={subId => setActiveTab('history')}
                onNavigateToHistory={() => setActiveTab('history')}
              />
            )}

            {activeTab === 'quiz_runner' && selectedQuizId && (
              <TimedQuizEngine
                quizId={selectedQuizId}
                onBack={() => setActiveTab('dashboard')}
                onSubmissionComplete={handleSubmissionComplete}
              />
            )}

            {activeTab === 'history' && <StudentHistory />}
          </>
        )}
      </main>

      {/* AI Quiz Generator Modal */}
      <AIQuizGeneratorModal
        isOpen={isAIGeneratorOpen}
        onClose={() => setIsAIGeneratorOpen(false)}
        onGeneratedSuccess={handleAIGenerateSuccess}
      />

      {/* Post-Quiz Instant Scorecard Modal */}
      <ScorecardModal
        submission={latestSubmission}
        isOpen={isScorecardOpen}
        onClose={() => setIsScorecardOpen(false)}
      />

      <footer className="border-t-2 border-zinc-900 bg-white py-6 text-center text-xs font-mono-code font-bold uppercase text-zinc-600">
        <p>QuizGenius.AI • Multi-Language OCR & Gemini 1.5 MCQ Engine • Editorial Platform Edition</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
