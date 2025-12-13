import React, { useState } from 'react';
import { Plan, MockExam } from '../types';
import { Plus, Clock, Trash2, Award, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

interface MockExamsManagerProps {
  plan: Plan;
  onCreateMockExam: (
    institution: string,
    year: number,
    total: number,
    correct: number,
    duration: string
  ) => void;
  onDeleteMockExam: (id: string) => void;
}

export const MockExamsManager: React.FC<MockExamsManagerProps> = ({ plan, onCreateMockExam, onDeleteMockExam }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Form State
  const [institution, setInstitution] = useState('');
  const [year, setYear] = useState<string>('');
  const [total, setTotal] = useState<string>('');
  const [correct, setCorrect] = useState<string>('');
  const [duration, setDuration] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numTotal = parseInt(total);
    const numCorrect = parseInt(correct);
    const numYear = parseInt(year);

    if (numCorrect > numTotal) {
      alert("O número de acertos não pode ser maior que o total.");
      return;
    }

    onCreateMockExam(institution, numYear, numTotal, numCorrect, duration);
    
    // Reset form
    setInstitution('');
    setYear('');
    setTotal('');
    setCorrect('');
    setDuration('');
    setIsFormOpen(false);
  };

  const mockExams = plan.mockExams || [];
  
  // Sort by date (newest first)
  const sortedExams = [...mockExams].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="p-6 max-w-5xl mx-auto min-h-screen">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Simulados</h2>
          <p className="text-slate-500">Registre e acompanhe seu desempenho em provas na íntegra.</p>
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
            <>Fechar <ChevronUp className="w-4 h-4" /></>
          ) : (
            <>Adicionar Simulado <Plus className="w-4 h-4" /></>
          )}
        </button>
      </div>

      {/* Form */}
      {isFormOpen && (
        <div className="bg-white p-6 rounded-xl border border-medical-200 shadow-lg mb-8 animate-fade-in">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
             <Award className="w-5 h-5 text-medical-600" /> Novo Simulado
           </h3>
           
           <form onSubmit={handleSubmit} className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Instituição</label>
                   <input
                     type="text"
                     placeholder="Ex: USP-SP, Unicamp, SUS-SP"
                     className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-medical-500 focus:outline-none"
                     value={institution}
                     onChange={(e) => setInstitution(e.target.value)}
                     required
                     autoFocus
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Ano da Prova</label>
                   <input
                     type="number"
                     placeholder="Ex: 2024"
                     className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-medical-500 focus:outline-none"
                     value={year}
                     onChange={(e) => setYear(e.target.value)}
                     required
                   />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Total de Questões</label>
                   <input
                     type="number"
                     className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-medical-500 focus:outline-none"
                     value={total}
                     onChange={(e) => setTotal(e.target.value)}
                     required
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Número de Acertos</label>
                   <input
                     type="number"
                     className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-medical-500 focus:outline-none"
                     value={correct}
                     onChange={(e) => setCorrect(e.target.value)}
                     required
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Tempo de Prova</label>
                   <input
                     type="text"
                     placeholder="Ex: 04:30"
                     className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-medical-500 focus:outline-none"
                     value={duration}
                     onChange={(e) => setDuration(e.target.value)}
                     required
                   />
                </div>
             </div>

             <div className="flex justify-end pt-2">
               <button type="submit" className="bg-medical-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-medical-700 shadow-sm">
                 Salvar Simulado
               </button>
            </div>
           </form>
        </div>
      )}

      {/* List */}
      {sortedExams.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
           <Award className="w-12 h-12 mx-auto mb-3 text-slate-300" />
           <p className="text-slate-500 font-medium">Nenhum simulado registrado.</p>
           <p className="text-sm text-slate-400">Clique em "Adicionar Simulado" para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedExams.map((exam) => {
            const percentage = (exam.questionsCorrect / exam.questionsTotal) * 100;
            const badgeColor = percentage >= 80 ? 'bg-emerald-100 text-emerald-700' : percentage >= 60 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700';

            return (
              <div key={exam.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 relative group">
                <div className="flex justify-between items-start mb-4">
                   <div>
                      <h3 className="font-bold text-lg text-slate-800">{exam.institution}</h3>
                      <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{exam.year}</span>
                   </div>
                   <div className={`text-lg font-bold px-3 py-1 rounded-lg ${badgeColor}`}>
                      {percentage.toFixed(1)}%
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <p className="text-slate-500 text-xs">Acertos</p>
                    <p className="font-semibold text-slate-700">{exam.questionsCorrect} / {exam.questionsTotal}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                     <p className="text-slate-500 text-xs">Tempo</p>
                     <p className="font-semibold text-slate-700 flex items-center gap-1">
                       <Clock className="w-3 h-3" /> {exam.duration}
                     </p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-100 pt-3">
                   <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(exam.date).toLocaleDateString()}
                   </div>
                   <button 
                     onClick={() => {
                        if(window.confirm('Excluir este simulado?')) onDeleteMockExam(exam.id);
                     }}
                     className="text-slate-400 hover:text-red-500 transition-colors p-1"
                     title="Excluir"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};