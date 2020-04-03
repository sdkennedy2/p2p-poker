import {WorkerThreadApi, WorkerThreadClient} from './interface';
import {wrap} from 'comlink';
import serverStoreToClientStore from './apis/store/client/server-store-to-client-store';

export async function createWorkerThreadClient(
  clientPort: MessagePort,
): Promise<WorkerThreadClient> {
  const workerThread = wrap<WorkerThreadApi>(clientPort);
  clientPort.start();

  const {actionCreators} = workerThread;
  const clientStore = await serverStoreToClientStore(workerThread.serverStore);

  return {actionCreators, clientStore};
}
