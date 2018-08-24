import { Component } from 'pearl';

import Session from './Session';
import Player from './Player';
import { Tag } from '../types';

export default class UI extends Component<void> {
  render(ctx: CanvasRenderingContext2D) {
    const players = this.pearl.entities.all(Tag.Player);

    const viewCenter = this.pearl.renderer.getViewCenter();
    const viewSize = this.pearl.renderer.getViewSize();
    ctx.translate(viewCenter.x - viewSize.x / 2, viewCenter.y - viewSize.y / 2);

    ctx.font = '16px monospace';
    ctx.textAlign = 'center';

    for (let playerEntity of players) {
      const player = playerEntity.getComponent(Player);
      const { slotPosition, color } = player;
      // TODO: I dunno if this is actually centered
      const x = slotPosition * 80 + 40;
      const y = 20;

      const score = player.score;
      ctx.fillStyle = `rgba(${color.join(',')})`;
      ctx.fillText(`${score}`, x, y);
    }
  }
}
