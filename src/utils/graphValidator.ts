import { Scene, Story, ValidationIssue } from '../types/story';

/**
 * Validates the branching graph of a story for structural issues:
 * - Missing or invalid start scene
 * - Unlinked choices (targetSceneId is null or missing)
 * - Dead ends (non-ending scenes with 0 choices)
 * - Orphan scenes (unreachable from startSceneId)
 */
export function validateStoryGraph(story: Story, scenes: Scene[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const sceneMap = new Map<string, Scene>();
  for (const scene of scenes) {
    sceneMap.set(scene.id, scene);
  }

  // 1. Check start scene
  const startScene = story.startSceneId ? sceneMap.get(story.startSceneId) : undefined;
  if (!startScene) {
    issues.push({
      id: 'missing-start',
      type: 'MISSING_START_SCENE',
      message: 'Story has no valid starting scene assigned.',
    });
  }

  // 2. Check unlinked choices & dead ends
  for (const scene of scenes) {
    if (!scene.isEnding && scene.choices.length === 0) {
      issues.push({
        id: `dead-end-${scene.id}`,
        type: 'DEAD_END',
        sceneId: scene.id,
        message: `"${scene.title || 'Untitled Scene'}" has no choices and is not marked as an ending.`,
      });
    }

    for (const choice of scene.choices) {
      if (!choice.targetSceneId || !sceneMap.has(choice.targetSceneId)) {
        issues.push({
          id: `unlinked-${choice.id}`,
          type: 'UNLINKED_CHOICE',
          sceneId: scene.id,
          choiceId: choice.id,
          message: `Choice "${choice.text || 'Untitled Choice'}" in "${scene.title || 'Untitled Scene'}" is not linked to a scene.`,
        });
      }
    }
  }

  // 3. BFS reachability for orphan scenes
  if (startScene) {
    const visited = new Set<string>();
    const queue: string[] = [startScene.id];
    visited.add(startScene.id);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const current = sceneMap.get(currentId);
      if (!current) continue;

      for (const choice of current.choices) {
        if (choice.targetSceneId && sceneMap.has(choice.targetSceneId) && !visited.has(choice.targetSceneId)) {
          visited.add(choice.targetSceneId);
          queue.push(choice.targetSceneId);
        }
      }
    }

    for (const scene of scenes) {
      if (!visited.has(scene.id)) {
        issues.push({
          id: `orphan-${scene.id}`,
          type: 'ORPHAN_SCENE',
          sceneId: scene.id,
          message: `"${scene.title || 'Untitled Scene'}" is unreachable from the starting scene.`,
        });
      }
    }
  }

  return issues;
}
