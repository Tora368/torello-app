import api from './client';
import type { Board } from '../types';

const BOARD_ID = '00000000-0000-0000-0000-000000000001';

export const boardApi = {
  getBoard: () =>
    api.get<Board>(`/boards/${BOARD_ID}`).then(r => r.data),

  updateTitle: (title: string) =>
    api.patch<Board>(`/boards/${BOARD_ID}`, { title }).then(r => r.data),

  addList: (title: string) =>
    api.post(`/boards/${BOARD_ID}/lists`, { title }).then(r => r.data),

  searchBoard: (query: string) =>
    api.get<Board>(`/boards/${BOARD_ID}/search`, { params: { q: query } }).then(r => r.data),
};
