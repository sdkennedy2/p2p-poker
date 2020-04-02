import {Patch} from 'immer';
import {Store, Unsubscribe, Dispatch} from 'redux';
import {State, Action} from '../../../../../../store/interface';

export type ServerStoreSubscribeListener = (patches: Patch[]) => void;
export interface ServerStore extends Store<State, Action> {
  dispatch: Dispatch<Action>;
  getState(): State;
  subscribe(listener: ServerStoreSubscribeListener): Unsubscribe;
}
