import {FoundState} from 'found';
import {GameAction, GameState} from './ducks/game/interface';

export interface State {
  found: FoundState;
  game: GameState;
}

export type Action = GameAction;
