import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Quiz, Question, QuizSubmission } from '../../types';
import { Clock, AlertTriangle, CheckCircle2, ChevronRight, ChevronLeft, ArrowLeft, Send, ShieldAlert, Loader2 } from 'lucide-react';

interface TimedQuizEngineProps {
  quizId: string;
  onBack: () => void;
  onSubmissionComplete: (submission: QuizSubmission) => void;
}

export const TimedQuizEngine: React.FC<TimedQuizEngineProps> = ({
  quizId,
  onBack,
  onSubmissionComplete,
}) => {
  const { token } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Selected answers map: { questionId: 'A' | 'B' | 'C' | 'D' | null }
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D' | null>>({});
  
  // Timer state
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    fetchQuizData();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizId]);

  const fetchQuizData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/student/quiz/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load quiz.');
      }

      const fetchedQuiz = data.quiz;
      setQuiz(fetchedQuiz);
      const qList = fetchedQuiz.questions || [];
      setQuestions(qList);

      // Initialize answers object
      const initAnswers: Record<string, any> = {};
      qList.forEach((q: Question) => {
        initAnswers[q.id] = null;
      });
      setAnswers(initAnswers);

      // Start Countdown Timer
      const totalSeconds = (fetchedQuiz.durationMinutes || 10) * 60;
      setTimeLeftSeconds(totalSeconds);
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        setTimeLeftSeconds(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            // Auto-submit when timer reaches 00:00!
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err: any) {
      setError(err.message || 'An error occurred while launching quiz.');
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (questionId: string, option: 'A' | 'B' | 'C' | 'D') => {
    if (isSubmitted || isSubmitting) return; // Inputs locked after submission!
    setAnswers(prev => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleAutoSubmit = () => {
    if (!isSubmitted && !isSubmitting) {
      submitQuiz(true);
    }
  };

  const submitQuiz = async (isAuto = false) => {
    if (isSubmitted || isSubmitting) return;

    if (timerRef.current) clearInterval(timerRef.current);
    setIsSubmitting(true);

    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, selectedOption]) => ({
        questionId,
        selectedOption,
      }));

      const elapsedSeconds = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));

      const res = await fetch('/api/student/submit-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quizId,
          answers: formattedAnswers,
          timeTakenSeconds: elapsedSeconds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit quiz.');
      }

      setIsSubmitted(true);
      onSubmissionComplete(data.submission);

    } catch (err: any) {
      setError(err.message || 'An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3 text-zinc-800 font-mono-code">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
        <p className="text-sm font-bold uppercase tracking-wider">Launching Timed Exam Engine...</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-white border-2 border-zinc-900 shadow-editorial-lg text-center space-y-4 font-mono-code">
        <ShieldAlert className="w-12 h-12 text-orange-600 mx-auto" />
        <h3 className="text-2xl font-black font-serif-display uppercase text-zinc-900">Exam Exception</h3>
        <p className="text-xs text-zinc-600 font-medium">{error || 'Unable to start quiz.'}</p>
        <button onClick={onBack} className="px-6 py-3 bg-zinc-900 text-white font-black text-xs uppercase tracking-wider">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const isTimeCritical = timeLeftSeconds <= 60 && timeLeftSeconds > 0;
  const answeredCount = Object.values(answers).filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      
      {/* Top Fixed Timed Quiz Bar */}
      <div className="sticky top-16 z-30 bg-white p-4 border-2 border-zinc-900 shadow-editorial flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono-code">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to exit? Your progress will be lost.')) onBack();
            }}
            className="p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 transition-colors border border-zinc-300"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-sm font-black uppercase tracking-tight text-zinc-900 truncate max-w-xs sm:max-w-sm">{quiz.title}</h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase">
              Question {currentIndex + 1} of {questions.length} • ({answeredCount} Answered)
            </p>
          </div>
        </div>

        {/* Countdown Timer Badge */}
        <div className={`px-4 py-2 font-mono-code font-black text-base sm:text-lg flex items-center space-x-2 border-2 transition-all ${
          isTimeCritical
            ? 'bg-orange-600 text-white border-zinc-900 animate-pulse shadow-editorial-orange'
            : 'bg-zinc-900 text-white border-zinc-900 shadow-editorial-orange'
        }`}>
          <Clock className={`w-5 h-5 ${isTimeCritical ? 'text-white animate-spin' : 'text-orange-400'}`} />
          <span>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          {isTimeCritical && <span className="text-[10px] uppercase font-black tracking-widest pl-1">CRITICAL!</span>}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-200 h-3 border-2 border-zinc-900 overflow-hidden">
        <div
          className="bg-orange-600 h-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        ></div>
      </div>

      {/* Current Question Card */}
      {currentQ && (
        <div className="bg-white p-8 border-2 border-zinc-900 shadow-editorial-lg space-y-6">
          <div className="flex items-center justify-between border-b-2 border-zinc-100 pb-4 font-mono-code">
            <span className="text-xs font-black uppercase px-3 py-1 bg-zinc-900 text-white">
              Question #{currentIndex + 1}
            </span>
            <span className="text-xs text-orange-600 font-bold uppercase">{currentQ.marks || 10} Points</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-zinc-900 leading-snug font-serif-display">
            {currentQ.questionText}
          </h3>

          {/* Options List */}
          <div className="space-y-4 font-mono-code">
            {(['A', 'B', 'C', 'D'] as const).map(optKey => {
              const optValKey = `option${optKey}` as keyof Question;
              const optionText = currentQ[optValKey] as string;
              if (!optionText) return null;

              const isSelected = answers[currentQ.id] === optKey;

              return (
                <button
                  key={optKey}
                  type="button"
                  onClick={() => selectAnswer(currentQ.id, optKey)}
                  disabled={isSubmitted || isSubmitting}
                  className={`w-full p-4 border-2 text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-orange-50 border-orange-600 text-zinc-900 shadow-editorial-orange'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-800 hover:border-zinc-900'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <span className={`w-8 h-8 font-black text-xs flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-orange-600 text-white'
                        : 'bg-zinc-900 text-white'
                    }`}>
                      {optKey}
                    </span>
                    <span className="text-sm font-bold">{optionText}</span>
                  </div>

                  <div className={`w-5 h-5 border-2 flex items-center justify-center ${
                    isSelected ? 'border-orange-600 bg-orange-600' : 'border-zinc-400'
                  }`}>
                    {isSelected && <div className="w-2 h-2 bg-white"></div>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="pt-6 border-t-2 border-zinc-100 flex items-center justify-between gap-4 font-mono-code">
            <button
              type="button"
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-3 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40 text-zinc-900 font-bold text-xs uppercase border-2 border-zinc-900 transition-all flex items-center space-x-1.5"
            >
              <ChevronLeft className="w-4 h-4 text-orange-600" />
              <span>Previous</span>
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-black text-xs uppercase tracking-wider shadow-editorial transition-all flex items-center space-x-2"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4 text-orange-400" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => submitQuiz(false)}
                disabled={isSubmitting}
                className="px-8 py-3.5 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-[0.15em] shadow-editorial transition-all flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Exam'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Question Selector Palette Grid */}
      <div className="bg-white p-6 border-2 border-zinc-900 shadow-editorial space-y-3 font-mono-code">
        <div className="flex items-center justify-between text-xs font-bold uppercase text-zinc-600">
          <span>Question Palette Grid:</span>
          <span>{answeredCount} of {questions.length} Answered</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {questions.map((q, idx) => {
            const isAnswered = Boolean(answers[q.id]);
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-9 h-9 font-black text-xs transition-all flex items-center justify-center border-2 ${
                  isCurrent
                    ? 'bg-orange-600 text-white border-zinc-900 shadow-editorial-orange'
                    : isAnswered
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-zinc-50 text-zinc-500 border-zinc-300 hover:border-zinc-900'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
