import {ServerStore} from './apis/store/server/interface';
import {ClientStore} from './apis/store/client/interface';

export interface WorkerThreadApi {
  serverStore: ServerStore;
}

export interface WorkerThreadClient {
  clientStore: ClientStore;
}
