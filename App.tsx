import React, { useState, useEffect, useMemo } from 'react';
import { Plan, ViewState, PlanStats, MockExam } from './types';
import { PlanSelection } from './components/PlanSelection';
import { PlanDashboard } from './components/PlanDashboard';
import { SubjectsManager } from './components/SubjectsManager';
import { QuestionsManager } from './components/QuestionsManager';
import { StatisticsDashboard } from './components/StatisticsDashboard';
import { CalendarView } from './components/CalendarView';
import { SettingsView } from './components/SettingsView';
import { MockExamsManager } from './components/MockExamsManager'; // Import
import { LayoutDashboard, Book, LogOut, FileText, PieChart, Loader2, Cloud, Calendar as CalendarIcon, Settings, Menu, ChevronLeft, ClipboardList } from 'lucide-react';
import { storageService } from './services/storage';

export default function App() {
  // State
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Load from storage on mount
  useEffect(() => {
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

    // Calculate from Subjects/Topics
    selectedPlan.subjects.forEach(subject => {
      subject.topics.forEach(topic => {
        totalTopics++;
        totalQuestions += topic.questionsTotal;
        totalCorrect += topic.questionsCorrect;
      });
    });

    // Calculate from Mock Exams (Simulados)
    if (selectedPlan.mockExams) {
      selectedPlan.mockExams.forEach(exam => {
        totalQuestions += exam.questionsTotal;
        totalCorrect += exam.questionsCorrect;
      });
    }

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
      studySessions: [],
      mockExams: []
    };
    
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

  const handleEditSubject = (subjectId: string, newName: string) => {
    if (!selectedPlan) return;

    const updatedPlan = {
      ...selectedPlan,
      subjects: selectedPlan.subjects.map(s => 
        s.id === subjectId ? { ...s, name: newName } : s
      )
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

  const handleEditTopic = (subjectId: string, topicId: string, newName: string) => {
    if (!selectedPlan) return;

    const updatedPlan = {
      ...selectedPlan,
      subjects: selectedPlan.subjects.map(subject => {
        if (subject.id === subjectId) {
          return {
            ...subject,
            topics: subject.topics.map(t => 
              t.id === topicId ? { ...t, name: newName } : t
            )
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
                // 1. Create Future Revisions (Pending)
                const newRevisions = revisionDays.map(days => {
                  const date = new Date();
                  date.setDate(date.getDate() + days);
                  return {
                    id: crypto.randomUUID(),
                    label: `D${days}`,
                    scheduledDate: date.toISOString(),
                    isCompleted: false
                  };
                });

                // 2. Create D0 Revision (Completed Immediately)
                // This marks the initial study session
                const d0Revision = {
                  id: crypto.randomUUID(),
                  label: 'D0',
                  scheduledDate: new Date().toISOString(),
                  isCompleted: true,
                  completedDate: new Date().toISOString(),
                  questionsTotal: total,
                  questionsCorrect: correct
                };

                // Merge revisions with existing ones
                const existingRevisions = topic.revisions || [];
                // Add D0 and Future revisions to the list
                const allRevisions = [...existingRevisions, d0Revision, ...newRevisions];

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
                  questionsTotal: topic.questionsTotal + total,
                  questionsCorrect: topic.questionsCorrect + correct,
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
                // Find the revision to get stats before deleting
                const revisionToDelete = topic.revisions.find(r => r.id === revisionId);
                let newTotal = topic.questionsTotal;
                let newCorrect = topic.questionsCorrect;

                // Subtract stats if the revision was completed
                if (revisionToDelete && revisionToDelete.isCompleted) {
                   const revTotal = revisionToDelete.questionsTotal || 0;
                   const revCorrect = revisionToDelete.questionsCorrect || 0;
                   newTotal = Math.max(0, newTotal - revTotal);
                   newCorrect = Math.max(0, newCorrect - revCorrect);
                }

                return {
                  ...topic,
                  questionsTotal: newTotal,
                  questionsCorrect: newCorrect,
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

  const handleResetProgress = () => {
    if (!selectedPlan) return;
    
    // Clear study sessions history (chart data)
    // Clear completed revisions
    // Reset topic counters
    const updatedPlan = {
      ...selectedPlan,
      studySessions: [],
      // Also clear mock exams
      mockExams: [],
      subjects: selectedPlan.subjects.map(subject => ({
        ...subject,
        topics: subject.topics.map(topic => ({
          ...topic,
          questionsTotal: 0,
          questionsCorrect: 0,
          // Keep only pending revisions (not completed)
          revisions: topic.revisions.filter(r => !r.isCompleted) 
        }))
      }))
    };

    updateSinglePlan(updatedPlan);
  };

  // --- Mock Exam Actions ---

  const handleCreateMockExam = (institution: string, year: number, total: number, correct: number, duration: string) => {
    if (!selectedPlan) return;

    const newMock: MockExam = {
      id: crypto.randomUUID(),
      institution,
      year,
      questionsTotal: total,
      questionsCorrect: correct,
      duration,
      date: new Date().toISOString()
    };

    const newSession = {
      date: new Date().toISOString(),
      questionsTotal: total,
      questionsCorrect: correct
    };

    const updatedPlan = {
      ...selectedPlan,
      studySessions: [...(selectedPlan.studySessions || []), newSession],
      mockExams: [...(selectedPlan.mockExams || []), newMock]
    };

    updateSinglePlan(updatedPlan);
  };

  const handleDeleteMockExam = (id: string) => {
    if (!selectedPlan) return;

    const updatedPlan = {
      ...selectedPlan,
      mockExams: (selectedPlan.mockExams || []).filter(e => e.id !== id)
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

  // Render Plan Selection
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
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-20 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-medical-600 font-bold text-xl">
             <div className="w-8 h-8 bg-medical-600 text-white rounded-lg flex items-center justify-center">D</div>
             Dr. Passei
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-slate-600"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
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
            onClick={() => setCurrentView('mock-exams')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'mock-exams' 
                ? 'bg-medical-50 text-medical-700' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            Simulados
          </button>

          <button
            onClick={() => setCurrentView('calendar')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'calendar' 
                ? 'bg-medical-50 text-medical-700' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CalendarIcon className="w-5 h-5" />
            Calendário
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
        
        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 space-y-1">
          <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium px-4 mb-2">
             <Cloud className="w-4 h-4" />
             Sincronização Ativa
          </div>
          
          <button
            onClick={() => setCurrentView('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'settings'
                ? 'bg-medical-50 text-medical-700'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Settings className="w-5 h-5" />
            Configurações
          </button>

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
      <main 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'ml-64' : 'ml-0'
        }`}
      >
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
              title={isSidebarOpen ? "Recolher Menu" : "Expandir Menu"}
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {currentView === 'settings' ? 'Configurações' : currentView === 'mock-exams' ? 'Simulados' : selectedPlan.name}
              </h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                {planStats && currentView !== 'settings' && (
                  <>
                    <span className="flex items-center gap-1 hidden sm:flex">
                      <span className="font-semibold text-slate-700">{planStats.totalSubjects}</span> Disciplinas
                    </span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full hidden sm:block"></span>
                    <span className="flex items-center gap-1 hidden sm:flex">
                      <span className="font-semibold text-slate-700">{planStats.totalTopics}</span> Tópicos
                    </span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full hidden sm:block"></span>
                    <span className="flex items-center gap-1">
                      <span className="font-semibold text-slate-700">{planStats.totalQuestions}</span> Questões
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold ml-2">
                      {planStats.accuracy.toFixed(1)}% Acerto
                    </span>
                  </>
                )}
              </div>
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
              onEditSubject={handleEditSubject}
              onDeleteSubject={handleDeleteSubject}
              onAddTopic={handleAddTopic}
              onEditTopic={handleEditTopic}
              onDeleteTopic={handleDeleteTopic}
            />
          )}
          {currentView === 'questions' && (
            <QuestionsManager 
              plan={selectedPlan}
              onRegisterSession={handleRegisterSession}
              onCompleteRevision={handleCompleteRevision}
              onDeleteRevision={handleDeleteRevision}
              onResetProgress={handleResetProgress}
            />
          )}
          {currentView === 'mock-exams' && (
            <MockExamsManager 
              plan={selectedPlan}
              onCreateMockExam={handleCreateMockExam}
              onDeleteMockExam={handleDeleteMockExam}
            />
          )}
          {currentView === 'calendar' && (
            <CalendarView plan={selectedPlan} />
          )}
          {currentView === 'statistics' && (
            <StatisticsDashboard plan={selectedPlan} />
          )}
          {currentView === 'settings' && (
            <SettingsView plan={selectedPlan} onResetProgress={handleResetProgress} />
          )}
        </div>
      </main>
    </div>
  );
}