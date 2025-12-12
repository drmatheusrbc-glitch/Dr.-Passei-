import React, { useState } from 'react';
import { Plan } from '../types';
import { Trash2, AlertTriangle, CheckCircle, RefreshCcw, Save } from 'lucide-react';

interface SettingsViewProps {
  plan: Plan;
  onResetProgress: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ plan, onResetProgress }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleReset = () => {
    onResetProgress();
    setShowConfirm(false);
    setSuccessMsg("Histórico de questões zerado com sucesso!");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Configurações</h2>
        <p className="text-slate-500">Gerencie as preferências e dados do plano <strong>{plan.name}</strong>.</p>
      </div>

      {successMsg && (
        <div className="mb-6 bg-emerald-100 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {successMsg}
        </div>
      )}

      {/* General Settings Placeholder */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
           Preferências Gerais
        </h3>
        <div className="text-sm text-slate-500 italic">
          Opções de personalização de interface e notificações serão adicionadas em breve.
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
        <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-bold text-red-800">Zona de Perigo</h3>
        </div>
        
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-slate-800 mb-1">Zerar Progresso de Questões</h4>
              <p className="text-sm text-slate-500 max-w-xl">
                Esta ação irá <strong>excluir todo o histórico</strong> de revisões realizadas e zerar os contadores de acertos/erros de todos os tópicos. As disciplinas e o cronograma futuro serão mantidos.
              </p>
            </div>
            
            {!showConfirm ? (
              <button 
                onClick={() => setShowConfirm(true)}
                className="px-4 py-2 bg-white border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors flex items-center gap-2 shadow-sm"
              >
                <RefreshCcw className="w-4 h-4" />
                Zerar Contadores
              </button>
            ) : (
              <div className="flex items-center gap-2 animate-fade-in">
                <span className="text-sm font-medium text-red-700">Tem certeza?</span>
                <button 
                  onClick={handleReset}
                  className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-sm transition-colors"
                >
                  Sim, Zerar Tudo
                </button>
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="px-3 py-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};