import createHistoryEnhancer from 'farce/createHistoryEnhancer';
import queryMiddleware from 'farce/queryMiddleware';
import Matcher from 'found/lib/Matcher';
import createMatchEnhancer from 'found/lib/createMatchEnhancer';

import {
  combineReducers,
  compose,
  createStore as baseCreateStore,
  Unsubscribe,
} from 'redux';
import {routeConfig} from '../../../../../../ui/routing';
import {reducers} from '../../../../../../store/reducers';
import BrowserWorkerProtocol from '../../../../../../store/ducks/farce/farce-protocol';
import {proxy, Remote} from 'comlink';
import {createComlinkEnhancer} from './comlink-enhancer';
import {MainThreadApi} from '../../../../main-thread/interface';
import {ServerStore, ServerStoreSubscribeListener} from './interface';
import {createActionCreators} from '../../../../../../store/action-creators';
import {ActionCreators} from '../../../../../../store/interface';

export async function createServerStore(
  mainThread: Remote<MainThreadApi>,
): Promise<{
  actionCreators: ActionCreators;
  serverStore: ServerStore;
}> {
  const browserWorkerProtocol = new BrowserWorkerProtocol(mainThread);

  const serverStore: ServerStore = baseCreateStore(
    combineReducers(reducers),
    compose(
      createComlinkEnhancer(),
      createHistoryEnhancer({
        protocol: browserWorkerProtocol,
        middlewares: [queryMiddleware],
      }),
      createMatchEnhancer(new Matcher(routeConfig)),
    ),
  );

  const actionCreators: ActionCreators = createActionCreators(
    serverStore.dispatch,
  );

  await actionCreators.farce.initializeLocation(
    browserWorkerProtocol,
    mainThread,
  );

  return {actionCreators, serverStore};
}
