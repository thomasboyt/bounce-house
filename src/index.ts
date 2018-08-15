import { createPearl } from 'pearl';
import { NetworkingHost, NetworkingClient } from 'pearl-networking';
import Game from './components/Game';
import networkedPrefabs from './networkedPrefabs';

const shaSpan = document.querySelector('.sha');
if (shaSpan) {
  shaSpan.innerHTML = process.env.BUILD_SHA!;
}

const parseIntParam = (param: string | null) => {
  if (!param) {
    return undefined;
  }
  const val = parseInt(param);
  if (Number.isNaN(val)) {
    return undefined;
  }

  return val;
};

async function createGame() {
  const params = new URLSearchParams(document.location.search.slice(1));
  const roomCode = params.get('roomCode') || undefined;
  const isHost = !roomCode;
  const scaleFactor = parseIntParam(params.get('scale'));

  let networkingComponent;

  if (isHost) {
    networkingComponent = new NetworkingHost({
      prefabs: networkedPrefabs,
      maxClients: 4,
    });
  } else {
    networkingComponent = new NetworkingClient({
      prefabs: networkedPrefabs,
    });
  }

  const pearl = await createPearl({
    rootComponents: [new Game({ isHost, roomCode }), networkingComponent],
    width: 320,
    height: 240,
    backgroundColor: 'black',
    canvas: document.getElementById('canvas') as HTMLCanvasElement,
  });

  pearl.renderer.scale(scaleFactor || 2);
}

createGame();
