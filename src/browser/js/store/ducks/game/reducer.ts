import {v4 as uuid} from 'uuid';

import {GameAction, GameState, StateMachineState} from './interface';

const initialState: GameState = {
  stateMachine: StateMachineState.Lobby,
  players: {},
  selfId: uuid(),
};

export function gameReducer(
  state: GameState = initialState,
  action: GameAction,
): GameState {
  return state;
}
