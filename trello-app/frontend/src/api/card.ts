import api from './client';
import type { Card } from '../types';

export const cardApi = {
  addCard: (listId: string, title: string, description: string) =>
    api.post<Card>(`/lists/${listId}/cards`, { title, description }).then(r => r.data),

  updateCard: (
    cardId: string,
    title: string,
    description: string,
    priority?: Card['priority'],
    dueDate?: string,
  ) =>
    api.patch<Card>(`/cards/${cardId}`, { title, description, priority: priority ?? null, dueDate: dueDate ?? null })
      .then(r => r.data),

  moveCard: (cardId: string, listId: string, position: number) =>
    api.patch<Card>(`/cards/${cardId}/position`, { listId, position }).then(r => r.data),

  deleteCard: (cardId: string) =>
    api.delete(`/cards/${cardId}`),
};
