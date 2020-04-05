import {AnyAction} from 'redux';

export function createReducer<State, Action extends AnyAction>(
  reducerMap,
  initialState,
) {
  return function reducer(state: State = initialState, action: Action): State {
    const reducer = reducerMap[action.type];
    return reducer ? reducer(state, action) : state;
  };
}
