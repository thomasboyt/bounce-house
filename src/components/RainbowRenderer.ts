import {
  Component,
  PolygonCollider,
  BoxCollider,
  Physical,
  VectorMaths as V,
} from 'pearl';

export default class RainbowRenderer extends Component<void> {
  offset = 0;

  update(dt: number) {
    // this.offset += dt * 0.05;
  }

  render(ctx: CanvasRenderingContext2D) {
    const poly =
      this.entity.maybeGetComponent(PolygonCollider) ||
      this.entity.maybeGetComponent(BoxCollider);

    if (!poly) {
      throw new Error('missing polygon or box collider on RainbowRenderer');
    }

    const phys = this.getComponent(Physical);

    const points = poly.getCollisionShape().points;

    const boundingBox = poly.getBounds();
    const rotatedBB = {
      min: V.rotate({ x: boundingBox.xMin, y: boundingBox.yMin }, phys.angle),
      max: V.rotate({ x: boundingBox.xMax, y: boundingBox.yMax }, phys.angle),
    };

    const lineStroke = this.createRainbowLine(
      ctx,
      rotatedBB.min.x,
      rotatedBB.min.y,
      rotatedBB.max.x,
      rotatedBB.max.y
    );

    ctx.strokeStyle = lineStroke;

    ctx.save();

    ctx.translate(phys.center.x, phys.center.y);
    ctx.rotate(phys.angle);

    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let point of [...points.slice(1), points[0]]) {
      ctx.lineTo(point[0], point[1]);
    }
    ctx.closePath();
    ctx.restore();

    ctx.stroke();
  }

  private createRainbowLine(
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number
  ): CanvasGradient {
    const colors = [
      '#ff7272', // red
      '#ffca78', // orange
      '#fdff58', // yellow
      '#99ff2d', // green
      '#31ffdc', // blue
    ];

    const duplicatedColors = [...colors, ...colors, colors[0]];

    const lineLength = V.length({
      x: x1 - x0,
      y: y1 - y0,
    });

    const offset = V.multiply(
      V.unit({ x: x0, y: y0 }),
      -(this.offset % lineLength)
    );

    const startWithOffset = V.subtract({ x: x0, y: y0 }, offset);
    const endWithOffset = V.subtract(
      V.add({ x: x1, y: y1 }, { x: x1 - x0, y: y1 - y0 }),
      offset
    );

    const gradient = ctx.createLinearGradient(
      startWithOffset.x,
      startWithOffset.y,
      endWithOffset.x,
      endWithOffset.y
    );

    for (let i = 0; i < duplicatedColors.length; i += 1) {
      gradient.addColorStop(
        i / (duplicatedColors.length - 1),
        duplicatedColors[i]
      );
    }

    return gradient;
  }
}
