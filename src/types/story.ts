export type EndingType = 'VICTORY' | 'DEATH' | 'NEUTRAL' | 'CLIFFHANGER';

export interface Choice {
  id: string;
  sceneId: string;
  text: string;
  targetSceneId: string | null;
  orderIndex: number;
}

export interface Scene {
  id: string;
  storyId: string;
  title: string;
  content: string;
  imageUri?: string | null;
  isEnding: boolean;
  endingType?: EndingType | null;
  positionX: number;
  positionY: number;
  choices: Choice[];
  updatedAt: number;
}

export interface Story {
  id: string;
  title: string;
  synopsis: string;
  author: string;
  coverImageUri?: string | null;
  startSceneId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface StoryWithCounts extends Story {
  sceneCount: number;
  hasAutoSave: boolean;
}

export interface HistoryStep {
  id: string;
  sessionId: string;
  stepIndex: number;
  sceneId: string | null;
  sceneTitleSnapshot: string;
  chosenChoiceText?: string | null;
  timestamp: number;
}

export interface PlaySession {
  id: string;
  storyId: string;
  slotName: string;
  isAutoSave: boolean;
  currentSceneId: string | null;
  historyStack: HistoryStep[];
  savedAt: number;
}

export type ValidationIssueType =
  | 'MISSING_START_SCENE'
  | 'UNLINKED_CHOICE'
  | 'DEAD_END'
  | 'ORPHAN_SCENE';

export interface ValidationIssue {
  id: string;
  type: ValidationIssueType;
  sceneId?: string;
  choiceId?: string;
  message: string;
}

export interface ExportedStoryBundle {
  schemaVersion: number;
  exportedAt: number;
  story: {
    id: string;
    title: string;
    synopsis: string;
    author: string;
    startSceneId: string | null;
  };
  scenes: Array<{
    id: string;
    title: string;
    content: string;
    isEnding: boolean;
    endingType?: EndingType | null;
    positionX: number;
    positionY: number;
    choices: Array<{
      id: string;
      text: string;
      targetSceneId: string | null;
      orderIndex: number;
    }>;
  }>;
}
