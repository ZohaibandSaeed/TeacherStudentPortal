import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Quiz } from '../../types';
import { BookOpenCheck, Clock, CheckCircle2, Award, Play, FileText, Search, Sparkles } from 'lucide-react';

interface StudentDashboardProps {
  onStartQuiz: (quizId: string) => void;
  onViewScorecard: (submissionId: string) => void;
  onNavigateToHistory: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onStartQuiz,
  onViewScorecard,
  onNavigateToHistory,
}) => {
  const { token, user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentQuizzes();
  }, []);

  const fetchStudentQuizzes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/student/quizzes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data.quizzes || []);
      }
    } catch (e) {
      console.error('Failed to load student quizzes:', e);
    } finally {
      setLoading(false);
    }
  };

  const completedCount = quizzes.filter(q => (q as any).isCompleted).length;
  const pendingCount = quizzes.length - completedCount;

  const filteredQuizzes = quizzes.filter(q => {
    const isCompleted = (q as any).isCompleted;
    const matchesSearch = q.title.toLowerCase().includes(search.toLowerCase()) ||
                          (q.description || '').toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (filterStatus === 'pending') return !isCompleted;
    if (filterStatus === 'completed') return isCompleted;
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Editorial Student Greeting Hero */}
      <div className="bg-[#FDFDFB] p-8 border-2 border-zinc-900 shadow-editorial-lg text-zinc-900 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 text-[10px] font-mono-code font-bold uppercase tracking-[0.2em] text-orange-600 mb-1">
              <BookOpenCheck className="w-4 h-4 text-orange-600" />
              <span>Student Portal • Timed MCQ Engine</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase font-serif-display leading-none">
              Hello,<br />
              <span className="italic font-normal text-zinc-800">{user?.fullName || 'Alex Morgan'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 max-w-2xl font-medium pt-1 leading-relaxed">
              Complete assigned timed exams, review instant auto-graded scorecards, and track your performance across English and French assessments.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={onNavigateToHistory}
              className="px-5 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase tracking-[0.15em] text-xs shadow-editorial-orange transition-all flex items-center space-x-2"
            >
              <Award className="w-4 h-4 text-orange-400" />
              <span>Scorecard Log</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono-code">
        <div className="bg-white p-5 border-2 border-zinc-900 shadow-editorial flex items-center space-x-4">
          <div className="w-12 h-12 bg-zinc-900 text-white font-black text-xl flex items-center justify-center shrink-0">
            01
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Assigned Exams</p>
            <p className="text-3xl font-black text-zinc-900 mt-0.5 leading-none">{quizzes.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 border-2 border-zinc-900 shadow-editorial flex items-center space-x-4">
          <div className="w-12 h-12 bg-orange-600 text-white font-black text-xl flex items-center justify-center shrink-0">
            02
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Pending Tests</p>
            <p className="text-3xl font-black text-orange-600 mt-0.5 leading-none">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 border-2 border-zinc-900 shadow-editorial flex items-center space-x-4">
          <div className="w-12 h-12 bg-zinc-900 text-white font-black text-xl flex items-center justify-center shrink-0">
            03
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Completed</p>
            <p className="text-3xl font-black text-emerald-600 mt-0.5 leading-none">{completedCount}</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 border-2 border-zinc-900 shadow-editorial flex flex-col sm:flex-row items-center justify-between gap-4 font-mono-code">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search assigned exams..."
            className="w-full bg-zinc-50 border border-zinc-300 pl-9 pr-4 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 font-mono-code"
          />
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center space-x-2 text-xs uppercase font-bold">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 border transition-all ${
              filterStatus === 'all' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-300'
            }`}
          >
            All ({quizzes.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 border transition-all ${
              filterStatus === 'pending' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-300'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 border transition-all ${
              filterStatus === 'completed' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-300'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>
      </div>

      {/* Quizzes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuizzes.map((q, idx) => {
          const isCompleted = (q as any).isCompleted;
          const score = (q as any).score;
          const maxScore = (q as any).maxScore;
          const percentage = (q as any).percentage;

          return (
            <div
              key={q.id}
              className="bg-white p-6 border-2 border-zinc-900 shadow-editorial-lg hover:shadow-editorial-orange-lg transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between font-mono-code">
                  <span className="text-xs font-black text-zinc-400">0{idx + 1}</span>
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                    q.language === 'fra' ? 'bg-zinc-900 text-white' : 'bg-orange-100 text-orange-700 border border-orange-300'
                  }`}>
                    {q.language === 'fra' ? 'French (QCM)' : 'English'}
                  </span>

                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest flex items-center space-x-1 ${
                    isCompleted
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-orange-100 text-orange-800 border border-orange-300'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    <span>{isCompleted ? 'Done' : 'Pending'}</span>
                  </span>
                </div>

                <h3 className="text-lg font-black tracking-tight text-zinc-900 group-hover:text-orange-600 transition-colors line-clamp-2 font-serif-display">
                  {q.title}
                </h3>

                <p className="text-xs text-zinc-600 line-clamp-2">
                  {q.description || 'Timed Multiple Choice Question Exam.'}
                </p>
              </div>

              <div className="pt-4 border-t-2 border-zinc-100 space-y-3 font-mono-code">
                <div className="flex items-center justify-between text-xs text-zinc-600">
                  <span className="flex items-center space-x-1">
                    <FileText className="w-3.5 h-3.5 text-orange-600" />
                    <span>{(q as any).questionsCount || 5} Questions</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-900" />
                    <span>{q.durationMinutes} Mins</span>
                  </span>
                </div>

                {isCompleted ? (
                  <div className="p-3 bg-zinc-50 border border-zinc-300 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase">Score</p>
                      <p className="text-sm font-extrabold text-emerald-700">{score} / {maxScore} ({percentage}%)</p>
                    </div>

                    <button
                      onClick={() => onStartQuiz(q.id)}
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider"
                    >
                      Retake
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onStartQuiz(q.id)}
                    className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-white font-black text-xs uppercase tracking-[0.15em] shadow-editorial-orange transition-all flex items-center justify-center space-x-2"
                  >
                    <Play className="w-4 h-4 fill-current text-orange-400" />
                    <span>Start Timed Exam</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
