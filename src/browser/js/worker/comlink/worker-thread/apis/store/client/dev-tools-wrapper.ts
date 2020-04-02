import {Action} from '../../../../../../store/interface';
import {Dispatch} from 'redux';
import {ClientStore} from './interface';

export function devToolsWrapper(store: ClientStore): ClientStore {
  if (
    typeof window !== 'undefined' &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__REDUX_DEVTOOLS_EXTENSION__
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const devTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect({
      autoPause: true,
      features: {pause: true, export: true, test: true},
      latency: 500,
      type: 'redux',
    });
    devTools.init(store.getState());
    const oldDispatch = store.dispatch;

    const newDispatch: Dispatch<Action> = <A extends Action>(action: A): A => {
      const result = oldDispatch(action);
      devTools.send(action, store.getState());
      return result;
    };

    return {
      ...store,
      dispatch: newDispatch,
    };
  }
  return store;
}
