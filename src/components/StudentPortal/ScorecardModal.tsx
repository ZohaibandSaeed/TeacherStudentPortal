import React from 'react';
import { QuizSubmission } from '../../types';
import { Trophy, CheckCircle2, XCircle, Clock, Award, X, Sparkles, HelpCircle } from 'lucide-react';

interface ScorecardModalProps {
  submission: QuizSubmission | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ScorecardModal: React.FC<ScorecardModalProps> = ({ submission, isOpen, onClose }) => {
  if (!isOpen || !submission) return null;

  const isPassed = submission.percentage >= 60;
  const minutes = Math.floor(submission.timeTakenSeconds / 60);
  const seconds = submission.timeTakenSeconds % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white border-2 border-zinc-900 shadow-editorial-lg max-w-2xl w-full p-6 sm:p-8 text-zinc-900 relative my-8 font-mono-code">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-900 hover:bg-zinc-100 border border-zinc-300 transition-colors"
        >
          <X className="w-5 h-5 text-zinc-900" />
        </button>

        {/* Hero Grade Banner */}
        <div className={`p-6 border-2 border-zinc-900 text-center space-y-3 mb-6 ${
          isPassed
            ? 'bg-emerald-50 text-emerald-950 shadow-editorial-orange'
            : 'bg-orange-50 text-orange-950 shadow-editorial-orange'
        }`}>
          <div className="w-14 h-14 mx-auto bg-zinc-900 text-white flex items-center justify-center border-2 border-zinc-900">
            {isPassed ? <Trophy className="w-7 h-7 text-orange-400" /> : <Award className="w-7 h-7 text-orange-400" />}
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 block">Official Exam Scorecard</span>
            <h2 className="text-4xl font-black mt-1 text-zinc-900 font-serif-display uppercase">{submission.percentage}% Score</h2>
            <p className="text-xs mt-1 text-zinc-700 font-semibold">
              {isPassed ? 'Congratulations! You successfully passed this exam assessment.' : 'Needs practice. Review the detailed answer breakdown below.'}
            </p>
          </div>

          <div className="flex items-center justify-center space-x-6 pt-3 text-xs font-bold text-zinc-900 border-t border-zinc-300">
            <div>
              <p className="text-zinc-500 text-[9px] uppercase tracking-wider">Points</p>
              <p className="font-black text-zinc-900">{submission.score} / {submission.maxScore}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-[9px] uppercase tracking-wider">Speed</p>
              <p className="font-black text-orange-600">{minutes}m {seconds}s</p>
            </div>
            <div>
              <p className="text-zinc-500 text-[9px] uppercase tracking-wider">Accuracy</p>
              <p className="font-black text-zinc-900">
                {submission.answers.filter(a => a.isCorrect).length} / {submission.answers.length}
              </p>
            </div>
          </div>
        </div>

        {/* Questions Breakdown Review */}
        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
          <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-orange-600" />
            <span>Question-by-Question Telemetry Breakdown</span>
          </h3>

          {submission.answers.map((ans, idx) => (
            <div
              key={idx}
              className={`p-4 border-2 text-xs space-y-2 ${
                ans.isCorrect
                  ? 'bg-zinc-50 border-zinc-900'
                  : 'bg-orange-50/50 border-orange-600'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-zinc-900 font-serif-display text-sm">
                  Q{idx + 1}: {ans.questionText}
                </span>

                <span className={`shrink-0 px-2 py-0.5 font-black uppercase text-[10px] flex items-center space-x-1 ${
                  ans.isCorrect ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-red-100 text-red-800 border border-red-300'
                }`}>
                  {ans.isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>{ans.isCorrect ? 'Correct' : 'Incorrect'}</span>
                </span>
              </div>

              {/* Answers Grid */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="p-2.5 bg-white border border-zinc-300">
                  <span className="text-zinc-500 block text-[9px] uppercase font-bold">Your Answer:</span>
                  <span className={ans.isCorrect ? 'text-emerald-700 font-black' : 'text-red-600 font-black'}>
                    Option ({ans.selectedOption || 'None Selected'})
                  </span>
                </div>

                <div className="p-2.5 bg-white border border-zinc-300">
                  <span className="text-zinc-500 block text-[9px] uppercase font-bold">Correct Key:</span>
                  <span className="text-emerald-700 font-black">Option ({ans.correctOption})</span>
                </div>
              </div>

              {/* Explanation */}
              {ans.explanation && (
                <div className="p-2.5 bg-zinc-100 text-zinc-800 text-[11px] flex items-start space-x-2 border border-zinc-200">
                  <HelpCircle className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                  <span><strong>Explanation:</strong> {ans.explanation}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t-2 border-zinc-200 text-right">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-black text-xs uppercase tracking-widest shadow-editorial transition-all"
          >
            Close Scorecard
          </button>
        </div>

      </div>
    </div>
  );
};
