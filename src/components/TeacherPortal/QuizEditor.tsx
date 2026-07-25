import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Question, Quiz } from '../../types';
import { Save, Plus, Trash2, CheckCircle, Clock, FileText, Check, AlertCircle, ArrowLeft, Languages } from 'lucide-react';

interface QuizEditorProps {
  initialQuiz?: Partial<Quiz> & { questions?: Question[] };
  onBack: () => void;
  onSaveSuccess: () => void;
}

export const QuizEditor: React.FC<QuizEditorProps> = ({ initialQuiz, onBack, onSaveSuccess }) => {
  const { token } = useAuth();

  const [title, setTitle] = useState(initialQuiz?.title || 'New MCQ Exam Quiz');
  const [description, setDescription] = useState(initialQuiz?.description || '');
  const [durationMinutes, setDurationMinutes] = useState(initialQuiz?.durationMinutes || 10);
  const [isPublished, setIsPublished] = useState(initialQuiz?.isPublished ?? true);
  const [language, setLanguage] = useState<'eng' | 'fra' | 'both'>(initialQuiz?.language || 'eng');
  
  const [questions, setQuestions] = useState<Question[]>(
    initialQuiz?.questions && initialQuiz.questions.length > 0
      ? initialQuiz.questions
      : [
          {
            id: 'q_1',
            questionText: 'Sample Question 1 text...',
            optionA: 'Option A',
            optionB: 'Option B',
            optionC: 'Option C',
            optionD: 'Option D',
            correctOption: 'A',
            explanation: 'Explanation for correct answer.',
            marks: 10,
          },
        ]
  );

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: `q_${Date.now()}_${questions.length + 1}`,
        questionText: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctOption: 'A',
        explanation: '',
        marks: 10,
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) {
      setError('A quiz must contain at least 1 question.');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const totalCalculatedMarks = questions.reduce((sum, q) => sum + (q.marks || 10), 0);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Please enter a quiz title.');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].questionText.trim()) {
        setError(`Question #${i + 1} text cannot be empty.`);
        return;
      }
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        id: initialQuiz?.id,
        title,
        description,
        durationMinutes,
        isPublished,
        language,
        questions,
      };

      const res = await fetch('/api/teacher/save-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save quiz.');
      }

      onSaveSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FDFDFB] p-6 border-2 border-zinc-900 shadow-editorial-lg text-zinc-900">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-zinc-600 hover:text-zinc-900 transition-colors text-xs font-mono-code font-bold uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4 text-orange-600" />
          <span>Back to Catalog</span>
        </button>

        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-2 border border-zinc-900 font-mono-code text-xs">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={e => setIsPublished(e.target.checked)}
              className="w-4 h-4 text-zinc-900 focus:ring-0 border-zinc-900"
            />
            <span className="font-bold uppercase tracking-wider text-zinc-900">
              {isPublished ? 'Status: Published' : 'Status: Draft'}
            </span>
          </label>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase tracking-[0.15em] text-xs shadow-editorial-orange transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-orange-400" />
            <span>{isSaving ? 'Saving...' : 'Save & Publish Exam'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-orange-50 border-2 border-orange-600 text-orange-900 text-xs font-mono-code flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-orange-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Quiz Details Configurator Card */}
      <div className="bg-white p-8 border-2 border-zinc-900 shadow-editorial-lg space-y-6">
        <div className="border-b-2 border-zinc-100 pb-4">
          <div className="text-[10px] font-mono-code font-bold uppercase tracking-[0.2em] text-orange-600 mb-1">
            Exam Meta Settings
          </div>
          <h3 className="text-2xl font-black uppercase font-serif-display text-zinc-900 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-zinc-900" />
            <span>Quiz Configuration & Rules</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono-code">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Exam Title:</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-300 p-3 text-sm text-zinc-900 font-serif-display font-bold focus:outline-none focus:border-zinc-900"
              placeholder="e.g. Advanced English Grammar MCQ Exam"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Duration (Minutes):</label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={180}
                value={durationMinutes}
                onChange={e => setDurationMinutes(parseInt(e.target.value) || 10)}
                className="w-full bg-zinc-50 border border-zinc-300 pl-10 pr-4 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
              />
              <Clock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Target Language:</label>
            <div className="relative">
              <select
                value={language}
                onChange={e => setLanguage(e.target.value as any)}
                className="w-full bg-zinc-50 border border-zinc-300 pl-10 pr-4 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 appearance-none font-mono-code"
              >
                <option value="eng">English (eng)</option>
                <option value="fra">French (fra / QCM)</option>
                <option value="both">Bilingual / Both</option>
              </select>
              <Languages className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Description & Instructions:</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-300 p-3 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
              placeholder="Optional overview or rules for students taking this test..."
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 text-xs font-mono-code font-bold uppercase tracking-wider text-zinc-500 border-t-2 border-zinc-100">
          <span>Questions Count: <strong className="text-zinc-900">{questions.length}</strong></span>
          <span>Total Calculated Marks: <strong className="text-orange-600">{totalCalculatedMarks} PTS</strong></span>
        </div>
      </div>

      {/* MCQ Questions Editor Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black uppercase font-serif-display text-zinc-900">
            Questions & Answer Options
          </h3>
          <button
            onClick={addQuestion}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white border-2 border-zinc-900 text-xs font-mono-code font-bold uppercase tracking-wider flex items-center space-x-2"
          >
            <Plus className="w-4 h-4 text-orange-400" />
            <span>Add Question</span>
          </button>
        </div>

        {questions.map((q, idx) => (
          <div
            key={idx}
            className="bg-white p-6 border-2 border-zinc-900 shadow-editorial space-y-4 relative"
          >
            <div className="flex items-center justify-between border-b-2 border-zinc-100 pb-3 font-mono-code">
              <span className="text-xs font-black uppercase tracking-wider px-3 py-1 bg-zinc-900 text-white">
                Question #{idx + 1}
              </span>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-xs font-bold uppercase text-zinc-600">
                  <span>Marks:</span>
                  <input
                    type="number"
                    min={1}
                    value={q.marks || 10}
                    onChange={e => handleQuestionChange(idx, 'marks', parseInt(e.target.value) || 10)}
                    className="w-16 bg-zinc-50 border border-zinc-300 px-2 py-1 text-xs text-center text-zinc-900 font-mono-code"
                  />
                </div>

                <button
                  onClick={() => removeQuestion(idx)}
                  className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors"
                  title="Remove Question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div className="font-mono-code">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Question Statement:</label>
              <textarea
                rows={2}
                value={q.questionText}
                onChange={e => handleQuestionChange(idx, 'questionText', e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-300 p-3 text-sm text-zinc-900 font-medium focus:outline-none focus:border-zinc-900"
                placeholder="Type question statement here..."
              />
            </div>

            {/* Options A, B, C, D */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono-code">
              {(['A', 'B', 'C', 'D'] as const).map(optKey => {
                const optValKey = `option${optKey}` as keyof Question;
                const isSelected = q.correctOption === optKey;

                return (
                  <div
                    key={optKey}
                    className={`p-4 border-2 transition-all ${
                      isSelected
                        ? 'bg-orange-50 border-orange-600'
                        : 'bg-zinc-50 border-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black uppercase text-zinc-800">Option ({optKey})</span>
                      <button
                        type="button"
                        onClick={() => handleQuestionChange(idx, 'correctOption', optKey)}
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center space-x-1 ${
                          isSelected
                            ? 'bg-orange-600 text-white'
                            : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{isSelected ? 'Correct Key' : 'Set as Correct'}</span>
                      </button>
                    </div>

                    <input
                      type="text"
                      value={(q[optValKey] as string) || ''}
                      onChange={e => handleQuestionChange(idx, optValKey, e.target.value)}
                      className="w-full bg-white border border-zinc-300 px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                      placeholder={`Enter text for Option ${optKey}...`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Explanation / Notes */}
            <div className="font-mono-code">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Answer Explanation / Rationale (Shown after test):
              </label>
              <input
                type="text"
                value={q.explanation || ''}
                onChange={e => handleQuestionChange(idx, 'explanation', e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700 placeholder-zinc-400 focus:outline-none focus:border-zinc-900"
                placeholder="e.g. According to rule X, Option B is correct because..."
              />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Save Bar */}
      <div className="pt-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase tracking-[0.15em] text-xs shadow-editorial-orange transition-all flex items-center space-x-2 disabled:opacity-50"
        >
          <Save className="w-5 h-5 text-orange-400" />
          <span>{isSaving ? 'Saving...' : 'Save & Publish Exam'}</span>
        </button>
      </div>

    </div>
  );
};
