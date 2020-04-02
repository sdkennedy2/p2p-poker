import {MainThreadApi} from './interface';
import {wrap, Remote} from 'comlink';

export function createMainThreadClient(
  clientPort: MessagePort,
): Remote<MainThreadApi> {
  const mainThread = wrap<MainThreadApi>(clientPort);
  clientPort.start();
  return mainThread;
}
