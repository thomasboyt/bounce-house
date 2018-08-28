import { Component, VectorMaths as V, Vector2, Maths } from 'pearl';
const { lerp, clamp } = Maths;

export default class CameraMover extends Component<void> {
  followCenter!: Vector2;
  targetCenter!: Vector2;

  // distance from center of the screen the player has to be at for the camera
  // to move
  windowPadding = {
    top: 20,
    bottom: 80,
    left: 60,
    right: 60,
  };

  // don't move past edges of world
  // (assumes world is positioned at 0, 0)
  private worldSize?: Vector2;

  init() {
    this.followCenter = this.pearl.renderer.getViewCenter();
    this.targetCenter = this.followCenter;
  }

  setWorldSize(worldSize: Vector2) {
    this.worldSize = worldSize;
  }

  moveCamera(followCenter: Vector2) {
    this.followCenter = followCenter;
  }

  update(dt: number) {
    const viewSize = this.pearl.renderer.getViewSize();
    const viewCenter = this.pearl.renderer.getViewCenter();
    const { followCenter, windowPadding } = this;

    const windowEdges = {
      top: viewCenter.y - viewSize.y / 2 + windowPadding.top,
      bottom: viewCenter.y + viewSize.y / 2 - windowPadding.bottom,
      left: viewCenter.x - viewSize.x / 2 + windowPadding.left,
      right: viewCenter.x + viewSize.x / 2 - windowPadding.right,
    };

    if (followCenter.x < windowEdges.left) {
      this.targetCenter = V.add(this.targetCenter, {
        x: followCenter.x - windowEdges.left,
        y: 0,
      });
    } else if (followCenter.x > windowEdges.right) {
      this.targetCenter = V.add(this.targetCenter, {
        x: followCenter.x - windowEdges.right,
        y: 0,
      });
    }

    if (followCenter.y < windowEdges.top) {
      this.targetCenter = V.add(this.targetCenter, {
        x: 0,
        y: followCenter.y - windowEdges.top,
      });
    } else if (followCenter.y > windowEdges.bottom) {
      this.targetCenter = V.add(this.targetCenter, {
        x: 0,
        y: followCenter.y - windowEdges.bottom,
      });
    }

    if (this.worldSize) {
      this.targetCenter = {
        x: clamp(
          this.targetCenter.x,
          viewSize.x / 2,
          this.worldSize.x - viewSize.x / 2
        ),
        // no lower bound because we can bounce above world size
        y: clamp(this.targetCenter.y, this.worldSize.y - viewSize.y / 2),
      };
    }

    this.pearl.renderer.setViewCenter(this.targetCenter);
  }
}
