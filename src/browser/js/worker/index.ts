import {enableMapSet, enablePatches} from 'immer';
import {listenForPorts} from './comlink/ports';
import {createMainThreadClient} from './comlink/main-thread/client';
import {createWorkerThreadServer} from './comlink/worker-thread/server';

enableMapSet();
enablePatches();

const initialize = async (service: ServiceWorker): Promise<void> => {
  const {workerServerPort, workerClientPort} = await listenForPorts(service);
  // Api for calling main thread
  const mainThread = createMainThreadClient(workerClientPort);
  createWorkerThreadServer(mainThread, workerServerPort);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
initialize(self as any);
