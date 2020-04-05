import {
  ServerStoreSubscribe,
  ServerStoreSubscribeListenerPayload,
} from './interface';

export function createTake(subscribe: ServerStoreSubscribe) {
  return function take<Action>(actionType): Promise<Action> {
    return new Promise((resolve) => {
      const unsubscribe = subscribe(
        ({action}: ServerStoreSubscribeListenerPayload) => {
          if (action.type === actionType) {
            resolve(action as any);
            unsubscribe();
          }
        },
      );
    });
  };
}
