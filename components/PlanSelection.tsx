import React, { useState } from 'react';
import { Plan } from '../types';
import { Plus, GraduationCap, ArrowRight } from 'lucide-react';

interface PlanSelectionProps {
  plans: Plan[];
  onCreatePlan: (name: string) => void;
  onSelectPlan: (planId: string) => void;
}

export const PlanSelection: React.FC<PlanSelectionProps> = ({ plans, onCreatePlan, onSelectPlan }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlanName.trim()) {
      onCreatePlan(newPlanName);
      setNewPlanName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-medical-100 rounded-full mb-4">
            <GraduationCap className="w-8 h-8 text-medical-700" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Seus Planos de Estudo</h1>
          <p className="text-slate-500">Selecione um plano para continuar sua jornada rumo à residência.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create New Button */}
          <div 
            onClick={() => setIsCreating(true)}
            className="group cursor-pointer border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 hover:border-medical-500 hover:text-medical-600 hover:bg-white transition-all duration-200 h-64"
          >
            <Plus className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Criar Novo Plano</span>
          </div>

          {/* Existing Plans */}
          {plans.map((plan) => {
             const subjectCount = plan.subjects.length;
             const topicCount = plan.subjects.reduce((acc, subj) => acc + subj.topics.length, 0);

             return (
              <div 
                key={plan.id}
                onClick={() => onSelectPlan(plan.id)}
                className="bg-white rounded-xl shadow-sm hover:shadow-md border border-slate-200 p-6 cursor-pointer flex flex-col justify-between h-64 transition-all duration-200 hover:-translate-y-1 relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-2 h-full bg-medical-500"></div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{plan.name}</h3>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-4">
                    Criado em {new Date(plan.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Disciplinas</span>
                    <span className="font-semibold">{subjectCount}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Tópicos</span>
                    <span className="font-semibold">{topicCount}</span>
                  </div>
                </div>

                <div className="flex items-center text-medical-600 font-medium group-hover:underline">
                  Acessar Plano <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal for Creation */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 text-slate-900">Novo Plano de Estudos</h2>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Plano</label>
                <input
                  type="text"
                  autoFocus
                  placeholder="Ex: Residência R1 - USP"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-medical-500 focus:outline-none"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newPlanName.trim()}
                  className="px-4 py-2 bg-medical-600 text-white rounded-lg hover:bg-medical-700 transition-colors disabled:opacity-50"
                >
                  Criar Plano
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};