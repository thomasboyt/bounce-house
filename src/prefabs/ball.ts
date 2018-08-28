import { KinematicBody, CircleCollider, CircleRenderer } from 'pearl';
import { NetworkedPrefab, NetworkedPhysical } from 'pearl-networking';
import TrailRenderer from '../components/TrailRenderer';
import Ball from '../components/Ball';
import { Tag } from '../types';

const player: NetworkedPrefab = {
  type: 'ball',

  tags: [Tag.Ball],

  createComponents: () => {
    return [
      new Ball(),
      new NetworkedPhysical(),
      new CircleCollider({
        radius: 5,
      }),
      new TrailRenderer(),
      new CircleRenderer({
        fillStyle: 'white',
      }),
      new KinematicBody(),
    ];
  },
};

export default player;
