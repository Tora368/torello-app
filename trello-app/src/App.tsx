import { useState } from 'react';
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
import { useLocalStorage } from './hooks/useLocalStorage';
import { ListColumn } from './components/ListColumn';
import type { Board, Card, List } from './types';
import './App.css';

const DEFAULT_BOARD: Board = {
  id: 'board-1',
  title: 'マイボード',
  createdAt: Date.now(),
  lists: [
    { id: 'list-todo', title: 'To Do', cards: [] },
    { id: 'list-doing', title: 'In Progress', cards: [] },
    { id: 'list-done', title: 'Done', cards: [] },
  ],
};

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export default function App() {
  const [board, setBoard] = useLocalStorage<Board>('trello-board', DEFAULT_BOARD);
  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [editingBoardTitle, setEditingBoardTitle] = useState(false);
  const [boardTitleInput, setBoardTitleInput] = useState(board.title);
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor)
  );

  // --- Board ---
  const handleRenameBoard = () => {
    if (boardTitleInput.trim()) setBoard(b => ({ ...b, title: boardTitleInput.trim() }));
    setEditingBoardTitle(false);
  };

  // --- Lists ---
  const addList = () => {
    if (!newListTitle.trim()) return;
    const newList: List = { id: uid(), title: newListTitle.trim(), cards: [] };
    setBoard(b => ({ ...b, lists: [...b.lists, newList] }));
    setNewListTitle('');
    setAddingList(false);
  };

  const deleteList = (listId: string) =>
    setBoard(b => ({ ...b, lists: b.lists.filter(l => l.id !== listId) }));

  const renameList = (listId: string, title: string) =>
    setBoard(b => ({ ...b, lists: b.lists.map(l => l.id === listId ? { ...l, title } : l) }));

  // --- Cards ---
  const addCard = (listId: string, title: string, description: string) => {
    const newCard: Card = { id: uid(), title, description, createdAt: Date.now() };
    setBoard(b => ({
      ...b,
      lists: b.lists.map(l => l.id === listId ? { ...l, cards: [...l.cards, newCard] } : l),
    }));
  };

  const deleteCard = (listId: string, cardId: string) =>
    setBoard(b => ({
      ...b,
      lists: b.lists.map(l =>
        l.id === listId ? { ...l, cards: l.cards.filter(c => c.id !== cardId) } : l
      ),
    }));

  const editCard = (listId: string, cardId: string, title: string, description: string) =>
    setBoard(b => ({
      ...b,
      lists: b.lists.map(l =>
        l.id === listId
          ? { ...l, cards: l.cards.map(c => c.id === cardId ? { ...c, title, description } : c) }
          : l
      ),
    }));

  // --- Drag & Drop ---
  const findListByCardId = (cardId: string) =>
    board.lists.find(l => l.cards.some(c => c.id === cardId));

  const handleDragStart = (event: DragStartEvent) => {
    console.log('dragStart', event);
    const { active } = event;
    if (active.data.current?.type === 'card') {
      const list = findListByCardId(active.id as string);
      const card = list?.cards.find(c => c.id === active.id);
      setActiveCard(card ?? null);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    const activeListId = active.data.current?.listId as string;
    const overListId = (over.data.current?.listId ?? overId) as string;
    if (!activeListId || !overListId || activeListId === overListId) return;

    setBoard(b => {
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
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    const listId = active.data.current?.listId as string;
    setBoard(b => ({
      ...b,
      lists: b.lists.map(l => {
        if (l.id !== listId) return l;
        const oldIdx = l.cards.findIndex(c => c.id === activeId);
        const newIdx = l.cards.findIndex(c => c.id === overId);
        if (oldIdx === -1 || newIdx === -1) return l;
        return { ...l, cards: arrayMove(l.cards, oldIdx, newIdx) };
      }),
    }));
  };

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
              onKeyDown={e => { if (e.key === 'Enter') handleRenameBoard(); if (e.key === 'Escape') setEditingBoardTitle(false); }}
              autoFocus
            />
          ) : (
            <h1 className="board-title" onClick={() => { setBoardTitleInput(board.title); setEditingBoardTitle(true); }}>
              {board.title}
            </h1>
          )}
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
          {board.lists.map(list => (
            <ListColumn
              key={list.id}
              list={list}
              onDeleteList={deleteList}
              onRenameList={renameList}
              onAddCard={addCard}
              onDeleteCard={deleteCard}
              onEditCard={editCard}
            />
          ))}

          <div className="add-list-area">
            {addingList ? (
              <div className="add-list-form">
                <input
                  className="list-title-input"
                  placeholder="リストのタイトル"
                  value={newListTitle}
                  onChange={e => setNewListTitle(e.target.value)}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') addList(); if (e.key === 'Escape') setAddingList(false); }}
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
