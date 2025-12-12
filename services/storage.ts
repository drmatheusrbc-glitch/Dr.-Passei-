import { Plan } from '../types';

const STORAGE_KEY = 'residenciamed-plans';

export const storageService = {
  
  // Load Plans (Local Only)
  async getPlans(): Promise<Plan[]> {
    return new Promise((resolve) => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Migration/Safety check for structure
          const migrated = parsed.map((p: any) => ({
              ...p, 
              studySessions: p.studySessions || []
          }));
          resolve(migrated);
        } catch (e) {
          console.error("Error parsing local plans", e);
          resolve([]);
        }
      } else {
        resolve([]);
      }
    });
  },

  // Save specific plan (Create or Update) - Local Only
  async savePlan(plan: Plan): Promise<void> {
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

  // Delete Plan - Local Only
  async deletePlan(planId: string): Promise<void> {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const currentPlans = JSON.parse(saved);
      const newPlans = currentPlans.filter((p: Plan) => p.id !== planId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlans));
    }
  }
};