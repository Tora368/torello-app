import type { Pool, PoolClient } from 'pg';

/** API レスポンス用（フロント types と一致） */
export type CardJson = {
  id: string;
  listId: string;
  title: string;
  description: string;
  position: number;
  priority?: 'high' | 'medium' | 'low';
  dueDate?: string;
  createdAt: string;
};

export type ListJson = {
  id: string;
  title: string;
  position: number;
  cards: CardJson[];
  createdAt: string;
};

export type BoardJson = {
  id: string;
  title: string;
  lists: ListJson[];
  createdAt: string;
};

type CardRow = {
  id: string;
  list_id: string;
  title: string;
  description: string;
  position: number;
  priority: string | null;
  due_date: string | Date | null;
  created_at: Date;
};

type ListRow = {
  id: string;
  title: string;
  position: number;
  created_at: Date;
};

function formatDueDate(due: Date | string | null): string | undefined {
  if (!due) return undefined;
  if (typeof due === 'string') return due.slice(0, 10);
  return due.toISOString().slice(0, 10);
}

function mapCard(row: CardRow): CardJson {
  const c: CardJson = {
    id: row.id,
    listId: row.list_id,
    title: row.title,
    description: row.description,
    position: row.position,
    createdAt: row.created_at.toISOString(),
  };
  if (row.priority) c.priority = row.priority as CardJson['priority'];
  const dd = formatDueDate(row.due_date);
  if (dd) c.dueDate = dd;
  return c;
}

export async function getBoard(pool: Pool, boardId: string): Promise<BoardJson | null> {
  const br = await pool.query<{ id: string; title: string; created_at: Date }>(
    'SELECT id, title, created_at FROM boards WHERE id = $1',
    [boardId],
  );
  if (br.rows.length === 0) return null;
  const board = br.rows[0];

  const lr = await pool.query<ListRow>(
    `SELECT id, title, position, created_at FROM lists WHERE board_id = $1 ORDER BY position ASC, created_at ASC`,
    [boardId],
  );

  const cr = await pool.query<CardRow>(
    `SELECT c.id, c.list_id, c.title, c.description, c.position, c.priority, c.due_date, c.created_at
     FROM cards c
     INNER JOIN lists l ON l.id = c.list_id
     WHERE l.board_id = $1
     ORDER BY c.position ASC, c.created_at ASC`,
    [boardId],
  );

  const byList = new Map<string, CardJson[]>();
  for (const row of cr.rows) {
    const listId = row.list_id;
    if (!byList.has(listId)) byList.set(listId, []);
    byList.get(listId)!.push(mapCard(row));
  }

  const lists: ListJson[] = lr.rows.map((row) => ({
    id: row.id,
    title: row.title,
    position: row.position,
    createdAt: row.created_at.toISOString(),
    cards: byList.get(row.id) ?? [],
  }));

  return {
    id: board.id,
    title: board.title,
    createdAt: board.created_at.toISOString(),
    lists,
  };
}

type SearchCardRow = CardRow & {
  list_title: string;
  list_position: number;
  list_created_at: Date;
};

export async function searchBoard(pool: Pool, boardId: string, query: string): Promise<BoardJson | null> {
  const br = await pool.query<{ id: string; title: string; created_at: Date }>(
    'SELECT id, title, created_at FROM boards WHERE id = $1',
    [boardId],
  );
  if (br.rows.length === 0) return null;
  const board = br.rows[0];

  const cr = await pool.query<SearchCardRow>(
    `SELECT
       c.id, c.list_id, c.title, c.description, c.position,
       c.priority, c.due_date, c.created_at,
       l.title AS list_title, l.position AS list_position, l.created_at AS list_created_at
     FROM cards c
     INNER JOIN lists l ON l.id = c.list_id
     WHERE l.board_id = $1
       AND (c.title ILIKE $2 OR c.description ILIKE $2)
     ORDER BY l.position ASC, l.created_at ASC, c.position ASC, c.created_at ASC`,
    [boardId, `%${query}%`],
  );

  const listsMap = new Map<string, ListJson>();
  for (const row of cr.rows) {
    if (!listsMap.has(row.list_id)) {
      listsMap.set(row.list_id, {
        id: row.list_id,
        title: row.list_title,
        position: row.list_position,
        createdAt: row.list_created_at.toISOString(),
        cards: [],
      });
    }
    listsMap.get(row.list_id)!.cards.push(mapCard(row));
  }

  return {
    id: board.id,
    title: board.title,
    createdAt: board.created_at.toISOString(),
    lists: [...listsMap.values()],
  };
}

