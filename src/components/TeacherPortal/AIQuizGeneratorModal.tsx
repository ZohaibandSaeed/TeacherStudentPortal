import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Wand2, X, Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface AIQuizGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGeneratedSuccess: (data: {
    title: string;
    description: string;
    durationMinutes: number;
    language: 'eng' | 'fra' | 'both';
    questions: any[];
  }) => void;
}

export const AIQuizGeneratorModal: React.FC<AIQuizGeneratorModalProps> = ({
  isOpen,
  onClose,
  onGeneratedSuccess,
}) => {
  const { token } = useAuth();
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [language, setLanguage] = useState<'eng' | 'fra'>('eng');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic or concept for the quiz.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/teacher/generate-ai-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          topic,
          numQuestions,
          language,
          difficulty,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate quiz with AI.');
      }

      onGeneratedSuccess({
        title: data.quizTitle || `${topic} Quiz`,
        description: data.description || `AI-generated quiz on ${topic}`,
        durationMinutes: data.durationMinutes || 10,
        language: data.language || language,
        questions: data.questions || [],
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred during AI quiz generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border-2 border-zinc-900 shadow-editorial-lg max-w-lg w-full p-6 sm:p-8 text-zinc-900 relative font-mono-code">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-900 hover:bg-zinc-100 border border-zinc-300 transition-colors"
        >
          <X className="w-5 h-5 text-zinc-900" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-zinc-900 text-white border-2 border-zinc-900 shadow-editorial-orange">
            <Wand2 className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase font-serif-display text-zinc-900">Generate Quiz via Gemini AI</h3>
            <p className="text-xs text-zinc-600 font-semibold">
              Instantly compile English or French MCQ test suites using Gemini.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border-2 border-red-600 text-red-900 text-xs font-bold flex items-center space-x-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-900 mb-1">
              Topic or Subject Matter:
            </label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. French Subjunctive Mood, World War II History, Photosynthesis..."
              className="w-full bg-zinc-50 border-2 border-zinc-900 px-4 py-2.5 text-xs text-zinc-900 font-bold focus:outline-none focus:bg-orange-50/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-900 mb-1">Language:</label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value as any)}
                className="w-full bg-zinc-50 border-2 border-zinc-900 px-3 py-2 text-xs text-zinc-900 font-bold focus:outline-none"
              >
                <option value="eng">English</option>
                <option value="fra">French (Français)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-zinc-900 mb-1">Difficulty Tier:</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value)}
                className="w-full bg-zinc-50 border-2 border-zinc-900 px-3 py-2 text-xs text-zinc-900 font-bold focus:outline-none"
              >
                <option value="Beginner">Beginner / Basic</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced / College</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-zinc-900 mb-1">
              Question Count ({numQuestions}):
            </label>
            <input
              type="range"
              min={3}
              max={15}
              value={numQuestions}
              onChange={e => setNumQuestions(parseInt(e.target.value) || 5)}
              className="w-full accent-orange-600"
            />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-end space-x-3 pt-4 border-t-2 border-zinc-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold uppercase text-zinc-600 hover:text-zinc-900"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-black text-xs uppercase tracking-widest shadow-editorial-orange transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                <span>Generating MCQs...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span>Generate & Open Editor</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
