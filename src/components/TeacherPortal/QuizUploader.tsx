import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Upload, FileText, Sparkles, CheckCircle2, AlertCircle, Loader2, Languages, Image as ImageIcon, FileUp, Wand2 } from 'lucide-react';
import { SamplePaperPickerModal } from './SamplePaperPickerModal';

interface QuizUploaderProps {
  onParsedSuccess: (data: {
    title: string;
    language: 'eng' | 'fra' | 'both';
    questions: any[];
  }) => void;
  onOpenAIGenerator: () => void;
}

export const QuizUploader: React.FC<QuizUploaderProps> = ({ onParsedSuccess, onOpenAIGenerator }) => {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [selectedLang, setSelectedLang] = useState<'eng' | 'fra' | 'both'>('eng');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState<number>(0);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const processUpload = async () => {
    if (!file && !rawText.trim()) {
      setError('Please upload a PDF/Word/Image file or paste raw test paper text.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Step 1: File Ingestion
      setProgressStep(1);
      setProgressText('Ingesting & parsing document structure...');
      await new Promise(r => setTimeout(r, 600));

      // Step 2: OCR Extraction
      setProgressStep(2);
      setProgressText('Executing pytesseract & Vision OCR (English + French)...');
      await new Promise(r => setTimeout(r, 800));

      // Step 3: Gemini AI JSON Structuring & Correct Option Detection
      setProgressStep(3);
      setProgressText('Gemini 1.5 Flash parsing MCQs & detecting marked answers...');

      let responseData;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('language', selectedLang);

        const res = await fetch('/api/teacher/upload-quiz', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        responseData = await res.json();
        if (!res.ok) {
          throw new Error(responseData.error || responseData.details || 'Failed to parse file.');
        }
      } else {
        const res = await fetch('/api/teacher/parse-text-quiz', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: rawText,
            language: selectedLang,
          }),
        });

        responseData = await res.json();
        if (!res.ok) {
          throw new Error(responseData.error || 'Failed to parse raw text.');
        }
      }

      setProgressStep(4);
      setProgressText('MCQs successfully extracted & structured!');
      await new Promise(r => setTimeout(r, 400));

      onParsedSuccess({
        title: responseData.quizTitle || responseData.title || 'Parsed MCQ Exam',
        language: responseData.language || selectedLang,
        questions: responseData.questions || [],
      });

    } catch (err: any) {
      setError(err.message || 'An error occurred during OCR parsing.');
    } finally {
      setIsProcessing(false);
      setProgressStep(0);
    }
  };

  const handleSelectSample = (sampleText: string, title: string, lang: 'eng' | 'fra') => {
    setRawText(sampleText);
    setSelectedLang(lang);
    setFile(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      
      {/* Editorial Header Banner */}
      <div className="bg-[#FDFDFB] p-8 border-2 border-zinc-900 shadow-editorial-lg text-zinc-900 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 text-[10px] font-mono-code font-bold uppercase tracking-[0.2em] text-orange-600 mb-1">
              <Sparkles className="w-4 h-4 text-orange-600" />
              <span>Multi-Language OCR Pipeline</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase font-serif-display leading-tight">
              Ingest Test Papers,<br />
              <span className="italic font-normal text-zinc-800">Extract Interactive MCQs</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 max-w-2xl font-medium pt-1 leading-relaxed">
              Upload physical PDF/Word or image scans. Our multi-language engine detects questions, options, and circled/highlighted correct answers in English and French.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setIsSampleModalOpen(true)}
              className="px-4 py-3 bg-white hover:bg-zinc-100 text-zinc-900 border-2 border-zinc-900 text-xs font-bold uppercase tracking-wider shadow-editorial transition-all flex items-center space-x-2"
            >
              <FileText className="w-4 h-4 text-orange-600" />
              <span>Load Sample</span>
            </button>
            <button
              onClick={onOpenAIGenerator}
              className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-black uppercase tracking-wider shadow-editorial-orange transition-all flex items-center space-x-2"
            >
              <Wand2 className="w-4 h-4 text-orange-400" />
              <span>AI Prompt Quiz</span>
            </button>
          </div>
        </div>
      </div>

      {/* Target Language Selector */}
      <div className="bg-white p-5 border-2 border-zinc-900 shadow-editorial flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-zinc-900 font-mono-code">
          <Languages className="w-5 h-5 text-orange-600" />
          <span className="text-xs font-bold uppercase tracking-wider">Target Language Parsing:</span>
        </div>

        <div className="flex items-center space-x-2 font-mono-code">
          <button
            type="button"
            onClick={() => setSelectedLang('eng')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border ${
              selectedLang === 'eng'
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-white text-zinc-600 border-zinc-300 hover:border-zinc-900'
            }`}
          >
            English (eng)
          </button>
          <button
            type="button"
            onClick={() => setSelectedLang('fra')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border ${
              selectedLang === 'fra'
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-white text-zinc-600 border-zinc-300 hover:border-zinc-900'
            }`}
          >
            French (fra / QCM)
          </button>
          <button
            type="button"
            onClick={() => setSelectedLang('both')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border ${
              selectedLang === 'both'
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-white text-zinc-600 border-zinc-300 hover:border-zinc-900'
            }`}
          >
            Bilingual (eng+fra)
          </button>
        </div>
      </div>

      {/* Main Upload Dropzone Panel */}
      <div className="bg-white p-8 border-2 border-zinc-900 shadow-editorial-lg space-y-6">
        
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          className={`border-2 border-dashed p-10 text-center transition-all cursor-pointer ${
            file
              ? 'border-emerald-600 bg-emerald-50/50'
              : 'border-zinc-900 bg-zinc-50 hover:bg-zinc-100'
          }`}
        >
          <input
            type="file"
            id="file-upload"
            accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.txt"
            onChange={handleFileChange}
            className="hidden"
          />

          <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-zinc-900 text-white font-black text-2xl flex items-center justify-center mb-4 shadow-editorial">
              {file ? '✓' : <FileUp className="w-8 h-8 text-orange-400" />}
            </div>

            {file ? (
              <div className="space-y-1">
                <p className="text-base font-extrabold text-emerald-800 flex items-center justify-center space-x-2 font-mono-code">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>{file.name}</span>
                </p>
                <p className="text-xs text-zinc-500 font-mono-code">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to process
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-base font-bold text-zinc-900">
                  Drag & drop exam paper, or <span className="text-orange-600 underline">browse files</span>
                </p>
                <p className="text-xs font-mono-code text-zinc-500 uppercase">
                  Supports PDF (.pdf), Word (.docx), Scanned Images (.jpg, .png), or Text
                </p>
              </div>
            )}
          </label>
        </div>

        {/* OR Divider */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t-2 border-zinc-200"></div>
          <span className="flex-shrink mx-4 text-xs font-mono-code font-extrabold text-zinc-400 uppercase tracking-widest">
            OR Paste Raw Exam Text Below
          </span>
          <div className="flex-grow border-t-2 border-zinc-200"></div>
        </div>

        {/* Textarea for Raw Text Input */}
        <div>
          <label className="block text-xs font-mono-code font-bold uppercase tracking-wider text-zinc-600 mb-2">
            Raw Question Paper Content:
          </label>
          <textarea
            rows={6}
            value={rawText}
            onChange={e => {
              setRawText(e.target.value);
              if (e.target.value.trim()) setFile(null);
            }}
            placeholder="Paste raw MCQs here e.g. Q1. What is the cell power generator? A) Nucleus *B) Mitochondria..."
            className="w-full bg-zinc-50 border-2 border-zinc-900 p-4 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white font-mono-code"
          />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-600 text-red-900 text-xs font-mono-code font-bold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Processing OCR Terminal Output */}
        {isProcessing && (
          <div className="p-5 bg-zinc-900 text-zinc-100 border-2 border-zinc-900 font-mono-code space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-orange-400 border-b border-zinc-800 pb-2">
              <span className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                <span>{progressText}</span>
              </span>
              <span>STEP 0{progressStep} / 03</span>
            </div>

            <div className="w-full bg-zinc-800 h-2 border border-zinc-700">
              <div
                className="bg-orange-500 h-full transition-all duration-500"
                style={{ width: `${(progressStep / 3) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={processUpload}
            disabled={isProcessing || (!file && !rawText.trim())}
            className="w-full py-4 px-6 bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase tracking-[0.2em] text-xs sm:text-sm shadow-editorial-orange disabled:opacity-50 transition-all flex items-center justify-center space-x-2 active:translate-x-0.5 active:translate-y-0.5"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing Exam Paper with OCR & AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-orange-400" />
                <span>Extract MCQs & Launch Editor</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Sample Paper Modal */}
      <SamplePaperPickerModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        onSelectSample={handleSelectSample}
      />

    </div>
  );
};

function FileCheckIcon() {
  return <CheckCircle2 className="w-7 h-7 text-emerald-400" />;
}
