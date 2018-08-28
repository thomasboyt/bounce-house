import {
  Component,
  Maths,
  Physical,
  VectorMaths as V,
  Keys,
  Vector2,
} from 'pearl';
const { clamp, lerp, radiansToDegrees } = Maths;
import { NetworkedComponent, NetworkedEntity } from 'pearl-networking';
import Player from './Player';

interface Snapshot {
  throwCharge: number;
}

/**
 * TODO:
 *
 * This component is currently a networked component that gets its state from
 * the host. However, eventually, this should be refactored to be a component
 * that only runs logic on the local player, and sends a throw to the server as
 * a _command_.
 */
export default class PlayerThrow extends Component<void>
  implements NetworkedComponent<Snapshot> {
  private isThrowCharging = false;
  private throwCharge = 0;
  private throwChargeCurrentMs = 0;
  private throwChargeMaxMs = 500;

  update(dt: number) {
    if (!this.getComponent(NetworkedEntity).isHost) {
      return;
    }

    const player = this.getComponent(Player);

    if (!player.heldBall) {
      return;
    }

    const inputter = player.getInputter();
    const throwKeyDown = inputter.isKeyDown(Keys.z);

    if (this.isThrowCharging) {
      if (throwKeyDown) {
        this.throwChargeCurrentMs += dt;
        // continue charging
        this.throwCharge = clamp(
          lerp(0.3, 1, this.throwChargeCurrentMs / this.throwChargeMaxMs),
          1
        );
      } else {
        // throw
        player.throwBall(this.getBallVector());
        this.isThrowCharging = false;
        this.throwCharge = 0;
      }
    } else {
      if (throwKeyDown) {
        // start charging
        this.isThrowCharging = true;
        this.throwCharge = 0;
        this.throwChargeCurrentMs = 0;
      }
    }
  }

  private getBallVector(): Vector2 {
    const player = this.getComponent(Player);

    // let direction = { x: 0, y: -1 };
    // so the initial angle is always straight out in facing direction:
    const xDirection = player.vel.x > 0 ? 1 : -1;

    // then, the angle of throw is based on your current y velocity. we want to
    // represent the "peak" of a jump here, so basically, rotated up the closer
    // you are to 0, rotated down the further away you are. also this doesn't
    // take into account change of speed not based on jump arc which... could be
    // rough idk
    const zeroAngle = radiansToDegrees(-45);
    const yDirection = V.fromAngle(zeroAngle).y;
    const scaledCharge = this.throwCharge * 0.2;

    return V.add(
      player.vel,
      V.multiply({ x: xDirection, y: yDirection }, scaledCharge)
    );
  }

  serialize(): Snapshot {
    return {
      throwCharge: this.throwCharge,
    };
  }

  deserialize(snapshot: Snapshot) {
    this.throwCharge = snapshot.throwCharge;
  }

  render(ctx: CanvasRenderingContext2D) {
    const player = this.getComponent(Player);
    if (!player.heldBall) {
      return;
    }

    if (
      player.id! !== this.getComponent(NetworkedEntity).networking.clientId!
    ) {
      return;
    }

    const phys = this.getComponent(Physical);
    const direction = this.getBallVector();
    ctx.translate(phys.center.x, phys.center.y);
    ctx.rotate(V.toAngle(direction));
    ctx.translate(10, 0);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, -2.5, 10 * 5 * V.magnitude(direction), 5);
  }
}
