import Peer, {DataConnection} from 'peerjs';
import {P2PPlayerOpponentId} from './interface';

export const createPeer = (): Promise<Peer> =>
  new Promise((resolve) => {
    const peer = new Peer({
      debug: 3,
      config: {
        iceServers: [
          {
            urls: 'stun:stun.l.google.com:19302',
          },
        ],
      },
    });
    peer.on('open', () => {
      resolve(peer);
    });
  });

export const connectOutboundConnection = (
  peer: Peer,
  id: P2PPlayerOpponentId,
): Promise<DataConnection> =>
  new Promise((resolve) => {
    const con = peer.connect(id, {reliable: true});
    con.on('open', () => {
      resolve(con);
    });
  });
