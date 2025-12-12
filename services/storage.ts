import { Plan } from '../types';
import { supabase } from '../supabaseClient';

const STORAGE_KEY = 'residenciamed-plans';

export const storageService = {
  
  // Load Plans with smart sync
  async getPlans(): Promise<Plan[]> {
    // 1. Load Local Data (Backup & Initial Upload Source)
    let localPlans: Plan[] = [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        localPlans = parsed.map((p: any) => ({
          ...p,
          studySessions: p.studySessions || []
        }));
      }
    } catch (e) {
      console.error("Erro ao ler cache local", e);
    }

    try {
      // 2. Try Fetch Cloud Data
      const { data, error } = await supabase
        .from('plans')
        .select('*');

      if (error) throw error;

      if (data && data.length > 0) {
        // CASE A: Cloud has data. Sync Cloud -> Local
        console.log("Sincronizando da nuvem...");
        const cloudPlans = data.map(row => row.content as Plan);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudPlans));
        return cloudPlans;
      } 
      else if (localPlans.length > 0) {
        // CASE B: Cloud is empty but Local has data. Sync Local -> Cloud (Initial Upload)
        console.log("Nuvem vazia. Fazendo upload dos dados locais...");
        
        // Execute uploads in parallel
        await Promise.all(localPlans.map(plan => 
          supabase.from('plans').upsert({
            id: plan.id,
            content: plan,
          })
        ));
        
        return localPlans;
      }

      // CASE C: Both empty
      return [];

    } catch (e) {
      console.warn("Modo Offline Ativo: Erro ao conectar na nuvem.", e);
      return localPlans;
    }
  },

  // Save specific plan (Local + Cloud Upsert)
  async savePlan(plan: Plan): Promise<void> {
    // 1. Save Local (Optimistic)
    const saved = localStorage.getItem(STORAGE_KEY);
    let currentPlans: Plan[] = [];
    if (saved) {
      try { currentPlans = JSON.parse(saved); } catch (e) { currentPlans = []; }
    }

    const index = currentPlans.findIndex(p => p.id === plan.id);
    let newPlans;
    if (index >= 0) {
      newPlans = currentPlans.map(p => p.id === plan.id ? plan : p);
    } else {
      newPlans = [...currentPlans, plan];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlans));

    // 2. Save Cloud (Async)
    try {
      const { error } = await supabase.from('plans').upsert({ 
        id: plan.id, 
        content: plan
      }, { onConflict: 'id' });

      if (error) throw error;
    } catch (e) {
      console.error("Erro ao salvar na nuvem:", e);
    }
  },

  // Delete Plan (Local + Cloud)
  async deletePlan(planId: string): Promise<void> {
    // 1. Delete Local
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const currentPlans = JSON.parse(saved);
      const newPlans = currentPlans.filter((p: Plan) => p.id !== planId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlans));
    }

    // 2. Delete Cloud
    try {
      await supabase.from('plans').delete().eq('id', planId);
    } catch (e) {
      console.error("Erro ao deletar na nuvem:", e);
    }
  }
};