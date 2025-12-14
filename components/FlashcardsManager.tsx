import React, { useState, useMemo, useRef } from 'react';
import { Plan, FlashcardDeck, FlashcardSubDeck, Flashcard } from '../types';
import { Layers, Plus, Play, BookOpen, Search, Trash2, Check, X, RotateCw, Image, ChevronDown, ChevronRight, ArrowRight, Save, Upload, Link as LinkIcon } from 'lucide-react';

interface FlashcardsManagerProps {
  plan: Plan;
  onUpdatePlan: (plan: Plan) => void;
}

type Tab = 'study' | 'create' | 'library';
type InputSource = 'url' | 'file';
type StudyMode = 'training' | 'game';

export const FlashcardsManager: React.FC<FlashcardsManagerProps> = ({ plan, onUpdatePlan }) => {
  const [activeTab, setActiveTab] = useState<Tab>('study');
  
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

  // --- Study State ---
  const [studyDeckId, setStudyDeckId] = useState('');
  const [studySubDeckId, setStudySubDeckId] = useState('');
  const [studyMode, setStudyMode] = useState<StudyMode>('training');
  const [isStudying, setIsStudying] = useState(false);
  const [studyQueue, setStudyQueue] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionResults, setSessionResults] = useState({ correct: 0, wrong: 0 });

  // --- Library State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDecks, setExpandedDecks] = useState<Set<string>>(new Set());

  // Helpers
  const decks = plan.flashcardDecks || [];
  const selectedDeck = decks.find(d => d.id === selectedDeckId);

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
    setSelectedDeckId(newDeck.id); // Auto select
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
    setSelectedSubDeckId(newSubDeck.id); // Auto select
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem é muito grande (Limite: 5MB). Para arquivos maiores, use um Link URL.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCardMediaUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateCard = () => {
    if (!selectedDeckId || !selectedSubDeckId || !cardQuestion.trim() || !cardAnswer.trim()) {
      alert("Selecione Deck, Sub-deck, Pergunta e Resposta.");
      return;
    }

    const newCard: Flashcard = {
      id: crypto.randomUUID(),
      question: cardQuestion,
      answer: cardAnswer,
      mediaUrl: (hasMedia && cardMediaUrl.trim()) ? cardMediaUrl.trim() : undefined,
      mediaType: (hasMedia && cardMediaUrl.trim()) ? 'image' : undefined,
      box: 0
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
    
    // Reset fields
    setCardQuestion('');
    setCardAnswer('');
    setCardMediaUrl('');
    setHasMedia(false);
    setMediaSource('url');
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    setCreateSuccess("Flashcard criado com sucesso!");
    setTimeout(() => setCreateSuccess(null), 3000);
  };

  const handleDeleteCard = (deckId: string, subDeckId: string, cardId: string) => {
    if (!window.confirm("Excluir este card?")) return;
    const updatedPlan = {
      ...plan,
      flashcardDecks: decks.map(d => {
        if (d.id === deckId) {
          return {
            ...d,
            subDecks: d.subDecks.map(sd => {
              if (sd.id === subDeckId) {
                return { ...sd, cards: sd.cards.filter(c => c.id !== cardId) };
              }
              return sd;
            })
          };
        }
        return d;
      })
    };
    onUpdatePlan(updatedPlan);
  };

  const handleDeleteSubDeck = (deckId: string, subDeckId: string) => {
     if (!window.confirm("Excluir este tópico e todos os seus cards?")) return;
     const updatedPlan = {
      ...plan,
      flashcardDecks: decks.map(d => {
        if (d.id === deckId) {
          return {
            ...d,
            subDecks: d.subDecks.filter(sd => sd.id !== subDeckId)
          };
        }
        return d;
      })
    };
    onUpdatePlan(updatedPlan);
  };

  const handleDeleteDeck = (deckId: string) => {
    if (!window.confirm("Excluir este deck completo?")) return;
    const updatedPlan = {
      ...plan,
      flashcardDecks: decks.filter(d => d.id !== deckId)
    };
    onUpdatePlan(updatedPlan);
  };

  const toggleExpandDeck = (deckId: string) => {
    const newSet = new Set(expandedDecks);
    if (newSet.has(deckId)) newSet.delete(deckId);
    else newSet.add(deckId);
    setExpandedDecks(newSet);
  };

  // --- Study Logic ---

  const startStudy = () => {
    if (!studyDeckId) return;

    let cards: Flashcard[] = [];
    const deck = decks.find(d => d.id === studyDeckId);
    if (!deck) return;

    if (studySubDeckId) {
      const sub = deck.subDecks.find(sd => sd.id === studySubDeckId);
      if (sub) cards = [...sub.cards];
    } else {
      // All cards in deck
      deck.subDecks.forEach(sd => {
        cards = [...cards, ...sd.cards];
      });
    }

    if (cards.length === 0) {
      alert("Não há cards neste deck/tópico.");
      return;
    }

    // Shuffle cards
    cards = cards.sort(() => Math.random() - 0.5);

    setStudyQueue(cards);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setSessionResults({ correct: 0, wrong: 0 });
    setIsStudying(true);
  };

  const handleStudyResult = (result: 'correct' | 'wrong' | 'next') => {
    if (studyMode === 'game') {
      // Mock SRS Logic
      const currentCard = studyQueue[currentCardIndex];
      // Here we would actually update the card's 'box' in the Plan
      // For now, we just track session stats
      if (result === 'correct') {
        setSessionResults(prev => ({ ...prev, correct: prev.correct + 1 }));
      } else {
        setSessionResults(prev => ({ ...prev, wrong: prev.wrong + 1 }));
      }
    }

    if (currentCardIndex < studyQueue.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      // Finish session
      alert(`Sessão finalizada!\nAcertos: ${sessionResults.correct + (result === 'correct' ? 1 : 0)}\nErros: ${sessionResults.wrong + (result === 'wrong' ? 1 : 0)}`);
      setIsStudying(false);
    }
  };

  // --- Renders ---

  const renderStudySession = () => {
    const card = studyQueue[currentCardIndex];
    const progress = ((currentCardIndex + 1) / studyQueue.length) * 100;

    return (
      <div className="flex flex-col items-center justify-center h-full w-full max-w-4xl mx-auto px-4 py-4">
        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-2.5 rounded-full mb-6">
          <div className="bg-medical-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="w-full perspective-1000 h-[450px] md:h-[500px] relative">
          <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
            
            {/* Front (Question) */}
            {!isFlipped && (
               <div className="absolute inset-0 backface-hidden bg-white border border-slate-200 rounded-2xl shadow-xl p-8 flex flex-col items-center justify-center text-center">
                  <span className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-6">
                    Pergunta {currentCardIndex + 1} de {studyQueue.length}
                  </span>
                  
                  <div className="flex-1 flex flex-col items-center justify-center w-full overflow-y-auto custom-scrollbar">
                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800 leading-tight">
                      {card.question}
                    </h3>
                    
                    {card.mediaUrl && (
                      <div className="mt-6 w-full max-h-60 flex justify-center overflow-hidden rounded-lg border border-slate-100 shadow-sm bg-slate-50">
                        <img src={card.mediaUrl} alt="media" className="h-48 md:h-60 object-contain" />
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => setIsFlipped(true)}
                    className="mt-6 bg-medical-600 text-white px-8 py-3 rounded-full font-bold text-base shadow-lg hover:bg-medical-700 hover:scale-105 transition-all w-full md:w-auto min-w-[180px]"
                  >
                    Ver Resposta
                  </button>
               </div>
            )}

            {/* Back (Answer) */}
            {isFlipped && (
               <div className="absolute inset-0 backface-hidden rotate-y-180 bg-slate-900 border border-slate-700 rounded-2xl shadow-xl p-8 flex flex-col items-center justify-center text-center">
                  <span className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-6">Resposta</span>
                  
                  <div className="flex-1 flex items-center justify-center overflow-y-auto w-full custom-scrollbar">
                     <p className="text-xl md:text-2xl lg:text-3xl text-white font-medium leading-relaxed">
                       {card.answer}
                     </p>
                  </div>

                  <div className="mt-6 flex gap-4 w-full max-w-xl">
                    {studyMode === 'game' ? (
                      <>
                        <button 
                          onClick={() => handleStudyResult('wrong')}
                          className="flex-1 bg-red-500/90 hover:bg-red-600 text-white py-3 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 transform hover:scale-105"
                        >
                          <X className="w-5 h-5" /> Errei
                        </button>
                        <button 
                          onClick={() => handleStudyResult('correct')}
                          className="flex-1 bg-emerald-500/90 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 transform hover:scale-105"
                        >
                          <Check className="w-5 h-5" /> Acertei
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => handleStudyResult('next')}
                        className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 transform hover:scale-105"
                      >
                        Próximo Card <ArrowRight className="w-5 h-5" />
                      </button>
                    )}
                  </div>
               </div>
            )}
          </div>
        </div>
        
        <button onClick={() => setIsStudying(false)} className="mt-6 text-slate-400 hover:text-slate-600 font-medium text-sm">
          Encerrar Sessão
        </button>
      </div>
    );
  };

  return (
    <div className={`p-6 max-w-6xl mx-auto ${isStudying ? 'h-[calc(100vh-100px)] flex flex-col justify-center' : 'min-h-screen'}`}>
      
      {/* Header Tabs */}
      {!isStudying && (
        <div className="flex items-center gap-4 mb-8 border-b border-slate-200 pb-2">
           <button
             onClick={() => setActiveTab('study')}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'study' ? 'bg-medical-50 text-medical-700' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             <Play className="w-5 h-5" /> Estudar
           </button>
           <button
             onClick={() => setActiveTab('create')}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'create' ? 'bg-medical-50 text-medical-700' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             <Plus className="w-5 h-5" /> Criar Flashcard
           </button>
           <button
             onClick={() => setActiveTab('library')}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'library' ? 'bg-medical-50 text-medical-700' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             <BookOpen className="w-5 h-5" /> Biblioteca de Decks
           </button>
        </div>
      )}

      {/* --- STUDY TAB --- */}
      {activeTab === 'study' && (
        isStudying ? renderStudySession() : (
          <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-lg border border-slate-100 animate-fade-in">
             <div className="text-center mb-8">
               <div className="w-16 h-16 bg-medical-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Layers className="w-8 h-8 text-medical-600" />
               </div>
               <h2 className="text-2xl font-bold text-slate-800">Hora de Praticar</h2>
               <p className="text-slate-500">Configure sua sessão de estudos</p>
             </div>

             <div className="space-y-6">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-2">Selecione o Deck (Matéria)</label>
                   <select 
                      className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-medical-500 bg-white"
                      value={studyDeckId}
                      onChange={(e) => { setStudyDeckId(e.target.value); setStudySubDeckId(''); }}
                   >
                     <option value="">Selecione...</option>
                     {decks.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                   </select>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-2">Selecione o Tópico (Opcional)</label>
                   <select 
                      className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-medical-500 bg-white disabled:bg-slate-50"
                      value={studySubDeckId}
                      onChange={(e) => setStudySubDeckId(e.target.value)}
                      disabled={!studyDeckId}
                   >
                     <option value="">Todos os tópicos</option>
                     {decks.find(d => d.id === studyDeckId)?.subDecks.map(sd => (
                       <option key={sd.id} value={sd.id}>{sd.name}</option>
                     ))}
                   </select>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-2">Modo de Estudo</label>
                   <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setStudyMode('training')}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${studyMode === 'training' ? 'border-medical-600 bg-medical-50 text-medical-700' : 'border-slate-200 hover:border-medical-300'}`}
                      >
                        <BookOpen className="w-6 h-6 mx-auto mb-2" />
                        <div className="font-bold">Treino</div>
                        <div className="text-xs text-slate-500">Ver resposta e seguir</div>
                      </button>
                      <button
                        onClick={() => setStudyMode('game')}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${studyMode === 'game' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 hover:border-emerald-300'}`}
                      >
                        <RotateCw className="w-6 h-6 mx-auto mb-2" />
                        <div className="font-bold">Jogo</div>
                        <div className="text-xs text-slate-500">Avaliar desempenho</div>
                      </button>
                   </div>
                </div>

                <button 
                  onClick={startStudy}
                  disabled={!studyDeckId}
                  className="w-full bg-medical-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-medical-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Começar Estudo
                </button>
             </div>
          </div>
        )
      )}

      {/* --- CREATE TAB --- */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
           {/* Setup Column */}
           <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                 <h3 className="font-bold text-slate-800 mb-4">1. Estrutura</h3>
                 
                 {/* Deck Creation */}
                 <div className="mb-6 pb-6 border-b border-slate-100">
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Criar Novo Deck</label>
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                         placeholder="Ex: Cardiologia"
                         value={newDeckName}
                         onChange={(e) => setNewDeckName(e.target.value)}
                       />
                       <button 
                         onClick={handleCreateDeck}
                         className="bg-slate-800 text-white p-2 rounded-lg hover:bg-slate-700"
                         title="Adicionar Deck"
                       >
                         <Plus className="w-4 h-4" />
                       </button>
                    </div>
                 </div>

                 {/* Deck Selection */}
                 <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Selecione o Deck</label>
                    <select
                       className="w-full border border-slate-300 rounded-lg px-3 py-2"
                       value={selectedDeckId}
                       onChange={(e) => setSelectedDeckId(e.target.value)}
                    >
                       <option value="">Selecione...</option>
                       {decks.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                 </div>

                 {/* SubDeck Creation */}
                 <div className="mb-4">
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Criar Tópico (Sub-deck)</label>
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                         placeholder="Ex: HAS"
                         value={newSubDeckName}
                         onChange={(e) => setNewSubDeckName(e.target.value)}
                         disabled={!selectedDeckId}
                       />
                       <button 
                         onClick={handleCreateSubDeck}
                         disabled={!selectedDeckId}
                         className="bg-slate-800 text-white p-2 rounded-lg hover:bg-slate-700 disabled:opacity-50"
                         title="Adicionar Tópico"
                       >
                         <Plus className="w-4 h-4" />
                       </button>
                    </div>
                 </div>

                 {/* SubDeck Selection */}
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Selecione o Tópico</label>
                    <select
                       className="w-full border border-slate-300 rounded-lg px-3 py-2"
                       value={selectedSubDeckId}
                       onChange={(e) => setSelectedSubDeckId(e.target.value)}
                       disabled={!selectedDeckId}
                    >
                       <option value="">Selecione...</option>
                       {selectedDeck?.subDecks.map(sd => <option key={sd.id} value={sd.id}>{sd.name}</option>)}
                    </select>
                 </div>
              </div>
           </div>

           {/* Card Content Column */}
           <div className="lg:col-span-2">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative">
                 <h3 className="font-bold text-slate-800 mb-6">2. Conteúdo do Flashcard</h3>
                 
                 {createSuccess && (
                    <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 px-3 py-1 rounded text-sm font-bold animate-fade-in flex items-center gap-1">
                       <Check className="w-4 h-4" /> {createSuccess}
                    </div>
                 )}

                 <div className="space-y-6">
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-2">Pergunta</label>
                       <textarea
                          className="w-full border border-slate-300 rounded-lg px-4 py-3 h-24 focus:outline-none focus:ring-2 focus:ring-medical-500"
                          placeholder="Digite a pergunta..."
                          value={cardQuestion}
                          onChange={(e) => setCardQuestion(e.target.value)}
                       />
                    </div>

                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-2">Imagem (Opcional)</label>
                       
                       <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                          {/* Type Selector Toggle */}
                          <div className="mb-3">
                             <button 
                                onClick={() => { setHasMedia(!hasMedia); setCardMediaUrl(''); }} 
                                className={`w-full py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${hasMedia ? 'bg-medical-200 text-medical-800 border border-medical-300' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                             >
                                <Image className="w-4 h-4"/> {hasMedia ? 'Remover Imagem' : 'Adicionar Imagem'}
                             </button>
                          </div>

                          {/* Source Toggle & Input */}
                          {hasMedia && (
                             <div className="animate-fade-in">
                                <div className="flex gap-4 mb-3 border-b border-slate-200 pb-2">
                                  <button 
                                    onClick={() => { setMediaSource('url'); setCardMediaUrl(''); }}
                                    className={`text-xs font-bold uppercase tracking-wide pb-1 ${mediaSource === 'url' ? 'text-medical-600 border-b-2 border-medical-600' : 'text-slate-400 hover:text-slate-600'}`}
                                  >
                                    Link (URL)
                                  </button>
                                  <button 
                                    onClick={() => { setMediaSource('file'); setCardMediaUrl(''); }}
                                    className={`text-xs font-bold uppercase tracking-wide pb-1 ${mediaSource === 'file' ? 'text-medical-600 border-b-2 border-medical-600' : 'text-slate-400 hover:text-slate-600'}`}
                                  >
                                    Upload de Imagem
                                  </button>
                                </div>

                                {mediaSource === 'url' ? (
                                   <div className="flex items-center gap-2">
                                      <LinkIcon className="w-4 h-4 text-slate-400" />
                                      <input 
                                        type="text" 
                                        className="flex-1 bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-medical-500"
                                        placeholder="Cole a URL da imagem..."
                                        value={cardMediaUrl}
                                        onChange={(e) => setCardMediaUrl(e.target.value)}
                                      />
                                   </div>
                                ) : (
                                   <div className="flex items-center gap-2">
                                      <label className="flex-1 cursor-pointer">
                                         <div className="flex items-center justify-center gap-2 w-full bg-white border border-dashed border-slate-300 rounded-lg py-3 text-slate-500 hover:bg-slate-50 hover:border-medical-400 hover:text-medical-600 transition-colors">
                                            <Upload className="w-4 h-4" />
                                            <span className="text-sm font-medium">Clique para escolher o arquivo</span>
                                         </div>
                                         <input 
                                           ref={fileInputRef}
                                           type="file" 
                                           className="hidden"
                                           accept="image/*"
                                           onChange={handleFileUpload}
                                         />
                                      </label>
                                   </div>
                                )}
                                
                                {cardMediaUrl && mediaSource === 'file' && (
                                   <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1">
                                      <Check className="w-3 h-3" /> Arquivo carregado com sucesso
                                   </div>
                                )}
                             </div>
                          )}
                       </div>
                    </div>

                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-2">Resposta</label>
                       <textarea
                          className="w-full border border-slate-300 rounded-lg px-4 py-3 h-24 focus:outline-none focus:ring-2 focus:ring-medical-500"
                          placeholder="Digite a resposta..."
                          value={cardAnswer}
                          onChange={(e) => setCardAnswer(e.target.value)}
                       />
                    </div>

                    <div className="flex justify-end pt-4">
                       <button 
                         onClick={handleCreateCard}
                         className="bg-medical-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-medical-700 shadow-md flex items-center gap-2"
                       >
                         <Save className="w-5 h-5" /> Adicionar Flashcard
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* --- LIBRARY TAB --- */}
      {activeTab === 'library' && (
        <div className="animate-fade-in">
           <div className="mb-6 flex gap-4">
              <div className="flex-1 relative">
                 <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                 <input 
                   type="text" 
                   placeholder="Buscar decks ou tópicos..."
                   className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-medical-500"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
              </div>
           </div>

           <div className="space-y-4">
              {decks.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.subDecks.some(sd => sd.name.toLowerCase().includes(searchQuery.toLowerCase()))).map(deck => (
                 <div key={deck.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div 
                      className="p-4 bg-slate-50 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => toggleExpandDeck(deck.id)}
                    >
                       <div className="flex items-center gap-3">
                          {expandedDecks.has(deck.id) ? <ChevronDown className="w-5 h-5 text-slate-500" /> : <ChevronRight className="w-5 h-5 text-slate-500" />}
                          <h3 className="font-bold text-slate-800 text-lg">{deck.name}</h3>
                          <span className="text-xs font-medium bg-white border border-slate-200 px-2 py-1 rounded text-slate-500">
                             {deck.subDecks.length} tópicos
                          </span>
                       </div>
                       <button 
                         onClick={(e) => { e.stopPropagation(); handleDeleteDeck(deck.id); }}
                         className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                       >
                         <Trash2 className="w-5 h-5" />
                       </button>
                    </div>

                    {expandedDecks.has(deck.id) && (
                       <div className="p-4 space-y-3">
                          {deck.subDecks.map(subDeck => (
                             <div key={subDeck.id} className="border border-slate-100 rounded-lg p-3 hover:border-slate-300 transition-colors">
                                <div className="flex justify-between items-center mb-2">
                                   <h4 className="font-semibold text-slate-700">{subDeck.name}</h4>
                                   <div className="flex items-center gap-2">
                                      <span className="text-xs text-slate-500">{subDeck.cards.length} cards</span>
                                      <button 
                                         onClick={() => handleDeleteSubDeck(deck.id, subDeck.id)}
                                         className="p-1 text-slate-300 hover:text-red-500"
                                      >
                                         <Trash2 className="w-4 h-4" />
                                      </button>
                                   </div>
                                </div>
                                <div className="pl-4 border-l-2 border-slate-100 space-y-2">
                                   {subDeck.cards.map(card => (
                                      <div key={card.id} className="text-sm flex justify-between group">
                                         <span className="text-slate-600 truncate max-w-[80%]">{card.question}</span>
                                         <button 
                                            onClick={() => handleDeleteCard(deck.id, subDeck.id, card.id)}
                                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"
                                         >
                                            <X className="w-4 h-4" />
                                         </button>
                                      </div>
                                   ))}
                                   {subDeck.cards.length === 0 && <p className="text-xs text-slate-400 italic">Sem cards.</p>}
                                </div>
                             </div>
                          ))}
                          {deck.subDecks.length === 0 && <p className="text-center text-slate-400 py-4">Nenhum tópico neste deck.</p>}
                       </div>
                    )}
                 </div>
              ))}
              {decks.length === 0 && (
                 <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                    <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum deck criado.</p>
                    <p className="text-sm">Vá na aba "Criar Flashcard" para começar.</p>
                 </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};