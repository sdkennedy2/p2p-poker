import {ServerStore} from './apis/store/server/interface';
import {ClientStore} from './apis/store/client/interface';
import {ActionCreators} from '../../../store/interface';
import {Remote} from 'comlink';

export interface WorkerThreadApi {
  actionCreators: ActionCreators;
  serverStore: ServerStore;
}

export interface WorkerThreadClient {
  actionCreators: Remote<ActionCreators>;
  clientStore: ClientStore;
}
