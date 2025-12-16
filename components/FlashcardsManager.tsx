import React, { useState, useRef, useMemo } from 'react';
import { Plan, FlashcardDeck, FlashcardSubDeck, Flashcard } from '../types';
import { Layers, Plus, Play, BookOpen, Search, Trash2, Check, X, Image, ChevronDown, ChevronRight, Save, Upload, Link as LinkIcon, Clock, TrendingUp, FileUp, FileText, AlertCircle } from 'lucide-react';

interface FlashcardsManagerProps {
  plan: Plan;
  onUpdatePlan: (plan: Plan) => void;
}

type Tab = 'decks' | 'create' | 'browse' | 'import';
type InputSource = 'url' | 'file';
type Rating = 'again' | 'hard' | 'good' | 'easy';

// Helper to calculate days difference
const getDaysDiff = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffTime = date.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};

// Helper to strip HTML (common in Anki exports)
const stripHtml = (html: string) => {
   const tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
};

export const FlashcardsManager: React.FC<FlashcardsManagerProps> = ({ plan, onUpdatePlan }) => {
  const [activeTab, setActiveTab] = useState<Tab>('decks');
  
  // --- Create State ---
  const [newDeckName, setNewDeckName] = useState('');
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [newSubDeckName, setNewSubDeckName] = useState('');
  const [selectedSubDeckId, setSelectedSubDeckId] = useState('');
  
  const [cardQuestion, setCardQuestion] = useState('');
  const [cardAnswer, setCardAnswer] = useState('');
  const [cardMediaUrl, setCardMediaUrl] = useState('');
  const [hasMedia, setHasMedia] = useState(false);
  const [mediaSource, setMediaSource] = useState<InputSource>('url');
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Import State ---
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<{q: string, a: string}[]>([]);
  const [importSeparator, setImportSeparator] = useState('tab'); // tab, comma, semicolon
  const [targetDeckId, setTargetDeckId] = useState('');
  const [targetSubDeckName, setTargetSubDeckName] = useState('');
  const [shouldStripHtml, setShouldStripHtml] = useState(true);

  // --- Study State ---
  const [studyQueue, setStudyQueue] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isStudying, setIsStudying] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyDeckName, setStudyDeckName] = useState('');

  // --- Browse State ---
  const [expandedDecks, setExpandedDecks] = useState<Set<string>>(new Set());

  // Helpers
  const decks = plan.flashcardDecks || [];
  const selectedDeck = decks.find(d => d.id === selectedDeckId);

  // --- Anki / SM-2 Algorithm Logic ---
  const calculateNextReview = (card: Flashcard, rating: Rating): Flashcard => {
    let newInterval = card.interval;
    let newEase = card.easeFactor;
    let newRepetitions = card.repetitions;
    let newState = card.state;
    
    // Rating 1: Again (Fail)
    if (rating === 'again') {
      newInterval = 0; // Review today/tomorrow
      newRepetitions = 0;
      newState = 'learning';
    } 
    // Rating 2: Hard (Pass but difficult)
    else if (rating === 'hard') {
      newInterval = Math.max(1, Math.floor(card.interval * 1.2));
      newEase = Math.max(1.3, card.easeFactor - 0.15);
      newState = 'review';
    }
    // Rating 3: Good (Normal)
    else if (rating === 'good') {
      if (card.repetitions === 0) {
        newInterval = 1;
      } else if (card.repetitions === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.ceil(card.interval * card.easeFactor);
      }
      newRepetitions += 1;
      newState = 'review';
    }
    // Rating 4: Easy
    else if (rating === 'easy') {
      if (card.repetitions === 0) {
        newInterval = 4;
      } else {
        newInterval = Math.ceil(card.interval * card.easeFactor * 1.3);
      }
      newEase += 0.15;
      newRepetitions += 1;
      newState = 'review';
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + newInterval);

    return {
      ...card,
      interval: newInterval,
      easeFactor: newEase,
      repetitions: newRepetitions,
      dueDate: nextDate.toISOString(),
      state: newState
    };
  };

  // --- Actions ---

  const handleCreateDeck = () => {
    if (!newDeckName.trim()) return;
    const newDeck: FlashcardDeck = {
      id: crypto.randomUUID(),
      name: newDeckName,
      subDecks: []
    };
    const updatedPlan = {
      ...plan,
      flashcardDecks: [...decks, newDeck]
    };
    onUpdatePlan(updatedPlan);
    setNewDeckName('');
    setSelectedDeckId(newDeck.id);
  };

  const handleCreateSubDeck = () => {
    if (!newSubDeckName.trim() || !selectedDeckId) return;
    const newSubDeck: FlashcardSubDeck = {
      id: crypto.randomUUID(),
      name: newSubDeckName,
      cards: []
    };
    
    const updatedPlan = {
      ...plan,
      flashcardDecks: decks.map(d => {
        if (d.id === selectedDeckId) {
          return { ...d, subDecks: [...d.subDecks, newSubDeck] };
        }
        return d;
      })
    };
    onUpdatePlan(updatedPlan);
    setNewSubDeckName('');
    setSelectedSubDeckId(newSubDeck.id);
  };

  const handleCreateCard = () => {
    if (!selectedDeckId || !selectedSubDeckId || !cardQuestion.trim() || !cardAnswer.trim()) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    const newCard: Flashcard = {
      id: crypto.randomUUID(),
      question: cardQuestion,
      answer: cardAnswer,
      mediaUrl: (hasMedia && cardMediaUrl.trim()) ? cardMediaUrl.trim() : undefined,
      mediaType: (hasMedia && cardMediaUrl.trim()) ? 'image' : undefined,
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      dueDate: new Date().toISOString(),
      state: 'new'
    };

    const updatedPlan = {
      ...plan,
      flashcardDecks: decks.map(d => {
        if (d.id === selectedDeckId) {
          return {
            ...d,
            subDecks: d.subDecks.map(sd => {
              if (sd.id === selectedSubDeckId) {
                return { ...sd, cards: [...sd.cards, newCard] };
              }
              return sd;
            })
          };
        }
        return d;
      })
    };
    onUpdatePlan(updatedPlan);
    
    setCardQuestion('');
    setCardAnswer('');
    setCardMediaUrl('');
    setHasMedia(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    setCreateSuccess("Card adicionado ao deck!");
    setTimeout(() => setCreateSuccess(null), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Imagem muito grande (Max 5MB).");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setCardMediaUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  // --- Import Logic ---

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      parseImportFile(file, importSeparator, shouldStripHtml);
    }
  };

  const parseImportFile = (file: File, separatorType: string, strip: boolean) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const separator = separatorType === 'tab' ? '\t' : separatorType === 'comma' ? ',' : ';';
      
      const lines = text.split('\n');
      const previewData: {q: string, a: string}[] = [];

      lines.forEach(line => {
        if (!line.trim() || line.startsWith('#')) return; // Skip empty or comments
        const parts = line.split(separator);
        if (parts.length >= 2) {
          let q = parts[0].trim();
          let a = parts[1].trim();
          
          if (strip) {
             q = stripHtml(q);
             a = stripHtml(a);
          }
          
          // Basic clean up of quotes if CSV
          if (separatorType === 'comma' && q.startsWith('"') && q.endsWith('"')) q = q.slice(1, -1);
          if (separatorType === 'comma' && a.startsWith('"') && a.endsWith('"')) a = a.slice(1, -1);

          if (q && a) {
            previewData.push({ q, a });
          }
        }
      });
      setImportPreview(previewData.slice(0, 100)); // Limit preview
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = () => {
    if (!targetDeckId || !targetSubDeckName || importPreview.length === 0) {
       alert("Selecione um Deck e defina um nome para o Tópico (Sub-deck).");
       return;
    }

    // 1. Convert preview (which is just a sample) - we need to re-parse all for final import
    // Actually, let's assume importPreview is enough if user didn't change file? 
    // Correct approach: Parse fully again or store parsed data. For MVP, re-using parsed preview if it contains all (slice limit above)
    // Let's re-read simply to be safe or just use the preview if file is small.
    // For safety, let's use the fileReader again to get ALL lines.
    
    if (!importFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const separator = importSeparator === 'tab' ? '\t' : importSeparator === 'comma' ? ',' : ';';
      const lines = text.split('\n');
      const newCards: Flashcard[] = [];

      lines.forEach(line => {
        if (!line.trim() || line.startsWith('#')) return;
        const parts = line.split(separator);
        if (parts.length >= 2) {
          let q = parts[0].trim();
          let a = parts[1].trim();
          if (shouldStripHtml) {
             q = stripHtml(q);
             a = stripHtml(a);
          }
          if (separator === ',' && q.startsWith('"') && q.endsWith('"')) q = q.slice(1, -1);
          if (separator === ',' && a.startsWith('"') && a.endsWith('"')) a = a.slice(1, -1);

          if (q && a) {
             newCards.push({
                id: crypto.randomUUID(),
                question: q,
                answer: a,
                interval: 0,
                easeFactor: 2.5,
                repetitions: 0,
                dueDate: new Date().toISOString(),
                state: 'new'
             });
          }
        }
      });

      if (newCards.length === 0) {
        alert("Nenhum card válido encontrado.");
        return;
      }

      // 2. Add to Plan
      const newSubDeck: FlashcardSubDeck = {
        id: crypto.randomUUID(),
        name: targetSubDeckName,
        cards: newCards
      };

      const updatedPlan = {
        ...plan,
        flashcardDecks: decks.map(d => {
          if (d.id === targetDeckId) {
            return {
              ...d,
              subDecks: [...d.subDecks, newSubDeck]
            };
          }
          return d;
        })
      };

      onUpdatePlan(updatedPlan);
      alert(`${newCards.length} cards importados com sucesso para "${targetSubDeckName}"!`);
      
      // Cleanup
      setImportFile(null);
      setImportPreview([]);
      setTargetSubDeckName('');
      setActiveTab('decks');
    };
    reader.readAsText(importFile);
  };

  // --- Study Logic ---

  const startStudySession = (deckId: string, subDeckId?: string) => {
    let cardsToStudy: Flashcard[] = [];
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    const deck = decks.find(d => d.id === deckId);
    if (!deck) return;

    const subDecksToSearch = subDeckId 
      ? deck.subDecks.filter(sd => sd.id === subDeckId)
      : deck.subDecks;

    subDecksToSearch.forEach(sd => {
      sd.cards.forEach(card => {
        const dueDate = new Date(card.dueDate);
        // Include if New or Due Date is passed/today
        if (dueDate <= today) {
          cardsToStudy.push(card);
        }
      });
    });

    if (cardsToStudy.length === 0) {
      alert("Não há cards para revisar neste deck hoje! Bom trabalho.");
      return;
    }

    // Shuffle slightly to mix new and reviews
    cardsToStudy = cardsToStudy.sort(() => Math.random() - 0.5);

    setStudyQueue(cardsToStudy);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setStudyDeckName(subDeckId ? (deck.subDecks.find(s=>s.id===subDeckId)?.name || deck.name) : deck.name);
    setIsStudying(true);
  };

  const handleRateCard = (rating: Rating) => {
    const currentCard = studyQueue[currentCardIndex];
    const updatedCard = calculateNextReview(currentCard, rating);

    // Update Plan with new card data
    const updatedPlan = {
      ...plan,
      flashcardDecks: decks.map(d => ({
        ...d,
        subDecks: d.subDecks.map(sd => ({
          ...sd,
          cards: sd.cards.map(c => c.id === currentCard.id ? updatedCard : c)
        }))
      }))
    };
    onUpdatePlan(updatedPlan);

    // If "Again", re-queue card at the end of this session
    if (rating === 'again') {
       setStudyQueue(prev => [...prev, updatedCard]);
    }

    // Move to next
    if (currentCardIndex < studyQueue.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      alert("Revisão finalizada! Todos os cards pendentes foram estudados.");
      setIsStudying(false);
    }
  };

  const toggleExpandDeck = (deckId: string) => {
    const newSet = new Set(expandedDecks);
    if (newSet.has(deckId)) newSet.delete(deckId);
    else newSet.add(deckId);
    setExpandedDecks(newSet);
  };

  // --- Render Components ---

  const renderDecks = () => {
    return (
      <div className="space-y-4 max-w-4xl mx-auto animate-fade-in">
        {decks.length === 0 && (
          <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
            <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Você ainda não tem decks.</p>
            <button onClick={() => setActiveTab('create')} className="text-medical-600 font-bold hover:underline">
              Criar meu primeiro deck
            </button>
          </div>
        )}

        {decks.map(deck => {
          // Calculate Stats per deck
          let dueCount = 0;
          let newCount = 0;
          let totalCount = 0;
          const today = new Date();
          today.setHours(23, 59, 59, 999);

          deck.subDecks.forEach(sd => {
            sd.cards.forEach(c => {
              totalCount++;
              if (c.state === 'new') newCount++;
              else if (new Date(c.dueDate) <= today) dueCount++;
            });
          });

          return (
            <div key={deck.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div 
                  className="flex items-center gap-3 cursor-pointer flex-1"
                  onClick={() => toggleExpandDeck(deck.id)}
                >
                  {expandedDecks.has(deck.id) ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{deck.name}</h3>
                    <div className="text-xs text-slate-500 flex gap-3">
                      <span className="text-emerald-600 font-medium">{dueCount} para revisar</span>
                      <span className="text-blue-600 font-medium">{newCount} novos</span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => startStudySession(deck.id)}
                  className="bg-medical-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-medical-700 shadow-sm"
                  disabled={dueCount + newCount === 0}
                >
                  Estudar Deck
                </button>
              </div>

              {expandedDecks.has(deck.id) && (
                <div className="bg-slate-50 border-t border-slate-100 divide-y divide-slate-100">
                  {deck.subDecks.map(sd => {
                    let sdDue = 0;
                    let sdNew = 0;
                    sd.cards.forEach(c => {
                      if (c.state === 'new') sdNew++;
                      else if (new Date(c.dueDate) <= today) sdDue++;
                    });

                    return (
                      <div key={sd.id} className="p-3 pl-12 flex justify-between items-center text-sm">
                        <span className="font-medium text-slate-700">{sd.name}</span>
                        <div className="flex items-center gap-4">
                           <span className="text-emerald-600 text-xs font-bold">{sdDue} rev</span>
                           <span className="text-blue-600 text-xs font-bold">{sdNew} new</span>
                           <button 
                              onClick={() => startStudySession(deck.id, sd.id)}
                              className="text-medical-600 hover:bg-medical-100 px-3 py-1 rounded transition-colors text-xs font-bold"
                              disabled={sdDue + sdNew === 0}
                           >
                             Estudar
                           </button>
                        </div>
                      </div>
                    );
                  })}
                  {deck.subDecks.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-400">Sem tópicos neste deck.</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderStudy = () => {
    const card = studyQueue[currentCardIndex];
    if (!card) return <div>Erro ao carregar card.</div>;

    return (
      <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4 px-4">
           <h3 className="font-bold text-slate-700">{studyDeckName}</h3>
           <div className="text-sm text-slate-500">
             {currentCardIndex + 1} / {studyQueue.length}
           </div>
        </div>

        {/* Card Area */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-lg flex flex-col overflow-hidden relative">
           {/* Front */}
           <div className={`p-8 flex-1 flex flex-col items-center justify-center text-center overflow-y-auto ${isFlipped ? 'border-b border-slate-100 bg-slate-50' : ''}`}>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Pergunta</span>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6">{card.question}</h2>
              {card.mediaUrl && (
                 <img src={card.mediaUrl} alt="media" className="max-h-48 md:max-h-64 object-contain rounded-lg border border-slate-200" />
              )}
           </div>

           {/* Back */}
           {isFlipped && (
             <div className="p-8 flex-1 flex flex-col items-center justify-center text-center bg-white animate-fade-in">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Resposta</span>
                <p className="text-xl md:text-2xl text-slate-700 font-medium">{card.answer}</p>
             </div>
           )}
        </div>

        {/* Controls */}
        <div className="mt-6 px-4">
           {!isFlipped ? (
             <button 
               onClick={() => setIsFlipped(true)}
               className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-900 shadow-lg transition-transform active:scale-95"
             >
               Mostrar Resposta
             </button>
           ) : (
             <div className="grid grid-cols-4 gap-3">
               <button onClick={() => handleRateCard('again')} className="flex flex-col items-center p-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 border border-red-200 transition-colors">
                  <span className="font-bold text-sm">Errei</span>
                  <span className="text-xs opacity-70 mt-1">&lt; 1 min</span>
               </button>
               <button onClick={() => handleRateCard('hard')} className="flex flex-col items-center p-3 bg-orange-100 text-orange-700 rounded-xl hover:bg-orange-200 border border-orange-200 transition-colors">
                  <span className="font-bold text-sm">Difícil</span>
                  <span className="text-xs opacity-70 mt-1">~ {Math.floor(Math.max(1, card.interval * 1.2))}d</span>
               </button>
               <button onClick={() => handleRateCard('good')} className="flex flex-col items-center p-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 border border-blue-200 transition-colors">
                  <span className="font-bold text-sm">Bom</span>
                  <span className="text-xs opacity-70 mt-1">~ {card.repetitions === 0 ? '1d' : Math.ceil(card.interval * card.easeFactor) + 'd'}</span>
               </button>
               <button onClick={() => handleRateCard('easy')} className="flex flex-col items-center p-3 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 border border-emerald-200 transition-colors">
                  <span className="font-bold text-sm">Fácil</span>
                  <span className="text-xs opacity-70 mt-1">~ {Math.ceil(card.interval * card.easeFactor * 1.3) + 'd'}</span>
               </button>
             </div>
           )}
        </div>
        
        <div className="mt-4 text-center">
           <button onClick={() => setIsStudying(false)} className="text-slate-400 text-sm hover:text-red-500">
             Sair da sessão
           </button>
        </div>
      </div>
    );
  };

  const renderCreate = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
         {/* Sidebar Setup */}
         <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
               <h3 className="font-bold text-slate-800 mb-4">1. Deck e Tópico</h3>
               
               {/* New Deck */}
               <div className="mb-6 pb-6 border-b border-slate-100">
                  <label className="text-xs font-bold uppercase text-slate-400 block mb-2">Novo Deck</label>
                  <div className="flex gap-2">
                     <input type="text" className="flex-1 border rounded px-2 py-1 text-sm" placeholder="Ex: Pediatria" value={newDeckName} onChange={e => setNewDeckName(e.target.value)} />
                     <button onClick={handleCreateDeck} className="bg-slate-800 text-white p-1.5 rounded"><Plus className="w-4 h-4" /></button>
                  </div>
               </div>

               {/* Select Deck */}
               <div className="mb-4">
                  <label className="text-sm font-medium text-slate-700 block mb-1">Selecione o Deck</label>
                  <select className="w-full border rounded px-2 py-2" value={selectedDeckId} onChange={e => setSelectedDeckId(e.target.value)}>
                    <option value="">Selecione...</option>
                    {decks.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
               </div>

               {/* New SubDeck */}
               <div className="mb-4">
                  <label className="text-xs font-bold uppercase text-slate-400 block mb-2">Novo Tópico</label>
                  <div className="flex gap-2">
                     <input type="text" className="flex-1 border rounded px-2 py-1 text-sm" placeholder="Ex: Vacinação" value={newSubDeckName} onChange={e => setNewSubDeckName(e.target.value)} disabled={!selectedDeckId} />
                     <button onClick={handleCreateSubDeck} className="bg-slate-800 text-white p-1.5 rounded" disabled={!selectedDeckId}><Plus className="w-4 h-4" /></button>
                  </div>
               </div>

               {/* Select SubDeck */}
               <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Selecione o Tópico</label>
                  <select className="w-full border rounded px-2 py-2" value={selectedSubDeckId} onChange={e => setSelectedSubDeckId(e.target.value)} disabled={!selectedDeckId}>
                    <option value="">Selecione...</option>
                    {selectedDeck?.subDecks.map(sd => <option key={sd.id} value={sd.id}>{sd.name}</option>)}
                  </select>
               </div>
            </div>
         </div>

         {/* Editor */}
         <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative">
               <h3 className="font-bold text-slate-800 mb-6">2. Criar Card</h3>
               {createSuccess && (
                  <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 px-3 py-1 rounded text-sm font-bold flex items-center gap-1">
                     <Check className="w-4 h-4" /> {createSuccess}
                  </div>
               )}

               <div className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Frente (Pergunta)</label>
                     <textarea 
                        className="w-full border border-slate-300 rounded-lg p-3 h-24 focus:ring-2 focus:ring-medical-500 outline-none" 
                        placeholder="Digite a pergunta..." 
                        value={cardQuestion} 
                        onChange={e => setCardQuestion(e.target.value)} 
                     />
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Imagem (Opcional)</label>
                     <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <button onClick={() => { setHasMedia(!hasMedia); setCardMediaUrl(''); }} className="text-sm font-medium text-slate-600 flex items-center gap-2 mb-2">
                           <Image className="w-4 h-4" /> {hasMedia ? 'Remover Imagem' : 'Adicionar Imagem'}
                        </button>
                        
                        {hasMedia && (
                           <div>
                              <div className="flex gap-4 mb-2 border-b border-slate-200">
                                 <button onClick={() => setMediaSource('url')} className={`text-xs pb-1 ${mediaSource === 'url' ? 'font-bold text-medical-600 border-b-2 border-medical-600' : 'text-slate-500'}`}>LINK</button>
                                 <button onClick={() => setMediaSource('file')} className={`text-xs pb-1 ${mediaSource === 'file' ? 'font-bold text-medical-600 border-b-2 border-medical-600' : 'text-slate-500'}`}>UPLOAD</button>
                              </div>
                              {mediaSource === 'url' ? (
                                 <input type="text" className="w-full border p-2 rounded text-sm" placeholder="URL da imagem..." value={cardMediaUrl} onChange={e => setCardMediaUrl(e.target.value)} />
                              ) : (
                                 <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileUpload} className="text-sm" />
                              )}
                              {cardMediaUrl && <div className="mt-2 text-xs text-emerald-600 font-medium">Imagem selecionada</div>}
                           </div>
                        )}
                     </div>
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Verso (Resposta)</label>
                     <textarea 
                        className="w-full border border-slate-300 rounded-lg p-3 h-24 focus:ring-2 focus:ring-medical-500 outline-none" 
                        placeholder="Digite a resposta..." 
                        value={cardAnswer} 
                        onChange={e => setCardAnswer(e.target.value)} 
                     />
                  </div>

                  <div className="flex justify-end pt-2">
                     <button onClick={handleCreateCard} className="bg-medical-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-medical-700 shadow-md flex items-center gap-2">
                        <Save className="w-5 h-5" /> Salvar Card
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </div>
    );
  };

  const renderImport = () => {
    return (
       <div className="max-w-4xl mx-auto animate-fade-in">
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                   <FileUp className="w-6 h-6" />
                </div>
                <div>
                   <h2 className="text-xl font-bold text-slate-800">Importar do Anki</h2>
                   <p className="text-slate-500 text-sm">Use arquivos de texto (.txt ou .csv) exportados do Anki.</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Config Left */}
                <div className="space-y-4">
                   <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">1. Selecione o Arquivo</label>
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-medical-400 transition-all">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <FileText className="w-8 h-8 mb-3 text-slate-400" />
                              <p className="text-sm text-slate-500"><span className="font-semibold">Clique para buscar</span></p>
                              <p className="text-xs text-slate-400">TXT ou CSV</p>
                          </div>
                          <input type="file" className="hidden" accept=".txt,.csv" onChange={handleImportFileChange} />
                      </label>
                      {importFile && (
                         <div className="mt-2 text-sm text-emerald-600 font-medium flex items-center gap-2">
                            <Check className="w-4 h-4" /> {importFile.name}
                         </div>
                      )}
                   </div>

                   <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">2. Configurações</label>
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <span className="text-xs font-bold text-slate-500 uppercase">Separador</span>
                            <select 
                               className="w-full mt-1 border border-slate-300 rounded p-2 text-sm"
                               value={importSeparator}
                               onChange={(e) => {
                                  setImportSeparator(e.target.value);
                                  if(importFile) parseImportFile(importFile, e.target.value, shouldStripHtml);
                               }}
                            >
                               <option value="tab">Tabulação (Anki)</option>
                               <option value="comma">Vírgula (CSV)</option>
                               <option value="semicolon">Ponto e vírgula</option>
                            </select>
                         </div>
                         <div>
                           <span className="text-xs font-bold text-slate-500 uppercase">HTML</span>
                           <div className="mt-2 flex items-center gap-2">
                              <input 
                                type="checkbox" 
                                checked={shouldStripHtml}
                                onChange={(e) => {
                                   setShouldStripHtml(e.target.checked);
                                   if(importFile) parseImportFile(importFile, importSeparator, e.target.checked);
                                }}
                                className="w-4 h-4"
                              />
                              <label className="text-sm text-slate-600">Remover Tags</label>
                           </div>
                         </div>
                      </div>
                   </div>

                   <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">3. Destino</label>
                      <div className="space-y-3">
                         <select 
                            className="w-full border border-slate-300 rounded p-2 text-sm"
                            value={targetDeckId}
                            onChange={(e) => setTargetDeckId(e.target.value)}
                         >
                            <option value="">Selecione o Deck...</option>
                            {decks.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                         </select>
                         <input 
                            type="text"
                            placeholder="Nome do Novo Tópico (ex: Importados)"
                            className="w-full border border-slate-300 rounded p-2 text-sm"
                            value={targetSubDeckName}
                            onChange={(e) => setTargetSubDeckName(e.target.value)}
                         />
                      </div>
                   </div>
                </div>

                {/* Preview Right */}
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 flex flex-col h-[400px]">
                   <h3 className="text-sm font-bold text-slate-700 mb-3">Pré-visualização ({importPreview.length} cards)</h3>
                   <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                      {importPreview.length === 0 ? (
                         <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                            Carregue um arquivo para visualizar
                         </div>
                      ) : (
                         importPreview.map((item, idx) => (
                            <div key={idx} className="bg-white p-2 rounded border border-slate-200 text-xs">
                               <div className="font-bold text-slate-700 mb-1">{item.q}</div>
                               <div className="text-slate-500">{item.a}</div>
                            </div>
                         ))
                      )}
                   </div>
                </div>
             </div>

             <div className="flex justify-end pt-4 border-t border-slate-100">
                <button 
                   onClick={handleExecuteImport}
                   disabled={!importFile || !targetDeckId || !targetSubDeckName}
                   className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center gap-2"
                >
                   <FileUp className="w-5 h-5" /> Importar Cards
                </button>
             </div>
          </div>
       </div>
    );
  };

  if (isStudying) {
    return <div className="p-4">{renderStudy()}</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen">
      <div className="flex items-center gap-4 mb-8 border-b border-slate-200 pb-2">
         <button onClick={() => setActiveTab('decks')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'decks' ? 'bg-medical-50 text-medical-700' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Layers className="w-5 h-5" /> Decks
         </button>
         <button onClick={() => setActiveTab('create')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'create' ? 'bg-medical-50 text-medical-700' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Plus className="w-5 h-5" /> Adicionar
         </button>
         <button onClick={() => setActiveTab('import')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'import' ? 'bg-medical-50 text-medical-700' : 'text-slate-500 hover:bg-slate-50'}`}>
            <FileUp className="w-5 h-5" /> Importar (Anki)
         </button>
      </div>

      {activeTab === 'decks' && renderDecks()}
      {activeTab === 'create' && renderCreate()}
      {activeTab === 'import' && renderImport()}
    </div>
  );
};