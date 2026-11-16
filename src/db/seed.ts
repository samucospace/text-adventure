import { Scene, Story } from '../types/story';
import { generateId } from '../utils/id';
import { storyRepo } from './storyRepo';

export async function seedSampleStoryIfEmpty(): Promise<void> {
  const existing = await storyRepo.listStories();
  if (existing.length > 0) return;

  const now = Date.now();
  const storyId = generateId();

  const s1 = generateId();
  const s2 = generateId();
  const s3 = generateId();
  const s4 = generateId();
  const s5 = generateId();

  const story: Story = {
    id: storyId,
    title: 'The Clockwork Spire',
    synopsis: 'An ancient brass tower ticks above the fog. Step inside to uncover what keeps the city turning.',
    author: 'Sample Adventure',
    coverImageUri: null,
    startSceneId: s1,
    createdAt: now,
    updatedAt: now,
  };

  const scenes: Scene[] = [
    {
      id: s1,
      storyId,
      title: 'The Brass Threshold',
      content:
        'Rain patters against your coat as you stand before the Clockwork Spire. Its arched bronze doors stand ajar, exhaling warm steam and the rhythmic hum of colossal gears.',
      isEnding: false,
      positionX: 200,
      positionY: 60,
      updatedAt: now,
      choices: [
        {
          id: generateId(),
          sceneId: s1,
          text: 'Step through the main bronze doors',
          targetSceneId: s2,
          orderIndex: 0,
        },
        {
          id: generateId(),
          sceneId: s1,
          text: 'Circle around to the maintenance grate',
          targetSceneId: s3,
          orderIndex: 1,
        },
      ],
    },
    {
      id: s2,
      storyId,
      title: 'The Pendulum Hall',
      content:
        'Inside, a golden pendulum swings silently across a vaulted atrium. In the center sits a pedestal with two levers: one marked DAWN, the other DUSK.',
      isEnding: false,
      positionX: 80,
      positionY: 230,
      updatedAt: now,
      choices: [
        {
          id: generateId(),
          sceneId: s2,
          text: 'Pull the DAWN lever',
          targetSceneId: s4,
          orderIndex: 0,
        },
        {
          id: generateId(),
          sceneId: s2,
          text: 'Pull the DUSK lever',
          targetSceneId: s5,
          orderIndex: 1,
        },
      ],
    },
    {
      id: s3,
      storyId,
      title: 'The Steam Conduit',
      content:
        'You pry open the rusted grate and crawl along a narrow copper pipe. Ahead, a ladder climbs straight into the atrium above, bypassing the locked inner gate.',
      isEnding: false,
      positionX: 340,
      positionY: 230,
      updatedAt: now,
      choices: [
        {
          id: generateId(),
          sceneId: s3,
          text: 'Climb the ladder into the Pendulum Hall',
          targetSceneId: s2,
          orderIndex: 0,
        },
      ],
    },
    {
      id: s4,
      storyId,
      title: 'City of Perpetual Morning',
      content:
        'A chime echoes through the spire. The clouds above part, bathing the city in warm morning sunlight as the great gears settle into a gentle, peaceful hum.',
      isEnding: true,
      endingType: 'VICTORY',
      positionX: 40,
      positionY: 400,
      updatedAt: now,
      choices: [],
    },
    {
      id: s5,
      storyId,
      title: 'The Endless Night',
      content:
        'The pendulum freezes mid-swing. Outside, the city lanterns flicker out one by one as the spire locks itself in silent obsidian slumber.',
      isEnding: true,
      endingType: 'CLIFFHANGER',
      positionX: 280,
      positionY: 400,
      updatedAt: now,
      choices: [],
    },
  ];

  await storyRepo.importStoryBundle(story, scenes);
}
