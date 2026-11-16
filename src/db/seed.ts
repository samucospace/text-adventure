import { Scene, Story } from '../types/story';
import { generateId } from '../utils/id';
import { storyRepo } from './storyRepo';

const LOST_PUPPY_STORY_ID = 'sample-lost-puppy-v1';

export async function seedSampleStoryIfEmpty(): Promise<void> {
  const existing = await storyRepo.listStories();
  if (existing.length === 0) {
    await seedClockworkSpire();
  }

  const hasLostPuppy = existing.some(
    (s) => s.id === LOST_PUPPY_STORY_ID || s.title === 'The Lost Puppy'
  );
  if (!hasLostPuppy) {
    await seedLostPuppy();
  }
}

async function seedClockworkSpire(): Promise<void> {

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

async function seedLostPuppy(): Promise<void> {
  const now = Date.now() + 1;
  const storyId = LOST_PUPPY_STORY_ID;

  const s1 = generateId();
  const s2a = generateId();
  const s2b = generateId();
  const s3a = generateId();
  const s3b = generateId();
  const s4a = generateId();
  const s4b = generateId();
  const s5a = generateId();
  const s5b = generateId();
  const s6a = generateId();
  const s6b = generateId();
  const s7a = generateId();
  const s7b = generateId();
  const s8a = generateId();
  const s8b = generateId();
  const s8c = generateId();

  const story: Story = {
    id: storyId,
    title: 'The Lost Puppy',
    synopsis: 'You find a red collar by your gate. Follow the clues in an 8-step adventure to bring Pip home!',
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
      title: 'The Red Collar',
      content:
        'You find a shiny red collar by your back gate. A small tag on it says "PIP". Just then, you hear a soft bark down the lane!',
      isEnding: false,
      positionX: 200,
      positionY: 40,
      updatedAt: now,
      choices: [
        {
          id: generateId(),
          sceneId: s1,
          text: 'Follow the muddy paw prints into the park',
          targetSceneId: s2a,
          orderIndex: 0,
        },
        {
          id: generateId(),
          sceneId: s1,
          text: 'Look behind the big oak tree by the pond',
          targetSceneId: s2b,
          orderIndex: 1,
        },
      ],
    },
    {
      id: s2a,
      storyId,
      title: 'The Muddy Park',
      content:
        'The paw prints go past the swings and stop by a tall green bush. Something inside is moving and making a rustle sound!',
      isEnding: false,
      positionX: 60,
      positionY: 200,
      updatedAt: now,
      choices: [
        {
          id: generateId(),
          sceneId: s2a,
          text: 'Peek under the bush',
          targetSceneId: s3a,
          orderIndex: 0,
        },
        {
          id: generateId(),
          sceneId: s2a,
          text: 'Call out, "Here, Pip!"',
          targetSceneId: s3b,
          orderIndex: 1,
        },
      ],
    },
    {
      id: s2b,
      storyId,
      title: 'The Duck Pond',
      content:
        'A green frog sits on a log by the water. You spot a line of wet paw prints leading toward the little wooden bridge.',
      isEnding: false,
      positionX: 340,
      positionY: 200,
      updatedAt: now,
      choices: [
        {
          id: generateId(),
          sceneId: s2b,
          text: 'Walk across the wooden bridge',
          targetSceneId: s3b,
          orderIndex: 0,
        },
        {
          id: generateId(),
          sceneId: s2b,
          text: 'Check the path by the tall bushes',
          targetSceneId: s3a,
          orderIndex: 1,
        },
      ],
    },
    {
      id: s3a,
      storyId,
      title: 'The Bushy Surprise',
      content:
        'It is not a puppy—it is a fluffy gray rabbit! The rabbit hops away toward an old wooden shed at the edge of the grass.',
      isEnding: false,
      positionX: 60,
      positionY: 360,
      updatedAt: now,
      choices: [
        {
          id: generateId(),
          sceneId: s3a,
          text: 'Walk over to the old shed',
          targetSceneId: s4a,
          orderIndex: 0,
        },
        {
          id: generateId(),
          sceneId: s3a,
          text: 'Check near the bakery across the street',
          targetSceneId: s4b,
          orderIndex: 1,
        },
      ],
    },
    {
      id: s3b,
      storyId,
      title: 'The Wooden Bridge',
      content:
        'You hear a happy "Woof!" on the other side of the bridge. A baker is sweeping crumbs outside her warm bread shop.',
      isEnding: false,
      positionX: 340,
      positionY: 360,
      updatedAt: now,
      choices: [
        {
          id: generateId(),
          sceneId: s3b,
          text: 'Ask the baker if she saw a puppy',
          targetSceneId: s4b,
          orderIndex: 0,
        },
        {
          id: generateId(),
          sceneId: s3b,
          text: 'Look behind the old garden shed',
          targetSceneId: s4a,
          orderIndex: 1,
        },
      ],
    },
    {
      id: s4a,
      storyId,
      title: 'The Old Garden Shed',
      content:
        'The shed door is open just a bit. Inside, you find a half-eaten dog treat and a bright blue rubber ball.',
      isEnding: false,
      positionX: 60,
      positionY: 520,
      updatedAt: now,
      choices: [
        {
          id: generateId(),
          sceneId: s4a,
          text: 'Pick up the blue ball and head to the woods',
          targetSceneId: s5a,
          orderIndex: 0,
        },
        {
          id: generateId(),
          sceneId: s4a,
          text: 'Follow the trail up the sunny hill',
          targetSceneId: s5b,
          orderIndex: 1,
        },
      ],
    },
    {
      id: s4b,
      storyId,
      title: 'The Sunny Bakery',
      content:
        'The baker smiles. "A tiny brown puppy ran past with a muffin! He went right up the hill!"',
      isEnding: false,
      positionX: 340,
      positionY: 520,
      updatedAt: now,
      choices: [
        {
          id: generateId(),
          sceneId: s4b,
          text: 'Take a dog biscuit and check the woods',
          targetSceneId: s5a,
          orderIndex: 0,
        },
        {
          id: generateId(),
          sceneId: s4b,
          text: 'Thank her and run up the hilltop path',
          targetSceneId: s5b,
          orderIndex: 1,
        },
      ],
    },
    {
      id: s5a,
      storyId,
      title: 'The Whispering Woods',
      content:
        'You reach the edge of the woods with your clue. Tall trees sway in the breeze, and two trails wind up the hill.',
      isEnding: false,
      positionX: 60,
      positionY: 680,
      updatedAt: now,
      choices: [
        {
          id: generateId(),
          sceneId: s5a,
          text: 'Take the sunny gravel trail',
          targetSceneId: s6a,
          orderIndex: 0,
        },
        {
          id: generateId(),
          sceneId: s5a,
          text: 'Take the shady mossy trail',
          targetSceneId: s6b,
          orderIndex: 1,
        },
      ],
    },
    {
      id: s5b,
      storyId,
      title: 'The Hilltop Path',
      content:
        'Halfway up the hill, you see fresh paw prints in the soft dirt. The prints split at a big flat rock!',
      isEnding: false,
      positionX: 340,
      positionY: 680,
      updatedAt: now,
      choices: [
        {
          id: generateId(),
          sceneId: s5b,
          text: 'Follow the prints to the left',
          targetSceneId: s6a,
          orderIndex: 0,
        },
        {
          id: generateId(),
          sceneId: s5b,
          text: 'Follow the prints to the right',
          targetSceneId: s6b,
          orderIndex: 1,
        },
      ],
    },
    {
      id: s6a,
      storyId,
      title: 'The Hollow Log',
      content:
        'You hear tiny whimpers coming from inside a big hollow log. Two bright brown eyes peek out at you!',
      isEnding: false,
      positionX: 60,
      positionY: 840,
      updatedAt: now,
      choices: [
        {
          id: generateId(),
          sceneId: s6a,
          text: 'Kneel down and hold out your hand',
          targetSceneId: s7a,
          orderIndex: 0,
        },
        {
          id: generateId(),
          sceneId: s6a,
          text: 'Speak softly and wait for him to come out',
          targetSceneId: s7b,
          orderIndex: 1,
        },
      ],
    },
    {
      id: s6b,
      storyId,
      title: 'The Berry Patch',
      content:
        'You spot a wagging tail sticking out of a berry bush! A little brown puppy has a ribbon caught on his paw.',
      isEnding: false,
      positionX: 340,
      positionY: 840,
      updatedAt: now,
      choices: [
        {
          id: generateId(),
          sceneId: s6b,
          text: 'Gently untangle the ribbon',
          targetSceneId: s7a,
          orderIndex: 0,
        },
        {
          id: generateId(),
          sceneId: s6b,
          text: 'Sit still and let the puppy sniff you first',
          targetSceneId: s7b,
          orderIndex: 1,
        },
      ],
    },
    {
      id: s7a,
      storyId,
      title: 'A New Friend',
      content:
        'Pip licks your nose! His tail wags so fast his whole body wiggles. Now it is time to bring him home safely.',
      isEnding: false,
      positionX: 60,
      positionY: 1000,
      updatedAt: now,
      choices: [
        {
          id: generateId(),
          sceneId: s7a,
          text: 'Put his red collar on and walk home',
          targetSceneId: s8a,
          orderIndex: 0,
        },
        {
          id: generateId(),
          sceneId: s7a,
          text: 'Carry Pip to the bakery to call his owner',
          targetSceneId: s8b,
          orderIndex: 1,
        },
      ],
    },
    {
      id: s7b,
      storyId,
      title: 'The Shy Puppy',
      content:
        'Pip is shy at first and hides behind your shoes. Then he sees your big smile and hops right into your lap!',
      isEnding: false,
      positionX: 340,
      positionY: 1000,
      updatedAt: now,
      choices: [
        {
          id: generateId(),
          sceneId: s7b,
          text: 'Walk back down the hill to your gate',
          targetSceneId: s8a,
          orderIndex: 0,
        },
        {
          id: generateId(),
          sceneId: s7b,
          text: 'Head to the swings to look for his owner',
          targetSceneId: s8c,
          orderIndex: 1,
        },
      ],
    },
    {
      id: s8a,
      storyId,
      title: 'Home Safe and Sound',
      content:
        'Pip’s owner is waiting by your gate with a big smile. She gives you a huge hug and says you are the best helper ever!',
      isEnding: true,
      endingType: 'VICTORY',
      positionX: 20,
      positionY: 1160,
      updatedAt: now,
      choices: [],
    },
    {
      id: s8b,
      storyId,
      title: 'The Bakery Party',
      content:
        'Pip’s owner meets you at the bakery. To say thank you, she buys warm cookies for everyone—and a doggy cookie for Pip!',
      isEnding: true,
      endingType: 'VICTORY',
      positionX: 200,
      positionY: 1160,
      updatedAt: now,
      choices: [],
    },
    {
      id: s8c,
      storyId,
      title: 'Best Friends Forever',
      content:
        'You find Pip’s owner by the swings. She lives right next door, and she asks if you want to help walk Pip every weekend!',
      isEnding: true,
      endingType: 'VICTORY',
      positionX: 380,
      positionY: 1160,
      updatedAt: now,
      choices: [],
    },
  ];

  await storyRepo.importStoryBundle(story, scenes);
}
