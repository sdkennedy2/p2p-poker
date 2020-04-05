import FarcActionTypes from 'farce/ActionTypes';
import {createActionCreator} from '../../util/action-creators';
import {
  InitializeLocationActionCreator,
  FarceUpdateLocationAction,
  UpdateLocationActionCreator,
  FaceActionCreators,
  BrowserWorkerProtocol,
} from './interface';
import {MainThreadApi} from '../../../worker/comlink/main-thread/interface';
import {Remote} from 'comlink';
import {Dispatch} from '../../interface';

function createInitializeLocation(updateLocation: UpdateLocationActionCreator) {
  return async function initializeLocation(
    browserWorkerProtocol: BrowserWorkerProtocol,
    mainThread: Remote<MainThreadApi>,
  ): Promise<FarceUpdateLocationAction> {
    const [location, historyState] = await Promise.all([
      mainThread.history.getLocation(),
      mainThread.history.getState(),
    ]);
    const farceLocation = browserWorkerProtocol.init({location, historyState});
    return updateLocation(farceLocation);
  };
}

export function createFarceActionCreators(
  dispatch: Dispatch,
): FaceActionCreators {
  const updateLocation: UpdateLocationActionCreator = createActionCreator(
    dispatch,
    FarcActionTypes.UPDATE_LOCATION,
  );
  const initializeLocation: InitializeLocationActionCreator = createInitializeLocation(
    updateLocation,
  );
  return {
    initializeLocation,
  };
}
