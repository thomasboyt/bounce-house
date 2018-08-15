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
const minimumBounce = 0.25;
const maximumBounce = 0.4;

/** Horizontal speed at which player can no longer accelerate */
const topSpeed = 0.1;
/** Horizontal acceleration on input */
const playerAccel = 0.002;
/** Horizontal air friction */
const friction = 0.0003;

const gravity = 0.0003;
const slamGravity = 0.0003;
const bounceCoefficient = 0.85;

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

    this.move(dt, xDirection, inputter.isKeyDown(Keys.space));
  }

  private move(dt: number, xDirection: number, slam: boolean) {
    let slamBoost = 0;
    if (slam && this.vel.y > 0) {
      slamBoost = slamGravity;
      this.getComponent(TrailRenderer).trailColor = [255, 255, 255];
    } else {
      this.getComponent(TrailRenderer).trailColor = this.color;
    }

    const accel = {
      x: xDirection * (Math.abs(this.vel.x) > topSpeed ? 0 : playerAccel),
      y: gravity + slamBoost,
    };

    this.vel = V.add(this.vel, V.multiply(accel, dt));

    // apply horizontal friction
    //
    // TODO: there should be a better way to do this? basically need to ensure
    // friction causes velocity to go to zero, not negate...
    if (this.vel.x > 0) {
      const xVelocityWithFriction = this.vel.x - friction * dt;
      this.vel = {
        x: xVelocityWithFriction < 0 ? 0 : xVelocityWithFriction,
        y: this.vel.y,
      };
    } else if (this.vel.x < 0) {
      const xVelocityWithFriction = this.vel.x + friction * dt;
      this.vel = {
        x: xVelocityWithFriction > 0 ? 0 : xVelocityWithFriction,
        y: this.vel.y,
      };
    }

    const collisions = this.getComponent(KinematicBody).moveAndSlide(
      V.multiply(this.vel, dt)
    );

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

      const scaledBounce = this.vel.y * bounceCoefficient;
      const impulse = Math.min(
        Math.max(scaledBounce, minimumBounce),
        maximumBounce
      );

      this.vel = V.multiply(V.unit(normal), impulse);
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
