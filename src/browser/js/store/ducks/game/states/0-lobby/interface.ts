import {PlayersState} from '../../interface';

interface GameLobby {
  actions: {
    join: () => void;
    ready: () => void;
  };
  state: {
    players: PlayersState;
  };
}
