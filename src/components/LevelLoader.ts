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

/**
 * Responsible for adding and removing platforms from the game world when the
 * level changes.
 *
 * changeLevel() is used on both hosts AND clients, since platforms aren't
 * network-managed to reduce the amount of data going over the wire. This may
 * change in the future if weird stuff is added (e.g. moving platforms), in
 * which case this component might end up getting used on just the host.
 */
export default class LevelLoader extends Component<void> {
  changeLevel(level: Level) {
    const existing = this.pearl.entities.all(Tag.Platform);
    for (let entity of existing) {
      this.pearl.entities.destroy(entity);
    }

    this.loadLevel(level);
  }

  private loadLevel(level: Level) {
    const worldSize = level.size;

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
