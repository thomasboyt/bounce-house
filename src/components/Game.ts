import {
  Component,
  Physical,
  BoxCollider,
  Entity,
  BoxRenderer,
  Maths,
  Vector2,
} from 'pearl';
import {
  NetworkingClient,
  NetworkingHost,
  NetworkedPhysical,
} from 'pearl-networking';

import Player from './Player';
import { Tag, ZIndex, RGB } from '../types';
import showRoomCode from '../showRoomCode';
import levels, { Level, Platform } from '../levels';
import Session from './Session';

const groovejetUrl = process.env.LOBBY_SERVER || 'localhost:3000';

interface Opts {
  isHost: boolean;
  roomCode?: string;
}

export default class Game extends Component<Opts> {
  isHost!: boolean;

  init(opts: Opts) {
    this.isHost = opts.isHost;

    if (opts.isHost) {
      this.runCoroutine(this.initializeHost());
    } else {
      this.runCoroutine(this.initializeClient(opts.roomCode!));
    }
  }

  private *initializeHost() {
    const host = this.getComponent(NetworkingHost);
    const roomCode = yield host.connect(groovejetUrl);

    showRoomCode(roomCode);

    const session = host.createNetworkedPrefab('session').getComponent(Session);

    host.onPlayerAdded.add(({ networkingPlayer }) => {
      session.addPlayer(networkingPlayer.id);
    });

    host.onPlayerRemoved.add(({ networkingPlayer }) => {
      session.addPlayer(networkingPlayer.id);
    });

    host.addLocalPlayer();
    session.rpcLoadLevel(1);
  }

  private *initializeClient(roomCode: string) {
    yield this.getComponent(NetworkingClient).connect({
      groovejetUrl,
      roomCode,
    });
    showRoomCode(roomCode);
  }

  render(ctx: CanvasRenderingContext2D) {
    const size = this.pearl.renderer.getViewSize();

    ctx.font = '12px monospace';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';

    if (this.isHost) {
      const host = this.getComponent(NetworkingHost);
      if (host.connectionState === 'connecting') {
        ctx.fillText('connecting to lobby...', size.x / 2, size.y / 2);
      }
    } else {
      const client = this.getComponent(NetworkingClient);

      if (client.connectionState === 'connecting') {
        ctx.fillText('connecting', size.x / 2, size.y / 2);
      } else if (client.connectionState === 'error') {
        ctx.fillText('connection error:', size.x / 2, size.y / 2);
        ctx.fillText(client.errorReason!, size.x / 2, size.y / 2 + 20);
      } else if (client.connectionState === 'closed') {
        ctx.fillText('connection closed', size.x / 2, size.y / 2);
      }
    }
  }
}
