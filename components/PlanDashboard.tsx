import React from 'react';
import { PlanStats } from '../types';
import { BarChart, BookOpen, CheckCircle, Target } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

interface PlanDashboardProps {
  stats: PlanStats;
}

export const PlanDashboard: React.FC<PlanDashboardProps> = ({ stats }) => {
  const data = [
    { name: 'Corretas', value: stats.totalCorrect },
    { name: 'Incorretas', value: stats.totalQuestions - stats.totalCorrect },
  ];
  
  // Handle case where no questions done yet to avoid ugly chart
  const hasData = stats.totalQuestions > 0;
  const chartData = hasData ? data : [{ name: 'Sem dados', value: 1 }];
  const COLORS = hasData ? ['#0ea5e9', '#ef4444'] : ['#e2e8f0'];

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Visão Geral</h2>
      
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Disciplinas</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats.totalSubjects}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Tópicos</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats.totalTopics}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Questões Realizadas</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats.totalQuestions}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <BarChart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Aproveitamento</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats.accuracy.toFixed(1)}%</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-1">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Desempenho Geral</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-medical-500"></div>
              <span className="text-slate-600">Acertos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-slate-600">Erros</span>
            </div>
          </div>
        </div>

        {/* Empty State / Welcome Message for specific prompt requirement */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 lg:col-span-2 flex flex-col justify-center items-center text-center">
          <h3 className="text-xl font-bold text-slate-800 mb-2">Bem-vindo ao seu Cronograma!</h3>
          <p className="text-slate-500 max-w-md mb-6">
            Comece organizando seus estudos. Vá até a aba "Disciplinas" para cadastrar as matérias e tópicos do seu edital.
          </p>
          {/* This is mostly visual filler for the MVP per instructions to focus on structure */}
          <div className="w-full h-32 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 text-sm">
            Gráfico de Evolução Semanal (Em breve)
          </div>
        </div>
      </div>
    </div>
  );
};