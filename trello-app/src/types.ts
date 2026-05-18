export interface Card {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  priority?: 'high' | 'medium' | 'low';
  dueDate?: string; // ISO date string e.g. "2025-06-01"
}

export interface List {
  id: string;
  title: string;
  cards: Card[];
}

export interface Board {
  id: string;
  title: string;
  lists: List[];
  createdAt: number;
}
