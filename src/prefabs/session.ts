import { NetworkedPrefab } from 'pearl-networking';
import Session from '../components/Session';

const session: NetworkedPrefab = {
  type: 'session',

  createComponents() {
    return [new Session()];
  },
};

export default session;
