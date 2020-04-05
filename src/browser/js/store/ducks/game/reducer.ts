import {v4 as uuid} from 'uuid';

import {
  GameAction,
  GameState,
  StateMachineState,
  GameJoinAction,
} from './interface';
import {ACTION_TYPE_JOIN_GAME} from './constants';
import {createReducer} from '../../util/reducer';

const initialState: GameState = {
  stateMachine: StateMachineState.Lobby,
  players: {},
  self: undefined,
};

function joinGameReducer(
  state: GameState,
  {payload}: GameJoinAction,
): GameState {
  state.players[payload.id] = payload;
  return state;
}

export const gameReducer = createReducer<GameState, GameAction>(
  {
    [ACTION_TYPE_JOIN_GAME]: joinGameReducer,
  },
  initialState,
);
