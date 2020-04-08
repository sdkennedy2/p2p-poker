import {SelfState, PlayersState} from './interface';
import {State} from '../../interface';

export const getState = (state: State): SelfState | undefined =>
  state.game.self;
export const getSelf = (state: State): SelfState | undefined => state.game.self;
export const getPlayers = (state: State): PlayersState => state.game.players;
