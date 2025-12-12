import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, LogOut, Database, AlertTriangle, CheckCircle } from 'lucide-react';

export const SettingsManager: React.FC = () => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  useEffect(() => {
    const savedUrl = localStorage.getItem('supabase_url') || '';
    const savedKey = localStorage.getItem('supabase_key') || '';
    setUrl(savedUrl);
    setKey(savedKey);
  }, []);

  const handleSave = () => {
    if (!url || !key) {
      alert("Por favor, preencha ambos os campos.");
      return;
    }

    setStatus('saving');
    localStorage.setItem('supabase_url', url.trim());
    localStorage.setItem('supabase_key', key.trim());
    
    setTimeout(() => {
      setStatus('success');
      // Reload to apply changes in supabaseClient
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }, 500);
  };

  const handleClear = () => {
    if (confirm("Deseja remover as configurações e voltar ao modo offline?")) {
      localStorage.removeItem('supabase_url');
      localStorage.removeItem('supabase_key');
      window.location.reload();
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Database className="w-6 h-6 text-medical-600" />
          Configuração de Nuvem
        </h2>
        <p className="text-slate-500">
          Conecte seu aplicativo ao Supabase para sincronizar seus dados entre dispositivos.
        </p>
      </div>

      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
        
        {status === 'success' ? (
          <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
            <div className="bg-emerald-100 p-4 rounded-full text-emerald-600 mb-4">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Configuração Salva!</h3>
            <p className="text-slate-500 mb-4">O aplicativo será recarregado para aplicar a conexão.</p>
            <RefreshCw className="w-6 h-6 text-medical-600 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-bold mb-1">Como obter as chaves?</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Acesse seu projeto no <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">Supabase</a>.</li>
                  <li>Vá em <strong>Settings</strong> (ícone de engrenagem) > <strong>API</strong>.</li>
                  <li>Copie a <strong>Project URL</strong> e a chave <strong>anon public</strong>.</li>
                </ol>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Project URL (URL do Projeto)
              </label>
              <input 
                type="text" 
                placeholder="https://exemplo.supabase.co"
                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-medical-500 focus:outline-none"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Anon Key (Chave Pública)
              </label>
              <input 
                type="password" 
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-medical-500 focus:outline-none font-mono text-sm"
                value={key}
                onChange={(e) => setKey(e.target.value)}
              />
              <p className="text-xs text-slate-400 mt-1">Essa chave é segura para usar no navegador.</p>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100 mt-4">
              <button
                onClick={handleClear}
                className="flex items-center gap-2 text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <LogOut className="w-4 h-4" /> Desconectar
              </button>

              <button
                onClick={handleSave}
                disabled={status === 'saving'}
                className="flex items-center gap-2 bg-medical-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-medical-700 shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {status === 'saving' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Salvar e Conectar
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
