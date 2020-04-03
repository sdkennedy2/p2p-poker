import {Dispatch, Unsubscribe} from 'redux';
import {Remote, proxy} from 'comlink';
import {State, Action} from '../../../../../../store/interface';
import {applyPatches, Patch} from 'immer';
import {ServerStore} from '../server/interface';
import {ClientStore} from './interface';

export default async function serverStoreToClientStore(
  serverStore: Remote<ServerStore>,
): Promise<ClientStore> {
  let devTools;
  if (
    typeof window !== 'undefined' &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__REDUX_DEVTOOLS_EXTENSION__
  ) {
    devTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect({
      autoPause: true,
      features: {pause: true, export: true, test: true},
      latency: 500,
      type: 'redux',
    });
  }

  const subscribers = new Set();
  let latestState = await serverStore.getState();
  if (devTools) {
    devTools.init(latestState);
  }

  serverStore.subscribe(
    proxy(async ({action, patches}: {action?: Action; patches: Patch[]}) => {
      const nextState = applyPatches(latestState, patches) as State;
      latestState = nextState;
      if (devTools) {
        devTools.send(action, latestState);
      }
      subscribers.forEach((f: () => void) => f());
    }),
  );
  const dispatch: Dispatch<Action> = (action) => {
    serverStore.dispatch(action);
    return action;
  };
  const subscribe = (listener: () => void): Unsubscribe => {
    subscribers.add(listener);
    return (): void => {
      subscribers.delete(listener);
    };
  };
  const getState = (): State => latestState;
  return {
    dispatch,
    getState,
    subscribe,
  };
}
