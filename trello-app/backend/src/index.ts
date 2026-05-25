import cors from 'cors';
import express from 'express';
import {
  addCard,
  addList,
  deleteCard,
  deleteList,
  getBoard,
  moveCard,
  patchBoard,
  patchCard,
  patchListPosition,
  patchListTitle,
} from './boardService.js';
import { pool } from './db.js';

const app = express();
const PORT = Number.parseInt(process.env.PORT ?? '3001', 10);

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());

const PRIORITIES = new Set(['high', 'medium', 'low']);

app.get('/api/boards/:id', async (req, res) => {
  const board = await getBoard(pool, req.params.id);
  if (!board) return res.status(404).json({ error: 'Board not found' });
  res.json(board);
});

app.patch('/api/boards/:id', async (req, res) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  if (!title) return res.status(400).json({ error: 'title is required' });
  const board = await patchBoard(pool, req.params.id, title);
  if (!board) return res.status(404).json({ error: 'Board not found' });
  res.json(board);
});

app.post('/api/boards/:id/lists', async (req, res) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  if (!title) return res.status(400).json({ error: 'title is required' });
  const list = await addList(pool, req.params.id, title);
  if (!list) return res.status(404).json({ error: 'Board not found' });
  res.status(201).json(list);
});

app.patch('/api/lists/:id', async (req, res) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  if (!title) return res.status(400).json({ error: 'title is required' });
  const list = await patchListTitle(pool, req.params.id, title);
  if (!list) return res.status(404).json({ error: 'List not found' });
  res.json(list);
});

app.patch('/api/lists/:id/position', async (req, res) => {
  const position = req.body?.position;
  if (typeof position !== 'number' || !Number.isInteger(position) || position < 0) {
    return res.status(400).json({ error: 'position must be a non-negative integer' });
  }
  const ok = await patchListPosition(pool, req.params.id, position);
  if (!ok) return res.status(404).json({ error: 'List not found' });
  res.status(204).send();
});

app.delete('/api/lists/:id', async (req, res) => {
  const ok = await deleteList(pool, req.params.id);
  if (!ok) return res.status(404).json({ error: 'List not found' });
  res.status(204).send();
});

app.post('/api/lists/:id/cards', async (req, res) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  if (!title) return res.status(400).json({ error: 'title is required' });
  const description =
    typeof req.body?.description === 'string' ? req.body.description : '';
  const card = await addCard(pool, req.params.id, title, description);
  if (!card) return res.status(404).json({ error: 'List not found' });
  res.status(201).json(card);
});

app.patch('/api/cards/:id', async (req, res) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  if (!title) return res.status(400).json({ error: 'title is required' });
  const description =
    typeof req.body?.description === 'string' ? req.body.description : '';

  const pr = req.body?.priority;
  let priority: string | null | undefined = undefined;
  if (pr === null) priority = null;
  else if (typeof pr === 'string' && PRIORITIES.has(pr)) priority = pr;
  else if (pr !== undefined)
    return res.status(400).json({ error: 'priority must be high, medium, low, or null' });

  const dueRaw = req.body?.dueDate;
  let dueDate: string | null | undefined = undefined;
  if (dueRaw === null) dueDate = null;
  else if (dueRaw === undefined) dueDate = undefined;
  else if (typeof dueRaw === 'string') dueDate = dueRaw.trim() || null;
  else return res.status(400).json({ error: 'dueDate must be a string or null' });

  const card = await patchCard(pool, req.params.id, { title, description, priority, dueDate });
  if (!card) return res.status(404).json({ error: 'Card not found' });
  res.json(card);
});

app.patch('/api/cards/:id/position', async (req, res) => {
  const listId = typeof req.body?.listId === 'string' ? req.body.listId : '';
  const position = req.body?.position;
  if (!listId) return res.status(400).json({ error: 'listId is required' });
  if (typeof position !== 'number' || !Number.isInteger(position) || position < 0) {
    return res.status(400).json({ error: 'position must be a non-negative integer' });
  }
  const card = await moveCard(pool, req.params.id, listId, position);
  if (!card) return res.status(404).json({ error: 'Card not found' });
  res.json(card);
});

app.delete('/api/cards/:id', async (req, res) => {
  const ok = await deleteCard(pool, req.params.id);
  if (!ok) return res.status(404).json({ error: 'Card not found' });
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}/api`);
});
