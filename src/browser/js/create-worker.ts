import {createPorts, publishPorts} from './worker/comlink/ports';
import {createMainThreadServer} from './worker/comlink/main-thread/server';
import {createWorkerThreadClient} from './worker/comlink/worker-thread/client';
import {WorkerThreadClient} from './worker/comlink/worker-thread/interface';

export async function createWorker(): Promise<WorkerThreadClient> {
  const {
    mainServerPort,
    mainClientPort,
    workerServerPort,
    workerClientPort,
  } = createPorts();

  // Respond to requests from worker
  createMainThreadServer(mainServerPort);

  const jsFiles: string[] = (window as any).files.js;
  const workerPath = jsFiles.find((file) => file.includes('worker'));
  const worker = new Worker(workerPath);

  publishPorts(worker, {workerServerPort, workerClientPort});
  // Make requests to worker
  return createWorkerThreadClient(mainClientPort);
}
