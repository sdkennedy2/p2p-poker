export type EventListeners<V = void> = (v: V) => void;
export interface EventEmitter<V = void> {
  addEventListener(listener: EventListeners<V>): void;
  removeEventListener(listener: EventListeners<V>): void;
  emit(v: V): void;
}

export const createEventEmitter = <V = void>(): EventEmitter<V> => {
  const listeners: Array<EventListeners<V>> = [];
  return {
    addEventListener(listener: EventListeners<V>): void {
      listeners.push(listener);
    },
    removeEventListener(listener: EventListeners<V>): void {
      const i = listeners.indexOf(listener);
      if (i !== -1) {
        listeners.splice(i);
      }
    },
    emit(v: V): void {
      listeners.forEach((listener) => listener(v));
    },
  };
};
