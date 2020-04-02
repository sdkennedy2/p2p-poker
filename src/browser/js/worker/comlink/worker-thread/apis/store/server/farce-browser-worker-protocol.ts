import invariant from 'invariant';
import createPath from 'farce/createPath';
import {
  HistoryProxy,
  PopStateEvent,
} from '../worker/comlink/main-thread/apis/history-proxy';
import {Remote, proxy} from 'comlink';
import {MainThreadApi} from '../worker/comlink/main-thread/interface';

export default class BrowserWorkerProtocol {
  _keyPrefix: string;
  _keyIndex: number;
  _index: number;
  _history: Remote<HistoryProxy>;

  constructor(mainThread: Remote<MainThreadApi>) {
    this._keyPrefix = Math.random().toString(36).slice(2, 8);
    this._keyIndex = 0;

    this._index = null;
    this._history = mainThread.history;
  }

  init(event: PopStateEvent) {
    const {historyState, location} = event;
    const {pathname, search, hash} = location;

    const {key, index = 0, state} = historyState || {};
    const delta = this._index != null ? index - this._index : 0;
    this._index = index;

    return {
      action: 'POP',
      pathname,
      search,
      hash,
      key,
      index,
      delta,
      state,
    };
  }

  subscribe(listener): () => void {
    const popStateListener = proxy((event: PopStateEvent): void => {
      listener(this.init(event));
    });
    this._history.addPopStateListener(popStateListener);
    return (): void => {
      this._history.removePopStateListener(popStateListener);
    };
  }

  navigate(location) {
    const {action, state} = location;

    const push = action === 'PUSH';
    invariant(
      push || action === 'REPLACE',
      `Unrecognized browser protocol action: %s.`,
      action,
    );

    const delta = push ? 1 : 0;
    const extraState = this._createExtraState(delta);

    const browserState = {state, ...extraState};
    const path = createPath(location);

    if (push) {
      this._history.pushState(browserState, null, path);
    } else {
      this._history.replaceState(browserState, null, path);
    }

    return {...location, ...extraState, delta};
  }

  go(delta?: number): void {
    this._history.go(delta);
  }

  createHref(location): string {
    return createPath(location);
  }

  _createExtraState(delta: number): {key: string; index: number} {
    const keyIndex = this._keyIndex++;
    this._index += delta;

    return {
      key: `${this._keyPrefix}:${keyIndex.toString(36)}`,
      index: this._index,
    };
  }
}
