import React, { useState, useRef, useMemo } from 'react';
import { Plan, FlashcardDeck, FlashcardSubDeck, Flashcard } from '../types';
import { Layers, Plus, Play, BookOpen, Search, Trash2, Check, X, Image, ChevronDown, ChevronRight, Save, Upload, Link as LinkIcon, Clock, TrendingUp, FileUp, FileText, AlertCircle, AlertTriangle, Library, Pencil, Filter } from 'lucide-react';

interface FlashcardsManagerProps {
  plan: Plan;
  onUpdatePlan: (plan: Plan) => void;
}

type Tab = 'decks' | 'create' | 'browse' | 'import' | 'library';
type InputSource = 'url' | 'file';
// Simplified Rating for this specific logic
type Rating = 'correct' | 'wrong';

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
  const [mediaSide, setMediaSide] = useState<'question' | 'answer'>('question'); // New state
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
  const [isStudyingErrorDeck, setIsStudyingErrorDeck] = useState(false);

  // --- Browse/Library State ---
  const [expandedDecks, setExpandedDecks] = useState<Set<string>>(new Set());
  const [expandedLibrarySubDecks, setExpandedLibrarySubDecks] = useState<Set<string>>(new Set()); // New state for accordion
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit State
  const [editingCard, setEditingCard] = useState<{ deckId: string, subDeckId: string, card: Flashcard } | null>(null);
  const [editQ, setEditQ] = useState('');
  const [editA, setEditA] = useState('');
  const [editMediaUrl, setEditMediaUrl] = useState('');
  const [editHasMedia, setEditHasMedia] = useState(false);
  const [editMediaSide, setEditMediaSide] = useState<'question' | 'answer'>('question'); // New edit state
  const [editMediaSource, setEditMediaSource] = useState<InputSource>('url');
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Helpers
  const decks = plan.flashcardDecks || [];
  const selectedDeck = decks.find(d => d.id === selectedDeckId);

  // Calculate Global Error Count
  const totalErrorCards = useMemo(() => {
    let count = 0;
    decks.forEach(d => d.subDecks.forEach(sd => sd.cards.forEach(c => {
      if (c.isError) count++;
    })));
    return count;
  }, [decks]);

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
      mediaSide: (hasMedia && cardMediaUrl.trim()) ? mediaSide : undefined, // Save side
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      dueDate: new Date().toISOString(),
      state: 'new',
      isError: false
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
    setMediaSide('question'); // Reset to default
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

  // --- Library Actions ---

  const handleDeleteCard = (deckId: string, subDeckId: string, cardId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este card?")) return;

    const updatedPlan = {
      ...plan,
      flashcardDecks: decks.map(d => {
        if (d.id !== deckId) return d;
        return {
          ...d,
          subDecks: d.subDecks.map(sd => {
            if (sd.id !== subDeckId) return sd;
            return {
              ...sd,
              cards: sd.cards.filter(c => c.id !== cardId)
            };
          })
        };
      })
    };
    onUpdatePlan(updatedPlan);
  };

  const handleStartEdit = (deckId: string, subDeckId: string, card: Flashcard) => {
    setEditingCard({ deckId, subDeckId, card });
    setEditQ(card.question);
    setEditA(card.answer);
    
    // Setup Media Edit State
    if (card.mediaUrl) {
      setEditHasMedia(true);
      setEditMediaUrl(card.mediaUrl);
      setEditMediaSource('url'); // Default to URL display
      setEditMediaSide(card.mediaSide || 'question'); // Set existing side
    } else {
      setEditHasMedia(false);
      setEditMediaUrl('');
      setEditMediaSide('question');
    }
  };

  const handleEditFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Imagem muito grande (Max 5MB).");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setEditMediaUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = () => {
    if (!editingCard) return;
    
    const updatedPlan = {
      ...plan,
      flashcardDecks: decks.map(d => {
        if (d.id !== editingCard.deckId) return d;
        return {
          ...d,
          subDecks: d.subDecks.map(sd => {
            if (sd.id !== editingCard.subDeckId) return sd;
            return {
              ...sd,
              cards: sd.cards.map(c => {
                if (c.id !== editingCard.card.id) return c;
                
                // Update fields
                return { 
                  ...c, 
                  question: editQ, 
                  answer: editA,
                  mediaUrl: (editHasMedia && editMediaUrl.trim()) ? editMediaUrl.trim() : undefined,
                  mediaType: (editHasMedia && editMediaUrl.trim()) ? 'image' : undefined,
                  mediaSide: (editHasMedia && editMediaUrl.trim()) ? editMediaSide : undefined
                };
              })
            };
          })
        };
      })
    };
    onUpdatePlan(updatedPlan);
    setEditingCard(null);
  };

  // --- Import Logic ---

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      parseTextImportFile(file, importSeparator, shouldStripHtml);
    }
  };

  const parseTextImportFile = (file: File, separatorType: string, strip: boolean) => {
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
                state: 'new',
                isError: false
             });
          }
        }
      });

      if (newCards.length === 0) {
        alert("Nenhum card válido encontrado.");
        return;
      }

      // Add to Plan
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

  const startStudyErrorDeck = () => {
     let errorCards: Flashcard[] = [];
     decks.forEach(d => d.subDecks.forEach(sd => sd.cards.forEach(c => {
       if (c.isError) errorCards.push(c);
     })));

     if (errorCards.length === 0) {
       alert("Parabéns! Você não tem cards marcados com erro.");
       return;
     }

     // Shuffle
     errorCards = errorCards.sort(() => Math.random() - 0.5);

     setStudyQueue(errorCards);
     setCurrentCardIndex(0);
     setIsFlipped(false);
     setStudyDeckName("⚠️ Deck de Erros");
     setIsStudyingErrorDeck(true);
     setIsStudying(true);
  };

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
    setIsStudyingErrorDeck(false);
    setIsStudying(true);
  };

  const handleRateCard = (rating: Rating) => {
    const currentCard = studyQueue[currentCardIndex];
    let updatedCard = { ...currentCard };
    
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);

    if (isStudyingErrorDeck) {
       if (rating === 'correct') {
          updatedCard.isError = false;
       } 
    } else {
       if (rating === 'correct') {
          updatedCard.dueDate = nextDay.toISOString();
       } else {
          updatedCard.isError = true;
          updatedCard.dueDate = nextDay.toISOString(); 
       }
    }

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

    if (currentCardIndex < studyQueue.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      alert("Sessão finalizada!");
      setIsStudying(false);
    }
  };

  const toggleExpandDeck = (deckId: string) => {
    const newSet = new Set(expandedDecks);
    if (newSet.has(deckId)) newSet.delete(deckId);
    else newSet.add(deckId);
    setExpandedDecks(newSet);
  };
  
  const toggleExpandSubDeck = (subDeckId: string) => {
    const newSet = new Set(expandedLibrarySubDecks);
    if (newSet.has(subDeckId)) newSet.delete(subDeckId);
    else newSet.add(subDeckId);
    setExpandedLibrarySubDecks(newSet);
  };

  // --- Render Components ---
  const renderStudy = () => {
    const card = studyQueue[currentCardIndex];
    if (!card) return <div>Erro: Card não encontrado.</div>;

    // Default to 'question' if undefined for backward compatibility
    const mediaSide = card.mediaSide || 'question';

    return (
      <div className="max-w-3xl mx-auto h-[80vh] flex flex-col animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800">{studyDeckName}</h2>
            {isStudyingErrorDeck && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Modo Erros</span>}
          </div>
          <div className="text-sm font-medium text-slate-500">
            Card {currentCardIndex + 1} de {studyQueue.length}
          </div>
        </div>

        {/* Card Area */}
        <div 
          className="flex-1 bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col relative overflow-hidden"
          style={{ perspective: '1000px' }}
        >
           {/* Content Container */}
           <div className="flex-1 p-8 flex flex-col items-center justify-center text-center overflow-y-auto">
              {/* Question */}
              <div className="w-full">
                <span className="inline-block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Pergunta</span>
                <div className="text-2xl font-medium text-slate-800 mb-6 whitespace-pre-wrap">{card.question}</div>
                
                {card.mediaUrl && mediaSide === 'question' && (
                   <div className="mb-6">
                      <img src={card.mediaUrl} alt="Card Media" className="max-h-64 max-w-full rounded-lg shadow-sm mx-auto object-contain" />
                   </div>
                )}
              </div>

              {/* Answer (Only if flipped) */}
              {isFlipped && (
                <div className="w-full pt-8 mt-8 border-t border-slate-100 animate-fade-in-up">
                   <span className="inline-block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Resposta</span>
                   <div className="text-xl text-slate-600 whitespace-pre-wrap">{card.answer}</div>
                   
                   {card.mediaUrl && mediaSide === 'answer' && (
                      <div className="mt-6">
                          <img src={card.mediaUrl} alt="Card Media Answer" className="max-h-64 max-w-full rounded-lg shadow-sm mx-auto object-contain" />
                      </div>
                   )}
                </div>
              )}
           </div>

           {/* Controls Bar */}
           <div className="p-6 bg-slate-50 border-t border-slate-200">
              {!isFlipped ? (
                 <button 
                   onClick={() => setIsFlipped(true)}
                   className="w-full bg-medical-600 text-white font-bold text-lg py-4 rounded-xl shadow-md hover:bg-medical-700 transition-transform active:scale-95 flex items-center justify-center gap-2"
                 >
                   Mostrar Resposta
                 </button>
              ) : (
                 <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => handleRateCard('wrong')}
                      className="bg-red-100 text-red-700 font-bold py-4 rounded-xl hover:bg-red-200 transition-colors flex flex-col items-center"
                    >
                      <span className="text-lg">Errei</span>
                      <span className="text-xs opacity-75 font-normal">Rever amanhã</span>
                    </button>
                    <button 
                      onClick={() => handleRateCard('correct')}
                      className="bg-emerald-100 text-emerald-700 font-bold py-4 rounded-xl hover:bg-emerald-200 transition-colors flex flex-col items-center"
                    >
                      <span className="text-lg">Acertei</span>
                      <span className="text-xs opacity-75 font-normal">Próxima revisão</span>
                    </button>
                 </div>
              )}
           </div>
        </div>
        
        <button 
          onClick={() => setIsStudying(false)}
          className="mt-6 text-slate-400 hover:text-slate-600 font-medium text-sm text-center"
        >
          Encerrar Sessão
        </button>
      </div>
    );
  };

  const renderDecks = () => {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
        
        {/* Special ERROR DECK */}
        {totalErrorCards > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden shadow-sm">
             <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="bg-red-100 p-2 rounded-full text-red-600">
                      <AlertTriangle className="w-6 h-6" />
                   </div>
                   <div>
                      <h3 className="font-bold text-red-800 text-lg">Deck de Erros</h3>
                      <p className="text-sm text-red-600">Cards que você errou e precisa reforçar</p>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                   <span className="font-bold text-xl text-red-700">{totalErrorCards} cards</span>
                   <button 
                      onClick={startStudyErrorDeck}
                      className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-red-700 transition-colors"
                   >
                      Revisar Erros
                   </button>
                </div>
             </div>
          </div>
        )}

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

  const renderLibrary = () => {
     const hasDecks = decks.length > 0;

     return (
       <div className="max-w-5xl mx-auto animate-fade-in pb-12">
          {/* Header & Filter */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                   <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                      <Library className="w-6 h-6 text-medical-600" />
                      Biblioteca de Cards
                   </h2>
                   <p className="text-slate-500 text-sm">Gerencie, edite e organize todos os seus flashcards.</p>
                </div>
                <div className="relative w-full md:w-auto min-w-[300px]">
                   <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                   <input 
                      type="text" 
                      placeholder="Buscar por pergunta ou resposta..."
                      className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-medical-500 focus:outline-none"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                   />
                </div>
             </div>
          </div>

          {/* Cards Structure */}
          {!hasDecks ? (
             <div className="text-center py-12 text-slate-400">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Sua biblioteca está vazia. Crie decks e cards primeiro.</p>
             </div>
          ) : (
             <div className="space-y-4">
                {decks.map(deck => {
                   const isDeckExpanded = expandedDecks.has(deck.id);
                   // Filter logic
                   const deckHasMatch = !searchTerm || deck.subDecks.some(sd => 
                      sd.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      sd.cards.some(c => 
                         c.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         c.answer.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                   );

                   if (!deckHasMatch) return null;

                   return (
                      <div key={deck.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                         {/* Deck Header */}
                         <div 
                            className="bg-slate-50 p-4 flex items-center gap-3 cursor-pointer border-b border-slate-100 hover:bg-slate-100 transition-colors"
                            onClick={() => toggleExpandDeck(deck.id)}
                         >
                            {isDeckExpanded || searchTerm ? <ChevronDown className="w-5 h-5 text-slate-500" /> : <ChevronRight className="w-5 h-5 text-slate-500" />}
                            <h3 className="font-bold text-slate-800 text-lg">{deck.name}</h3>
                            <span className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-500">
                               {deck.subDecks.length} tópicos
                            </span>
                         </div>

                         {/* Topics Accordion */}
                         {(isDeckExpanded || searchTerm) && (
                            <div className="bg-white">
                               {deck.subDecks.map(subDeck => {
                                  // Accordion State
                                  const isSubDeckExpanded = expandedLibrarySubDecks.has(subDeck.id);
                                  
                                  const cardsToShow = subDeck.cards.filter(c => 
                                     !searchTerm || 
                                     c.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                     c.answer.toLowerCase().includes(searchTerm.toLowerCase())
                                  );

                                  if (searchTerm && cardsToShow.length === 0) return null;

                                  return (
                                     <div key={subDeck.id} className="border-b border-slate-50 last:border-b-0">
                                        {/* Topic Header (Clickable Accordion) */}
                                        <div 
                                          onClick={() => toggleExpandSubDeck(subDeck.id)}
                                          className="p-3 pl-8 flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors"
                                        >
                                           {isSubDeckExpanded || searchTerm ? (
                                              <ChevronDown className="w-4 h-4 text-slate-400" />
                                           ) : (
                                              <ChevronRight className="w-4 h-4 text-slate-400" />
                                           )}
                                           <div className="w-2 h-2 rounded-full bg-medical-400"></div>
                                           <h4 className="font-semibold text-slate-700 flex-1">{subDeck.name}</h4>
                                           <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                              {cardsToShow.length} cards
                                           </span>
                                        </div>

                                        {/* Card Grid (Accordion Body) */}
                                        {(isSubDeckExpanded || searchTerm) && (
                                           <div className="p-4 pl-12 bg-slate-50/50 border-t border-slate-100">
                                              {cardsToShow.length === 0 ? (
                                                 <p className="text-sm text-slate-400 italic">Nenhum card neste tópico.</p>
                                              ) : (
                                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {cardsToShow.map(card => (
                                                       <div key={card.id} className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow relative group">
                                                          {card.isError && (
                                                             <div className="absolute top-2 right-2 text-red-500" title="Marcado como erro">
                                                                <AlertCircle className="w-4 h-4" />
                                                             </div>
                                                          )}
                                                          
                                                          <div className="mb-3">
                                                             <span className="text-xs font-bold uppercase text-slate-400">Pergunta</span>
                                                             <p className="text-slate-800 font-medium line-clamp-2">{card.question}</p>
                                                             {card.mediaUrl && <div className="mt-2 text-xs text-blue-500 flex items-center gap-1"><Image className="w-3 h-3"/> Contém Imagem</div>}
                                                          </div>
                                                          
                                                          <div className="mb-4">
                                                             <span className="text-xs font-bold uppercase text-slate-400">Resposta</span>
                                                             <p className="text-slate-600 text-sm line-clamp-2">{card.answer}</p>
                                                          </div>

                                                          <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                                                             <button 
                                                                onClick={(e) => { e.stopPropagation(); handleStartEdit(deck.id, subDeck.id, card); }}
                                                                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                                                             >
                                                                <Pencil className="w-3 h-3" /> Editar
                                                             </button>
                                                             <button 
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteCard(deck.id, subDeck.id, card.id); }}
                                                                className="flex items-center gap-1 text-xs font-medium text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                                                             >
                                                                <Trash2 className="w-3 h-3" /> Excluir
                                                             </button>
                                                          </div>
                                                       </div>
                                                    ))}
                                                 </div>
                                              )}
                                           </div>
                                        )}
                                     </div>
                                  );
                               })}
                               {deck.subDecks.length === 0 && (
                                  <p className="text-sm text-slate-400 text-center py-4">Sem tópicos neste deck.</p>
                               )}
                            </div>
                         )}
                      </div>
                   );
                })}
             </div>
          )}

          {/* Edit Modal */}
          {editingCard && (
             <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
                   <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                         <Pencil className="w-5 h-5 text-blue-600" /> Editar Card
                      </h3>
                      <button onClick={() => setEditingCard(null)} className="text-slate-400 hover:bg-slate-100 p-1 rounded-full">
                         <X className="w-6 h-6" />
                      </button>
                   </div>

                   <div className="space-y-4">
                      <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Pergunta</label>
                         <textarea 
                            className="w-full border border-slate-300 rounded-lg p-3 h-24 focus:ring-2 focus:ring-medical-500 outline-none resize-none"
                            value={editQ}
                            onChange={(e) => setEditQ(e.target.value)}
                         />
                      </div>

                      {/* Image Edit Section */}
                      <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Imagem</label>
                         <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <button onClick={() => { setEditHasMedia(!editHasMedia); if(!editHasMedia) setEditMediaUrl(''); }} className="text-sm font-medium text-slate-600 flex items-center gap-2 mb-2">
                               <Image className="w-4 h-4" /> {editHasMedia ? 'Remover Imagem' : 'Adicionar Imagem'}
                            </button>
                            
                            {editHasMedia && (
                               <div>
                                  <div className="flex gap-4 mb-2 border-b border-slate-200">
                                     <button onClick={() => setEditMediaSource('url')} className={`text-xs pb-1 ${editMediaSource === 'url' ? 'font-bold text-medical-600 border-b-2 border-medical-600' : 'text-slate-500'}`}>LINK</button>
                                     <button onClick={() => setEditMediaSource('file')} className={`text-xs pb-1 ${editMediaSource === 'file' ? 'font-bold text-medical-600 border-b-2 border-medical-600' : 'text-slate-500'}`}>UPLOAD</button>
                                  </div>
                                  
                                  {editMediaSource === 'url' ? (
                                     <input type="text" className="w-full border p-2 rounded text-sm" placeholder="URL da imagem..." value={editMediaUrl} onChange={e => setEditMediaUrl(e.target.value)} />
                                  ) : (
                                     <input type="file" ref={editFileInputRef} accept="image/*" onChange={handleEditFileUpload} className="text-sm" />
                                  )}

                                  {/* Side Selection */}
                                  <div className="flex gap-4 mt-3 pt-2 border-t border-slate-200">
                                     <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                        <input 
                                           type="radio" 
                                           name="editMediaSide" 
                                           checked={editMediaSide === 'question'} 
                                           onChange={() => setEditMediaSide('question')}
                                           className="text-medical-600 focus:ring-medical-500" 
                                        />
                                        Exibir na Pergunta (Frente)
                                     </label>
                                     <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                        <input 
                                           type="radio" 
                                           name="editMediaSide" 
                                           checked={editMediaSide === 'answer'} 
                                           onChange={() => setEditMediaSide('answer')}
                                           className="text-medical-600 focus:ring-medical-500" 
                                        />
                                        Exibir na Resposta (Verso)
                                     </label>
                                  </div>

                                  {editMediaUrl && (
                                    <div className="mt-3">
                                      <div className="text-xs text-emerald-600 font-medium mb-1">Pré-visualização:</div>
                                      <img src={editMediaUrl} alt="Preview" className="max-h-32 rounded border border-slate-200" />
                                    </div>
                                  )}
                               </div>
                            )}
                         </div>
                      </div>

                      <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Resposta</label>
                         <textarea 
                            className="w-full border border-slate-300 rounded-lg p-3 h-24 focus:ring-2 focus:ring-medical-500 outline-none resize-none"
                            value={editA}
                            onChange={(e) => setEditA(e.target.value)}
                         />
                      </div>
                      <div className="flex justify-end pt-2 gap-3">
                         <button onClick={() => setEditingCard(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium">Cancelar</button>
                         <button onClick={handleSaveEdit} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm">Salvar Alterações</button>
                      </div>
                   </div>
                </div>
             </div>
          )}
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
                              
                              {/* Side Selection */}
                              <div className="flex gap-4 mt-3 pt-2 border-t border-slate-200">
                                 <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                    <input 
                                       type="radio" 
                                       name="mediaSide" 
                                       checked={mediaSide === 'question'} 
                                       onChange={() => setMediaSide('question')}
                                       className="text-medical-600 focus:ring-medical-500" 
                                    />
                                    Exibir na Pergunta (Frente)
                                 </label>
                                 <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                    <input 
                                       type="radio" 
                                       name="mediaSide" 
                                       checked={mediaSide === 'answer'} 
                                       onChange={() => setMediaSide('answer')}
                                       className="text-medical-600 focus:ring-medical-500" 
                                    />
                                    Exibir na Resposta (Verso)
                                 </label>
                              </div>

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
                      <label className="block text-sm font-medium text-slate-700 mb-2">1. Selecione o Arquivo (.txt)</label>
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
                            <span className="text-xs font-bold text-slate-500 uppercase">Separador (Txt)</span>
                            <select 
                               className="w-full mt-1 border border-slate-300 rounded p-2 text-sm"
                               value={importSeparator}
                               onChange={(e) => {
                                  setImportSeparator(e.target.value);
                                  if(importFile) parseTextImportFile(importFile, e.target.value, shouldStripHtml);
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
                                   if(importFile) parseTextImportFile(importFile, importSeparator, e.target.checked);
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
                   <h3 className="text-sm font-bold text-slate-700 mb-3">Pré-visualização</h3>
                   <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                      {importPreview.length === 0 ? (
                         <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                            Carregue um arquivo de texto para visualizar
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
         <button onClick={() => setActiveTab('library')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'library' ? 'bg-medical-50 text-medical-700' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Library className="w-5 h-5" /> Biblioteca
         </button>
         <button onClick={() => setActiveTab('create')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'create' ? 'bg-medical-50 text-medical-700' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Plus className="w-5 h-5" /> Adicionar
         </button>
         <button onClick={() => setActiveTab('import')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'import' ? 'bg-medical-50 text-medical-700' : 'text-slate-500 hover:bg-slate-50'}`}>
            <FileUp className="w-5 h-5" /> Importar (Anki)
         </button>
      </div>

      {activeTab === 'decks' && renderDecks()}
      {activeTab === 'library' && renderLibrary()}
      {activeTab === 'create' && renderCreate()}
      {activeTab === 'import' && renderImport()}
    </div>
  );
};