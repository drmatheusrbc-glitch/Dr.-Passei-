import { Plan } from '../types';
import { supabase } from '../supabaseClient';

const STORAGE_KEY = 'residenciamed-plans';

export const storageService = {
  
  // Load Plans
  async getPlans(): Promise<Plan[]> {
    // IF Supabase is configured (url valid), use it.
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('plans')
          .select('content');

        if (error) {
          console.error("Supabase Error (check if table 'plans' exists):", error);
          return [];
        }
        
        return data ? data.map(row => row.content) : [];
      } catch (error) {
        console.error("Connection Error:", error);
        return [];
      }
    }

    // FALLBACK: Local Storage (Used if no Supabase keys provided)
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
  },

  // Save specific plan (Create or Update)
  async savePlan(plan: Plan): Promise<void> {
    if (supabase) {
      try {
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
      return;
    }

    // Local Storage Logic
    // We manually read existing data to simulate a DB update
    const saved = localStorage.getItem(STORAGE_KEY);
    let currentPlans: Plan[] = [];
    
    if (saved) {
      try {
        currentPlans = JSON.parse(saved);
      } catch (e) { currentPlans = []; }
    }

    const index = currentPlans.findIndex(p => p.id === plan.id);
    let newPlans;
    
    if (index >= 0) {
      newPlans = currentPlans.map(p => p.id === plan.id ? plan : p);
    } else {
      newPlans = [...currentPlans, plan];
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlans));
  },

  // Delete Plan
  async deletePlan(planId: string): Promise<void> {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('plans')
          .delete()
          .eq('id', planId);
          
        if (error) throw error;
      } catch (error) {
         console.error("Error deleting from Supabase:", error);
      }
      return;
    }

    // Local Storage Logic
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const currentPlans = JSON.parse(saved);
      const newPlans = currentPlans.filter((p: Plan) => p.id !== planId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlans));
    }
  }
};