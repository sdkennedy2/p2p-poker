import {ClientStore} from './interface';
import {ServerStore} from '../server/interface';
import serverStoreToClientStore from './server-store-to-client-store';
import {Remote} from 'comlink';
import {devToolsWrapper} from './dev-tools-wrapper';

export async function createClientStore(
  serverStore: Remote<ServerStore>,
): Promise<ClientStore> {
  let clientStore = await serverStoreToClientStore(serverStore);
  clientStore = devToolsWrapper(clientStore);
  return clientStore;
}
