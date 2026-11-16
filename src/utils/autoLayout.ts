import { Scene } from '../types/story';

const NODE_HORIZONTAL_GAP = 240;
const NODE_VERTICAL_GAP = 160;
const START_X = 80;
const START_Y = 80;

/**
 * Computes clean hierarchical (BFS level-based) canvas coordinates
 * starting from `startSceneId`. Disconnected scenes are placed in a
 * separate row below the main graph.
 */
export function computeAutoLayout(
  scenes: Scene[],
  startSceneId: string | null
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  if (scenes.length === 0) return positions;

  const sceneMap = new Map<string, Scene>();
  for (const s of scenes) {
    sceneMap.set(s.id, s);
  }

  const rootId = startSceneId && sceneMap.has(startSceneId) ? startSceneId : scenes[0].id;
  const levels = new Map<number, string[]>();
  const visited = new Set<string>();

  const queue: Array<{ id: string; level: number }> = [{ id: rootId, level: 0 }];
  visited.add(rootId);

  let maxLevel = 0;

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    maxLevel = Math.max(maxLevel, level);

    const bucket = levels.get(level) ?? [];
    bucket.push(id);
    levels.set(level, bucket);

    const scene = sceneMap.get(id);
    if (!scene) continue;

    for (const choice of scene.choices) {
      if (choice.targetSceneId && sceneMap.has(choice.targetSceneId) && !visited.has(choice.targetSceneId)) {
        visited.add(choice.targetSceneId);
        queue.push({ id: choice.targetSceneId, level: level + 1 });
      }
    }
  }

  // Assign coordinates to reachable levels
  for (let level = 0; level <= maxLevel; level++) {
    const bucket = levels.get(level) ?? [];
    bucket.forEach((id, index) => {
      positions.set(id, {
        x: START_X + index * NODE_HORIZONTAL_GAP,
        y: START_Y + level * NODE_VERTICAL_GAP,
      });
    });
  }

  // Place unreachable/orphan scenes below
  const orphans = scenes.filter((s) => !visited.has(s.id));
  orphans.forEach((scene, index) => {
    positions.set(scene.id, {
      x: START_X + index * NODE_HORIZONTAL_GAP,
      y: START_Y + (maxLevel + 1) * NODE_VERTICAL_GAP + 40,
    });
  });

  return positions;
}
