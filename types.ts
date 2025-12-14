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

export interface MockExam {
  id: string;
  institution: string;
  year: number;
  questionsTotal: number;
  questionsCorrect: number;
  duration: string; // e.g. "04:30"
  date: string;
}

// --- Flashcards Types ---

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  // SRS Fields (Simple implementation)
  box: number; // 0 to 5
  lastReviewed?: string;
}

export interface FlashcardSubDeck {
  id: string;
  name: string;
  cards: Flashcard[];
}

export interface FlashcardDeck {
  id: string;
  name: string;
  subDecks: FlashcardSubDeck[];
}

export interface Plan {
  id: string;
  name: string;
  createdAt: string;
  subjects: Subject[];
  studySessions: StudySession[]; // History for charts
  mockExams?: MockExam[]; // Mock exams
  flashcardDecks?: FlashcardDeck[]; // Flashcards system
}

export type ViewState = 'dashboard' | 'subjects' | 'questions' | 'schedule' | 'statistics' | 'calendar' | 'settings' | 'mock-exams' | 'flashcards';

export interface PlanStats {
  totalSubjects: number;
  totalTopics: number;
  totalQuestions: number;
  totalCorrect: number;
  accuracy: number;
}