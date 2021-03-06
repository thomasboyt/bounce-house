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

export interface ParsedLevel {
  platforms: LevelShape[];
  size: Vector2;
}

function parseSVGAnimatedLength(len: SVGAnimatedLength): number {
  const allowedUnits = new Set([
    len.baseVal.SVG_LENGTHTYPE_NUMBER,
    len.baseVal.SVG_LENGTHTYPE_PX,
  ]);
  if (!allowedUnits.has(len.baseVal.unitType)) {
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

// TODO: support rotating around a non-center point?
function parseRotation(el: SVGGraphicsElement): number {
  const rotates = svgListToArray(el.transform.baseVal).filter(
    (transform) => transform.type === transform.SVG_TRANSFORM_ROTATE
  );
  return rotates.reduce((acc, transform) => acc + transform.angle, 0);
}

function parseScale(el: SVGGraphicsElement): Vector2 {
  const transforms = el.transform.baseVal;
  const scales = svgListToArray(el.transform.baseVal).filter(
    (transform) => transform.type === transform.SVG_TRANSFORM_SCALE
  );
  return scales.reduce(
    (acc, transform) => {
      return {
        x: acc.x * transform.matrix.a,
        y: acc.y * transform.matrix.d,
      };
    },
    { x: 1, y: 1 }
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

export default function parseSVGLevel(svgDocument: string): ParsedLevel {
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

      const scale = parseScale(polygon);

      const localPoints: [number, number][] = worldPoints
        .map(
          (point) =>
            [point.x - center.x, point.y - center.y] as [number, number]
        )
        .map(
          (point) =>
            [point[0] * scale.x, point[1] * scale.y] as [number, number]
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

  const width = parseSVGAnimatedLength(doc.rootElement.width);
  const height = parseSVGAnimatedLength(doc.rootElement.height);

  return {
    platforms: shapes,
    size: {
      x: width,
      y: height,
    },
  };
}
