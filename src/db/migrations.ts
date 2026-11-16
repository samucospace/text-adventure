import type { SQLiteDatabase } from './client';

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      synopsis TEXT DEFAULT '',
      author TEXT DEFAULT '',
      cover_image_uri TEXT,
      start_scene_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scenes (
      id TEXT PRIMARY KEY,
      story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      image_uri TEXT,
      is_ending INTEGER DEFAULT 0,
      ending_type TEXT,
      position_x REAL DEFAULT 0,
      position_y REAL DEFAULT 0,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS choices (
      id TEXT PRIMARY KEY,
      scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      target_scene_id TEXT REFERENCES scenes(id) ON DELETE SET NULL,
      order_index INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS play_sessions (
      id TEXT PRIMARY KEY,
      story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
      slot_name TEXT NOT NULL,
      is_auto_save INTEGER DEFAULT 0,
      current_scene_id TEXT REFERENCES scenes(id) ON DELETE SET NULL,
      saved_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS history_steps (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES play_sessions(id) ON DELETE CASCADE,
      step_index INTEGER NOT NULL,
      scene_id TEXT REFERENCES scenes(id) ON DELETE SET NULL,
      scene_title_snapshot TEXT NOT NULL,
      chosen_choice_text TEXT,
      timestamp INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_scenes_story_id ON scenes(story_id);
    CREATE INDEX IF NOT EXISTS idx_choices_scene_id ON choices(scene_id);
    CREATE INDEX IF NOT EXISTS idx_choices_target_scene_id ON choices(target_scene_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_story_id ON play_sessions(story_id);
    CREATE INDEX IF NOT EXISTS idx_history_session_id ON history_steps(session_id);
  `);
}
