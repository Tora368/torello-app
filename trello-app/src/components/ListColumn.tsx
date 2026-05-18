import { useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import type { Card, List } from '../types';
import { CardItem } from './CardItem';

interface Props {
  list: List;
  onDeleteList: (listId: string) => void;
  onRenameList: (listId: string, title: string) => void;
  onAddCard: (listId: string, title: string, description: string) => void;
  onDeleteCard: (listId: string, cardId: string) => void;
  onEditCard: (listId: string, cardId: string, title: string, description: string, priority?: Card['priority'], dueDate?: string) => void;
  onSortByPriority: (listId: string) => void;
  onSortByDueDate: (listId: string) => void;
}

export function ListColumn({ list, onDeleteList, onRenameList, onAddCard, onDeleteCard, onEditCard, onSortByPriority, onSortByDueDate }: Props) {
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDesc, setNewCardDesc] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [listTitle, setListTitle] = useState(list.title);

  const { setNodeRef, isOver } = useDroppable({ id: list.id, data: { type: 'list', listId: list.id } });

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      onAddCard(list.id, newCardTitle.trim(), newCardDesc.trim());
      setNewCardTitle('');
      setNewCardDesc('');
      setAddingCard(false);
    }
  };

  const handleRename = () => {
    if (listTitle.trim()) onRenameList(list.id, listTitle.trim());
    setEditingTitle(false);
  };

  return (
    <div className="list-column">
      <div className="list-header">
        {editingTitle ? (
          <input
            className="list-title-input"
            value={listTitle}
            onChange={e => setListTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditingTitle(false); }}
            autoFocus
          />
        ) : (
          <h3 className="list-title" onClick={() => setEditingTitle(true)}>{list.title}</h3>
        )}
        <button className="btn-icon danger" onClick={() => onDeleteList(list.id)} title="リストを削除">✕</button>
      </div>
      <div className="list-sort-bar">
        <button className="btn-sort" onClick={() => onSortByPriority(list.id)} title="優先度順に並び替え">優先度順</button>
        <button className="btn-sort" onClick={() => onSortByDueDate(list.id)} title="期限順に並び替え">期限順</button>
      </div>

      <SortableContext items={list.cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`cards-container ${isOver ? 'drop-over' : ''}`}
        >
          {list.cards.map(card => (
            <CardItem
              key={card.id}
              card={card}
              listId={list.id}
              onDelete={onDeleteCard}
              onEdit={onEditCard}
            />
          ))}
          {list.cards.length === 0 && (
            <div className="empty-list-placeholder">カードをここにドロップ</div>
          )}
        </div>
      </SortableContext>

      {addingCard ? (
        <div className="add-card-form">
          <input
            className="card-title-input"
            placeholder="カードのタイトル"
            value={newCardTitle}
            onChange={e => setNewCardTitle(e.target.value)}
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleAddCard(); if (e.key === 'Escape') setAddingCard(false); }}
          />
          <textarea
            className="card-desc-input"
            placeholder="説明（任意）"
            value={newCardDesc}
            onChange={e => setNewCardDesc(e.target.value)}
            rows={2}
          />
          <div className="card-actions">
            <button className="btn btn-primary btn-sm" onClick={handleAddCard}>追加</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setAddingCard(false)}>キャンセル</button>
          </div>
        </div>
      ) : (
        <button className="add-card-btn" onClick={() => setAddingCard(true)}>+ カードを追加</button>
      )}
    </div>
  );
}
