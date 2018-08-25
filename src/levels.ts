import { Vector2 } from 'pearl';
import parseSVGLevel, { LevelShape } from './parseSVGLevel';

const levelSize = {
  x: 320,
  y: 240,
};

export interface Level {
  spawns: [Vector2, Vector2, Vector2, Vector2];
  platforms: LevelShape[];
  size: Vector2;
}

const levelOne: Level = {
  spawns: [
    {
      x: 20,
      y: 120,
    },
    {
      x: 100,
      y: 120,
    },
    {
      x: 220,
      y: 120,
    },
    {
      x: 300,
      y: 120,
    },
  ],
  ...parseSVGLevel(require('../assets/level-1.svg')),
};

const levelTwo: Level = {
  spawns: [
    {
      x: 20,
      y: 120,
    },
    {
      x: 80,
      y: 120,
    },
    {
      x: 240,
      y: 120,
    },
    {
      x: 300,
      y: 120,
    },
  ],
  ...parseSVGLevel(require('../assets/level-2.svg')),
};

const levelThree: Level = {
  spawns: [
    {
      x: 160,
      y: 400,
    },
    {
      x: 266,
      y: 400,
    },
    {
      x: 373,
      y: 400,
    },
    {
      x: 480,
      y: 400,
    },
  ],
  ...parseSVGLevel(require('../assets/level-3.svg')),
};

export default [levelOne, levelTwo, levelThree];
