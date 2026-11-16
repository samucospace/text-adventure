import { Choice, EndingType, Scene, Story, StoryWithCounts } from '../types/story';
import { generateId } from '../utils/id';
import { getDb } from './client';

interface StoryRow {
  id: string;
  title: string;
  synopsis: string;
  author: string;
  cover_image_uri: string | null;
  start_scene_id: string | null;
  created_at: number;
  updated_at: number;
  scene_count?: number;
  has_auto_save?: number;
}

interface SceneRow {
  id: string;
  story_id: string;
  title: string;
  content: string;
  image_uri: string | null;
  is_ending: number;
  ending_type: string | null;
  position_x: number;
  position_y: number;
  updated_at: number;
}

interface ChoiceRow {
  id: string;
  scene_id: string;
  text: string;
  target_scene_id: string | null;
  order_index: number;
}

function mapStoryRow(row: StoryRow): Story {
  return {
    id: row.id,
    title: row.title,
    synopsis: row.synopsis,
    author: row.author,
    coverImageUri: row.cover_image_uri,
    startSceneId: row.start_scene_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const storyRepo = {
  async listStories(): Promise<StoryWithCounts[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<StoryRow>(`
      SELECT
        s.*,
        (SELECT COUNT(*) FROM scenes sc WHERE sc.story_id = s.id) AS scene_count,
        (SELECT COUNT(*) FROM play_sessions ps WHERE ps.story_id = s.id AND ps.is_auto_save = 1) AS has_auto_save
      FROM stories s
      ORDER BY s.updated_at DESC
    `);

    return rows.map((row) => ({
      ...mapStoryRow(row),
      sceneCount: row.scene_count ?? 0,
      hasAutoSave: (row.has_auto_save ?? 0) > 0,
    }));
  },

  async getStoryWithScenes(storyId: string): Promise<{ story: Story; scenes: Scene[] } | null> {
    const db = await getDb();
    const storyRow = await db.getFirstAsync<StoryRow>(
      'SELECT * FROM stories WHERE id = ?',
      [storyId]
    );
    if (!storyRow) return null;

    const sceneRows = await db.getAllAsync<SceneRow>(
      'SELECT * FROM scenes WHERE story_id = ? ORDER BY updated_at ASC',
      [storyId]
    );

    const choiceRows = await db.getAllAsync<ChoiceRow>(
      `SELECT c.* FROM choices c
       INNER JOIN scenes sc ON c.scene_id = sc.id
       WHERE sc.story_id = ?
       ORDER BY c.order_index ASC`,
      [storyId]
    );

    const choicesByScene = new Map<string, Choice[]>();
    for (const cr of choiceRows) {
      const list = choicesByScene.get(cr.scene_id) ?? [];
      list.push({
        id: cr.id,
        sceneId: cr.scene_id,
        text: cr.text,
        targetSceneId: cr.target_scene_id,
        orderIndex: cr.order_index,
      });
      choicesByScene.set(cr.scene_id, list);
    }

    const scenes: Scene[] = sceneRows.map((sr) => ({
      id: sr.id,
      storyId: sr.story_id,
      title: sr.title,
      content: sr.content,
      imageUri: sr.image_uri,
      isEnding: sr.is_ending === 1,
      endingType: (sr.ending_type as EndingType | null) ?? null,
      positionX: sr.position_x,
      positionY: sr.position_y,
      choices: choicesByScene.get(sr.id) ?? [],
      updatedAt: sr.updated_at,
    }));

    return {
      story: mapStoryRow(storyRow),
      scenes,
    };
  },

  async createStory(input: {
    title: string;
    synopsis?: string;
    author?: string;
  }): Promise<Story> {
    const db = await getDb();
    const now = Date.now();
    const storyId = generateId();
    const startSceneId = generateId();

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO stories (id, title, synopsis, author, cover_image_uri, start_scene_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, NULL, ?, ?, ?)`,
        [storyId, input.title, input.synopsis ?? '', input.author ?? '', startSceneId, now, now]
      );

      await db.runAsync(
        `INSERT INTO scenes (id, story_id, title, content, image_uri, is_ending, ending_type, position_x, position_y, updated_at)
         VALUES (?, ?, ?, ?, NULL, 0, NULL, 100, 80, ?)`,
        [
          startSceneId,
          storyId,
          'Opening Scene',
          'Write the opening of your adventure here...',
          now,
        ]
      );
    });

    return {
      id: storyId,
      title: input.title,
      synopsis: input.synopsis ?? '',
      author: input.author ?? '',
      coverImageUri: null,
      startSceneId,
      createdAt: now,
      updatedAt: now,
    };
  },

  async updateStory(
    storyId: string,
    patch: Partial<Pick<Story, 'title' | 'synopsis' | 'author' | 'coverImageUri' | 'startSceneId'>>
  ): Promise<void> {
    const db = await getDb();
    const now = Date.now();
    const current = await db.getFirstAsync<StoryRow>('SELECT * FROM stories WHERE id = ?', [storyId]);
    if (!current) return;

    await db.runAsync(
      `UPDATE stories
       SET title = ?, synopsis = ?, author = ?, cover_image_uri = ?, start_scene_id = ?, updated_at = ?
       WHERE id = ?`,
      [
        patch.title ?? current.title,
        patch.synopsis ?? current.synopsis,
        patch.author ?? current.author,
        patch.coverImageUri !== undefined ? patch.coverImageUri : current.cover_image_uri,
        patch.startSceneId !== undefined ? patch.startSceneId : current.start_scene_id,
        now,
        storyId,
      ]
    );
  },

  async deleteStory(storyId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM stories WHERE id = ?', [storyId]);
  },

  async importStoryBundle(story: Story, scenes: Scene[]): Promise<void> {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO stories (id, title, synopsis, author, cover_image_uri, start_scene_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          story.id,
          story.title,
          story.synopsis,
          story.author,
          story.coverImageUri ?? null,
          story.startSceneId,
          story.createdAt,
          story.updatedAt,
        ]
      );

      for (const scene of scenes) {
        await db.runAsync(
          `INSERT INTO scenes (id, story_id, title, content, image_uri, is_ending, ending_type, position_x, position_y, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            scene.id,
            story.id,
            scene.title,
            scene.content,
            scene.imageUri ?? null,
            scene.isEnding ? 1 : 0,
            scene.endingType ?? null,
            scene.positionX,
            scene.positionY,
            scene.updatedAt,
          ]
        );
      }

      for (const scene of scenes) {
        for (const choice of scene.choices) {
          await db.runAsync(
            `INSERT INTO choices (id, scene_id, text, target_scene_id, order_index)
             VALUES (?, ?, ?, ?, ?)`,
            [choice.id, scene.id, choice.text, choice.targetSceneId, choice.orderIndex]
          );
        }
      }
    });
  },

  async createScene(scene: Omit<Scene, 'updatedAt'>): Promise<Scene> {
    const db = await getDb();
    const now = Date.now();
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO scenes (id, story_id, title, content, image_uri, is_ending, ending_type, position_x, position_y, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          scene.id,
          scene.storyId,
          scene.title,
          scene.content,
          scene.imageUri ?? null,
          scene.isEnding ? 1 : 0,
          scene.endingType ?? null,
          scene.positionX,
          scene.positionY,
          now,
        ]
      );

      for (const choice of scene.choices) {
        await db.runAsync(
          `INSERT INTO choices (id, scene_id, text, target_scene_id, order_index)
           VALUES (?, ?, ?, ?, ?)`,
          [choice.id, scene.id, choice.text, choice.targetSceneId, choice.orderIndex]
        );
      }

      await db.runAsync('UPDATE stories SET updated_at = ? WHERE id = ?', [now, scene.storyId]);
    });

    return { ...scene, updatedAt: now };
  },

  async saveSceneAndChoices(scene: Scene): Promise<void> {
    const db = await getDb();
    const now = Date.now();
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `UPDATE scenes
         SET title = ?, content = ?, image_uri = ?, is_ending = ?, ending_type = ?, position_x = ?, position_y = ?, updated_at = ?
         WHERE id = ?`,
        [
          scene.title,
          scene.content,
          scene.imageUri ?? null,
          scene.isEnding ? 1 : 0,
          scene.endingType ?? null,
          scene.positionX,
          scene.positionY,
          now,
          scene.id,
        ]
      );

      await db.runAsync('DELETE FROM choices WHERE scene_id = ?', [scene.id]);
      for (let i = 0; i < scene.choices.length; i++) {
        const c = scene.choices[i];
        await db.runAsync(
          `INSERT INTO choices (id, scene_id, text, target_scene_id, order_index)
           VALUES (?, ?, ?, ?, ?)`,
          [c.id, scene.id, c.text, c.targetSceneId, i]
        );
      }

      await db.runAsync('UPDATE stories SET updated_at = ? WHERE id = ?', [now, scene.storyId]);
    });
  },

  async updateScenePositions(
    storyId: string,
    updates: Array<{ id: string; positionX: number; positionY: number }>
  ): Promise<void> {
    const db = await getDb();
    const now = Date.now();
    await db.withTransactionAsync(async () => {
      for (const u of updates) {
        await db.runAsync(
          'UPDATE scenes SET position_x = ?, position_y = ?, updated_at = ? WHERE id = ?',
          [u.positionX, u.positionY, now, u.id]
        );
      }
      await db.runAsync('UPDATE stories SET updated_at = ? WHERE id = ?', [now, storyId]);
    });
  },

  async deleteScene(
    storyId: string,
    sceneId: string,
    rerouteTargetSceneId?: string | null
  ): Promise<void> {
    const db = await getDb();
    const now = Date.now();
    await db.withTransactionAsync(async () => {
      if (rerouteTargetSceneId) {
        await db.runAsync(
          'UPDATE choices SET target_scene_id = ? WHERE target_scene_id = ?',
          [rerouteTargetSceneId, sceneId]
        );
      }

      await db.runAsync(
        'UPDATE stories SET start_scene_id = NULL, updated_at = ? WHERE id = ? AND start_scene_id = ?',
        [now, storyId, sceneId]
      );

      await db.runAsync('DELETE FROM scenes WHERE id = ?', [sceneId]);
      await db.runAsync('UPDATE stories SET updated_at = ? WHERE id = ?', [now, storyId]);
    });
  },
};
