import { NetworkedPrefab } from 'pearl-networking';
import Session from '../components/Session';
import CameraMover from '../components/CameraMover';
import LevelLoader from '../components/LevelLoader';
import { Tag } from '../types';

const session: NetworkedPrefab = {
  type: 'session',
  tags: [Tag.Session],

  createComponents() {
    return [new Session(), new CameraMover(), new LevelLoader()];
  },
};

export default session;
