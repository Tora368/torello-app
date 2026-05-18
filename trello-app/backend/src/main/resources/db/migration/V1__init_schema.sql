CREATE TABLE boards (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    title      VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE lists (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id   UUID         NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title      VARCHAR(255) NOT NULL,
    position   INTEGER      NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE cards (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id     UUID         NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    description TEXT         NOT NULL DEFAULT '',
    position    INTEGER      NOT NULL,
    priority    VARCHAR(10)  CHECK (priority IN ('high', 'medium', 'low')),
    due_date    DATE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_lists_board_id    ON lists(board_id);
CREATE INDEX idx_lists_position    ON lists(board_id, position);
CREATE INDEX idx_cards_list_id     ON cards(list_id);
CREATE INDEX idx_cards_position    ON cards(list_id, position);
