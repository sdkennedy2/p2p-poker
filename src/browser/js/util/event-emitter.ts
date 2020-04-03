const MAX_BUFFER_SIZE = 20;

export function createBufferedEventEmitter() {
  const allListeners = new Set();
  let buffer = [];
  const listeners = {};
  function addEventListener(name: string, listener) {
    listeners[name] = listeners[name] || new Set();
    listeners[name].add(listener);
    allListeners.add(listener);
    buffer.forEach((event) => listener(event));
    buffer = [];
  }
  function removeEventListener(name: string, listener) {
    listeners[name] = listeners[name] || new Set();
    listeners[name].delete(listener);
    allListeners.delete(listener);
  }
  function emit(event) {
    buffer.push(event);
    if (buffer.length > MAX_BUFFER_SIZE) {
      buffer.splice(0, 1);
    }
    listeners[event.type] = listeners[event.type] || new Set();
    listeners[event.type].forEach((listener) => listener(event));
  }
  return {
    addEventListener,
    removeEventListener,
    emit,
  };
}
