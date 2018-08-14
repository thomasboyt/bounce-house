import { BoxCollider, BoxRenderer, KinematicBody } from 'pearl';
import { NetworkedPrefab, NetworkedPhysical } from 'pearl-networking';
import Player from '../components/Player';
import { Tag } from '../types';
import TrailRenderer from '../components/TrailRenderer';
import SpawningDyingRenderer from '../components/SpawningDyingRenderer';

const player: NetworkedPrefab = {
  type: 'player',

  tags: [Tag.Player],

  createComponents: () => {
    return [
      new NetworkedPhysical(),
      new Player(),
      new BoxCollider({
        width: 10,
        height: 10,
      }),
      new TrailRenderer(),
      new BoxRenderer({
        fillStyle: 'white',
      }),
      new KinematicBody(),
      new SpawningDyingRenderer(),
    ];
  },
};

export default player;
