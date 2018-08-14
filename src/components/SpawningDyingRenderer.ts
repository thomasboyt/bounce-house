import {
  Component,
  AnimationManager,
  Physical,
  Maths,
  VectorMaths as V,
  BoxCollider,
  BoxRenderer,
} from 'pearl';

interface Pixel {
  startX: number;
  startY: number;
  destX: number;
  destY: number;
}

const SPAWN_TIME_MS = 1000;
const DIE_TIME_MS = 1000;

function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

type RGBA = [number, number, number, number];
function colorStyleToRGBA(color: string): RGBA {
  const canvas = document.createElement('canvas');
  canvas.height = 1;
  canvas.width = 1;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const data = ctx.getImageData(0, 0, 1, 1).data;
  return [...data] as RGBA;
}

export default class SpawningDyingRenderer extends Component<null> {
  private _state: 'spawning' | 'dying' | null = null;
  private _timeElapsedMs = 0;
  private _targetTimeMs = 0;

  private _pixels: Pixel[] = [];
  private _color?: RGBA;
  private _onFinishCb?: () => void;

  spawn(cb?: () => void) {
    this._state = 'spawning';
    this._onFinishCb = cb;
    this.startAnimation(SPAWN_TIME_MS);
  }

  die(cb?: () => void) {
    this._state = 'dying';
    this._onFinishCb = cb;
    this.startAnimation(DIE_TIME_MS);
  }

  private startAnimation(targetTime: number) {
    this.isVisible = true;
    this._timeElapsedMs = 0;
    this._targetTimeMs = targetTime;
    this._pixels = [];

    const box = this.getComponent(BoxCollider);
    const { width, height } = box;

    const renderer = this.getComponent(BoxRenderer);
    renderer.isVisible = false;

    this._color = colorStyleToRGBA(renderer.fillStyle!);

    for (let pixelX = 0; pixelX < width; pixelX += 1) {
      for (let pixelY = 0; pixelY < height; pixelY += 1) {
        const center = { x: width / 2, y: height / 2 };
        const vector = {
          x: pixelX - center.x,
          y: pixelY - center.y,
        };

        const angleFromCenter = Math.atan2(vector.y, vector.x);
        const len = getRandomInt(15, 25);
        const startPoint = V.multiply(V.fromAngle(angleFromCenter), len);
        this._pixels.push({
          startX: startPoint.x,
          startY: startPoint.y,
          destX: pixelX,
          destY: pixelY,
        });
      }
    }
  }

  update(dt: number) {
    if (!this._state) {
      return;
    }

    this._timeElapsedMs += dt;

    if (this._timeElapsedMs > this._targetTimeMs) {
      this._onFinish();
    }
  }

  private _onFinish() {
    if (this._state === 'spawning') {
      this.getComponent(BoxRenderer).isVisible = true;
    }

    this._state = null;
    this.isVisible = false;

    if (this._onFinishCb) {
      this._onFinishCb();
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    const phys = this.getComponent(Physical);
    const { center, angle } = phys;

    ctx.translate(center.x, center.y);
    ctx.rotate(angle);

    const { width, height } = this.getComponent(BoxCollider);

    for (let pixel of this._pixels) {
      let f = this._timeElapsedMs / this._targetTimeMs;

      if (this._state === 'dying') {
        f = 1 - f;
      }

      const x = Maths.lerp(pixel.startX, pixel.destX - width / 2, f);
      const y = Maths.lerp(pixel.startY, pixel.destY - height / 2, f);
      const color = this._color!;
      ctx.fillStyle = `rgba(${[color[0], color[1], color[2], f].join(',')})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
}
