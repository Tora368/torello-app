import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Card } from '../types';

interface Props {
  card: Card;
  listId: string;
  onDelete: (listId: string, cardId: string) => void;
  onEdit: (listId: string, cardId: string, title: string, description: string, priority?: Card['priority'], dueDate?: string) => void;
}

const PRIORITY_LABEL: Record<string, string> = { high: '高', medium: '中', low: '低' };
const PRIORITY_COLOR: Record<string, string> = { high: '#de350b', medium: '#ff991f', low: '#36b37e' };

export function CardItem({ card, listId, onDelete, onEdit }: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [priority, setPriority] = useState<Card['priority']>(card.priority);
  const [dueDate, setDueDate] = useState(card.dueDate ?? '');

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', listId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleSave = () => {
    if (title.trim()) {
      onEdit(listId, card.id, title.trim(), description.trim(), priority, dueDate || undefined);
      setEditing(false);
    }
  };

  const handleEditOpen = () => {
    setTitle(card.title);
    setDescription(card.description);
    setPriority(card.priority);
    setDueDate(card.dueDate ?? '');
    setEditing(true);
  };

  if (editing) {
    return (
      <div className="card editing" ref={setNodeRef} style={style}>
        <input
          className="card-title-input"
          value={title}
          onChange={e => setTitle(e.target.value)}
          autoFocus
          onKeyDown={e => e.key === 'Escape' && setEditing(false)}
        />
        <textarea
          className="card-desc-input"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="説明（任意）"
          rows={3}
        />
        <div className="card-meta-row">
          <label className="card-meta-label">優先度</label>
          <select
            className="card-select"
            value={priority ?? ''}
            onChange={e => setPriority((e.target.value as Card['priority']) || undefined)}
          >
            <option value="">なし</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
        </div>
        <div className="card-meta-row">
          <label className="card-meta-label">期限</label>
          <input
            type="date"
            className="card-date-input"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
          />
        </div>
        <div className="card-actions">
          <button className="btn btn-primary btn-sm" onClick={handleSave}>保存</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>キャンセル</button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="card-body">
        <p className="card-title">{card.title}</p>
        {card.description && <p className="card-description">{card.description}</p>}
        <div className="card-badges">
          {card.priority && (
            <span className="badge-priority" style={{ background: PRIORITY_COLOR[card.priority] }}>
              {PRIORITY_LABEL[card.priority]}
            </span>
          )}
          {card.dueDate && (
            <span className="badge-due">📅 {card.dueDate}</span>
          )}
        </div>
      </div>
      <div className="card-menu">
        <button
          className="btn-icon"
          onPointerDown={e => e.stopPropagation()}
          onClick={handleEditOpen}
          title="編集"
        >✏️</button>
        <button
          className="btn-icon danger"
          onPointerDown={e => e.stopPropagation()}
          onClick={() => onDelete(listId, card.id)}
          title="削除"
        >🗑️</button>
      </div>
    </div>
  );
}
