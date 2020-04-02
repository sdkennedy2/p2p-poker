import {Dispatch, Unsubscribe} from 'redux';
import {Action, State} from '../../../../../../store/interface';

export interface ClientStore {
  dispatch: Dispatch<Action>;
  getState(): State;
  subscribe(listener: () => void): Unsubscribe;
}
