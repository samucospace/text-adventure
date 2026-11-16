import { create } from 'zustand';
import { storyRepo } from '../db/storyRepo';
import { Scene, Story, ValidationIssue } from '../types/story';
import { computeAutoLayout } from '../utils/autoLayout';
import { validateStoryGraph } from '../utils/graphValidator';
import { generateId } from '../utils/id';

export type EditorViewMode = 'map' | 'outline';

interface EditorState {
  story: Story | null;
  scenes: Scene[];
  viewMode: EditorViewMode;
  selectedSceneId: string | null;
  isLoading: boolean;

  loadStory: (storyId: string) => Promise<void>;
  clearEditor: () => void;
  setViewMode: (mode: EditorViewMode) => void;
  selectScene: (sceneId: string | null) => void;
  updateStoryMeta: (
    patch: Partial<Pick<Story, 'title' | 'synopsis' | 'author' | 'startSceneId'>>
  ) => Promise<void>;
  addScene: (input?: {
    title?: string;
    content?: string;
    positionX?: number;
    positionY?: number;
  }) => Promise<Scene | null>;
  saveScene: (scene: Scene) => Promise<void>;
  deleteScene: (sceneId: string, rerouteTargetId?: string | null) => Promise<void>;
  updateNodePosition: (sceneId: string, x: number, y: number) => Promise<void>;
  runAutoLayout: () => Promise<void>;
  getValidationIssues: () => ValidationIssue[];
}

export const useEditorStore = create<EditorState>((set, get) => ({
  story: null,
  scenes: [],
  viewMode: 'outline',
  selectedSceneId: null,
  isLoading: false,

  loadStory: async (storyId: string) => {
    set({ isLoading: true });
    const result = await storyRepo.getStoryWithScenes(storyId);
    if (!result) {
      set({ story: null, scenes: [], isLoading: false });
      return;
    }
    set({
      story: result.story,
      scenes: result.scenes,
      selectedSceneId: null,
      isLoading: false,
    });
  },

  clearEditor: () => {
    set({ story: null, scenes: [], selectedSceneId: null, isLoading: false });
  },

  setViewMode: (mode) => set({ viewMode: mode }),

  selectScene: (sceneId) => set({ selectedSceneId: sceneId }),

  updateStoryMeta: async (patch) => {
    const { story } = get();
    if (!story) return;
    await storyRepo.updateStory(story.id, patch);
    set({
      story: {
        ...story,
        ...patch,
        updatedAt: Date.now(),
      },
    });
  },

  addScene: async (input) => {
    const { story, scenes } = get();
    if (!story) return null;

    const offsetIndex = scenes.length;
    const newScene = await storyRepo.createScene({
      id: generateId(),
      storyId: story.id,
      title: input?.title ?? `Scene ${scenes.length + 1}`,
      content: input?.content ?? '',
      imageUri: null,
      isEnding: false,
      endingType: null,
      positionX: input?.positionX ?? 80 + (offsetIndex % 3) * 220,
      positionY: input?.positionY ?? 80 + Math.floor(offsetIndex / 3) * 160,
      choices: [],
    });

    // If story has no startSceneId yet, assign this new scene as start
    let updatedStory = story;
    if (!story.startSceneId) {
      await storyRepo.updateStory(story.id, { startSceneId: newScene.id });
      updatedStory = { ...story, startSceneId: newScene.id, updatedAt: Date.now() };
    }

    set({
      story: updatedStory,
      scenes: [...scenes, newScene],
    });
    return newScene;
  },

  saveScene: async (scene) => {
    await storyRepo.saveSceneAndChoices(scene);
    set((state) => ({
      scenes: state.scenes.map((s) =>
        s.id === scene.id ? { ...scene, updatedAt: Date.now() } : s
      ),
    }));
  },

  deleteScene: async (sceneId, rerouteTargetId) => {
    const { story, scenes, selectedSceneId } = get();
    if (!story) return;

    await storyRepo.deleteScene(story.id, sceneId, rerouteTargetId);

    const updatedScenes = scenes
      .filter((s) => s.id !== sceneId)
      .map((s) => ({
        ...s,
        choices: s.choices.map((c) =>
          c.targetSceneId === sceneId
            ? { ...c, targetSceneId: rerouteTargetId ?? null }
            : c
        ),
      }));

    const updatedStartSceneId =
      story.startSceneId === sceneId ? null : story.startSceneId;

    set({
      story: { ...story, startSceneId: updatedStartSceneId, updatedAt: Date.now() },
      scenes: updatedScenes,
      selectedSceneId: selectedSceneId === sceneId ? null : selectedSceneId,
    });
  },

  updateNodePosition: async (sceneId, x, y) => {
    const { story, scenes } = get();
    if (!story) return;

    set({
      scenes: scenes.map((s) =>
        s.id === sceneId ? { ...s, positionX: x, positionY: y } : s
      ),
    });

    await storyRepo.updateScenePositions(story.id, [
      { id: sceneId, positionX: x, positionY: y },
    ]);
  },

  runAutoLayout: async () => {
    const { story, scenes } = get();
    if (!story || scenes.length === 0) return;

    const positions = computeAutoLayout(scenes, story.startSceneId);
    const updates: Array<{ id: string; positionX: number; positionY: number }> = [];

    const updatedScenes = scenes.map((s) => {
      const pos = positions.get(s.id);
      if (!pos) return s;
      updates.push({ id: s.id, positionX: pos.x, positionY: pos.y });
      return { ...s, positionX: pos.x, positionY: pos.y };
    });

    set({ scenes: updatedScenes });
    await storyRepo.updateScenePositions(story.id, updates);
  },

  getValidationIssues: () => {
    const { story, scenes } = get();
    if (!story) return [];
    return validateStoryGraph(story, scenes);
  },
}));
