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
import levels, { Level } from '../levels';
import CameraMover from './CameraMover';
import LevelLoader from './LevelLoader';
import { RectangleLevelShape } from '../parseSVGLevel';

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
  private playerIdToSlotIdx = new Map<string, number>();
  private slots: PlayerSlot[];

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

  getPlayerIds() {
    return [...this.playerIdToSlotIdx.keys()];
  }

  getSlotForPlayerId(id: string) {
    return this.slots[this.playerIdToSlotIdx.get(id)!];
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
    this.setLevel(0);
  }

  update() {
    if (!this.getComponent(NetworkedEntity).isHost) {
      return;
    }

    for (let k = 48; k < 58; k += 1) {
      if (this.pearl.inputter.isKeyPressed(k)) {
        const n = k - 48;
        if (levels[n - 1]) {
          this.setLevel(n - 1);
        }
      }
    }
  }

  addPlayer(id: string) {
    // XXX: This gets sent to all players, which is why rpcLoadLevel() has a
    // check to ignore it if it's the current level. In the future, may be
    // nice to send an RPC message to a specific client. Should be easier with
    // TypeScript allow checking of something like
    // `rpcToClient(this.rpcLoadLevel, [1])`

    // TODO: This may be ignored on clients if they haven't received the initial
    // snapshot containing Session yet!!
    this.rpcLoadLevel(this.currentLevelIdx!);

    const slot = this.playerSlotManager!.addPlayer(id);
    this.createPlayerEntity(id, slot);
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

  private createPlayerEntity(playerId: string, slot: PlayerSlot) {
    if (!this.currentLevel) {
      return;
    }

    const { color, position } = slot;
    const spawn = this.currentLevel!.spawns[position];

    const player = this.pearl.root
      .getComponent(NetworkingHost)
      .createNetworkedPrefab('player');

    player.getComponent(Player).id = playerId;
    player.getComponent(Player).color = color;
    player.getComponent(Player).spawn = spawn;
    player.getComponent(Player).slotPosition = position;
    player.getComponent(Physical).center = spawn;
  }

  private setLevel(levelIdx: number) {
    const players = this.pearl.entities.all(Tag.Player);
    for (let player of players) {
      this.pearl.entities.destroy(player);
    }

    this.rpcLoadLevel(levelIdx);

    const playerIds = this.playerSlotManager!.getPlayerIds();
    for (let playerId of playerIds) {
      this.createPlayerEntity(
        playerId,
        this.playerSlotManager!.getSlotForPlayerId(playerId)
      );
    }
  }

  private rpcLoadLevel(levelIdx: number) {
    const level = levels[levelIdx];
    if (level === this.currentLevel) {
      return;
    }

    this.currentLevel = level;
    this.currentLevelIdx = levelIdx;
    this.getComponent(LevelLoader).changeLevel(level);

    // TODO: make this work for polygons too
    const lowestPlatformTop = level.platforms
      .filter(
        (platform): platform is RectangleLevelShape =>
          platform.type === 'rectangle'
      )
      .reduce(
        (prevTop, platform) =>
          Math.max(prevTop, platform.center.y - platform.size.y / 2),
        0
      );

    this.getComponent(CameraMover).yMaximum = lowestPlatformTop + 20;
  }
}
