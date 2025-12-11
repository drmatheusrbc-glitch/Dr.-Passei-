export interface Revision {
  id: string;
  label: string; // e.g., "7 dias", "R1"
  scheduledDate: string; // ISO date string
  isCompleted: boolean;
  completedDate?: string;
  questionsTotal?: number;
  questionsCorrect?: number;
}

export interface Topic {
  id: string;
  name: string;
  questionsTotal: number;
  questionsCorrect: number;
  isTheoryCompleted?: boolean;
  revisions: Revision[]; // List of specific revision instances
  lastRevision?: string;
}

export interface Subject {
  id: string;
  name: string;
  topics: Topic[];
}

export interface StudySession {
  date: string;
  questionsTotal: number;
  questionsCorrect: number;
}

export interface Plan {
  id: string;
  name: string;
  createdAt: string;
  subjects: Subject[];
  studySessions: StudySession[]; // History for charts
}

export type ViewState = 'dashboard' | 'subjects' | 'questions' | 'schedule' | 'settings' | 'statistics';

export interface PlanStats {
  totalSubjects: number;
  totalTopics: number;
  totalQuestions: number;
  totalCorrect: number;
  accuracy: number;
}