import {historyProxy} from './apis/history-proxy';
import {expose} from 'comlink';

export function createMainThreadServer(serverPort: MessagePort): void {
  return expose({history: historyProxy}, serverPort);
  serverPort.start();
}
