import {createPeer} from './peer';
import {createSignal, SignalEvent, Signal} from './signal';

function createInitialPeers(
  signal: Signal,
  peerIds: Array<string>,
): {[peerId: string]: RTCDataChannel} {
  return Object.fromEntries(
    peerIds.map((destinationId) => [
      destinationId,
      createPeer({signal, destinationId, polite: true}),
    ]),
  );
}

export async function createRoom(
  roomId: string,
  signalEndpoint = 'ws://localhost:3001',
): Promise<void> {
  const signal = await createSignal(signalEndpoint);

  const {peerIds: initialPeerIds} = await signal.join(roomId);

  const peers = createInitialPeers(signal, initialPeerIds);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).peers = peers;

  signal.addEventListener((event: SignalEvent): void => {
    const {sourceId} = event;
    if (event.action === 'disconnect') {
      // todo: properly disconnect
      delete peers[sourceId];
    } else if (!peers[sourceId]) {
      // Found new peer
      peers[sourceId] = createPeer({
        signal,
        destinationId: sourceId,
        polite: false,
        initialEvent: event,
      });
    }
  });
}
