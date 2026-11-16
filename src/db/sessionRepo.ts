import { HistoryStep, PlaySession } from '../types/story';
import { generateId } from '../utils/id';
import { getDb } from './client';

interface SessionRow {
  id: string;
  story_id: string;
  slot_name: string;
  is_auto_save: number;
  current_scene_id: string | null;
  saved_at: number;
}

interface HistoryRow {
  id: string;
  session_id: string;
  step_index: number;
  scene_id: string | null;
  scene_title_snapshot: string;
  chosen_choice_text: string | null;
  timestamp: number;
}

export const sessionRepo = {
  async listSessionsForStory(storyId: string): Promise<PlaySession[]> {
    const db = await getDb();
    const sessionRows = await db.getAllAsync<SessionRow>(
      'SELECT * FROM play_sessions WHERE story_id = ? ORDER BY is_auto_save DESC, saved_at DESC',
      [storyId]
    );

    const sessions: PlaySession[] = [];
    for (const sr of sessionRows) {
      const historyRows = await db.getAllAsync<HistoryRow>(
        'SELECT * FROM history_steps WHERE session_id = ? ORDER BY step_index ASC',
        [sr.id]
      );
      sessions.push({
        id: sr.id,
        storyId: sr.story_id,
        slotName: sr.slot_name,
        isAutoSave: sr.is_auto_save === 1,
        currentSceneId: sr.current_scene_id,
        savedAt: sr.saved_at,
        historyStack: historyRows.map((hr) => ({
          id: hr.id,
          sessionId: hr.session_id,
          stepIndex: hr.step_index,
          sceneId: hr.scene_id,
          sceneTitleSnapshot: hr.scene_title_snapshot,
          chosenChoiceText: hr.chosen_choice_text,
          timestamp: hr.timestamp,
        })),
      });
    }
    return sessions;
  },

  async getAutoSave(storyId: string): Promise<PlaySession | null> {
    const db = await getDb();
    const sr = await db.getFirstAsync<SessionRow>(
      'SELECT * FROM play_sessions WHERE story_id = ? AND is_auto_save = 1 LIMIT 1',
      [storyId]
    );
    if (!sr) return null;

    const historyRows = await db.getAllAsync<HistoryRow>(
      'SELECT * FROM history_steps WHERE session_id = ? ORDER BY step_index ASC',
      [sr.id]
    );

    return {
      id: sr.id,
      storyId: sr.story_id,
      slotName: sr.slot_name,
      isAutoSave: true,
      currentSceneId: sr.current_scene_id,
      savedAt: sr.saved_at,
      historyStack: historyRows.map((hr) => ({
        id: hr.id,
        sessionId: hr.session_id,
        stepIndex: hr.step_index,
        sceneId: hr.scene_id,
        sceneTitleSnapshot: hr.scene_title_snapshot,
        chosenChoiceText: hr.chosen_choice_text,
        timestamp: hr.timestamp,
      })),
    };
  },

  async saveAutoSave(
    storyId: string,
    currentSceneId: string | null,
    historyStack: HistoryStep[]
  ): Promise<PlaySession> {
    const db = await getDb();
    const now = Date.now();
    const existing = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM play_sessions WHERE story_id = ? AND is_auto_save = 1 LIMIT 1',
      [storyId]
    );

    const sessionId = existing?.id ?? generateId();

    await db.withTransactionAsync(async () => {
      if (existing) {
        await db.runAsync(
          'UPDATE play_sessions SET current_scene_id = ?, saved_at = ? WHERE id = ?',
          [currentSceneId, now, sessionId]
        );
        await db.runAsync('DELETE FROM history_steps WHERE session_id = ?', [sessionId]);
      } else {
        await db.runAsync(
          `INSERT INTO play_sessions (id, story_id, slot_name, is_auto_save, current_scene_id, saved_at)
           VALUES (?, ?, 'Auto-Save', 1, ?, ?)`,
          [sessionId, storyId, currentSceneId, now]
        );
      }

      for (let i = 0; i < historyStack.length; i++) {
        const step = historyStack[i];
        await db.runAsync(
          `INSERT INTO history_steps (id, session_id, step_index, scene_id, scene_title_snapshot, chosen_choice_text, timestamp)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            step.id || generateId(),
            sessionId,
            i,
            step.sceneId,
            step.sceneTitleSnapshot,
            step.chosenChoiceText ?? null,
            step.timestamp,
          ]
        );
      }
    });

    return {
      id: sessionId,
      storyId,
      slotName: 'Auto-Save',
      isAutoSave: true,
      currentSceneId,
      historyStack: historyStack.map((s, idx) => ({ ...s, sessionId, stepIndex: idx })),
      savedAt: now,
    };
  },

  async createManualSave(
    storyId: string,
    slotName: string,
    currentSceneId: string | null,
    historyStack: HistoryStep[]
  ): Promise<PlaySession> {
    const db = await getDb();
    const now = Date.now();
    const sessionId = generateId();

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO play_sessions (id, story_id, slot_name, is_auto_save, current_scene_id, saved_at)
         VALUES (?, ?, ?, 0, ?, ?)`,
        [sessionId, storyId, slotName, currentSceneId, now]
      );

      for (let i = 0; i < historyStack.length; i++) {
        const step = historyStack[i];
        await db.runAsync(
          `INSERT INTO history_steps (id, session_id, step_index, scene_id, scene_title_snapshot, chosen_choice_text, timestamp)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            generateId(),
            sessionId,
            i,
            step.sceneId,
            step.sceneTitleSnapshot,
            step.chosenChoiceText ?? null,
            step.timestamp,
          ]
        );
      }
    });

    return {
      id: sessionId,
      storyId,
      slotName,
      isAutoSave: false,
      currentSceneId,
      historyStack: historyStack.map((s, idx) => ({ ...s, sessionId, stepIndex: idx })),
      savedAt: now,
    };
  },

  async deleteSession(sessionId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM play_sessions WHERE id = ?', [sessionId]);
  },
};
