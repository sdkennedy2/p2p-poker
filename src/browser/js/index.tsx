import {v4 as uuid} from 'uuid';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './ui/app';
import {enableMapSet, enablePatches} from 'immer';
import {createWorker} from './create-worker';
import {createRoom} from './util/webrtc/room';

enableMapSet();
enablePatches();

async function createWebSocket(): Promise<WebSocket> {
  return new Promise((resolve) => {
    const ws = new WebSocket('ws://localhost:3001');
    ws.addEventListener('message', (event) => {
      console.log('message', event.data);
    });
    const handler = (): void => {
      ws.removeEventListener('open', handler);
      resolve(ws);
    };
    ws.addEventListener('open', handler);
  });
}

interface JoinResponse {
  peerIds: Array<string>;
  requestId: string;
  selfId: string;
}

// WebRtc signaling
interface CandidatePayload {
  destinationId: string;
  candidate: RTCIceCandidate;
}
interface DescriptionPayload {
  destinationId: string;
  description: RTCSessionDescription;
}
interface DescriptionEvent {
  action: 'description';
  sourceId: string;
  payload: DescriptionPayload;
}
interface CandidateEvent {
  action: 'candidate';
  sourceId: string;
  payload: CandidatePayload;
}
interface DisconnectEvent {
  action: 'disconnect';
  sourceId: string;
  payload: {};
}
type SignalEvent = DescriptionEvent | CandidateEvent | DisconnectEvent;
type SignalEventCallback = (event: SignalEvent) => void;
interface Signal {
  addEventListener(listener: SignalEventCallback, peerId?: string): void;
  removeEventListener(listener: SignalEventCallback, peerId?: string): void;
  join: (joinId: string) => Promise<JoinResponse>;
  candidate: (payload: CandidatePayload) => void;
  description: (payload: DescriptionPayload) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const send = (ws: WebSocket, action: string, payload: any): void =>
  ws.send(JSON.stringify({action, payload}));

function createJoin(ws: WebSocket) {
  return async (roomId: string): Promise<JoinResponse> => {
    return new Promise((resolve) => {
      const requestId = uuid();
      const handler = (event: MessageEvent): void => {
        try {
          const {action, payload} = JSON.parse(event.data);
          if (action === 'join' && payload.requestId === requestId) {
            ws.removeEventListener('message', handler);
            resolve(payload);
          }
        } catch (err) {}
      };
      ws.addEventListener('message', handler);
      send(ws, 'join', {requestId, roomId});
    });
  };
}

const createSignalEvent = (event: MessageEvent): SignalEvent | null => {
  try {
    const {action, sourceId, payload} = JSON.parse(event.data);
    if (action === 'description') {
      return {
        action,
        sourceId,
        payload: {
          description: new RTCSessionDescription(payload.description),
        },
      };
    } else if (action === 'candidate') {
      return {
        action,
        sourceId,
        payload: {
          candidate: new RTCIceCandidate(payload.candidate),
        },
      };
    } else if (action === 'disconnect') {
      return {
        action,
        sourceId,
        payload: {},
      };
    } else {
      return null;
    }
  } catch (err) {
    return null;
  }
};

const createSignal = (ws: WebSocket): Signal => {
  const globalListeners: Set<SignalEventCallback> = new Set();
  const peerIdListeners: {[peerId: string]: Set<SignalEventCallback>} = {};

  ws.addEventListener('message', (event: MessageEvent): void => {
    const signalEvent = createSignalEvent(event);
    if (!signalEvent) return;

    globalListeners.forEach((listener) => listener(signalEvent));

    const {sourceId} = signalEvent;
    peerIdListeners[sourceId] = peerIdListeners[sourceId] || new Set();
    peerIdListeners[sourceId].forEach((listener) => listener(signalEvent));
  });

  return {
    addEventListener(listener: SignalEventCallback, peerId?: string): void {
      if (peerId) {
        peerIdListeners[peerId] = peerIdListeners[peerId] || new Set();
        peerIdListeners[peerId].add(listener);
      } else {
        globalListeners.add(listener);
      }
    },
    removeEventListener(listener: SignalEventCallback, peerId?: string): void {
      if (peerId) {
        peerIdListeners[peerId] = peerIdListeners[peerId] || new Set();
        peerIdListeners[peerId].delete(listener);
      } else {
        globalListeners.delete(listener);
      }
    },
    join: createJoin(ws),
    candidate: (payload: CandidatePayload): void =>
      send(ws, 'candidate', payload),
    description: (payload: DescriptionPayload): void =>
      send(ws, 'description', payload),
  };
};

interface Peer {
  pc: RTCPeerConnection;
  dc: RTCDataChannel;
}
function createPeer({
  signal,
  destinationId,
  initialEvent,
  polite,
}: {
  signal: Signal;
  destinationId: string;
  initialEvent?: SignalEvent;
  polite: boolean;
}): Peer {
  const pc = new RTCPeerConnection({
    iceServers: [{urls: 'stun:stun.l.google.com:19302'}],
  });
  const dc = pc.createDataChannel('both', {negotiated: true, id: 0});

  // Perfect negotiation
  // https://w3c.github.io/webrtc-pc/#perfect-negotiation-example
  // keep track of some negotiation state to prevent races and errors
  let makingOffer = false;
  let ignoreOffer = false;

  pc.onicecandidate = ({candidate}): void => {
    if (!candidate) return;
    signal.candidate({candidate, destinationId});
  };

  // let the "negotiationneeded" event trigger offer generation
  pc.onnegotiationneeded = async (): Promise<void> => {
    try {
      makingOffer = true;
      // Typescript definition doesn't have 0 argument version
      await (pc as any).setLocalDescription();
      signal.description({
        description: pc.localDescription,
        destinationId,
      });
    } catch (err) {
      console.error(err);
    } finally {
      makingOffer = false;
    }
  };

  const handleEvent = async (event: SignalEvent): Promise<void> => {
    if (event.action === 'description') {
      const {description} = event.payload;

      const offerCollision =
        description.type == 'offer' &&
        (makingOffer || pc.signalingState != 'stable');

      ignoreOffer = !polite && offerCollision;
      if (ignoreOffer) {
        return;
      }

      await pc.setRemoteDescription(description); // SRD rolls back as needed
      if (description.type == 'offer') {
        // Typescript definition doesn't have 0 argument version
        await (pc as any).setLocalDescription();
        signal.description({description: pc.localDescription, destinationId});
      }
    } else if (event.action === 'candidate') {
      const {candidate} = event.payload;
      try {
        await pc.addIceCandidate(candidate);
      } catch (err) {
        if (!ignoreOffer) throw err; // Suppress ignored offer's candidates
      }
    }
  };
  if (initialEvent) {
    handleEvent(initialEvent);
  }

  signal.addEventListener(handleEvent, destinationId);
  return {pc, dc};
}

function createInitialPeers(
  signal,
  peerIds: Array<string>,
): {[peerId: string]: Peer} {
  return Object.fromEntries(
    peerIds.map((destinationId) => [
      destinationId,
      createPeer({signal, destinationId, polite: true}),
    ]),
  );
}

async function webWorkerTest() {
  const roomId = '123';

  const ws = await createWebSocket();

  const signal = createSignal(ws);
  const {peerIds: initialPeerIds} = await signal.join(roomId);

  const peers = createInitialPeers(signal, initialPeerIds);
  window.peers = peers;

  signal.addEventListener((event: SignalEvent) => {
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

async function init(): Promise<void> {
  const workerClient = await createWorker();
  workerClient.actions.game.initGame({
    peers: [],
  });
  createRoom('123');
  // webWorkerTest();
  const {clientStore: store} = workerClient;
  const root = document.createElement('div');
  document.body.appendChild(root);
  ReactDOM.render(<App store={store} />, root);
}
init();
