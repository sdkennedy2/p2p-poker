import {v4 as uuid} from 'uuid';

export interface JoinResponse {
  peerIds: Array<string>;
  requestId: string;
  selfId: string;
}

// WebRtc signaling
export interface CandidatePayload {
  destinationId: string;
  candidate: RTCIceCandidate;
}
export interface DescriptionPayload {
  destinationId: string;
  description: RTCSessionDescription;
}
export interface DescriptionEvent {
  action: 'description';
  sourceId: string;
  payload: DescriptionPayload;
}
export interface CandidateEvent {
  action: 'candidate';
  sourceId: string;
  payload: CandidatePayload;
}
export interface DisconnectEvent {
  action: 'disconnect';
  sourceId: string;
  payload: {};
}
export type SignalEvent = DescriptionEvent | CandidateEvent | DisconnectEvent;
export type SignalEventCallback = (event: SignalEvent) => void;
export interface Signal {
  addEventListener(listener: SignalEventCallback, peerId?: string): void;
  removeEventListener(listener: SignalEventCallback, peerId?: string): void;
  join: (joinId: string) => Promise<JoinResponse>;
  candidate: (payload: CandidatePayload) => void;
  description: (payload: DescriptionPayload) => void;
}

async function createWebSocket(endpoint: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(endpoint);
    ws.addEventListener('message', (event) => {
      console.log('message', event.data);
    });
    const handler = (): void => {
      ws.removeEventListener('open', handler);
      resolve(ws);
    };
    ws.addEventListener('open', handler);
    // ws.addEventListener('error', (err) => reject(err));
  });
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

export async function createSignal(endpoint: string): Promise<Signal> {
  const globalListeners: Set<SignalEventCallback> = new Set();
  const peerIdListeners: {[peerId: string]: Set<SignalEventCallback>} = {};

  const ws = await createWebSocket(endpoint);
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
}
