import {Endpoint} from 'comlink';

const MESSAGE_TYPE_COMLINK_PORTS = 'COMLINK_PORTS';

function logPort(name: string, port: MessagePort): void {
  port.addEventListener('message', (message) => {
    console.log(`Port: ${name}`, message.data);
  });
}

/*
Creates ports for main thread to communicate with worker via comlink and vice versa
*/
export function createPorts(): {
  mainServerPort: MessagePort;
  mainClientPort: MessagePort;
  workerServerPort: MessagePort;
  workerClientPort: MessagePort;
} {
  const outboundChannel = new MessageChannel();
  const inboundChannel = new MessageChannel();

  // Main listens to requests and response to worker on this port
  const mainServerPort = inboundChannel.port1;
  // Main broadcasts requests and lists for response from worker on this port
  const mainClientPort = outboundChannel.port1;
  // Worker listens to requests and response to main on this port
  const workerServerPort = outboundChannel.port2;
  // Worker broadcasts requests and lists for response from main on this port
  const workerClientPort = inboundChannel.port2;

  const ports = {
    mainServerPort,
    mainClientPort,
    workerServerPort,
    workerClientPort,
  };
  // Object.entries(ports).forEach(([name, port]) => {
  //   logPort(name, port);
  // });
  return ports;
}

export async function publishPorts(
  endpoint: Endpoint,
  ports: {workerServerPort: MessagePort; workerClientPort: MessagePort},
): Promise<void> {
  const {workerServerPort, workerClientPort} = ports;
  endpoint.postMessage(
    {
      type: MESSAGE_TYPE_COMLINK_PORTS,
      workerServerPort,
      workerClientPort,
    },
    [workerServerPort, workerClientPort],
  );
}

export async function listenForPorts(
  // Should be something like web worker's self, window or MessagePort
  target: EventTarget,
): Promise<{
  workerServerPort: MessagePort;
  workerClientPort: MessagePort;
}> {
  return new Promise((resolve) => {
    const listener = (ev: MessageEvent): void => {
      if (ev.data && ev.data.type === MESSAGE_TYPE_COMLINK_PORTS) {
        const {workerServerPort, workerClientPort} = ev.data;
        resolve({workerServerPort, workerClientPort});
        target.removeEventListener('message', listener);
      }
    };
    target.addEventListener('message', listener);
  });
}
