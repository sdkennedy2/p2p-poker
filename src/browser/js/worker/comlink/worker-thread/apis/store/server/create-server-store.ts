import FarcActionTypes from 'farce/ActionTypes';
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
import BrowserWorkerProtocol from './farce-protocol';
import {proxy, Remote} from 'comlink';
import {createPatchSubscribeEnhancer} from './patch-subscribe-enhancer';
import {MainThreadApi} from '../../../../main-thread/interface';
import {ServerStore, ServerStoreSubscribeListener} from './interface';

export async function createServerStore(
  mainThread: Remote<MainThreadApi>,
): Promise<ServerStore> {
  const browserWorkerProtocol = new BrowserWorkerProtocol(mainThread);

  const baseStore: ServerStore = baseCreateStore(
    combineReducers(reducers),
    compose(
      createPatchSubscribeEnhancer(),
      createHistoryEnhancer({
        protocol: browserWorkerProtocol,
        middlewares: [queryMiddleware],
      }),
      createMatchEnhancer(new Matcher(routeConfig)),
    ),
  );

  const baseSubscribe = baseStore.subscribe.bind(baseStore);
  baseStore.subscribe = (
    listener: ServerStoreSubscribeListener,
  ): Unsubscribe => {
    const baseUnsubscribe = baseSubscribe(listener);
    return proxy(() => {
      baseUnsubscribe();
    });
  };

  const [location, historyState] = await Promise.all([
    mainThread.history.getLocation(),
    mainThread.history.getState(),
  ]);
  const updateLocationAction = {
    type: FarcActionTypes.UPDATE_LOCATION,
    payload: browserWorkerProtocol.init({location, historyState}),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
  baseStore.dispatch(updateLocationAction);

  return baseStore;
}
