import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Quiz, ClassAnalytics } from '../../types';
import { BookOpenCheck, Sparkles, Shield, Users, Trophy, Clock, ArrowUpRight, Plus, FileText, CheckCircle2, Wand2 } from 'lucide-react';

interface TeacherDashboardProps {
  onNavigateToUpload: () => void;
  onNavigateToQuizzes: () => void;
  onNavigateToAnalytics: () => void;
  onOpenAIGenerator: () => void;
  onSelectQuizToEdit: (quizId: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  onNavigateToUpload,
  onNavigateToQuizzes,
  onNavigateToAnalytics,
  onOpenAIGenerator,
  onSelectQuizToEdit,
}) => {
  const { token, user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [analytics, setAnalytics] = useState<ClassAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [qRes, aRes] = await Promise.all([
        fetch('/api/teacher/quizzes', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/teacher/analytics', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (qRes.ok) {
        const qData = await qRes.json();
        setQuizzes(qData.quizzes || []);
      }

      if (aRes.ok) {
        const aData = await aRes.json();
        setAnalytics(aData.analytics || null);
      }
    } catch (err) {
      console.error('Failed to load teacher dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Editorial Welcome Banner */}
      <div className="bg-[#FDFDFB] p-8 border-2 border-zinc-900 shadow-editorial-lg relative overflow-hidden text-zinc-900">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 text-[10px] font-mono-code font-bold uppercase tracking-[0.2em] text-orange-600 mb-1">
              <Shield className="w-4 h-4 text-orange-600" />
              <span>System Architecture • Teacher Hub</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase font-serif-display leading-none">
              Welcome Back,<br />
              <span className="italic font-normal text-zinc-800">{user?.fullName || 'Dr. Jenkins'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 max-w-2xl font-medium pt-2 leading-relaxed">
              Convert physical test papers into structured interactive MCQs using Gemini 1.5 Flash Vision. Manage timed exams and track student grade distributions.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <button
              onClick={onNavigateToUpload}
              className="px-5 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase tracking-[0.15em] text-xs shadow-editorial-orange transition-all flex items-center space-x-2.5 active:translate-x-0.5 active:translate-y-0.5"
            >
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span>OCR Paper Upload</span>
            </button>
            <button
              onClick={onOpenAIGenerator}
              className="px-5 py-3.5 bg-white hover:bg-zinc-100 text-zinc-900 border-2 border-zinc-900 font-bold uppercase tracking-wider text-xs shadow-editorial transition-all flex items-center space-x-2"
            >
              <Wand2 className="w-4 h-4 text-orange-600" />
              <span>AI Prompt Quiz</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 Metric Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 border-2 border-zinc-900 shadow-editorial flex items-center space-x-4">
          <div className="w-12 h-12 bg-zinc-900 text-white font-black text-xl flex items-center justify-center shrink-0">
            01
          </div>
          <div>
            <p className="text-[10px] font-mono-code font-bold uppercase tracking-widest text-zinc-500">Total Quizzes</p>
            <p className="text-3xl font-black text-zinc-900 mt-0.5 leading-none">{quizzes.length}</p>
            <p className="text-[10px] font-mono-code font-bold text-orange-600 mt-1">{quizzes.filter(q => q.isPublished).length} Active Exams</p>
          </div>
        </div>

        <div className="bg-white p-5 border-2 border-zinc-900 shadow-editorial flex items-center space-x-4">
          <div className="w-12 h-12 bg-orange-600 text-white font-black text-xl flex items-center justify-center shrink-0">
            02
          </div>
          <div>
            <p className="text-[10px] font-mono-code font-bold uppercase tracking-widest text-zinc-500">Submissions</p>
            <p className="text-3xl font-black text-zinc-900 mt-0.5 leading-none">{analytics?.totalSubmissions || 0}</p>
            <p className="text-[10px] font-mono-code font-bold text-zinc-600 mt-1">Graded by System</p>
          </div>
        </div>

        <div className="bg-white p-5 border-2 border-zinc-900 shadow-editorial flex items-center space-x-4">
          <div className="w-12 h-12 bg-zinc-900 text-white font-black text-xl flex items-center justify-center shrink-0">
            03
          </div>
          <div>
            <p className="text-[10px] font-mono-code font-bold uppercase tracking-widest text-zinc-500">Class Average</p>
            <p className="text-3xl font-black text-emerald-600 mt-0.5 leading-none">
              {analytics?.classAveragePercentage ?? 85}%
            </p>
            <p className="text-[10px] font-mono-code font-bold text-zinc-600 mt-1">Passing Grade: 60%</p>
          </div>
        </div>

        <div className="bg-white p-5 border-2 border-zinc-900 shadow-editorial flex items-center space-x-4">
          <div className="w-12 h-12 bg-orange-600 text-white font-black text-xl flex items-center justify-center shrink-0">
            04
          </div>
          <div>
            <p className="text-[10px] font-mono-code font-bold uppercase tracking-widest text-zinc-500">Top Score</p>
            <p className="text-3xl font-black text-zinc-900 mt-0.5 leading-none">
              {analytics?.topScorePercentage ?? 100}%
            </p>
            <p className="text-[10px] font-mono-code font-bold text-zinc-600 mt-1">Peak Performance</p>
          </div>
        </div>

      </div>

      {/* Main Grid: Recent Quizzes & Submissions Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Quizzes List (2 Columns) */}
        <div className="lg:col-span-2 bg-white p-6 border-2 border-zinc-900 shadow-editorial-lg space-y-5">
          <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-3">
            <h3 className="text-lg font-black uppercase tracking-wider text-zinc-900 font-serif-display italic flex items-center space-x-2">
              <FileText className="w-5 h-5 text-orange-600" />
              <span>Recent Managed Quizzes</span>
            </h3>
            <button
              onClick={onNavigateToQuizzes}
              className="text-xs font-mono-code font-bold uppercase tracking-wider text-orange-600 hover:underline flex items-center space-x-1"
            >
              <span>View Catalog</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {quizzes.slice(0, 4).map((q, idx) => (
              <div
                key={q.id}
                onClick={() => onSelectQuizToEdit(q.id)}
                className="p-5 border-2 border-zinc-200 hover:border-zinc-900 bg-white hover:bg-zinc-50 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono-code font-black text-zinc-400">0{idx + 1}</span>
                    <span className={`px-2 py-0.5 text-[9px] font-mono-code font-bold uppercase tracking-widest ${
                      q.language === 'fra' ? 'bg-zinc-900 text-white' : 'bg-orange-100 text-orange-700 border border-orange-300'
                    }`}>
                      {q.language === 'fra' ? 'French (QCM)' : 'English'}
                    </span>
                    <span className={`px-2 py-0.5 text-[9px] font-mono-code font-bold uppercase tracking-widest ${
                      q.isPublished ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-zinc-100 text-zinc-600 border border-zinc-300'
                    }`}>
                      {q.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">
                    {q.title}
                  </h4>

                  <p className="text-xs text-zinc-600 line-clamp-1">
                    {q.description || 'No description provided.'}
                  </p>
                </div>

                <div className="flex items-center space-x-5 shrink-0 text-xs font-mono-code text-zinc-600 border-t sm:border-t-0 sm:border-l border-zinc-200 pt-3 sm:pt-0 sm:pl-5">
                  <div>
                    <p className="font-bold text-zinc-900">{q.questionsCount || 5} Qs</p>
                    <p className="text-[10px] uppercase text-zinc-400">{q.durationMinutes} Mins</p>
                  </div>

                  <div className="text-right">
                    <span className="px-3 py-1 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-wider group-hover:bg-orange-600 transition-colors">
                      Edit →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Student Activity Stream (1 Column) */}
        <div className="bg-[#FDFDFB] p-6 border-2 border-zinc-900 shadow-editorial-lg space-y-5">
          <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-3">
            <h3 className="text-lg font-black uppercase tracking-wider text-zinc-900 font-serif-display italic flex items-center space-x-2">
              <Users className="w-5 h-5 text-orange-600" />
              <span>Live Submissions</span>
            </h3>
            <button
              onClick={onNavigateToAnalytics}
              className="text-xs font-mono-code font-bold uppercase tracking-wider text-orange-600 hover:underline"
            >
              Log
            </button>
          </div>

          <div className="space-y-3 font-mono-code">
            {analytics?.recentSubmissions && analytics.recentSubmissions.length > 0 ? (
              analytics.recentSubmissions.slice(0, 5).map(sub => (
                <div key={sub.id} className="p-3.5 bg-white border border-zinc-300 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900">{sub.studentName}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 ${
                      sub.percentage >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {sub.percentage}%
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-600 truncate">{sub.quizTitle}</p>
                  <p className="text-[10px] text-zinc-400">
                    Speed: {Math.floor(sub.timeTakenSeconds / 60)}m {sub.timeTakenSeconds % 60}s
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-400 py-6 text-center font-mono-code">No student submissions recorded yet.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
