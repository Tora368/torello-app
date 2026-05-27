import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { ListColumn } from './components/ListColumn';
import { boardApi } from './api/board';
import { listApi } from './api/list';
import { cardApi } from './api/card';
import type { Board, Card, List } from './types';
import './App.css';

export default function App() {
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [editingBoardTitle, setEditingBoardTitle] = useState(false);
  const [boardTitleInput, setBoardTitleInput] = useState('');
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Board | null>(null);
  const [searching, setSearching] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fetchBoard = useCallback(async () => {
    try {
      const data = await boardApi.getBoard();
      setBoard(data);
      setBoardTitleInput(data.title);
    } catch {
      setError('ボードの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBoard(); }, [fetchBoard]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    const timer = setTimeout(() => {
      setSearching(true);
      boardApi.searchBoard(searchQuery.trim())
        .then(setSearchResults)
        .catch(() => setSearchResults(null))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const updateBoardState = (updater: (b: Board) => Board) =>
    setBoard(prev => (prev ? updater(prev) : prev));

  // --- Board ---
  const handleRenameBoard = async () => {
    if (!board || !boardTitleInput.trim()) { setEditingBoardTitle(false); return; }
    const updated = await boardApi.updateTitle(boardTitleInput.trim());
    setBoard(updated as Board);
    setEditingBoardTitle(false);
  };

  // --- Lists ---
  const addList = async () => {
    if (!newListTitle.trim()) return;
    const newList = await boardApi.addList(newListTitle.trim()) as List;
    updateBoardState(b => ({ ...b, lists: [...b.lists, { ...newList, cards: [] }] }));
    setNewListTitle('');
    setAddingList(false);
  };

  const deleteList = async (listId: string) => {
    await listApi.deleteList(listId);
    updateBoardState(b => ({ ...b, lists: b.lists.filter(l => l.id !== listId) }));
  };

  const renameList = async (listId: string, title: string) => {
    await listApi.updateTitle(listId, title);
    updateBoardState(b => ({
      ...b,
      lists: b.lists.map(l => l.id === listId ? { ...l, title } : l),
    }));
  };

  // --- Cards ---
  const addCard = async (listId: string, title: string, description: string) => {
    const newCard = await cardApi.addCard(listId, title, description) as Card;
    updateBoardState(b => ({
      ...b,
      lists: b.lists.map(l => l.id === listId ? { ...l, cards: [...l.cards, newCard] } : l),
    }));
  };

  const deleteCard = async (listId: string, cardId: string) => {
    await cardApi.deleteCard(cardId);
    updateBoardState(b => ({
      ...b,
      lists: b.lists.map(l =>
        l.id === listId ? { ...l, cards: l.cards.filter(c => c.id !== cardId) } : l
      ),
    }));
  };

  const editCard = async (
    listId: string, cardId: string,
    title: string, description: string,
    priority?: Card['priority'], dueDate?: string
  ) => {
    const updated = await cardApi.updateCard(cardId, title, description, priority, dueDate) as Card;
    updateBoardState(b => ({
      ...b,
      lists: b.lists.map(l =>
        l.id === listId
          ? { ...l, cards: l.cards.map(c => c.id === cardId ? { ...c, ...updated } : c) }
          : l
      ),
    }));
  };

  const sortListByPriority = (listId: string) => {
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
    updateBoardState(b => ({
      ...b,
      lists: b.lists.map(l => {
        if (l.id !== listId) return l;
        const sorted = [...l.cards].sort(
          (a, b) => (order[a.priority ?? 'low'] ?? 2) - (order[b.priority ?? 'low'] ?? 2)
        );
        return { ...l, cards: sorted };
      }),
    }));
  };

  const sortListByDueDate = (listId: string) => {
    updateBoardState(b => ({
      ...b,
      lists: b.lists.map(l => {
        if (l.id !== listId) return l;
        const sorted = [...l.cards].sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        });
        return { ...l, cards: sorted };
      }),
    }));
  };

  // --- Drag & Drop ---
  const findListByCardId = (cardId: string) =>
    board?.lists.find(l => l.cards.some(c => c.id === cardId));

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'card') {
      const list = findListByCardId(active.id as string);
      const card = list?.cards.find(c => c.id === active.id);
      setActiveCard(card ?? null);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !board) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    const activeListId = active.data.current?.listId as string;
    const overListId = (over.data.current?.listId ?? overId) as string;
    if (!activeListId || !overListId || activeListId === overListId) return;

    updateBoardState(b => {
      const lists = b.lists.map(l => ({ ...l, cards: [...l.cards] }));
      const fromList = lists.find(l => l.id === activeListId);
      const toList = lists.find(l => l.id === overListId);
      if (!fromList || !toList) return b;

      const cardIdx = fromList.cards.findIndex(c => c.id === activeId);
      if (cardIdx === -1) return b;
      const [card] = fromList.cards.splice(cardIdx, 1);

      const overCardIdx = toList.cards.findIndex(c => c.id === overId);
      toList.cards.splice(overCardIdx === -1 ? toList.cards.length : overCardIdx, 0, card);

      return { ...b, lists };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);
    if (!over || !board) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    const activeListId = active.data.current?.listId as string;
    const overListId = (over.data.current?.listId ?? overId) as string;

    if (activeListId === overListId) {
      const list = board.lists.find(l => l.id === activeListId);
      if (!list) return;
      const oldIdx = list.cards.findIndex(c => c.id === activeId);
      const newIdx = list.cards.findIndex(c => c.id === overId);
      if (oldIdx === -1 || newIdx === -1) return;
      updateBoardState(b => ({
        ...b,
        lists: b.lists.map(l =>
          l.id === activeListId ? { ...l, cards: arrayMove(l.cards, oldIdx, newIdx) } : l
        ),
      }));
      cardApi.moveCard(activeId, activeListId, newIdx).catch(console.error);
    } else {
      const targetList = board.lists.find(l => l.id === overListId);
      const newIdx = targetList?.cards.findIndex(c => c.id === overId) ?? -1;
      cardApi.moveCard(activeId, overListId, newIdx === -1 ? 0 : newIdx).catch(console.error);
    }
  };

  if (loading) return <div className="loading">読み込み中...</div>;
  if (error || !board) return <div className="error">{error ?? 'エラーが発生しました'}</div>;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <span className="logo">🗂️</span>
          {editingBoardTitle ? (
            <input
              className="board-title-input"
              value={boardTitleInput}
              onChange={e => setBoardTitleInput(e.target.value)}
              onBlur={handleRenameBoard}
              onKeyDown={e => {
                if (e.key === 'Enter') handleRenameBoard();
                if (e.key === 'Escape') setEditingBoardTitle(false);
              }}
              autoFocus
            />
          ) : (
            <h1
              className="board-title"
              onClick={() => { setBoardTitleInput(board.title); setEditingBoardTitle(true); }}
            >
              {board.title}
            </h1>
          )}
        </div>
        <div className="header-right">
          <div className="search-bar">
            <input
              className="search-input"
              type="search"
              placeholder="カードを検索..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>
          {searching && <span className="search-status">検索中...</span>}
        </div>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <main className="board">
          {(searchResults ? searchResults.lists : board.lists).map(list => (
            <ListColumn
              key={list.id}
              list={list}
              onDeleteList={deleteList}
              onRenameList={renameList}
              onAddCard={addCard}
              onDeleteCard={deleteCard}
              onEditCard={editCard}
              onSortByPriority={sortListByPriority}
              onSortByDueDate={sortListByDueDate}
            />
          ))}

          {searchQuery.trim() && (searchResults?.lists.length ?? 0) === 0 && !searching && (
            <div className="search-empty">「{searchQuery}」に一致するカードはありません</div>
          )}

          {!searchQuery.trim() && (
            <div className="add-list-area">
              {addingList ? (
                <div className="add-list-form">
                  <input
                    className="list-title-input"
                    placeholder="リストのタイトル"
                    value={newListTitle}
                    onChange={e => setNewListTitle(e.target.value)}
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') addList();
                      if (e.key === 'Escape') setAddingList(false);
                    }}
                  />
                  <div className="card-actions">
                    <button className="btn btn-primary btn-sm" onClick={addList}>追加</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setAddingList(false)}>キャンセル</button>
                  </div>
                </div>
              ) : (
                <button className="add-list-btn" onClick={() => setAddingList(true)}>+ リストを追加</button>
              )}
            </div>
          )}
        </main>

        <DragOverlay>
          {activeCard && (
            <div className="card drag-overlay">
              <div className="card-body">
                <p className="card-title">{activeCard.title}</p>
                {activeCard.description && <p className="card-description">{activeCard.description}</p>}
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
