import {expose, Remote} from 'comlink';
import {createServerStore} from './apis/store/server/create-server-store';
import {MainThreadApi} from '../main-thread/interface';

export async function createWorkerThreadServer(
  mainThread: Remote<MainThreadApi>,
  serverPort: MessagePort,
): Promise<void> {
  // Api exposed to main thread from worker
  const serverStore = await createServerStore(mainThread);

  // Listen for incomming requests
  expose({serverStore}, serverPort);
  serverPort.start();
}
