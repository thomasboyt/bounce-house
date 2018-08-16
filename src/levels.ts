import { Vector2 } from 'pearl';

const levelSize = {
  x: 320,
  y: 240,
};

export interface Level {
  spawns: [Vector2, Vector2, Vector2, Vector2];
  platforms: Platform[];
}

export interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  angle?: number;
}

const ground = {
  x: levelSize.x / 2,
  y: levelSize.y + 10,
  w: levelSize.x,
  h: 50,
};

const levelOne: Level = {
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
  platforms: [
    ground,

    // platforms
    { x: 120, y: levelSize.y - 80, w: 40, h: 20, angle: 45 },
    { x: levelSize.x - 120, y: levelSize.y - 120, w: 40, h: 20, angle: -45 },
    { x: 120, y: levelSize.y - 160, w: 40, h: 20, angle: 45 },
    { x: levelSize.x - 120, y: levelSize.y - 200, w: 40, h: 20 },
  ],
};

const levelTwo: Level = {
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
  platforms: [
    ground,
    { x: 60, y: 160, w: 60, h: 20 },
    { x: levelSize.x - 60, y: 160, w: 60, h: 20 },
    { x: 146, y: 80, w: 60, h: 20, angle: -45 },
    { x: levelSize.x - 146, y: 80, w: 60, h: 20, angle: 45 },
    { x: levelSize.x / 2, y: 0, w: 20, h: 150 },
  ],
};

export default [levelOne, levelTwo];
