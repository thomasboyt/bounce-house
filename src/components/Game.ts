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
  GroovejetError,
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
  roomCode?: string;

  create(opts: Opts) {
    this.isHost = opts.isHost;
    this.roomCode = opts.roomCode;
  }

  init() {
    if (this.isHost) {
      this.runCoroutine(this.initializeHost());
    } else {
      this.runCoroutine(this.initializeClient(this.roomCode!));
    }
  }

  private *initializeHost() {
    const host = this.getComponent(NetworkingHost);

    let roomCode;
    try {
      roomCode = yield host.connect(groovejetUrl);
    } catch (err) {
      if (!(err instanceof GroovejetError)) {
        throw err;
      }
      return;
    }

    showRoomCode(roomCode);

    const session = host.createNetworkedPrefab('session').getComponent(Session);

    host.onPlayerAdded.add(({ networkingPlayer }) => {
      session.addPlayer(networkingPlayer.id);
    });

    host.onPlayerRemoved.add(({ networkingPlayer }) => {
      session.removePlayer(networkingPlayer.id);
    });

    host.addLocalPlayer();
  }

  private *initializeClient(roomCode: string) {
    try {
      yield this.getComponent(NetworkingClient).connect({
        groovejetUrl,
        roomCode,
      });
    } catch (err) {
      if (!(err instanceof GroovejetError)) {
        throw err;
      }
      return;
    }
    showRoomCode(roomCode);
  }

  render(ctx: CanvasRenderingContext2D) {
    const size = this.pearl.renderer.getViewSize();

    ctx.font = '12px monospace';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';

    const networking = (this.entity.maybeGetComponent(NetworkingHost) ||
      this.entity.maybeGetComponent(NetworkingClient))!;

    if (networking.connectionState === 'connecting') {
      ctx.fillText('connecting...', size.x / 2, size.y / 2);
    } else if (networking.connectionState === 'error') {
      ctx.fillText('connection error:', size.x / 2, size.y / 2);
      ctx.fillText(networking.errorReason!, size.x / 2, size.y / 2 + 20);
    } else if (networking.connectionState === 'closed') {
      ctx.fillText('connection closed', size.x / 2, size.y / 2);
    }
  }
}
