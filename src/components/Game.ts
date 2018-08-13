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
import { Tag, ZIndex } from '../types';
import showRoomCode from '../showRoomCode';

interface Opts {
  isHost: boolean;
  roomCode?: string;
}

const groovejetUrl = process.env.LOBBY_SERVER || 'localhost:3000';

export default class Game extends Component<Opts> {
  isHost!: boolean;

  init(opts: Opts) {
    this.isHost = opts.isHost;

    if (opts.isHost) {
      this.runCoroutine(this.initializeHost());
    } else {
      this.runCoroutine(this.initializeClient(opts.roomCode!));
    }

    this.createWorld();
  }

  private *initializeHost() {
    const host = this.getComponent(NetworkingHost);
    const roomCode = yield host.connect(groovejetUrl);

    showRoomCode(roomCode);

    host.onPlayerAdded.add(({ networkingPlayer }) => {
      const id = networkingPlayer.id;
      const player = host.createNetworkedPrefab('player');
      player.getComponent(Player).id = id;

      player.getComponent(Physical).center = {
        x: 10,
        y: 10,
      };
    });

    host.onPlayerRemoved.add(({ networkingPlayer }) => {
      const id = networkingPlayer.id;
      const players = this.pearl.entities.all(Tag.Player);
      for (let player of players) {
        if (player.getComponent(Player).id === id) {
          this.pearl.entities.destroy(player);
        }
      }
    });

    host.addLocalPlayer();
  }

  private *initializeClient(roomCode: string) {
    yield this.getComponent(NetworkingClient).connect({
      groovejetUrl,
      roomCode,
    });
    showRoomCode(roomCode);
  }

  private createWorld() {
    const worldSize = this.pearl.renderer.getViewSize();

    this.createPlatform({
      center: {
        x: worldSize.x / 2,
        y: worldSize.y - 10,
      },
      size: {
        x: worldSize.x,
        y: 20,
      },
    });

    this.createPlatform({
      center: {
        x: 120,
        y: worldSize.y - 80,
      },
      size: {
        x: 40,
        y: 20,
      },
      angle: Maths.degreesToRadians(45),
    });

    this.createPlatform({
      center: {
        x: worldSize.x - 120,
        y: worldSize.y - 120,
      },
      size: {
        x: 40,
        y: 20,
      },
      angle: Maths.degreesToRadians(-45),
    });

    this.createPlatform({
      center: {
        x: 120,
        y: worldSize.y - 160,
      },
      size: {
        x: 40,
        y: 20,
      },
      angle: Maths.degreesToRadians(45),
    });

    this.createPlatform({
      center: {
        x: worldSize.x - 120,
        y: worldSize.y - 200,
      },
      size: {
        x: 40,
        y: 20,
      },
    });
  }

  private createPlatform({
    center,
    size,
    angle = 0,
  }: {
    center: Vector2;
    size: Vector2;
    angle?: number;
  }) {
    this.pearl.entities.add(
      new Entity({
        name: 'platform',
        components: [
          new Physical({ center, angle }),
          new BoxCollider({
            width: size.x,
            height: size.y,
          }),
          new BoxRenderer({
            strokeStyle: 'white',
          }),
        ],
      })
    );
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
