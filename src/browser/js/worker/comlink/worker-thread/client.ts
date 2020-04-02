import {WorkerThreadApi, WorkerThreadClient} from './interface';
import {wrap} from 'comlink';
import {createClientStore} from './apis/store/client/create-client-store';

export async function createWorkerThreadClient(
  clientPort: MessagePort,
): Promise<WorkerThreadClient> {
  const workerThread = wrap<WorkerThreadApi>(clientPort);
  clientPort.start();

  const clientStore = await createClientStore(workerThread.serverStore);

  return {clientStore};
}
