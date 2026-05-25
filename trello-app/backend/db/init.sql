-- Trello-app schema (要件定義書 11.2) + 既定ボード（フロントの BOARD_ID と一致）

CREATE TABLE boards (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE lists (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id   UUID         NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  title      VARCHAR(255) NOT NULL,
  position   INTEGER      NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE cards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id     UUID         NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  description TEXT         NOT NULL DEFAULT '',
  position    INTEGER      NOT NULL,
  priority    VARCHAR(10)  CHECK (priority IS NULL OR priority IN ('high', 'medium', 'low')),
  due_date    DATE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

INSERT INTO boards (id, title)
VALUES ('00000000-0000-0000-0000-000000000001', 'My Board');
