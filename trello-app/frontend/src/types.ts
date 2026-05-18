export interface Card {
  id: string;
  listId: string;
  title: string;
  description: string;
  position: number;
  priority?: 'high' | 'medium' | 'low';
  dueDate?: string; // "YYYY-MM-DD"
  createdAt: string;
}

export interface List {
  id: string;
  title: string;
  position: number;
  cards: Card[];
  createdAt: string;
}

export interface Board {
  id: string;
  title: string;
  lists: List[];
  createdAt: string;
}
