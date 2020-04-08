import {useSelector} from 'react-redux';
import {getState} from './selectors';
import {StateMachineState} from './interface';
import {useGameLobby} from './states/0-lobby/hooks';

export function useGame() {
  const state = useSelector(getState);
  switch (state) {
    case StateMachineState.Lobby:
      return useGameLobby();
  }
}
