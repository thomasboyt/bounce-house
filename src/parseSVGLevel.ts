import { Vector2 } from 'pearl';

interface BaseShape {
  type: string;
  center: Vector2;
  angle: number;
}

export interface RectangleLevelShape extends BaseShape {
  type: 'rectangle';
  size: Vector2;
}

export interface PolygonLevelShape extends BaseShape {
  type: 'polygon';
  center: Vector2;
  localPoints: [number, number][];
}

export type LevelShape = RectangleLevelShape | PolygonLevelShape;

function parseSVGAnimatedLength(len: SVGAnimatedLength): number {
  if (len.baseVal.unitType !== len.baseVal.SVG_LENGTHTYPE_NUMBER) {
    throw new Error(
      `unrecognized unit type for SVGAnimatedLength: ${
        len.baseVal.valueAsString
      }`
    );
  }

  return len.baseVal.valueInSpecifiedUnits;
}

interface SVGList<T> {
  numberOfItems: number;
  getItem(idx: number): T;
}

function svgListToArray<T>(list: SVGList<T>): T[] {
  const arr: T[] = [];
  for (let i = 0; i < list.numberOfItems; i += 1) {
    arr.push(list.getItem(i));
  }
  return arr;
}

function parseRotation(el: SVGGraphicsElement): number {
  const transforms = el.transform.baseVal;
  return svgListToArray(transforms).reduce(
    (acc, transform) => acc + transform.angle,
    0
  );
}

function getBoundingBoxForPoints(
  points: Vector2[]
): { min: Vector2; max: Vector2 } {
  const min = { x: points[0].x, y: points[1].y };
  const max = { x: points[0].x, y: points[1].y };

  for (let point of points) {
    min.x = Math.min(min.x, point.x);
    min.y = Math.min(min.y, point.y);
    max.x = Math.max(max.x, point.x);
    max.y = Math.max(max.y, point.y);
  }

  return { min, max };
}

export default function parseSVGLevel(svgDocument: string): LevelShape[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgDocument, 'image/svg+xml');

  const groupId = 'Level';

  const level = doc.getElementById(groupId) as SVGElement | null;

  if (!level) {
    throw new Error(`no group found with id '${groupId}'`);
  }

  const shapes: LevelShape[] = [];
  for (let el of level.children) {
    const svgEl = el as SVGElement;
    if (svgEl.tagName === 'rect') {
      const rect = svgEl as SVGRectElement;
      const x = parseSVGAnimatedLength(rect.x);
      const y = parseSVGAnimatedLength(rect.y);
      const width = parseSVGAnimatedLength(rect.width);
      const height = parseSVGAnimatedLength(rect.height);

      const shape: RectangleLevelShape = {
        type: 'rectangle',
        center: {
          x: x + width / 2,
          y: y + height / 2,
        },
        size: {
          x: width,
          y: height,
        },
        angle: parseRotation(rect),
      };
      shapes.push(shape);
    } else if (svgEl.tagName === 'polygon') {
      const polygon = svgEl as SVGPolygonElement;

      const svgPoints = polygon.points;
      const worldPoints: Vector2[] = [];

      for (let i = 0; i < svgPoints.numberOfItems; i += 1) {
        const point = svgPoints.getItem(i);
        worldPoints.push({ x: point.x, y: point.y });
      }

      const box = getBoundingBoxForPoints(worldPoints);
      const center = {
        x: (box.min.x + box.max.x) / 2,
        y: (box.min.y + box.max.y) / 2,
      };

      const localPoints: [number, number][] = worldPoints.map(
        (point) => [point.x - center.x, point.y - center.y] as [number, number]
      );

      shapes.push({
        type: 'polygon',
        localPoints,
        center,
        angle: parseRotation(polygon),
      });
    } else {
      throw new Error(`unrecognized svg element: ${svgEl.tagName}`);
    }
  }

  console.log(shapes);
  return shapes;
}
