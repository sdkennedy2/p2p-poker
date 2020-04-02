import foundReducer from 'found/lib/foundReducer';
import {gameReducer} from './ducks/game/reducer';

export const reducers = {
  found: foundReducer,
  players: gameReducer,
};
