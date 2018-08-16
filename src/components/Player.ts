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
const maximumBounce = 0.35;

/** Horizontal speed at which player can no longer accelerate */
const topSpeed = 0.1;
/** Horizontal acceleration on input */
const playerAccel = 0.002;
/** Horizontal air friction */
const friction = 0.0003;

const gravity = 0.0003;
const bounceCoefficient = 0.85;
const slamBoost = 0.1;

interface Snapshot {
  color: RGB;
}

export default class Player extends Component<void> {
  id?: string;
  vel: Vector2 = { x: 0, y: 0 };
  color!: RGB;
  spawn!: Vector2;
  state: 'spawning' | 'alive' | 'dead' = 'alive';
  isSlamming: boolean = false;
  currentSlamBoost = 0;

  get velWithBoost() {
    return V.add(this.vel, {
      x: 0,
      y: this.currentSlamBoost,
    });
  }

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
    if (inputter.isKeyPressed(Keys.space)) {
      this.slam();
    }

    this.move(dt, xDirection);
  }

  private slam() {
    if (this.isSlamming || !(this.vel.y > 0)) {
      return;
    }

    this.isSlamming = true;
    this.currentSlamBoost = slamBoost;

    this.runCoroutine(function*(this: Player) {
      yield this.pearl.async.waitMs(200);
      this.isSlamming = false;
      this.currentSlamBoost = 0;
    });
  }

  private move(dt: number, xDirection: number) {
    const accel = {
      x: xDirection * (Math.abs(this.vel.x) > topSpeed ? 0 : playerAccel),
      y: gravity,
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
      V.multiply(this.velWithBoost, dt)
    );

    const platformCollisions = collisions.filter(
      (collision) =>
        !collision.collider.isTrigger && collision.entity.hasTag(Tag.Platform)
    );

    this.handlePlatformCollisions(platformCollisions);
  }

  private handlePlatformCollisions(platformCollisions: CollisionInformation[]) {
    if (this.vel.y > 0) {
      const bounceableCollision = platformCollisions.find(
        (collision) => collision.response.overlapVector.y > 0
      );

      if (bounceableCollision) {
        this.bounce(bounceableCollision);
      }
    } else if (this.vel.y < 0) {
      const overheadCollision = platformCollisions.some(
        (collision) => collision.response.overlapVector.y < 0
      );

      if (overheadCollision) {
        this.vel = { x: this.vel.x, y: 0 };
      }
    }
  }

  private bounce(collision: CollisionInformation) {
    const overlap = collision.response.overlapVector;
    const normal = V.multiply(overlap, -1);

    const scaledBounce = this.velWithBoost.y * bounceCoefficient;
    const impulse = Math.min(
      Math.max(scaledBounce, minimumBounce),
      maximumBounce
    );

    this.vel = V.multiply(V.unit(normal), impulse);
    this.isSlamming = false;
    this.currentSlamBoost = 0;
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
