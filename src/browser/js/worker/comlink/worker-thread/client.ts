import {WorkerThreadApi, WorkerThreadClient} from './interface';
import {wrap} from 'comlink';
import serverStoreToClientStore from './apis/store/client/server-store-to-client-store';

export async function createWorkerThreadClient(
  clientPort: MessagePort,
): Promise<WorkerThreadClient> {
  const workerThread = wrap<WorkerThreadApi>(clientPort);
  clientPort.start();

  const {actions, serverStore} = workerThread;
  const clientStore = await serverStoreToClientStore(serverStore);

  return {actions, clientStore};
}
