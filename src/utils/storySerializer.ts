import { Choice, ExportedStoryBundle, Scene, Story } from '../types/story';
import { generateId } from './id';

export function serializeStoryToBundle(story: Story, scenes: Scene[]): ExportedStoryBundle {
  return {
    schemaVersion: 1,
    exportedAt: Date.now(),
    story: {
      id: story.id,
      title: story.title,
      synopsis: story.synopsis,
      author: story.author,
      startSceneId: story.startSceneId,
    },
    scenes: scenes.map((scene) => ({
      id: scene.id,
      title: scene.title,
      content: scene.content,
      isEnding: scene.isEnding,
      endingType: scene.endingType ?? null,
      positionX: scene.positionX,
      positionY: scene.positionY,
      choices: scene.choices.map((c) => ({
        id: c.id,
        text: c.text,
        targetSceneId: c.targetSceneId,
        orderIndex: c.orderIndex,
      })),
    })),
  };
}

/**
 * Parses and validates an imported JSON string, regenerating all IDs
 * so the imported story never collides with existing local records.
 */
export function parseImportedStoryBundle(jsonString: string): {
  story: Story;
  scenes: Scene[];
} {
  const raw = JSON.parse(jsonString) as Partial<ExportedStoryBundle>;
  if (!raw || typeof raw !== 'object' || !raw.story || !Array.isArray(raw.scenes)) {
    throw new Error('Invalid CYOA story file format.');
  }

  const now = Date.now();
  const newStoryId = generateId();

  // Map old scene IDs to freshly generated scene IDs
  const sceneIdMap = new Map<string, string>();
  for (const s of raw.scenes) {
    if (s && typeof s.id === 'string') {
      sceneIdMap.set(s.id, generateId());
    }
  }

  const mappedStartSceneId =
    raw.story.startSceneId && sceneIdMap.has(raw.story.startSceneId)
      ? sceneIdMap.get(raw.story.startSceneId)!
      : null;

  const story: Story = {
    id: newStoryId,
    title: String(raw.story.title || 'Imported Story'),
    synopsis: String(raw.story.synopsis || ''),
    author: String(raw.story.author || ''),
    coverImageUri: null,
    startSceneId: mappedStartSceneId,
    createdAt: now,
    updatedAt: now,
  };

  const scenes: Scene[] = raw.scenes.map((s) => {
    const newSceneId = sceneIdMap.get(s.id) ?? generateId();
    const rawChoices = Array.isArray(s.choices) ? s.choices : [];
    const choices: Choice[] = rawChoices.map((c, idx) => ({
      id: generateId(),
      sceneId: newSceneId,
      text: String(c.text || 'Continue'),
      targetSceneId: c.targetSceneId && sceneIdMap.has(c.targetSceneId)
        ? sceneIdMap.get(c.targetSceneId)!
        : null,
      orderIndex: typeof c.orderIndex === 'number' ? c.orderIndex : idx,
    }));

    return {
      id: newSceneId,
      storyId: newStoryId,
      title: String(s.title || 'Untitled Scene'),
      content: String(s.content || ''),
      imageUri: null,
      isEnding: Boolean(s.isEnding),
      endingType: s.endingType ?? null,
      positionX: typeof s.positionX === 'number' ? s.positionX : 80,
      positionY: typeof s.positionY === 'number' ? s.positionY : 80,
      choices,
      updatedAt: now,
    };
  });

  return { story, scenes };
}
