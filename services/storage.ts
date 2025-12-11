import { Plan } from '../types';
import { supabase } from '../supabaseClient';

const STORAGE_KEY = 'residenciamed-plans';

// Mude para TRUE para usar o Supabase
const USE_CLOUD = false; 

export const storageService = {
  
  // Load Plans
  async getPlans(): Promise<Plan[]> {
    if (USE_CLOUD && supabase) {
      try {
        // No Supabase, selecionamos a coluna 'content' da tabela 'plans'
        const { data, error } = await supabase
          .from('plans')
          .select('content');

        if (error) throw error;
        
        // Mapeamos o resultado para retornar apenas o objeto Plan
        return data ? data.map(row => row.content) : [];
      } catch (error) {
        console.error("Error fetching from Supabase:", error);
        return [];
      }
    } else {
      // Local Storage Fallback
      return new Promise((resolve) => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            const migrated = parsed.map((p: any) => ({
                ...p, 
                studySessions: p.studySessions || []
            }));
            resolve(migrated);
          } catch (e) {
            resolve([]);
          }
        } else {
          resolve([]);
        }
      });
    }
  },

  // Save specific plan (Create or Update)
  async savePlan(plan: Plan): Promise<void> {
    if (USE_CLOUD && supabase) {
      try {
        // Usamos UPSERT (Update ou Insert) baseado no ID
        // Salvamos o objeto inteiro do plano dentro da coluna JSONB 'content'
        const { error } = await supabase
          .from('plans')
          .upsert({ 
            id: plan.id, 
            content: plan 
          });
          
        if (error) throw error;
      } catch (error) {
        console.error("Error saving to Supabase:", error);
      }
    } else {
      // Local Storage Logic
      const currentPlans = await this.getPlans();
      const index = currentPlans.findIndex(p => p.id === plan.id);
      
      let newPlans;
      if (index >= 0) {
        newPlans = currentPlans.map(p => p.id === plan.id ? plan : p);
      } else {
        newPlans = [...currentPlans, plan];
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlans));
    }
  },

  // Delete Plan
  async deletePlan(planId: string): Promise<void> {
    if (USE_CLOUD && supabase) {
      try {
        const { error } = await supabase
          .from('plans')
          .delete()
          .eq('id', planId);
          
        if (error) throw error;
      } catch (error) {
         console.error("Error deleting from Supabase:", error);
      }
    } else {
       const currentPlans = await this.getPlans();
       const newPlans = currentPlans.filter(p => p.id !== planId);
       localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlans));
    }
  }
};