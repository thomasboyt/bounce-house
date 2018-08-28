import {
  Component,
  Physical,
  Vector2,
  BoxCollider,
  Maths,
  VectorMaths as V,
} from 'pearl';
import { RGB } from '../types';

export default class TrailRenderer extends Component<void> {
  trailLength = 15;
  trailWidth = 10;
  trailColor: RGB = [255, 255, 255];

  private trail: Vector2[] = [];
  private visibleTrailLength = 0;
  private lastCenter!: Vector2;

  init() {
    this.lastCenter = this.getComponent(Physical).center;
  }

  update() {
    const phys = this.getComponent(Physical);

    const diff = Math.abs(
      V.magnitude(V.subtract(phys.center, this.lastCenter))
    );

    this.visibleTrailLength = Math.round(Maths.lerp(0, 20, diff / 5));

    this.trail.push(phys.center);
    if (this.trail.length > this.trailLength) {
      this.trail.shift();
    }

    this.lastCenter = phys.center;
  }

  render(ctx: CanvasRenderingContext2D) {
    if (this.visibleTrailLength < 2) {
      return;
    }

    const trail = this.trail.slice(-this.visibleTrailLength);
    const trailStart = trail[0];
    const trailEnd = trail[trail.length - 1];

    ctx.lineWidth = this.trailWidth;
    ctx.lineJoin = 'bevel';
    ctx.lineCap = 'round';

    for (let idx = 1; idx < trail.length; idx += 1) {
      const startPoint = trail[idx - 1];
      const endPoint = trail[idx];

      const grd = ctx.createLinearGradient(
        startPoint.x,
        startPoint.y,
        endPoint.x,
        endPoint.y
      );
      const color = this.trailColor.join(',');
      grd.addColorStop(
        0,
        `rgba(${color}, ${(idx / (trail.length + 1)) * 0.25})`
      );
      grd.addColorStop(1, `rgba(${color}, ${(idx / trail.length) * 0.25})`);
      ctx.strokeStyle = grd;

      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(endPoint.x, endPoint.y);
      ctx.stroke();
    }
  }
}
