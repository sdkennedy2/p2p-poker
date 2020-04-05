import {Dispatch as BaseDispatch} from 'redux';

import {FoundState} from 'found';
import {
  GameAction,
  GameState,
  GameActionCreators,
} from './ducks/game/interface';
import {FarceAction, FarceActionCreators} from './ducks/farce/interface';

export interface State {
  found: FoundState;
  game: GameState;
}

export type Action = FarceAction | GameAction;

export interface ActionCreators {
  farce: FarceActionCreators;
  game: GameActionCreators;
}

export type Dispatch = BaseDispatch<Action>;
