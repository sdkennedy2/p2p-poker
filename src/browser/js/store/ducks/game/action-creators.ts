import {createActionCreator} from '../../util/action-creators';
import {ACTION_TYPE_JOIN_GAME} from './constants';
import {GameActionCreators} from './interface';

export function createGameActionCreators(dispatch): GameActionCreators {
  const joinGame = createActionCreator(dispatch, ACTION_TYPE_JOIN_GAME);
  return {
    joinGame,
  };
}
