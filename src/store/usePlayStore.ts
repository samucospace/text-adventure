import { create } from 'zustand';
import { sessionRepo } from '../db/sessionRepo';
import { storyRepo } from '../db/storyRepo';
import { Choice, HistoryStep, PlaySession, Scene, Story } from '../types/story';
import { generateId } from '../utils/id';

interface PlayState {
  story: Story | null;
  scenesById: Record<string, Scene>;
  currentSceneId: string | null;
  historyStack: HistoryStep[];
  savedSlots: PlaySession[];
  isLoading: boolean;

  startOrResumeStory: (storyId: string, forceRestart?: boolean) => Promise<void>;
  clearPlaySession: () => void;
  makeChoice: (choice: Choice) => Promise<void>;
  rewindOneStep: () => Promise<void>;
  rewindToStep: (stepIndex: number) => Promise<void>;
  restartStory: () => Promise<void>;
  saveManualSlot: (slotName: string) => Promise<void>;
  loadSaveSlot: (session: PlaySession) => Promise<void>;
  deleteSaveSlot: (sessionId: string) => Promise<void>;
}

export const usePlayStore = create<PlayState>((set, get) => ({
  story: null,
  scenesById: {},
  currentSceneId: null,
  historyStack: [],
  savedSlots: [],
  isLoading: false,

  startOrResumeStory: async (storyId: string, forceRestart = false) => {
    set({ isLoading: true });
    const result = await storyRepo.getStoryWithScenes(storyId);
    if (!result) {
      set({ story: null, scenesById: {}, currentSceneId: null, historyStack: [], isLoading: false });
      return;
    }

    const scenesById: Record<string, Scene> = {};
    for (const scene of result.scenes) {
      scenesById[scene.id] = scene;
    }

    const sessions = await sessionRepo.listSessionsForStory(storyId);
    const autoSave = sessions.find((s) => s.isAutoSave);

    if (!forceRestart && autoSave && autoSave.currentSceneId && scenesById[autoSave.currentSceneId]) {
      set({
        story: result.story,
        scenesById,
        currentSceneId: autoSave.currentSceneId,
        historyStack: autoSave.historyStack,
        savedSlots: sessions,
        isLoading: false,
      });
      return;
    }

    const startId = result.story.startSceneId;
    const validStartId = startId && scenesById[startId] ? startId : result.scenes[0]?.id ?? null;

    if (validStartId) {
      await sessionRepo.saveAutoSave(storyId, validStartId, []);
    }

    const refreshedSessions = await sessionRepo.listSessionsForStory(storyId);

    set({
      story: result.story,
      scenesById,
      currentSceneId: validStartId,
      historyStack: [],
      savedSlots: refreshedSessions,
      isLoading: false,
    });
  },

  clearPlaySession: () => {
    set({
      story: null,
      scenesById: {},
      currentSceneId: null,
      historyStack: [],
      savedSlots: [],
      isLoading: false,
    });
  },

  makeChoice: async (choice: Choice) => {
    const { story, scenesById, currentSceneId, historyStack } = get();
    if (!story || !currentSceneId || !choice.targetSceneId) return;
    if (!scenesById[choice.targetSceneId]) return;

    const currentScene = scenesById[currentSceneId];
    const newStep: HistoryStep = {
      id: generateId(),
      sessionId: '',
      stepIndex: historyStack.length,
      sceneId: currentSceneId,
      sceneTitleSnapshot: currentScene?.title ?? 'Unknown Scene',
      chosenChoiceText: choice.text,
      timestamp: Date.now(),
    };

    const nextHistory = [...historyStack, newStep];
    const nextSceneId = choice.targetSceneId;

    set({
      currentSceneId: nextSceneId,
      historyStack: nextHistory,
    });

    await sessionRepo.saveAutoSave(story.id, nextSceneId, nextHistory);
    const sessions = await sessionRepo.listSessionsForStory(story.id);
    set({ savedSlots: sessions });
  },

  rewindOneStep: async () => {
    const { story, historyStack, scenesById } = get();
    if (!story || historyStack.length === 0) return;

    const lastStep = historyStack[historyStack.length - 1];
    if (!lastStep.sceneId || !scenesById[lastStep.sceneId]) return;

    const trimmedHistory = historyStack.slice(0, -1);
    set({
      currentSceneId: lastStep.sceneId,
      historyStack: trimmedHistory,
    });

    await sessionRepo.saveAutoSave(story.id, lastStep.sceneId, trimmedHistory);
    const sessions = await sessionRepo.listSessionsForStory(story.id);
    set({ savedSlots: sessions });
  },

  rewindToStep: async (stepIndex: number) => {
    const { story, historyStack, scenesById } = get();
    if (!story || stepIndex < 0 || stepIndex >= historyStack.length) return;

    const targetStep = historyStack[stepIndex];
    if (!targetStep.sceneId || !scenesById[targetStep.sceneId]) return;

    const trimmedHistory = historyStack.slice(0, stepIndex);
    set({
      currentSceneId: targetStep.sceneId,
      historyStack: trimmedHistory,
    });

    await sessionRepo.saveAutoSave(story.id, targetStep.sceneId, trimmedHistory);
    const sessions = await sessionRepo.listSessionsForStory(story.id);
    set({ savedSlots: sessions });
  },

  restartStory: async () => {
    const { story, scenesById } = get();
    if (!story) return;

    const firstId =
      story.startSceneId && scenesById[story.startSceneId]
        ? story.startSceneId
        : Object.keys(scenesById)[0] ?? null;

    set({
      currentSceneId: firstId,
      historyStack: [],
    });

    await sessionRepo.saveAutoSave(story.id, firstId, []);
    const sessions = await sessionRepo.listSessionsForStory(story.id);
    set({ savedSlots: sessions });
  },

  saveManualSlot: async (slotName: string) => {
    const { story, currentSceneId, historyStack } = get();
    if (!story || !currentSceneId) return;

    await sessionRepo.createManualSave(
      story.id,
      slotName.trim() || `Save ${new Date().toLocaleTimeString()}`,
      currentSceneId,
      historyStack
    );
    const sessions = await sessionRepo.listSessionsForStory(story.id);
    set({ savedSlots: sessions });
  },

  loadSaveSlot: async (session: PlaySession) => {
    const { story, scenesById } = get();
    if (!story || !session.currentSceneId || !scenesById[session.currentSceneId]) return;

    set({
      currentSceneId: session.currentSceneId,
      historyStack: session.historyStack,
    });

    await sessionRepo.saveAutoSave(story.id, session.currentSceneId, session.historyStack);
    const sessions = await sessionRepo.listSessionsForStory(story.id);
    set({ savedSlots: sessions });
  },

  deleteSaveSlot: async (sessionId: string) => {
    const { story } = get();
    await sessionRepo.deleteSession(sessionId);
    if (story) {
      const sessions = await sessionRepo.listSessionsForStory(story.id);
      set({ savedSlots: sessions });
    }
  },
}));
