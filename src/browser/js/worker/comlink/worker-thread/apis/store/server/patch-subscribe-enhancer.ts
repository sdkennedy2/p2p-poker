import {
  StoreEnhancer,
  AnyAction,
  StoreCreator,
  Reducer,
  Dispatch,
  Unsubscribe,
} from 'redux';
import {produceWithPatches, Patch} from 'immer';

type StateWithPatches<S> = {state: S; patches: Patch[]};
const initialStateWithPatches = {state: undefined, patches: []};

export function createPatchSubscribeEnhancer(): StoreEnhancer<any> {
  return (createStore: StoreCreator) => <S, A extends AnyAction>(
    baseReducer: Reducer<S, A>,
    ...args: any[]
  ) => {
    const reducerWithPatches = (
      previousStateWithPatches: StateWithPatches<S> = initialStateWithPatches,
      action: A,
    ): StateWithPatches<S> => {
      const {state: previousState} = previousStateWithPatches;
      const [nextState, patches] = produceWithPatches(
        previousState,
        (draft: S) => baseReducer(draft, action),
      );
      return {state: nextState as any, patches};
    };
    const store = createStore(reducerWithPatches, ...args);

    const getState = (): S => store.getState().state;
    const subscribe = (listener: (patches: Patch[]) => void): Unsubscribe => {
      const boundListener = (): void => {
        const {patches} = store.getState();
        listener(patches);
      };
      return store.subscribe(boundListener);
    };

    return {
      ...store,
      getState,
      subscribe,
    };
  };
}
