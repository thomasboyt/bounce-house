import {
  Component,
  Physical,
  Maths,
  Vector2,
  BoxRenderer,
  BoxCollider,
  Entity,
} from 'pearl';
import { NetworkedEntity, NetworkingHost } from 'pearl-networking';
import Player from './Player';
import { Tag, RGB } from '../types';
import levels, { Platform, Level } from '../levels';

const colors: RGB[] = [
  [0, 183, 235],
  [255, 0, 144],
  [255, 255, 0],
  [255, 255, 255],
];

class PlayerSlot {
  position: number;
  color: RGB;

  constructor(position: number, color: RGB) {
    this.position = position;
    this.color = color;
  }
}

const slots = [
  new PlayerSlot(0, colors[0]),
  new PlayerSlot(1, colors[1]),
  new PlayerSlot(2, colors[2]),
  new PlayerSlot(3, colors[3]),
];

const indexArray = (arr: any[]) => arr.map((item, idx) => idx);

class PlayerSlotManager {
  playerIdToSlotIdx = new Map<string, number>();
  slots: PlayerSlot[];

  constructor(slots: PlayerSlot[]) {
    this.slots = slots;
  }

  addPlayer(id: string): PlayerSlot {
    const takenSlotIndexes = [...this.playerIdToSlotIdx.values()];
    const availableSlotIndexes = indexArray(this.slots).filter(
      (index) => takenSlotIndexes.indexOf(index) === -1
    );
    const nextSlotIdx = availableSlotIndexes[0];

    if (nextSlotIdx === undefined) {
      throw new Error('cannot add player, no slots available');
    }

    this.playerIdToSlotIdx.set(id, nextSlotIdx);

    return this.slots[nextSlotIdx];
  }

  removePlayer(id: string) {
    this.playerIdToSlotIdx.delete(id);
  }
}

export default class Session extends Component<void> {
  playerSlotManager?: PlayerSlotManager;
  currentLevel?: Level;
  currentLevelIdx?: number;

  create() {
    if (this.getComponent(NetworkedEntity).isHost) {
      this.initializeHost();
    }
  }

  private initializeHost() {
    this.playerSlotManager = new PlayerSlotManager(slots);
  }

  addPlayer(id: string) {
    // XXX: This gets sent to all players, which is why rpcLoadLevel() has a
    // check to ignore it if it's the current level. In the future, may be
    // nice to send an RPC message to a specific client. Should be easier with
    // TypeScript allow checking of something like
    // `rpcToClient(this.rpcLoadLevel, [1])`

    // TODO: This may be ignored on clients if they haven't received the initial
    // snapshot containing Session yet!!
    this.rpcLoadLevel(1);

    const slot = this.playerSlotManager!.addPlayer(id);
    const { color, position } = slot;
    const spawn = this.currentLevel!.spawns[position];

    const player = this.pearl.root
      .getComponent(NetworkingHost)
      .createNetworkedPrefab('player');

    player.getComponent(Player).id = id;
    player.getComponent(Player).color = color;
    player.getComponent(Player).spawn = spawn;
    player.getComponent(Physical).center = spawn;
  }

  removePlayer(id: string) {
    const players = this.pearl.entities.all(Tag.Player);
    for (let player of players) {
      if (player.getComponent(Player).id === id) {
        this.pearl.entities.destroy(player);
      }
    }

    this.playerSlotManager!.removePlayer(id);
  }

  rpcLoadLevel(levelIdx: number) {
    const level = levels[levelIdx];
    if (level === this.currentLevel) {
      return;
    }

    this.currentLevel = level;
    this.currentLevelIdx = levelIdx;
    this.createWorld(level.platforms);
  }

  private createWorld(platforms: Platform[]) {
    const worldSize = this.pearl.renderer.getViewSize();

    const walls: Platform[] = [
      { x: -25, y: worldSize.y / 2, w: 50, h: worldSize.y * 4 },
      { x: worldSize.x + 25, y: worldSize.y / 2, w: 50, h: worldSize.y * 4 },
    ];

    for (let platform of [...walls, ...platforms]) {
      this.createPlatform(platform);
    }
  }

  private createPlatform(platform: Platform) {
    this.pearl.entities.add(
      new Entity({
        name: 'platform',
        tags: [Tag.Platform],
        components: [
          new Physical({
            center: { x: platform.x, y: platform.y },
            angle: Maths.degreesToRadians(platform.angle || 0),
          }),
          new BoxCollider({
            width: platform.w,
            height: platform.h,
          }),
          new BoxRenderer({
            strokeStyle: 'white',
          }),
        ],
      })
    );
  }
}