export async function patchBoard(pool: Pool, boardId: string, title: string): Promise<BoardJson | null> {
  const r = await pool.query('UPDATE boards SET title = $1 WHERE id = $2 RETURNING id', [title, boardId]);
  if (r.rowCount === 0) return null;
  return getBoard(pool, boardId);
}

export async function addList(pool: Pool, boardId: string, title: string): Promise<ListJson | null> {
  const boardOk = await pool.query('SELECT 1 FROM boards WHERE id = $1', [boardId]);
  if (boardOk.rowCount === 0) return null;

  const max = await pool.query<{ m: string | null }>(
    'SELECT MAX(position)::text AS m FROM lists WHERE board_id = $1',
    [boardId],
  );
  const nextPos = max.rows[0].m === null ? 0 : Number.parseInt(max.rows[0].m!, 10) + 1;

  const ins = await pool.query<ListRow>(
    `INSERT INTO lists (board_id, title, position)
     VALUES ($1, $2, $3)
     RETURNING id, title, position, created_at`,
    [boardId, title, nextPos],
  );
  const row = ins.rows[0];
  return {
    id: row.id,
    title: row.title,
    position: row.position,
    createdAt: row.created_at.toISOString(),
    cards: [],
  };
}

export async function patchListTitle(pool: Pool, listId: string, title: string): Promise<ListJson | null> {
  const r = await pool.query<ListRow>(
    `UPDATE lists SET title = $1 WHERE id = $2 RETURNING id, title, position, created_at`,
    [title, listId],
  );
  if (r.rows.length === 0) return null;
  const row = r.rows[0];
  return {
    id: row.id,
    title: row.title,
    position: row.position,
    createdAt: row.created_at.toISOString(),
    cards: [],
  };
}

export async function patchListPosition(pool: Pool, listId: string, newPosition: number): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const b = await client.query<{ board_id: string }>('SELECT board_id FROM lists WHERE id = $1', [listId]);
    if (b.rows.length === 0) {
      await client.query('ROLLBACK');
      return false;
    }
    const boardId = b.rows[0].board_id;
    const { rows: lists } = await client.query<{ id: string }>(
      'SELECT id FROM lists WHERE board_id = $1 ORDER BY position ASC, created_at ASC',
      [boardId],
    );
    const ids = lists.map((l) => l.id);
    const cur = ids.indexOf(listId);
    if (cur === -1 || newPosition < 0 || newPosition >= ids.length) {
      await client.query('ROLLBACK');
      return false;
    }
    ids.splice(cur, 1);
    ids.splice(newPosition, 0, listId);
    for (let i = 0; i < ids.length; i++) {
      await client.query('UPDATE lists SET position = $1 WHERE id = $2', [i, ids[i]]);
    }
    await client.query('COMMIT');
    return true;
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

export async function deleteList(pool: Pool, listId: string): Promise<boolean> {
  const r = await pool.query('DELETE FROM lists WHERE id = $1', [listId]);
  return (r.rowCount ?? 0) > 0;
}

export async function addCard(
  pool: Pool,
  listId: string,
  title: string,
  description: string,
): Promise<CardJson | null> {
  const listOk = await pool.query('SELECT 1 FROM lists WHERE id = $1', [listId]);
  if (listOk.rowCount === 0) return null;

  const max = await pool.query<{ m: string | null }>(
    'SELECT MAX(position)::text AS m FROM cards WHERE list_id = $1',
    [listId],
  );
  const nextPos = max.rows[0].m === null ? 0 : Number.parseInt(max.rows[0].m!, 10) + 1;

  const ins = await pool.query<CardRow>(
    `INSERT INTO cards (list_id, title, description, position)
     VALUES ($1, $2, $3, $4)
     RETURNING id, list_id, title, description, position, priority, due_date, created_at`,
    [listId, title, description, nextPos],
  );
  return mapCard(ins.rows[0]);
}

