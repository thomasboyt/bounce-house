export default function showRoomCode(roomCode: string) {
  console.log('roomCode:', roomCode);
  const url =
    document.location.origin +
    document.location.pathname +
    `?roomCode=${roomCode}`;
  console.log('link', url);

  const roomLink = document.querySelector('a.room-link');
  if (roomLink instanceof HTMLAnchorElement) {
    roomLink.href = url;
    roomLink.innerText = url;
  }
}
