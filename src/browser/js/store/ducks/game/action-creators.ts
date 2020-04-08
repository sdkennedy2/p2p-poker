import {v4 as uuid} from 'uuid';
import {createActionCreator} from '../../util/action-creators';
import {ACTION_TYPE_JOIN_GAME, ACTION_TYPE_INIT_GAME} from './constants';
import {
  GameActionCreators,
  GameJoinActionCreator,
  GameInitActionCreator,
  GameInitAction,
  PeerId,
  StateMachineState,
  GameState,
  LoadingStatus,
} from './interface';
import {Dispatch} from '../../interface';

function createInitialState(
  status: LoadingStatus = LoadingStatus.Unloaded,
): GameState {
  return {
    id: uuid(),
    status,
    stateMachine: StateMachineState.Lobby,
    players: {},
  };
}

export const createGameInitActionCreator = (dispatch: Dispatch) => {
  return async ({
    gameId,
    peers,
  }: {
    gameId?: string;
    peers: PeerId[];
  }): Promise<void> => {
    const action: GameInitAction = {
      type: ACTION_TYPE_INIT_GAME,
      payload: createInitialState(LoadingStatus.Loading),
    };
    dispatch(action);
  };
};

export function createGameActionCreators(dispatch): GameActionCreators {
  const initGame: GameInitActionCreator = createGameInitActionCreator(dispatch);
  const joinGame: GameJoinActionCreator = createActionCreator(
    dispatch,
    ACTION_TYPE_JOIN_GAME,
  );
  return {
    initGame,
    joinGame,
  };
}
