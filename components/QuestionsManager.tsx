import React, { useState, useEffect } from 'react';
import { Plan, Revision, Subject, Topic } from '../types';
import { CheckCircle, Calendar, Save, AlertCircle, Plus, ChevronDown, ChevronUp, Clock, CheckSquare, Flag, X, Trash2, AlertTriangle, Calendar as CalendarIcon } from 'lucide-react';

interface QuestionsManagerProps {
  plan: Plan;
  onRegisterSession: (
    subjectId: string,
    topicId: string,
    total: number,
    correct: number,
    revisionDays: number[],
    theoryFinished: boolean
  ) => void;
  onCompleteRevision: (
    subjectId: string,
    topicId: string,
    revisionId: string,
    total: number,
    correct: number
  ) => void;
  onDeleteRevision: (
    subjectId: string,
    topicId: string,
    revisionId: string
  ) => void;
}

type TabType = 'scheduled' | 'completed' | 'finished';

export const QuestionsManager: React.FC<QuestionsManagerProps> = ({ plan, onRegisterSession, onCompleteRevision, onDeleteRevision }) => {
  // UI State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('scheduled');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Modal State for Completing Revision
  const [revisionToComplete, setRevisionToComplete] = useState<{
    subjectId: string;
    topicId: string;
    revision: Revision;
    subjectName: string;
    topicName: string;
  } | null>(null);
  const [revTotal, setRevTotal] = useState('');
  const [revCorrect, setRevCorrect] = useState('');

  // Form State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [totalQuestions, setTotalQuestions] = useState<string>('');
  const [correctQuestions, setCorrectQuestions] = useState<string>('');
  const [revisionPattern, setRevisionPattern] = useState<string>('7, 14, 30');
  const [isTheoryFinished, setIsTheoryFinished] = useState<boolean>(false);

  // Reset topic when subject changes
  useEffect(() => {
    setSelectedTopicId('');
  }, [selectedSubjectId]);

  const selectedSubject = plan.subjects.find(s => s.id === selectedSubjectId);
  const selectedTopic = selectedSubject?.topics.find(t => t.id === selectedTopicId);

  // Initialize theory checkbox state based on existing data
  useEffect(() => {
    if (selectedTopic) {
      setIsTheoryFinished(selectedTopic.isTheoryCompleted || false);
    } else {
      setIsTheoryFinished(false);
    }
  }, [selectedTopic]);

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !selectedTopicId) return;

    const total = parseInt(totalQuestions) || 0;
    const correct = parseInt(correctQuestions) || 0;

    if (correct > total) {
      alert("O número de acertos não pode ser maior que o total.");
      return;
    }

    const days = revisionPattern
      .split(',')
      .map(d => parseInt(d.trim()))
      .filter(d => !isNaN(d) && d > 0);

    onRegisterSession(
      selectedSubjectId,
      selectedTopicId,
      total,
      correct,
      days,
      isTheoryFinished
    );

    setTotalQuestions('');
    setCorrectQuestions('');
    setSuccessMessage('Estudo e revisões cadastrados com sucesso!');
    setIsFormOpen(false); // Close form after save
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleRevisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionToComplete) return;

    const total = parseInt(revTotal) || 0;
    const correct = parseInt(revCorrect) || 0;

    if (correct > total) {
       alert("Acertos não podem ser maiores que total.");
       return;
    }

    onCompleteRevision(
      revisionToComplete.subjectId,
      revisionToComplete.topicId,
      revisionToComplete.revision.id,
      total,
      correct
    );

    setRevisionToComplete(null);
    setRevTotal('');
    setRevCorrect('');
    setSuccessMessage('Revisão concluída!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Helper to flatten data for lists
  const getFlattenedData = () => {
    const scheduled: any[] = [];
    const completed: any[] = [];
    const finished: any[] = [];

    plan.subjects.forEach(subj => {
      subj.topics.forEach(topic => {
        const revisions = topic.revisions || [];
        
        // Scheduled (Pending)
        revisions.filter(r => !r.isCompleted).forEach(rev => {
          scheduled.push({
            revision: rev,
            topic: topic,
            subject: subj
          });
        });

        // Completed (History)
        revisions.filter(r => r.isCompleted).forEach(rev => {
          completed.push({
            revision: rev,
            topic: topic,
            subject: subj
          });
        });

        // Finished Topics (All scheduled revisions are done AND there was at least one revision)
        // Or user marked as theory finished and no pending revisions
        // Based on prompt: "When check D30... automatically appears in finalized".
        // Logic: Has revisions, and all are completed.
        if (revisions.length > 0 && revisions.every(r => r.isCompleted)) {
             finished.push({
               topic: topic,
               subject: subj,
               accuracy: topic.questionsTotal > 0 ? (topic.questionsCorrect / topic.questionsTotal * 100) : 0
             });
        }
      });
    });

    // Sort by date
    scheduled.sort((a, b) => new Date(a.revision.scheduledDate).getTime() - new Date(b.revision.scheduledDate).getTime());
    completed.sort((a, b) => new Date(b.revision.completedDate!).getTime() - new Date(a.revision.completedDate!).getTime()); // Newest first
    
    return { scheduled, completed, finished };
  };

  const { scheduled, completed, finished } = getFlattenedData();

  return (
    <div className="p-6 max-w-5xl mx-auto min-h-screen">
      
      {/* Success Notification */}
      {successMessage && (
        <div className="fixed top-24 right-6 bg-emerald-100 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50 animate-fade-in">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Header & Toggle Button */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Controle de Questões</h2>
          <p className="text-slate-500">Gerencie seus estudos e revisões programadas.</p>
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm ${
            isFormOpen 
              ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
              : 'bg-medical-600 text-white hover:bg-medical-700 hover:shadow-md'
          }`}
        >
          {isFormOpen ? (
            <>Fehar Cadastro <ChevronUp className="w-4 h-4" /></>
          ) : (
            <>Cadastrar Questões <Plus className="w-4 h-4" /></>
          )}
        </button>
      </div>

      {/* Collapsible Registration Form */}
      {isFormOpen && (
        <div className="bg-white p-6 rounded-xl border border-medical-200 shadow-lg mb-8 animate-fade-in relative overflow-hidden">
           <div className="absolute top-0 left-0 w-1 h-full bg-medical-500"></div>
           <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
             <Plus className="w-5 h-5 text-medical-600" /> Novo Estudo
           </h3>
           
           <form onSubmit={handleRegisterSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Disciplina</label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-medical-500 focus:outline-none transition-all"
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  required
                >
                  <option value="">Selecione...</option>
                  {plan.subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tópico</label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-medical-500 focus:outline-none transition-all disabled:opacity-50"
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  disabled={!selectedSubjectId}
                  required
                >
                  <option value="">Selecione...</option>
                  {selectedSubject?.topics.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Total de Questões</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-medical-500 focus:outline-none"
                    value={totalQuestions}
                    onChange={(e) => setTotalQuestions(e.target.value)}
                    required
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Acertos</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-medical-500 focus:outline-none"
                    value={correctQuestions}
                    onChange={(e) => setCorrectQuestions(e.target.value)}
                    required
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Revisões (dias)</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-medical-500 focus:outline-none"
                    value={revisionPattern}
                    onChange={(e) => setRevisionPattern(e.target.value)}
                    placeholder="Ex: 7, 14, 30"
                  />
               </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="theory"
                className="w-4 h-4 text-medical-600 rounded border-gray-300 focus:ring-medical-500"
                checked={isTheoryFinished}
                onChange={(e) => setIsTheoryFinished(e.target.checked)}
              />
              <label htmlFor="theory" className="text-sm text-slate-700 font-medium">Teoria Finalizada</label>
            </div>

            <div className="flex justify-end pt-2">
               <button type="submit" className="bg-medical-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-medical-700 shadow-sm">
                 Salvar Estudo
               </button>
            </div>
           </form>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('scheduled')}
          className={`pb-3 px-6 text-sm font-medium transition-colors relative ${
            activeTab === 'scheduled' 
              ? 'text-medical-600 border-b-2 border-medical-600' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Programadas
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{scheduled.length}</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-3 px-6 text-sm font-medium transition-colors relative ${
            activeTab === 'completed' 
              ? 'text-medical-600 border-b-2 border-medical-600' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
             <CheckSquare className="w-4 h-4" />
             Realizadas
          </div>
        </button>
        <button
          onClick={() => setActiveTab('finished')}
          className={`pb-3 px-6 text-sm font-medium transition-colors relative ${
            activeTab === 'finished' 
              ? 'text-medical-600 border-b-2 border-medical-600' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
             <Flag className="w-4 h-4" />
             Finalizadas
          </div>
        </button>
      </div>

      {/* Content Area */}
      <div className="space-y-4">
        
        {/* SCHEDULED TAB */}
        {activeTab === 'scheduled' && (
          <>
            {scheduled.length === 0 ? (
               <div className="text-center py-12 text-slate-400">
                 <p>Nenhuma revisão programada no momento.</p>
               </div>
            ) : (
              scheduled.map((item, idx) => {
                const date = new Date(item.revision.scheduledDate);
                const isLate = date < new Date() && new Date().toDateString() !== date.toDateString();
                const isToday = new Date().toDateString() === date.toDateString();
                
                return (
                  <div 
                    key={idx}
                    onClick={() => setRevisionToComplete({
                       subjectId: item.subject.id,
                       topicId: item.topic.id,
                       revision: item.revision,
                       subjectName: item.subject.name,
                       topicName: item.topic.name
                    })}
                    className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-medical-400 hover:shadow-md transition-all group ${isLate ? 'border-l-4 border-l-red-500' : isToday ? 'border-l-4 border-l-yellow-400' : ''}`}
                  >
                    <div>
                       <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {item.subject.name}
                          </span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600">
                            {item.revision.label}
                          </span>

                          {isLate && (
                             <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 animate-pulse">
                               <AlertTriangle className="w-3 h-3" />
                               Atrasada
                             </span>
                          )}
                          {isToday && (
                             <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">
                               <CalendarIcon className="w-3 h-3" />
                               Hoje
                             </span>
                          )}
                       </div>
                       <h4 className="text-lg font-semibold text-slate-800">{item.topic.name}</h4>
                       <p className="text-sm flex items-center gap-1 text-slate-500 mt-1">
                         <Calendar className="w-3 h-3" /> 
                         {date.toLocaleDateString()} 
                       </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-50 text-medical-600 p-2 rounded-full group-hover:bg-medical-600 group-hover:text-white transition-colors">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteRevision(item.subject.id, item.topic.id, item.revision.id);
                        }}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Excluir Revisão"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* COMPLETED TAB */}
        {activeTab === 'completed' && (
          <>
            {completed.length === 0 ? (
               <div className="text-center py-12 text-slate-400">
                 <p>Nenhuma revisão realizada ainda.</p>
               </div>
            ) : (
              completed.map((item, idx) => {
                const acc = item.revision.questionsTotal > 0 ? (item.revision.questionsCorrect / item.revision.questionsTotal * 100) : 0;
                return (
                  <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:bg-white hover:shadow-sm transition-all">
                     <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                {item.subject.name}
                              </span>
                              <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded">
                                {item.revision.label}
                              </span>
                          </div>
                          <h4 className="text-lg font-semibold text-slate-700 strike-through decoration-slate-400">{item.topic.name}</h4>
                          <p className="text-xs text-slate-500 mt-1">Concluída em: {new Date(item.revision.completedDate).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="text-right">
                              <div className="text-2xl font-bold text-slate-700">{acc.toFixed(0)}%</div>
                              <div className="text-xs text-slate-500">{item.revision.questionsCorrect}/{item.revision.questionsTotal} acertos</div>
                           </div>
                           <button
                             onClick={() => onDeleteRevision(item.subject.id, item.topic.id, item.revision.id)}
                             className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                             title="Excluir Registro"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                     </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* FINISHED TAB */}
        {activeTab === 'finished' && (
          <>
            {finished.length === 0 ? (
               <div className="text-center py-12 text-slate-400">
                 <p>Nenhum tópico finalizado (todas revisões concluídas) ainda.</p>
               </div>
            ) : (
              finished.map((item, idx) => (
                <div key={idx} className="bg-emerald-50 p-5 rounded-xl border border-emerald-100 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="bg-emerald-200 p-3 rounded-full text-emerald-700">
                         <Flag className="w-6 h-6" />
                      </div>
                      <div>
                         <span className="text-xs font-bold uppercase text-emerald-600 mb-1 block">{item.subject.name}</span>
                         <h4 className="text-xl font-bold text-slate-800">{item.topic.name}</h4>
                         <p className="text-sm text-emerald-600 mt-1 flex items-center gap-1">
                           <CheckCircle className="w-3 h-3" /> Ciclo de revisão completo
                         </p>
                      </div>
                   </div>
                   <div className="text-right px-4 border-l border-emerald-200">
                      <p className="text-xs text-slate-500 uppercase font-bold">Aproveitamento Total</p>
                      <p className="text-3xl font-bold text-slate-800">{item.accuracy.toFixed(0)}%</p>
                   </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* MODAL FOR COMPLETING REVISION */}
      {revisionToComplete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-6">
               <div>
                  <h3 className="text-xl font-bold text-slate-800">Registrar Revisão</h3>
                  <p className="text-sm text-slate-500">{revisionToComplete.subjectName} • {revisionToComplete.topicName}</p>
               </div>
               <button onClick={() => setRevisionToComplete(null)} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                 <X className="w-6 h-6 text-slate-400" />
               </button>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-6 flex items-center justify-between border border-blue-100">
               <span className="text-blue-700 font-medium">Revisão programada:</span>
               <span className="bg-white text-blue-800 font-bold px-3 py-1 rounded shadow-sm">
                 {revisionToComplete.revision.label}
               </span>
            </div>

            <form onSubmit={handleRevisionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Questões Realizadas</label>
                <input
                  type="number"
                  autoFocus
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-medical-500 focus:outline-none"
                  value={revTotal}
                  onChange={(e) => setRevTotal(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Acertos</label>
                <input
                  type="number"
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-medical-500 focus:outline-none"
                  value={revCorrect}
                  onChange={(e) => setRevCorrect(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>

              <div className="pt-4 flex gap-3">
                 <button
                   type="button"
                   onClick={() => setRevisionToComplete(null)}
                   className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors"
                 >
                   Cancelar
                 </button>
                 <button
                   type="submit"
                   className="flex-1 py-3 bg-medical-600 text-white font-bold rounded-xl hover:bg-medical-700 shadow-lg shadow-medical-200 transition-all hover:-translate-y-0.5"
                 >
                   Concluir Revisão
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};