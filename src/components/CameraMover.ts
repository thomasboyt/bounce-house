import { Component, VectorMaths as V, Vector2, Maths } from 'pearl';
const { lerp } = Maths;

export default class CameraMover extends Component<void> {
  followCenter!: Vector2;
  targetCenter!: Vector2;

  // distance from center of the screen the player has to be at for the camera
  // to move
  windowEdges = {
    topPadding: 20,
    bottomPadding: 80,
  };

  yMaximum?: number;

  init() {
    this.followCenter = this.pearl.renderer.getViewCenter();
    this.targetCenter = this.followCenter;
  }

  moveCamera(followCenter: Vector2) {
    this.followCenter = followCenter;
  }

  update(dt: number) {
    const viewSize = this.pearl.renderer.getViewSize();
    const viewCenter = this.pearl.renderer.getViewCenter();
    const { followCenter, windowEdges } = this;

    const relViewportY = followCenter.y - (viewCenter.y - viewSize.y / 2);

    if (relViewportY > viewSize.y - windowEdges.bottomPadding) {
      this.targetCenter = V.add(this.targetCenter, {
        x: 0,
        y: relViewportY - (viewSize.y - windowEdges.bottomPadding),
      });
    } else if (relViewportY < windowEdges.topPadding) {
      this.targetCenter = V.add(this.targetCenter, {
        x: 0,
        y: relViewportY - windowEdges.topPadding,
      });
    }

    const bottomViewportEdge = this.targetCenter.y + viewSize.y / 2;
    if (this.yMaximum !== undefined && bottomViewportEdge > this.yMaximum) {
      this.targetCenter = V.subtract(this.targetCenter, {
        x: 0,
        y: bottomViewportEdge - this.yMaximum,
      });
    }

    this.pearl.renderer.setViewCenter(this.targetCenter);
  }
}
