import {
  Component,
  Entity,
  Physical,
  BoxCollider,
  BoxRenderer,
  Maths,
  PolygonRenderer,
  PolygonCollider,
} from 'pearl';

import parseSVGLevel, {
  PolygonLevelShape,
  RectangleLevelShape,
} from '../parseSVGLevel';
import { Tag } from '../types';
import { Level } from '../levels';

export default class LevelLoader extends Component<void> {
  loadLevel(level: Level) {
    const worldSize = this.pearl.renderer.getViewSize();

    const walls: RectangleLevelShape[] = [
      {
        type: 'rectangle',
        center: { x: -25, y: worldSize.y / 2 },
        size: { x: 50, y: worldSize.y * 4 },
        angle: 0,
      },
      {
        type: 'rectangle',
        center: { x: worldSize.x + 25, y: worldSize.y / 2 },
        size: { x: 50, y: worldSize.y * 4 },
        angle: 0,
      },
    ];

    const platforms = [...level.platforms, ...walls];

    for (let shape of platforms) {
      if (shape.type === 'polygon') {
        this.createPolygonPlatform(shape);
      } else if (shape.type === 'rectangle') {
        this.createBoxPlatform(shape);
      }
    }
  }

  private createBoxPlatform(shape: RectangleLevelShape) {
    this.pearl.entities.add(
      new Entity({
        name: 'platform',
        tags: [Tag.Platform],
        components: [
          new Physical({
            center: shape.center,
            angle: Maths.degreesToRadians(shape.angle || 0),
          }),
          new BoxCollider({ width: shape.size.x, height: shape.size.y }),
          new BoxRenderer({
            strokeStyle: 'white',
          }),
        ],
      })
    );
  }

  private createPolygonPlatform(shape: PolygonLevelShape) {
    this.pearl.entities.add(
      new Entity({
        name: 'platform',
        tags: [Tag.Platform],
        components: [
          new Physical({
            center: shape.center,
            angle: Maths.degreesToRadians(shape.angle || 0),
          }),
          new PolygonCollider({
            points: shape.localPoints,
          }),
          new BoxRenderer({
            strokeStyle: 'white',
          }),
        ],
      })
    );
  }
}
