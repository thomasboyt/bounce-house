import {
  Component,
  KinematicBody,
  Vector2,
  CollisionInformation,
  VectorMaths as V,
} from 'pearl';
import { NetworkedEntity, NetworkedComponent } from 'pearl-networking';
import { Tag } from '../types';

const gravity = 0.0003;

export default class Ball extends Component<void> {
  vel: Vector2 = { x: 0, y: -0.1 };

  get isAttachedToPlayer() {
    return this.entity.parent && this.entity.parent.hasTag(Tag.Player);
  }

  update(dt: number) {
    const networking = this.getComponent(NetworkedEntity).networking;

    if (this.getComponent(NetworkedEntity).isHost) {
      this.updateHost(dt);
    }
  }

  private updateHost(dt: number) {
    if (this.isAttachedToPlayer) {
      return;
    }

    this.move(dt);
  }

  private move(dt: number) {
    const accel = {
      x: 0,
      y: gravity,
    };

    this.vel = V.add(this.vel, V.multiply(accel, dt));

    const collisions = this.getComponent(KinematicBody).moveAndSlide(
      V.multiply(this.vel, dt)
    );

    const platformCollisions = collisions.filter(
      (collision) =>
        !collision.collider.isTrigger && collision.entity.hasTag(Tag.Platform)
    );

    this.handlePlatformCollisions(platformCollisions);
  }

  private handlePlatformCollisions(platformCollisions: CollisionInformation[]) {
    const bounceableCollision = platformCollisions.find(
      (collision) => Math.abs(collision.response.overlap) > 0
    );

    if (bounceableCollision) {
      this.bounce(bounceableCollision);
    }
  }

  private bounce(collision: CollisionInformation) {
    const overlap = collision.response.overlapVector;
    const normal = V.multiply(overlap, -1);
    this.vel = V.reflect(this.vel, normal);
  }
}
