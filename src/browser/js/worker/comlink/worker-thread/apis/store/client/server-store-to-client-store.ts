import {Dispatch, Unsubscribe} from 'redux';
import {Remote, proxy} from 'comlink';
import {State, Action} from '../../../../../../store/interface';
import {applyPatches, Patch} from 'immer';
import {ServerStore} from '../server/interface';
import {ClientStore} from './interface';

export default async function serverStoreToClientStore(
  serverStore: Remote<ServerStore>,
): Promise<ClientStore> {
  const subscribers = new Set();

  let latestState = await serverStore.getState();
  serverStore.subscribe(
    proxy(async (patches: Patch[]) => {
      const nextState = applyPatches(latestState, patches) as State;
      latestState = nextState;
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