export async function patchCard(
  pool: Pool,
  cardId: string,
  body: {
    title: string;
    description: string;
    priority?: string | null;
    dueDate?: string | null;
  },
): Promise<CardJson | null> {
  const cur = await pool.query<CardRow>(
    'SELECT id, list_id, title, description, position, priority, due_date, created_at FROM cards WHERE id = $1',
    [cardId],
  );
  if (cur.rows.length === 0) return null;
  const row = cur.rows[0];

  const priority = body.priority !== undefined ? body.priority : row.priority;
  const dueDate =
    body.dueDate !== undefined ? body.dueDate : formatDueDate(row.due_date) ?? null;

  const r = await pool.query<CardRow>(
    `UPDATE cards SET
       title = $1,
       description = $2,
       priority = $3,
       due_date = $4
     WHERE id = $5
     RETURNING id, list_id, title, description, position, priority, due_date, created_at`,
    [body.title, body.description, priority, dueDate, cardId],
  );
  return mapCard(r.rows[0]!);
}

export async function deleteCard(pool: Pool, cardId: string): Promise<boolean> {
  const r = await pool.query('DELETE FROM cards WHERE id = $1', [cardId]);
  return (r.rowCount ?? 0) > 0;
}

export async function moveCard(
  pool: Pool,
  cardId: string,
  targetListId: string,
  targetPosition: number,
): Promise<CardJson | null> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const cardR = await client.query<CardRow>(
      'SELECT id, list_id, title, description, position, priority, due_date, created_at FROM cards WHERE id = $1',
      [cardId],
    );
    if (cardR.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }
    const sourceListId = cardR.rows[0].list_id;

    const listExists = await client.query<{ board_id: string }>(
      'SELECT board_id FROM lists WHERE id = $1',
      [targetListId],
    );
    if (listExists.rowCount === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const sourceBoard = await client.query<{ board_id: string }>(
      'SELECT board_id FROM lists WHERE id = $1',
      [sourceListId],
    );
    if (
      sourceBoard.rowCount === 0 ||
      sourceBoard.rows[0].board_id !== listExists.rows[0].board_id
    ) {
      await client.query('ROLLBACK');
      return null;
    }

    const { rows: sourceRows } = await client.query<CardRow>(
      'SELECT id, list_id, title, description, position, priority, due_date, created_at FROM cards WHERE list_id = $1 ORDER BY position ASC, created_at ASC',
      [sourceListId],
    );
    const { rows: targetRows } = await client.query<CardRow>(
      'SELECT id, list_id, title, description, position, priority, due_date, created_at FROM cards WHERE list_id = $1 ORDER BY position ASC, created_at ASC',
      [targetListId],
    );

    const sourceIds = sourceRows.map((c) => c.id);
    const targetIds = targetRows.map((c) => c.id);

    if (sourceListId === targetListId) {
      const ordered = [...sourceIds];
      const oldIdx = ordered.indexOf(cardId);
      if (oldIdx === -1) {
        await client.query('ROLLBACK');
        return null;
      }
      ordered.splice(oldIdx, 1);
      const pos = Math.max(0, Math.min(targetPosition, ordered.length));
      ordered.splice(pos, 0, cardId);
      for (let i = 0; i < ordered.length; i++) {
        await resequenceCard(client, ordered[i]!, sourceListId, i);
      }
    } else {
      const sourceWithout = sourceIds.filter((id) => id !== cardId);
      const targetWithout = targetIds.filter((id) => id !== cardId);
      const pos = Math.max(0, Math.min(targetPosition, targetWithout.length));
      const newTarget = [...targetWithout];
      newTarget.splice(pos, 0, cardId);

      for (let i = 0; i < sourceWithout.length; i++) {
        await resequenceCard(client, sourceWithout[i]!, sourceListId, i);
      }
      for (let i = 0; i < newTarget.length; i++) {
        await resequenceCard(client, newTarget[i]!, targetListId, i);
      }
    }

    await client.query('COMMIT');
    const final = await pool.query<CardRow>(
      'SELECT id, list_id, title, description, position, priority, due_date, created_at FROM cards WHERE id = $1',
      [cardId],
    );
    return mapCard(final.rows[0]!);
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

async function resequenceCard(client: PoolClient, cardId: string, listId: string, position: number) {
  await client.query('UPDATE cards SET list_id = $1, position = $2 WHERE id = $3', [listId, position, cardId]);
}
