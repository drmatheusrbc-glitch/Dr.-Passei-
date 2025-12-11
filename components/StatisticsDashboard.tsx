import React, { useMemo } from 'react';
import { Plan } from '../types';
import { BookOpen, Target, CheckCircle, BarChart2, CheckSquare } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StatisticsDashboardProps {
  plan: Plan;
}

export const StatisticsDashboard: React.FC<StatisticsDashboardProps> = ({ plan }) => {
  
  // Calculations
  const metrics = useMemo(() => {
    let totalTopics = 0;
    let finishedTheory = 0;
    let totalQuestions = 0;
    let totalCorrect = 0;
    let finishedRevisions = 0;
    let completedRevisionCount = 0; // individual revision instances

    const subjectPerformance: { name: string; correct: number; total: number; accuracy: number }[] = [];

    plan.subjects.forEach(subject => {
      let subjCorrect = 0;
      let subjTotal = 0;

      subject.topics.forEach(topic => {
        totalTopics++;
        if (topic.isTheoryCompleted) finishedTheory++;
        
        totalQuestions += topic.questionsTotal;
        totalCorrect += topic.questionsCorrect;
        
        subjCorrect += topic.questionsCorrect;
        subjTotal += topic.questionsTotal;

        if (topic.revisions) {
          topic.revisions.forEach(rev => {
             if (rev.isCompleted) completedRevisionCount++;
          });
          // Check if revisions are fully finished for the topic (based on our definition in QuestionsManager)
          if (topic.revisions.length > 0 && topic.revisions.every(r => r.isCompleted)) {
             finishedRevisions++;
          }
        }
      });

      subjectPerformance.push({
        name: subject.name,
        correct: subjCorrect,
        total: subjTotal,
        accuracy: subjTotal > 0 ? (subjCorrect / subjTotal) * 100 : 0
      });
    });

    // Sort subjects by accuracy descending
    subjectPerformance.sort((a, b) => b.accuracy - a.accuracy);

    const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    const theoryPercentage = totalTopics > 0 ? (finishedTheory / totalTopics) * 100 : 0;

    return {
      totalSubjects: plan.subjects.length,
      totalTopics,
      finishedTheory,
      theoryPercentage,
      totalQuestions,
      totalCorrect,
      accuracy,
      finishedRevisions: completedRevisionCount, // Using actual completed count per prompt "Número de revisões finalizadas"
      subjectPerformance
    };
  }, [plan]);

  // Chart Data Preparation
  const chartData = useMemo(() => {
    // We need to create a cumulative timeline.
    // If we have studySessions (added in new update), we use them.
    // Otherwise we fall back to a simple point.
    
    if (!plan.studySessions || plan.studySessions.length === 0) {
       return [{ date: new Date().toLocaleDateString('pt-BR'), accuracy: 0 }];
    }

    // Sort sessions by date
    const sortedSessions = [...plan.studySessions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let runningTotal = 0;
    let runningCorrect = 0;
    const dataPoints: any[] = [];

    sortedSessions.forEach(session => {
       runningTotal += session.questionsTotal;
       runningCorrect += session.questionsCorrect;
       const acc = runningTotal > 0 ? (runningCorrect / runningTotal) * 100 : 0;
       
       dataPoints.push({
         date: new Date(session.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
         accuracy: parseFloat(acc.toFixed(1))
       });
    });

    return dataPoints;
  }, [plan.studySessions]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
      
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Estatísticas Detalhadas</h2>
        <p className="text-slate-500">Acompanhe sua evolução e métricas de estudo.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Disciplinas */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex items-center gap-2 mb-2">
             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
               <BookOpen className="w-5 h-5" />
             </div>
             <span className="text-sm font-medium text-slate-500">Disciplinas</span>
           </div>
           <p className="text-2xl font-bold text-slate-800">{metrics.totalSubjects}</p>
        </div>

        {/* Tópicos / Teoria */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex items-center gap-2 mb-2">
             <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
               <Target className="w-5 h-5" />
             </div>
             <span className="text-sm font-medium text-slate-500">Teoria Finalizada</span>
           </div>
           <div className="flex items-end gap-2">
              <p className="text-2xl font-bold text-slate-800">{metrics.finishedTheory} <span className="text-sm text-slate-400 font-normal">/ {metrics.totalTopics}</span></p>
           </div>
           <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
              <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${metrics.theoryPercentage}%` }}></div>
           </div>
        </div>

        {/* Questões */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex items-center gap-2 mb-2">
             <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
               <CheckCircle className="w-5 h-5" />
             </div>
             <span className="text-sm font-medium text-slate-500">Questões Realizadas</span>
           </div>
           <p className="text-2xl font-bold text-slate-800">{metrics.totalQuestions}</p>
        </div>

        {/* Acertos */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex items-center gap-2 mb-2">
             <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
               <BarChart2 className="w-5 h-5" />
             </div>
             <span className="text-sm font-medium text-slate-500">Aproveitamento</span>
           </div>
           <p className="text-2xl font-bold text-slate-800">{metrics.accuracy.toFixed(1)}%</p>
        </div>

        {/* Revisões */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex items-center gap-2 mb-2">
             <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
               <CheckSquare className="w-5 h-5" />
             </div>
             <span className="text-sm font-medium text-slate-500">Revisões Feitas</span>
           </div>
           <p className="text-2xl font-bold text-slate-800">{metrics.finishedRevisions}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Subject Table */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="p-4 border-b border-slate-100 bg-slate-50">
             <h3 className="font-bold text-slate-800">Desempenho por Disciplina</h3>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="bg-white text-slate-500 font-medium border-b border-slate-100">
                 <tr>
                   <th className="px-4 py-3">Disciplina</th>
                   <th className="px-4 py-3 text-right">Acertos</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {metrics.subjectPerformance.map((subj) => (
                   <tr key={subj.name} className="hover:bg-slate-50">
                     <td className="px-4 py-3 font-medium text-slate-700">{subj.name}</td>
                     <td className="px-4 py-3 text-right">
                       <span className={`font-bold ${subj.accuracy >= 80 ? 'text-emerald-600' : subj.accuracy >= 60 ? 'text-blue-600' : 'text-slate-600'}`}>
                         {subj.accuracy.toFixed(1)}%
                       </span>
                     </td>
                   </tr>
                 ))}
                 {metrics.subjectPerformance.length === 0 && (
                   <tr>
                     <td colSpan={2} className="px-4 py-8 text-center text-slate-400">
                       Sem dados
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>

        {/* Evolution Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
           <h3 className="font-bold text-slate-800 mb-6">Evolução de Acertos Totais</h3>
           <div className="h-80 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart
                 data={chartData}
                 margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
               >
                 <defs>
                   <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                 <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                 />
                 <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                 />
                 <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                 />
                 <Area 
                    type="monotone" 
                    dataKey="accuracy" 
                    stroke="#0ea5e9" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorAcc)" 
                    name="Aproveitamento"
                    unit="%"
                 />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

      </div>

    </div>
  );
};