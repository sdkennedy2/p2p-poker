import {SelfState} from './interface';
import {State} from '../../interface';

export const getSelf = (state: State): SelfState | undefined => state.game.self;
