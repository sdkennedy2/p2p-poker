import {FoundState} from 'found';
import {
  GameAction,
  GameState,
  GameActionCreators,
} from './ducks/game/interface';

export interface State {
  found: FoundState;
  game: GameState;
}

export type Action = GameAction;

export interface ActionCreators {
  game: GameActionCreators;
}
