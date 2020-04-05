import {createGameActionCreators} from './ducks/game/action-creators';
import {ActionCreators, Dispatch} from './interface';
import {createFarceActionCreators} from './ducks/farce/action-creators';

export function createActionCreators(dispatch: Dispatch): ActionCreators {
  return {
    farce: createFarceActionCreators(dispatch),
    game: createGameActionCreators(dispatch),
  };
}
