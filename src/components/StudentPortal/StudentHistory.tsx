import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { QuizSubmission } from '../../types';
import { Award, Clock, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { ScorecardModal } from './ScorecardModal';

export const StudentHistory: React.FC = () => {
  const { token } = useAuth();
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<QuizSubmission | null>(null);
  const [isScorecardOpen, setIsScorecardOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/student/submissions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Editorial Header */}
      <div className="bg-[#FDFDFB] p-8 border-2 border-zinc-900 shadow-editorial-lg text-zinc-900">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 text-[10px] font-mono-code font-bold uppercase tracking-[0.2em] text-orange-600 mb-1">
            <Award className="w-4 h-4 text-orange-600" />
            <span>Student Log & Scorecards</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase font-serif-display leading-tight">
            Historical Exam<br />
            <span className="italic font-normal text-zinc-800">Scorecards & Performance Log</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 max-w-xl font-medium pt-1">
            Review past test scores, completion speeds, auto-graded scorecards, and detailed question explanations.
          </p>
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {submissions.map(sub => {
          const minutes = Math.floor(sub.timeTakenSeconds / 60);
          const seconds = sub.timeTakenSeconds % 60;
          const isPassed = sub.percentage >= 60;

          return (
            <div
              key={sub.id}
              onClick={() => {
                setSelectedSubmission(sub);
                setIsScorecardOpen(true);
              }}
              className="bg-white p-6 border-2 border-zinc-900 shadow-editorial hover:shadow-editorial-orange transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group font-mono-code"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                    isPassed ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-red-100 text-red-800 border border-red-300'
                  }`}>
                    {isPassed ? 'Passed' : 'Needs Practice'}
                  </span>
                  <span className="text-xs text-zinc-500 font-bold">
                    {new Date(sub.submittedAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-xl font-black text-zinc-900 group-hover:text-orange-600 transition-colors font-serif-display">
                  {sub.quizTitle}
                </h3>

                <p className="text-xs text-zinc-600">
                  Time Spent: {minutes}m {seconds}s • {sub.totalQuestions} Questions Total
                </p>
              </div>

              <div className="flex items-center space-x-6 shrink-0">
                <div className="text-right">
                  <p className="text-2xl font-black text-zinc-900">{sub.score} / {sub.maxScore}</p>
                  <p className="text-xs font-bold text-orange-600 uppercase">{sub.percentage}% Score</p>
                </div>

                <div className="p-3 bg-zinc-900 text-white group-hover:bg-orange-600 transition-all">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}

        {submissions.length === 0 && (
          <div className="p-12 text-center bg-white border-2 border-zinc-900 shadow-editorial text-zinc-500 space-y-2 font-mono-code">
            <FileText className="w-8 h-8 mx-auto text-zinc-400" />
            <p className="text-sm font-bold uppercase text-zinc-900">No historical test submissions recorded yet.</p>
            <p className="text-xs text-zinc-500">Take assigned quizzes from your student dashboard to inspect instant scorecards here.</p>
          </div>
        )}
      </div>

      {/* Scorecard Modal */}
      <ScorecardModal
        submission={selectedSubmission}
        isOpen={isScorecardOpen}
        onClose={() => setIsScorecardOpen(false)}
      />

    </div>
  );
};
