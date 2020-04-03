import {v4 as uuid} from 'uuid';

import {
  GameAction,
  GameState,
  StateMachineState,
  GameJoinAction,
} from './interface';
import {ACTION_TYPE_JOIN_GAME} from './constants';
import {AnyAction} from 'redux';

const initialState: GameState = {
  stateMachine: StateMachineState.Lobby,
  players: {},
  selfId: uuid(),
};

function joinGameReducer(
  state: GameState,
  {payload}: GameJoinAction,
): GameState {
  state.players[payload.id] = payload;
  return state;
}

const reducerMap = {
  [ACTION_TYPE_JOIN_GAME]: joinGameReducer,
};

function createReducer<State, Action extends AnyAction>(
  reducerMap,
  initialState,
) {
  return function reducer(state: State = initialState, action: Action) {
    const reducer = reducerMap[action.type];
    return reducer ? reducer(state, action) : state;
  };
}

export const gameReducer = createReducer<GameState, GameAction>(
  {
    [ACTION_TYPE_JOIN_GAME]: joinGameReducer,
  },
  initialState,
);
