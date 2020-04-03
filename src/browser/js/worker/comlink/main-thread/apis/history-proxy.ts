import {proxy} from 'comlink';

export interface HistoryState {
  key: string;
  index: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any;
}

export interface LocationData {
  href: string;
  protocol: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  origin: string;
}

export type PopStateEvent = {
  historyState: HistoryState;
  location: LocationData;
};
export type PopStateListener = (event: PopStateEvent) => void;

export interface HistoryProxy {
  addPopStateListener: (listener: PopStateListener) => void;
  removePopStateListener: (listener: PopStateListener) => void;
  getLocation(): LocationData;
  getState(): HistoryState;
  pushState(data: HistoryState, title: string, url?: string): void;
  replaceState(data: HistoryState, title: string, url?: string): void;
  go(delta?: number): void;
}

export const getLocation = proxy(
  (): LocationData => {
    const {
      href,
      protocol,
      host,
      hostname,
      port,
      pathname,
      search,
      hash,
      origin,
    } = window.location;
    return {
      href,
      protocol,
      host,
      hostname,
      port,
      pathname,
      search,
      hash,
      origin,
    };
  },
);

// Getters
const getState = (): HistoryState => window.history.state;
const pushState = (data: HistoryState, title: string, url?: string): void => {
  window.history.pushState(data, title, url);
};

// Mutations
const replaceState = (
  data: HistoryState,
  title: string,
  url?: string,
): void => {
  window.history.replaceState(data, title, url);
};
const go = (delta?: number): void => {
  window.history.go(delta);
};

// Pop State Event
const wrappedListenerMap = new WeakMap();

const addPopStateListener = (listener: PopStateListener): void => {
  if (!wrappedListenerMap.has(listener)) {
    wrappedListenerMap.set(listener, () => {
      listener({
        historyState: getState(),
        location: getLocation(),
      });
    });
  }
  const wrappedListener = wrappedListenerMap.get(listener);
  window.addEventListener('popstate', () => {
    wrappedListener();
  });
};

const removePopStateListener = (listener: PopStateListener): void => {
  const wrappedListener = wrappedListenerMap.get(listener);
  if (wrappedListener) {
    window.removeEventListener('popstate', wrappedListener);
  }
};

export const historyProxy: HistoryProxy = {
  getLocation,
  getState,
  pushState,
  replaceState,
  go,
  addPopStateListener,
  removePopStateListener,
};
