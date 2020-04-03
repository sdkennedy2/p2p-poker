import {createGameActionCreators} from './ducks/game/action-creators';
import {ActionCreators} from './interface';

export function createActionCreators(dispatch): ActionCreators {
  return {
    game: createGameActionCreators(dispatch),
  };
}
