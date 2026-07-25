import React from 'react';
import { FileText, Sparkles, X, CheckCircle2 } from 'lucide-react';

interface SamplePaperPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (text: string, title: string, language: 'eng' | 'fra') => void;
}

export const SamplePaperPickerModal: React.FC<SamplePaperPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectSample,
}) => {
  if (!isOpen) return null;

  const samples = [
    {
      title: 'English Grammar & Vocabulary Test (with Marked Correct Answers)',
      language: 'eng' as const,
      description: 'Contains 5 MCQs with circled/highlighted correct options in English.',
      text: `EXAM PAPER: ADVANCED ENGLISH GRAMMAR (SPRING SESSION)
Grade Level: Higher Secondary
Instructions: Select the correct option [A, B, C, or D]. Marked correct answers are indicated with (*).

Q1. Neither the conductor nor the orchestra members _____ ready for the final symphony rehearsal.
(A) was
*(B) were
(C) has been
(D) is

Q2. Which sentence correctly uses the English subjunctive mood?
(A) I insist that he stays in the hotel room.
(B) If I was you, I would take the offer.
*(C) The board recommended that the project be postponed.
(D) She acts as if she knows all the answers.

Q3. What is the precise synonym of the vocabulary word "EPHEMERAL"?
(A) Everlasting and permanent
*(B) Transient and short-lived
(C) Mysterious and deep
(D) High-yielding

Q4. Had we known about the extreme traffic jam, we _____ earlier.
(A) would start
(B) will have started
*(C) would have started
(D) had started

Q5. Identify the grammatically sound statement:
(A) Every one of the items have been inspected.
*(B) Either of the two solutions is acceptable.
(C) Between you and I, this plan fails.
(D) She is one of those managers who is always late.`,
    },
    {
      title: 'Évaluation de Langue et Grammaire Française (Examen QCM avec Réponses Entourées)',
      language: 'fra' as const,
      description: 'Contient 4 QCM en français avec les réponses correctes marquées (*).',
      text: `ÉPREUVE DE FRANÇAIS ET GRAMMAIRE - SESSION OFFICIELLE
Niveau : Avancé / Baccalauréat
Consigne : Choisissez la bonne option A, B, C ou D. Les bonnes réponses entourées sont indiquées par (*).

Q1. Choisissez la phrase qui contient l emploi correct du subjonctif présent :
(A) Il faut absolument que tu viens demain matin.
(B) Bien qu il fait très beau, il reste à la maison.
*(C) Je doute fortement qu il puisse accomplir ce projet sans aide.
(D) Je pense qu elle soit très qualifiée pour ce travail.

Q2. Accord du participe passé avec l auxiliaire AVOIR : "Les rapports que nous avons _____ hier ont été validés."
(A) rédigé
(B) rédigée
(C) rédigés
*(D) rédigées

Q3. Que signifie exactement la tournure idiomatique "Poser un lapin" ?
(A) Offrir un cadeau surprise à un ami
*(B) Ne pas venir à un rendez-vous convenu
(C) Résoudre un problème rapidement
(D) Commettre une faute impardonnable

Q4. Quel est le synonyme exact du terme "PERPLEXE" ?
*(A) Hésitant et déconcerté
(B) Enthousiaste et plein d énergie
(C) Silencieux et discret
(D) Facile à comprendre`,
    },
    {
      title: 'Bilingual Science & Environmental Knowledge Paper',
      language: 'eng' as const,
      description: 'General Science test paper covering biology and environmental principles.',
      text: `GENERAL SCIENCE & CELLULAR BIOLOGY EXAM
Questions & Marked Key

1. Which organelle is widely known as the powerhouse of the cell?
A. Ribosome
*B. Mitochondrion
C. Lysosome
D. Endoplasmic reticulum

2. Primary gas absorbed by green plants during active photosynthesis:
A. Oxygen
B. Nitrogen
*C. Carbon Dioxide
D. Helium

3. The chemical bond characterized by the mutual sharing of electron pairs between atoms:
A. Ionic Bond
*B. Covalent Bond
C. Hydrogen Bond
D. Metallic Bond`,
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border-2 border-zinc-900 shadow-editorial-lg max-w-2xl w-full p-6 sm:p-8 text-zinc-900 relative font-mono-code">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-900 hover:bg-zinc-100 border border-zinc-300 transition-colors"
        >
          <X className="w-5 h-5 text-zinc-900" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-zinc-900 text-white border-2 border-zinc-900 shadow-editorial-orange">
            <Sparkles className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase font-serif-display text-zinc-900">Select Preset Sample Exam Paper</h3>
            <p className="text-xs text-zinc-600 font-semibold">
              Instant test OCR & Gemini Flash MCQ extraction without uploading local file assets.
            </p>
          </div>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {samples.map((sample, index) => (
            <div
              key={index}
              onClick={() => {
                onSelectSample(sample.text, sample.title, sample.language);
                onClose();
              }}
              className="p-5 bg-zinc-50 border-2 border-zinc-900 hover:border-orange-600 hover:bg-orange-50/40 cursor-pointer transition-all group shadow-editorial"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-base font-black text-zinc-900 group-hover:text-orange-600 font-serif-display">
                  {sample.title}
                </h4>
                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                  sample.language === 'fra' ? 'bg-orange-100 text-orange-900 border border-orange-300' : 'bg-zinc-200 text-zinc-900 border border-zinc-400'
                }`}>
                  {sample.language === 'fra' ? 'French (Français)' : 'English'}
                </span>
              </div>
              <p className="text-xs text-zinc-600 font-medium mb-3">{sample.description}</p>
              <div className="flex items-center text-xs text-orange-600 font-bold uppercase tracking-wider">
                <span>Load Sample into OCR Engine</span>
                <CheckCircle2 className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t-2 border-zinc-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold uppercase text-zinc-600 hover:text-zinc-900"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
