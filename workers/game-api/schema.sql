CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  device_id TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  max_tile INTEGER NOT NULL DEFAULT 2,
  board_total INTEGER NOT NULL DEFAULT 0,
  board_size INTEGER NOT NULL DEFAULT 4,
  lives INTEGER NOT NULL DEFAULT 3,
  used_lives INTEGER NOT NULL DEFAULT 0,
  moves INTEGER NOT NULL DEFAULT 0,
  active_ms INTEGER NOT NULL DEFAULT 0,
  review_until INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'playing',
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS players_room_score ON players(room_id, score DESC);
CREATE INDEX IF NOT EXISTS players_updated ON players(updated_at);
