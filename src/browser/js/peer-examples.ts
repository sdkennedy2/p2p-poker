import Peer from 'peerjs';
import {v4 as uuid} from 'uuid';

console.clear();

const debugEvent = (
  objType: string,
  obj: Peer | Peer.DataConnection,
  eventName: string,
  peedId: string,
): void => {
  obj.on(eventName, (event) => {
    console.log(`DEBUG Event=${objType}:${eventName} ${peedId}`, event);
  });
};

const createPeer = (
  id: string,
  {peerName, debug}: {peerName: string; debug?: number},
): Promise<Peer> =>
  new Promise((resolve) => {
    const peer = new Peer(id, {
      debug,
      config: {
        iceServers: [
          {
            urls: 'stun:stun.l.google.com:19302',
          },
        ],
      },
    });
    debugEvent('peer', peer, 'connection', peerName);
    debugEvent('peer', peer, 'disconnected', peerName);
    debugEvent('peer', peer, 'close', peerName);
    debugEvent('peer', peer, 'error', peerName);
    peer.on('open', () => {
      resolve(peer);
    });
  });

const handleInbound = (
  p: Peer,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cb: (con: Peer.DataConnection, data: any) => void,
): void => {
  p.on('connection', (con: Peer.DataConnection) => {
    con.on('data', (data) => {
      cb(con, data);
    });
  });
};

const connectOutbound = (
  name: string,
  p1: Peer,
  p2Id: string,
): Promise<Peer.DataConnection> =>
  new Promise((resolve) => {
    console.log('DEBUG Creating connection', name);
    const con = p1.connect(p2Id, {reliable: true});
    debugEvent('connection', con, 'data', name);
    debugEvent('connection', con, 'open', name);
    debugEvent('connection', con, 'call', name);
    debugEvent('connection', con, 'close', name);
    con.on('open', () => {
      console.log('DEBUG Connection established', name);
      resolve(con);
    });
  });

const crossProduct = <K>(arr: Array<K>): Array<[K, K]> => {
  const output = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < i; j++) {
      output.push([arr[i], arr[j]]);
    }
  }
  return output;
};

const testMultiPeer = async (): Promise<void> => {
  console.log('Starting');
  const peers = await Promise.all([
    createPeer(uuid(), {peerName: 'Peer 1'}),
    createPeer(uuid(), {peerName: 'Peer 2'}),
    createPeer(uuid(), {peerName: 'Peer 3'}),
  ]);
  const [peer1, peer2, peer3] = peers;
  const idToName = {
    [peer1.id]: 'Peer 1',
    [peer2.id]: 'Peer 2',
    [peer3.id]: 'Peer 3',
  };
  peers.forEach((peer) => {
    handleInbound(peer, (con, data) => {
      console.log(
        `Receiving From:${idToName[con.peer]} To:${idToName[peer.id]} recieved`,
        data,
      );
    });
  });

  const outboundConnections: Array<[
    Peer,
    Peer,
    Peer.DataConnection,
  ]> = await Promise.all(
    crossProduct(peers).map(
      async ([p1, p2]): Promise<[Peer, Peer, Peer.DataConnection]> => {
        const con = await connectOutbound(
          `${idToName[peer1.id]} -> ${idToName[peer2.id]}`,
          peer1,
          peer2.id,
        );
        return [p1, p2, con];
      },
    ),
  );

  outboundConnections.forEach(([p1, p2, outboundConnection]) => {
    const data = `(${idToName[p1.id]} to ${idToName[p2.id]})`;
    console.log(`Sending ${idToName[p1.id]} -> ${idToName[p2.id]}`, data);
    outboundConnection.send(data);
  });
};

const createElement = (html: string) => {
  const parent = document.createElement('div');
  parent.innerHTML = html;
  return parent.childNodes[0];
};

const testChat = async () => {
  try {
    document.body.innerHTML = 'Loading';
    const me = await createPeer(uuid(), {peerName: 'Me'});
    const others = [];

    const peerIdDiv = createElement(`<div>${me.id}</div>`);

    const othersDiv = document.createElement('div');
    othersDiv.style.display = 'flex';
    othersDiv.style.flexDirection = 'column';

    const connectInput = document.createElement('input');
    connectInput.setAttribute('type', 'text');
    connectInput.addEventListener('keydown', async (e) => {
      if (e.key !== 'Enter') {
        return;
      }
      const otherId = connectInput.value;
      const conn = await connectOutbound(otherId, me, otherId);
      conn.send(`${me.id} connected`);
      others.push(conn);
      othersDiv.appendChild(createElement(`<div>${otherId}</div>`));
      connectInput.value = '';
    });

    const chatInput = document.createElement('input');
    chatInput.setAttribute('type', 'text');
    chatInput.addEventListener('keydown', async (e) => {
      if (e.key !== 'Enter') {
        return;
      }
      others.forEach((conn) => {
        conn.send(`${me.id} sent: ${chatInput.value}`);
      });
      chatInput.value = '';
    });

    const dataDiv = document.createElement('div');
    dataDiv.style.display = 'flex';
    dataDiv.style.flexDirection = 'column';
    handleInbound(me, (con, data) => {
      console.log('Inbound connection');
      dataDiv.appendChild(createElement(`<div>${data}</div>`));
    });

    document.body.innerHTML = '';
    [peerIdDiv, connectInput, othersDiv, chatInput, dataDiv].forEach((el) =>
      document.body.appendChild(el),
    );
  } catch (e) {
    document.body.append(e.message);
  }
};

testChat();
