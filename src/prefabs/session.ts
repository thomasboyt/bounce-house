import { NetworkedPrefab } from 'pearl-networking';
import Session from '../components/Session';
import CameraMover from '../components/CameraMover';
import { Tag } from '../types';

const session: NetworkedPrefab = {
  type: 'session',
  tags: [Tag.Session],

  createComponents() {
    return [new Session(), new CameraMover()];
  },
};

export default session;
