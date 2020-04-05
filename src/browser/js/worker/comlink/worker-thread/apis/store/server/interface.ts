import {Patch} from 'immer';
import {Store, Unsubscribe, Dispatch} from 'redux';
import {State, Action} from '../../../../../../store/interface';

export type ServerStoreSubscribeListenerPayload = {
  action?: Action;
  patches: Patch[];
};
export type ServerStoreSubscribeListener = (
  payload: ServerStoreSubscribeListenerPayload,
) => void;

export type ServerStoreSubscribe = (
  listener: ServerStoreSubscribeListener,
) => Unsubscribe;
export interface ServerStore extends Store<State, Action> {
  dispatch: Dispatch<Action>;
  getState(): State;
  subscribe: ServerStoreSubscribe;
}
