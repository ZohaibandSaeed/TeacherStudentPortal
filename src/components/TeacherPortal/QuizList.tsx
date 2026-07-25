import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Quiz } from '../../types';
import { FileText, Edit3, Trash2, CheckCircle2, XCircle, Search, Sparkles, Clock, Plus, Wand2 } from 'lucide-react';

interface QuizListProps {
  onSelectQuizToEdit: (quizId: string) => void;
  onNavigateToUpload: () => void;
  onOpenAIGenerator: () => void;
}

export const QuizList: React.FC<QuizListProps> = ({
  onSelectQuizToEdit,
  onNavigateToUpload,
  onOpenAIGenerator,
}) => {
  const { token } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [search, setSearch] = useState('');
  const [filterLang, setFilterLang] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/teacher/quizzes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data.quizzes || []);
      }
    } catch (e) {
      console.error('Failed to load quizzes', e);
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (id: string) => {
    try {
      const res = await fetch(`/api/teacher/quiz/${id}/publish`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setQuizzes(quizzes.map(q => q.id === id ? { ...q, isPublished: !q.isPublished } : q));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteQuiz = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;
    try {
      const res = await fetch(`/api/teacher/quiz/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setQuizzes(quizzes.filter(q => q.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredQuizzes = quizzes.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(search.toLowerCase()) ||
                          (q.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesLang = filterLang === 'all' || q.language === filterLang;
    return matchesSearch && matchesLang;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 bg-[#FDFDFB] p-8 border-2 border-zinc-900 shadow-editorial-lg text-zinc-900">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 text-[10px] font-mono-code font-bold uppercase tracking-[0.2em] text-orange-600 mb-1">
            <FileText className="w-4 h-4 text-orange-600" />
            <span>Curriculum Management</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase font-serif-display leading-tight">
            Quiz & Assessment<br />
            <span className="italic font-normal text-zinc-800">Exam Catalog</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 max-w-xl font-medium pt-1">
            Manage, edit, publish, or inspect all created MCQ test papers across English and French classes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={onNavigateToUpload}
            className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase tracking-wider text-xs shadow-editorial-orange transition-all flex items-center space-x-2"
          >
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span>OCR Upload</span>
          </button>
          <button
            onClick={onOpenAIGenerator}
            className="px-4 py-3 bg-white hover:bg-zinc-100 text-zinc-900 border-2 border-zinc-900 font-bold uppercase tracking-wider text-xs shadow-editorial transition-all flex items-center space-x-2"
          >
            <Wand2 className="w-4 h-4 text-orange-600" />
            <span>AI Quiz</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 border-2 border-zinc-900 shadow-editorial flex flex-col md:flex-row items-center justify-between gap-4 font-mono-code">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search quizzes by title or keyword..."
            className="w-full bg-zinc-50 border border-zinc-300 pl-9 pr-4 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 font-mono-code"
          />
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto justify-end text-xs font-bold uppercase">
          <span className="text-zinc-500">Language:</span>
          <select
            value={filterLang}
            onChange={e => setFilterLang(e.target.value)}
            className="bg-zinc-50 border border-zinc-300 px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 font-mono-code"
          >
            <option value="all">All Languages</option>
            <option value="eng">English (eng)</option>
            <option value="fra">French (fra / QCM)</option>
          </select>
        </div>
      </div>

      {/* Quiz Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuizzes.map((q, idx) => (
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

                <button
                  onClick={() => togglePublish(q.id)}
                  className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest transition-all flex items-center space-x-1 ${
                    q.isPublished
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-zinc-100 text-zinc-600 border border-zinc-300'
                  }`}
                  title="Click to toggle publish state"
                >
                  {q.isPublished ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-zinc-400" />}
                  <span>{q.isPublished ? 'Published' : 'Draft'}</span>
                </button>
              </div>

              <h3 className="text-lg font-black tracking-tight text-zinc-900 group-hover:text-orange-600 transition-colors line-clamp-2 font-serif-display">
                {q.title}
              </h3>

              <p className="text-xs text-zinc-600 line-clamp-2">
                {q.description || 'No description provided.'}
              </p>
            </div>

            <div className="pt-4 border-t-2 border-zinc-100 space-y-3 font-mono-code">
              <div className="flex items-center justify-between text-xs text-zinc-600">
                <span className="flex items-center space-x-1">
                  <FileText className="w-3.5 h-3.5 text-orange-600" />
                  <span>{q.questionsCount || 5} Qs</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-900" />
                  <span>{q.durationMinutes} Mins</span>
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => onSelectQuizToEdit(q.id)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5 text-orange-400" />
                  <span>Edit Exam</span>
                </button>

                <button
                  onClick={() => deleteQuiz(q.id)}
                  className="p-2 text-zinc-400 hover:text-red-600 hover:bg-zinc-100 transition-colors border border-transparent hover:border-zinc-300"
                  title="Delete Quiz"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
