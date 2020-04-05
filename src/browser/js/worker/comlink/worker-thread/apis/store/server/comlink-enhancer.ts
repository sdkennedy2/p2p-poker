import {
  StoreEnhancer,
  AnyAction,
  StoreCreator,
  Reducer,
  Unsubscribe,
} from 'redux';
import {produceWithPatches, Patch} from 'immer';
import {proxy} from 'comlink';

type StateWithPatches<A, S> = {action?: A; state: S; patches: Patch[]};

const initialStateWithPatches = {
  action: undefined,
  state: undefined,
  patches: [],
};

export function createComlinkEnhancer(): StoreEnhancer<any> {
  return (createStore: StoreCreator) => <S, A extends AnyAction>(
    baseReducer: Reducer<S, A>,
    ...args: any[]
  ) => {
    const reducerWithPatches = (
      previousStateWithPatches: StateWithPatches<
        A,
        S
      > = initialStateWithPatches,
      action: A,
    ): StateWithPatches<A, S> => {
      const {state: previousState} = previousStateWithPatches;
      const [nextState, patches] = produceWithPatches(
        previousState,
        (draft: S) => baseReducer(draft, action),
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return {action, state: nextState as any, patches};
    };
    const store = createStore(reducerWithPatches, ...args);

    const getState = (): S => store.getState().state;
    const subscribe = (
      listener: (payload: {action: A; patches: Patch[]}) => void,
    ): Unsubscribe => {
      const boundListener = (): void => {
        const {action, patches} = store.getState();
        listener({action, patches});
      };
      const unsubscribe = store.subscribe(boundListener);
      return proxy(unsubscribe);
    };

    return {
      ...store,
      getState,
      subscribe,
    };
  };
}
