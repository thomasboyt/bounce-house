import {
  Component,
  Physical,
  Keys,
  BoxCollider,
  KinematicBody,
  Vector2,
  VectorMaths as V,
  CollisionInformation,
  BoxRenderer,
} from 'pearl';
import { NetworkedEntity, NetworkingHost } from 'pearl-networking';
import TrailRenderer from './TrailRenderer';
import { RGB, Tag } from '../types';
import SpawningDyingRenderer from './SpawningDyingRenderer';

// TODO: what to do with all these constants?
const bounceImpulse = 4;
const topSpeed = 1.5;
const playerAccel = 0.02;
const friction = 0.005;
const gravity = 0.005;

interface Snapshot {
  color: RGB;
}

export default class Player extends Component<void> {
  id?: number;
  vel: Vector2 = { x: 0, y: 0 };
  color!: RGB;
  spawn!: Vector2;
  state: 'spawning' | 'alive' | 'dead' = 'alive';

  init() {
    this.getComponent(TrailRenderer).trailColor = this.color;
    this.getComponent(BoxRenderer).fillStyle = `rgb(${this.color.join(',')})`;
  }

  update(dt: number) {
    if (!this.getComponent(NetworkedEntity).isHost) {
      return;
    }

    if (this.state !== 'alive') {
      return;
    }

    const host = this.getComponent(NetworkedEntity)
      .networking as NetworkingHost;
    const inputter = host.players.get(this.id!)!.inputter;

    let xDirection = 0;
    if (inputter.isKeyDown(Keys.rightArrow)) {
      xDirection += 1;
    }
    if (inputter.isKeyDown(Keys.leftArrow)) {
      xDirection -= 1;
    }

    this.move(dt, xDirection);
  }

  private move(dt: number, xDirection: number) {
    const phys = this.getComponent(Physical);

    if (Math.abs(this.vel.x) > topSpeed) {
      // should be just enough to counteract friction
      xDirection = 0;
    }

    this.vel = {
      x: this.vel.x + xDirection * playerAccel * dt,
      y: this.vel.y + gravity * dt,
    };

    if (this.vel.x > 0) {
      const x = this.vel.x - friction * dt;
      this.vel = {
        x: x < 0 ? 0 : x,
        y: this.vel.y,
      };
    } else if (this.vel.x < 0) {
      const x = this.vel.x + friction * dt;
      this.vel = {
        x: x > 0 ? 0 : x,
        y: this.vel.y,
      };
    }

    const collisions = this.getComponent(KinematicBody).moveAndSlide(this.vel);
    const platformCollisions = collisions.filter(
      (collision) =>
        !collision.collider.isTrigger && collision.entity.hasTag(Tag.Platform)
    );
    // we only will try to handle the first collision; managing multiple is
    // kinda undefined territory (which do you bounce off, etc...)
    const collision = platformCollisions[0];

    if (collision) {
      this.respondToCollision(collision);
    }
  }

  private respondToCollision(collision: CollisionInformation) {
    const { x, y } = collision.response.overlapVector;

    if (this.vel.y > 0 && y > 0) {
      // we hit ground, so bounce
      const overlap = collision.response.overlapVector;
      const normal = V.multiply(overlap, -1);
      this.vel = V.multiply(V.unit(normal), bounceImpulse);
    } else if (this.vel.y < 0 && y < 0) {
      // bumping into ceiling
      this.vel = { x: this.vel.x, y: 0 };
    }
  }

  private die() {
    this.getComponent(BoxCollider).isEnabled = false;
    this.vel = { x: 0, y: 0 };
    this.state = 'dead';
    this.rpcAnimateDie();
  }

  private respawn() {
    this.getComponent(Physical).center = this.spawn;
    this.state = 'spawning';
    this.rpcAnimateSpawn();
  }

  private rpcAnimateSpawn() {
    if (this.getComponent(NetworkedEntity).isHost) {
      this.getComponent(SpawningDyingRenderer).spawn(() => {
        this.state = 'alive';
        this.getComponent(BoxCollider).isEnabled = true;
      });
    } else {
      this.getComponent(SpawningDyingRenderer).spawn();
    }
  }

  private rpcAnimateDie() {
    if (this.getComponent(NetworkedEntity).isHost) {
      this.getComponent(SpawningDyingRenderer).die(() => {
        this.respawn();
      });
    } else {
      this.getComponent(SpawningDyingRenderer).die();
    }
  }

  serialize(): Snapshot {
    return {
      color: this.color,
    };
  }

  deserialize(snapshot: Snapshot) {
    this.color = snapshot.color;
  }

  onCollision(collision: CollisionInformation) {
    if (collision.entity.hasTag(Tag.Player)) {
      const y = collision.response.overlapVector.y;
      if (y < 0) {
        // got bonked :(
        this.die();
      }
    }
  }
}
