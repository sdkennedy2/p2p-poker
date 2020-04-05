// Actions

import {ActionContainer, ActionCreator} from '../../util/action-creators';
import {MainThreadApi} from '../../../worker/comlink/main-thread/interface';
import {Remote} from 'comlink';
import {
  LocationData,
  HistoryState,
} from '../../../worker/comlink/main-thread/apis/history-proxy';

export interface FarceLocation {
  action: string;
  pathname: string;
  search: string;
  hash: string;
  key: string;
  index?: number;
  delta: number;
  state?: string;
}

export interface BrowserWorkerProtocol {
  init(payload: {
    location: LocationData;
    historyState: HistoryState;
  }): FarceLocation;
}

// Actions
export type FarceUpdateLocationAction = ActionContainer<
  '@@farce/UPDATE_LOCATION',
  FarceLocation
>;

export type FarceAction = FarceUpdateLocationAction;

// Action creators
export type UpdateLocationActionCreator = ActionCreator<
  FarceLocation,
  FarceUpdateLocationAction
>;
export type InitializeLocationActionCreator = (
  browserWorkerProtocol: BrowserWorkerProtocol,
  mainThread: Remote<MainThreadApi>,
) => Promise<FarceUpdateLocationAction>;

export interface FarceActionCreators {
  initializeLocation: InitializeLocationActionCreator;
}
