import React, { useState, useEffect, useMemo } from 'react';
import { Plan, ViewState, PlanStats } from './types';
import { PlanSelection } from './components/PlanSelection';
import { PlanDashboard } from './components/PlanDashboard';
import { SubjectsManager } from './components/SubjectsManager';
import { QuestionsManager } from './components/QuestionsManager';
import { StatisticsDashboard } from './components/StatisticsDashboard';
import { LayoutDashboard, Book, LogOut, FileText, PieChart, Loader2, Cloud, CloudOff, Wifi } from 'lucide-react';
import { storageService } from './services/storage';
import { supabase } from './supabaseClient';

export default function App() {
  // State
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isCloudConnected, setIsCloudConnected] = useState(false);

  // Load from storage on mount (Async)
  useEffect(() => {
    // Check connection type
    setIsCloudConnected(!!supabase);

    const loadData = async () => {
      setIsLoading(true);
      try {
        const loadedPlans = await storageService.getPlans();
        setPlans(loadedPlans);
      } catch (error) {
        console.error("Failed to load plans", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Helper to update local state AND storage persistence
  // We wrap all state updates in this helper to ensure persistence
  const updatePlans = (newPlans: Plan[]) => {
    setPlans(newPlans);
    
    // In a real cloud app, we might want to be more selective (save only the changed plan)
    // But for this transition, we mimic the previous behavior but routed through the service
    newPlans.forEach(plan => {
      storageService.savePlan(plan);
    });
  };

  // Helper to update a SINGLE plan (better for performance)
  const updateSinglePlan = (updatedPlan: Plan) => {
    setPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));
    storageService.savePlan(updatedPlan);
  };

  // Derived state
  const selectedPlan = useMemo(
    () => plans.find(p => p.id === selectedPlanId),
    [plans, selectedPlanId]
  );

  const planStats: PlanStats | null = useMemo(() => {
    if (!selectedPlan) return null;
    
    let totalSubjects = selectedPlan.subjects.length;
    let totalTopics = 0;
    let totalQuestions = 0;
    let totalCorrect = 0;

    selectedPlan.subjects.forEach(subject => {
      subject.topics.forEach(topic => {
        totalTopics++;
        totalQuestions += topic.questionsTotal;
        totalCorrect += topic.questionsCorrect;
      });
    });

    const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    return {
      totalSubjects,
      totalTopics,
      totalQuestions,
      totalCorrect,
      accuracy
    };
  }, [selectedPlan]);

  // Actions
  const handleCreatePlan = async (name: string) => {
    const newPlan: Plan = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      subjects: [],
      studySessions: []
    };
    
    // Optimistic UI update
    setPlans(prev => [...prev, newPlan]);
    await storageService.savePlan(newPlan);
  };

  const handleSelectPlan = (id: string) => {
    setSelectedPlanId(id);
    setCurrentView('dashboard');
  };

  const handleAddSubject = (name: string) => {
    if (!selectedPlan) return;
    
    const updatedPlan = {
      ...selectedPlan,
      subjects: [...selectedPlan.subjects, {
        id: crypto.randomUUID(),
        name,
        topics: []
      }]
    };
    
    updateSinglePlan(updatedPlan);
  };

  const handleDeleteSubject = (subjectId: string) => {
    if (!selectedPlan) return;
    if (!window.confirm("Tem certeza? Todos os tópicos desta disciplina serão perdidos.")) return;
    
    const updatedPlan = {
      ...selectedPlan,
      subjects: selectedPlan.subjects.filter(s => s.id !== subjectId)
    };
    
    updateSinglePlan(updatedPlan);
  };

  const handleAddTopic = (subjectId: string, topicName: string) => {
    if (!selectedPlan) return;
    
    const updatedPlan = {
      ...selectedPlan,
      subjects: selectedPlan.subjects.map(subject => {
        if (subject.id === subjectId) {
          return {
            ...subject,
            topics: [...subject.topics, {
              id: crypto.randomUUID(),
              name: topicName,
              questionsTotal: 0,
              questionsCorrect: 0,
              revisions: []
            }]
          };
        }
        return subject;
      })
    };

    updateSinglePlan(updatedPlan);
  };

  const handleDeleteTopic = (subjectId: string, topicId: string) => {
    if (!selectedPlan) return;

    const updatedPlan = {
      ...selectedPlan,
      subjects: selectedPlan.subjects.map(subject => {
        if (subject.id === subjectId) {
          return {
            ...subject,
            topics: subject.topics.filter(t => t.id !== topicId)
          };
        }
        return subject;
      })
    };

    updateSinglePlan(updatedPlan);
  };

  const handleRegisterSession = (
    subjectId: string, 
    topicId: string, 
    total: number, 
    correct: number,
    revisionDays: number[],
    theoryFinished: boolean
  ) => {
    if (!selectedPlan) return;

    // Create session record
    const newSession = {
      date: new Date().toISOString(),
      questionsTotal: total,
      questionsCorrect: correct
    };

    const updatedPlan = {
      ...selectedPlan,
      studySessions: [...(selectedPlan.studySessions || []), newSession],
      subjects: selectedPlan.subjects.map(subject => {
        if (subject.id === subjectId) {
          return {
            ...subject,
            topics: subject.topics.map(topic => {
              if (topic.id === topicId) {
                // Create specific Revision objects
                const newRevisions = revisionDays.map(days => {
                  const date = new Date();
                  date.setDate(date.getDate() + days);
                  return {
                    id: crypto.randomUUID(),
                    label: `${days} dias`,
                    scheduledDate: date.toISOString(),
                    isCompleted: false
                  };
                });

                // Merge revisions with existing ones
                const existingRevisions = topic.revisions || [];
                const allRevisions = [...existingRevisions, ...newRevisions];

                return {
                  ...topic,
                  questionsTotal: topic.questionsTotal + total,
                  questionsCorrect: topic.questionsCorrect + correct,
                  isTheoryCompleted: theoryFinished,
                  revisions: allRevisions
                };
              }
              return topic;
            })
          };
        }
        return subject;
      })
    };

    updateSinglePlan(updatedPlan);
  };

  const handleCompleteRevision = (
    subjectId: string,
    topicId: string,
    revisionId: string,
    total: number,
    correct: number
  ) => {
    if (!selectedPlan) return;

    const newSession = {
      date: new Date().toISOString(),
      questionsTotal: total,
      questionsCorrect: correct
    };

    const updatedPlan = {
      ...selectedPlan,
      studySessions: [...(selectedPlan.studySessions || []), newSession],
      subjects: selectedPlan.subjects.map(subject => {
        if (subject.id === subjectId) {
          return {
            ...subject,
            topics: subject.topics.map(topic => {
              if (topic.id === topicId) {
                return {
                  ...topic,
                  // Update aggregate stats
                  questionsTotal: topic.questionsTotal + total,
                  questionsCorrect: topic.questionsCorrect + correct,
                  // Mark revision as completed
                  revisions: topic.revisions.map(rev => {
                    if (rev.id === revisionId) {
                      return {
                        ...rev,
                        isCompleted: true,
                        completedDate: new Date().toISOString(),
                        questionsTotal: total,
                        questionsCorrect: correct
                      };
                    }
                    return rev;
                  })
                };
              }
              return topic;
            })
          };
        }
        return subject;
      })
    };

    updateSinglePlan(updatedPlan);
  };

  const handleDeleteRevision = (
    subjectId: string,
    topicId: string,
    revisionId: string
  ) => {
    if (!selectedPlan) return;
    if (!window.confirm("Tem certeza que deseja excluir esta revisão?")) return;

    const updatedPlan = {
      ...selectedPlan,
      subjects: selectedPlan.subjects.map(subject => {
        if (subject.id === subjectId) {
          return {
            ...subject,
            topics: subject.topics.map(topic => {
              if (topic.id === topicId) {
                return {
                  ...topic,
                  revisions: topic.revisions.filter(r => r.id !== revisionId)
                };
              }
              return topic;
            })
          };
        }
        return subject;
      })
    };

    updateSinglePlan(updatedPlan);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 text-medical-600">
          <Loader2 className="w-12 h-12 animate-spin" />
          <p className="font-medium text-lg">Carregando Dr. Passei...</p>
        </div>
      </div>
    );
  }

  // Render Plan Selection if no plan selected
  if (!selectedPlan) {
    return (
      <PlanSelection 
        plans={plans} 
        onCreatePlan={handleCreatePlan} 
        onSelectPlan={handleSelectPlan} 
      />
    );
  }

  // Render Main App Layout
  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 z-20">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-medical-600 font-bold text-xl">
             <div className="w-8 h-8 bg-medical-600 text-white rounded-lg flex items-center justify-center">D</div>
             Dr. Passei
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'dashboard' 
                ? 'bg-medical-50 text-medical-700' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Visão Geral
          </button>
          
          <button
            onClick={() => setCurrentView('subjects')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'subjects' 
                ? 'bg-medical-50 text-medical-700' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Book className="w-5 h-5" />
            Disciplinas
          </button>

          <button
            onClick={() => setCurrentView('questions')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'questions' 
                ? 'bg-medical-50 text-medical-700' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-5 h-5" />
            Questões
          </button>

          <button
            onClick={() => setCurrentView('statistics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'statistics' 
                ? 'bg-medical-50 text-medical-700' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <PieChart className="w-5 h-5" />
            Estatísticas
          </button>
        </nav>

        {/* Cloud Status Indicator */}
        <div className="px-4 pb-2">
          <div className={`rounded-lg p-3 text-xs flex items-center gap-2 border ${isCloudConnected ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
             {isCloudConnected ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
             <div className="flex flex-col">
               <span className="font-bold">{isCloudConnected ? 'Sincronizado' : 'Modo Offline'}</span>
               <span className="text-[10px] opacity-80">{isCloudConnected ? 'Salvo na nuvem' : 'Salvo no navegador'}</span>
             </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => setSelectedPlanId(null)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Trocar Plano
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{selectedPlan.name}</h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
              {planStats && (
                <>
                  <span className="flex items-center gap-1">
                    <span className="font-semibold text-slate-700">{planStats.totalSubjects}</span> Disciplinas
                  </span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span className="flex items-center gap-1">
                    <span className="font-semibold text-slate-700">{planStats.totalTopics}</span> Tópicos
                  </span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span className="flex items-center gap-1">
                    <span className="font-semibold text-slate-700">{planStats.totalQuestions}</span> Questões
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                    {planStats.accuracy.toFixed(1)}% Acerto
                  </span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-auto bg-slate-50">
          {currentView === 'dashboard' && planStats && (
            <PlanDashboard stats={planStats} />
          )}
          {currentView === 'subjects' && (
            <SubjectsManager 
              plan={selectedPlan}
              onAddSubject={handleAddSubject}
              onAddTopic={handleAddTopic}
              onDeleteSubject={handleDeleteSubject}
              onDeleteTopic={handleDeleteTopic}
            />
          )}
          {currentView === 'questions' && (
            <QuestionsManager 
              plan={selectedPlan}
              onRegisterSession={handleRegisterSession}
              onCompleteRevision={handleCompleteRevision}
              onDeleteRevision={handleDeleteRevision}
            />
          )}
          {currentView === 'statistics' && (
            <StatisticsDashboard plan={selectedPlan} />
          )}
        </div>
      </main>
    </div>
  );
}