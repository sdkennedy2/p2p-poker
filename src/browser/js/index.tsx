import {v4 as uuid} from 'uuid';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './ui/app';
import {enableMapSet, enablePatches} from 'immer';
import {createWorker} from './create-worker';

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

function createJoin(ws: WebSocket) {
  return async (
    roomId: string,
  ): Promise<{peerIds: Array<string>; requestId: string; selfId: string}> => {
    return new Promise((resolve) => {
      const requestId = uuid();
      const handler = (event): void => {
        try {
          const response = JSON.parse(event.data);
          if (
            response.action === 'join' &&
            response.payload.requestId === requestId
          ) {
            ws.removeEventListener('message', handler);
            resolve(response.payload);
          }
        } catch (err) {}
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({action: 'join', payload: {requestId, roomId}}));
    });
  };
}

const sendResponse = (ws: WebSocket, action: string, payload: any): void =>
  ws.send(JSON.stringify({action, payload}));

const createApi = (ws: WebSocket) => ({
  join: createJoin(ws),
  offers: (payload: {
    offers: {[peerId: string]: Offer};
    roomId: string;
  }): void => sendResponse(ws, 'offers', payload),
});

function collectIceCandidates(
  connection: RTCPeerConnection,
): Promise<Array<RTCIceCandidate>> {
  const candidates = [];
  connection.onicecandidate = ({candidate}) => {
    if (!candidate) return;
    candidates.push(candidate.toJSON());
  };
  return new Promise((resolve) => {
    connection.onicegatheringstatechange = (): void => {
      if (connection.iceGatheringState === 'complete') {
        resolve(candidates);
      }
    };
  });
}

function createPeerConnection(): RTCPeerConnection {
  return new RTCPeerConnection({
    iceServers: [{urls: 'stun:stun.l.google.com:19302'}],
  });
}

async function createInitiatorChannel(
  connection: RTCPeerConnection,
): Promise<RTCDataChannel> {
  return new Promise((resolve) => {
    const c = connection.createDataChannel('comlink', null);
    c.onopen = ({target}): void => {
      if ((target as any).readyState === 'open') {
        resolve(c);
      }
    };
  });
}

interface Peer {
  connection: RTCPeerConnection;
  channel: Promise<RTCDataChannel>;
}
interface Initiator {
  offer: Offer;
  peer: Peer;
}
async function createInitiator(): Promise<Initiator> {
  const connection = createPeerConnection();
  const channel = createInitiatorChannel(connection);
  const localDescription = new RTCSessionDescription(
    await connection.createOffer(),
  );
  const candidatesPromise = collectIceCandidates(connection);
  connection.setLocalDescription(localDescription);
  const candidates = await candidatesPromise;
  const offer = {
    description: localDescription.toJSON(),
    candidates,
  };
  return {offer, peer: {connection, channel}};
}

interface Offer {
  description: RTCSessionDescription;
  candidates: Array<RTCIceCandidate>;
}
async function createInitiators(
  peerIds: Array<string>,
): Promise<{
  offers: {[peerId: string]: Offer};
  peers: {[peerId: string]: Peer};
}> {
  const initiators = await Promise.all(
    peerIds.map((id) => Promise.all([id, createInitiator()])),
  );
  const offers = Object.fromEntries(
    initiators.map(([id, {offer}]) => [id, offer]),
  );
  const peers = Object.fromEntries(
    initiators.map(([id, {peer}]) => [id, peer]),
  );
  return {
    offers,
    peers,
  };
}

async function createAnswerorChannel(
  connection: RTCPeerConnection,
): Promise<RTCDataChannel> {
  return new Promise((resolve) => {
    connection.ondatachannel = ({channel}): void => {
      resolve(channel);
    };
  });
}

async function handleOffer(ws: WebSocket, request) {
  const {payload} = request;
  const {
    roomId,
    initiatorId,
    offer: {description, candidates},
  } = payload;
  const connection = createPeerConnection();
  const channel = createAnswerorChannel(connection);

  // Setup remote info
  connection.setRemoteDescription(new RTCSessionDescription(description));
  candidates.forEach((c) => connection.addIceCandidate(new RTCIceCandidate(c)));

  // Setup local info
  const localDescription = new RTCSessionDescription(
    await connection.createAnswer(),
  );
  const answerCandidatesPromise = collectIceCandidates(connection);
  connection.setLocalDescription(localDescription);
  const answerCandidates = await answerCandidatesPromise;

  // Send local info to remote
  sendResponse(ws, 'answer', {
    answer: {
      description: localDescription.toJSON(),
      candidates: answerCandidates,
    },
    initiatorId,
    roomId,
  });

  return {
    initiatorId,
    peer: {
      connection,
      channel,
    },
  };
}

function handleAnswer({connection, answer}): void {
  const {description, candidates} = answer;
  connection.setRemoteDescription(new RTCSessionDescription(description));
  candidates.forEach((c) => connection.addIceCandidate(new RTCIceCandidate(c)));
}

let peerConnections = {};

function createMessageHandler(ws: WebSocket) {
  return async (event: MessageEvent): Promise<void> => {
    try {
      const request = JSON.parse(event.data);
      const {action} = request;
      if (action === 'offer') {
        const {initiatorId, peer} = await handleOffer(ws, request);
        peerConnections[initiatorId] = peer;
      } else if (action === 'answer') {
        const {answerorId, answer} = request.payload;
        const peer = peerConnections[answerorId];
        if (peer) {
          handleAnswer({
            connection: peer.connection,
            answer,
          });
        }
      }
    } catch (err) {
      console.log('Error', err);
    }
  };
}

async function webWorkerTest() {
  const roomId = '123';

  const ws = await createWebSocket();

  const api = createApi(ws);
  const {peerIds} = await api.join(roomId);

  const handleMessage = createMessageHandler(ws);
  ws.addEventListener('message', handleMessage);

  const {peers, offers} = await createInitiators(peerIds);

  peerConnections = peers;

  if (Object.keys(offers).length > 0) {
    await api.offers({offers, roomId});
  }
}

async function init(): Promise<void> {
  const workerClient = await createWorker();
  workerClient.actions.game.initGame({
    peers: [],
  });
  webWorkerTest();
  const {clientStore: store} = workerClient;
  const root = document.createElement('div');
  document.body.appendChild(root);
  ReactDOM.render(<App store={store} />, root);
}
init();
