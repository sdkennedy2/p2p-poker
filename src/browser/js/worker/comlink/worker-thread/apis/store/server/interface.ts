import {Patch} from 'immer';
import {Action as BaseAction, Store, Unsubscribe, Dispatch} from 'redux';
import {State, Action, ActionCreators} from '../../../../../../store/interface';

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

// Saga
export type Take = <
  ActionType extends string,
  Action extends BaseAction<ActionType>
>(
  actionType: ActionType,
) => Promise<Action>;

export interface SagaOptions {
  actionCreators: ActionCreators;
  take: Take;
  getState(): State;
}

export type Saga<R> = (options: SagaOptions) => Promise<R>;
