import api from './client';

export const listApi = {
  updateTitle: (listId: string, title: string) =>
    api.patch(`/lists/${listId}`, { title }).then(r => r.data),

  deleteList: (listId: string) =>
    api.delete(`/lists/${listId}`),
};
