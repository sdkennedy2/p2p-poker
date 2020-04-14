import AWS from 'aws-sdk';

const rooms: {[roomId: string]: Set<string>} = {};
const connectionToRoom: {[connectionId: string]: string} = {};

const sendMessageToClient = async (endpoint, connectionId, payload) =>
  new Promise((resolve, reject) => {
    const apigatewaymanagementapi = new AWS.ApiGatewayManagementApi({
      apiVersion: '2018-11-29',
      endpoint,
    });
    apigatewaymanagementapi.postToConnection(
      {
        ConnectionId: connectionId, // connectionId of the receiving ws-client
        Data: JSON.stringify(payload),
      },
      (err, data) => {
        if (err) {
          console.log('err is', err);
          reject(err);
        }
        resolve(data);
      },
    );
  });

export async function connectHandler(event) {
  console.log('Connection');
  return {
    statusCode: 200,
  };
}

export async function disconnectHandler(event) {
  const domain = event.requestContext.domainName;
  const stage = event.requestContext.stage;
  const endpoint = process.env.PRODUCTION
    ? `https://${domain}/${stage}`
    : 'http://localhost:3001';
  console.log('Disconnect');
  const connectionId = event.requestContext.connectionId;
  const roomId = connectionToRoom[connectionId];
  delete connectionToRoom[connectionId];
  const room = rooms[roomId];
  if (room) {
    room.delete(connectionId);
    const peerIds = Array.from(room);
    await Promise.all(
      peerIds.map((id) =>
        sendMessageToClient(endpoint, id, {
          action: 'disconnect',
          sourceId: connectionId,
          payload: {},
        }),
      ),
    );
  }
  return {
    statusCode: 200,
  };
}

export async function messageHandler(event) {
  const domain = event.requestContext.domainName;
  const stage = event.requestContext.stage;
  const endpoint = process.env.PRODUCTION
    ? `https://${domain}/${stage}`
    : 'http://localhost:3001';
  const connectionId = event.requestContext.connectionId;

  const body = JSON.parse(event.body);
  const {action, payload} = body;

  if (action === 'join') {
    console.log('Join', payload);
    const {requestId, roomId} = payload;
    rooms[roomId] = rooms[roomId] || new Set();
    const peerIds = Array.from(rooms[roomId]);
    rooms[roomId].add(connectionId);
    connectionToRoom[connectionId] = roomId;
    await sendMessageToClient(endpoint, connectionId, {
      action: 'join',
      sourceId: connectionId,
      payload: {
        requestId,
        peerIds,
        selfId: connectionId,
      },
    });
  } else if (action === 'description' || action === 'candidate') {
    console.log(action, payload);
    const {destinationId} = payload;
    sendMessageToClient(endpoint, destinationId, {
      action,
      sourceId: connectionId,
      payload,
    });
  }

  return {
    statusCode: 200,
    body: `Hello, ${body.name}`,
  };
}
