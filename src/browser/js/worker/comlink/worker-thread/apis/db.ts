import {GameState} from '../../../../store/ducks/game/interface';

const DB_NAME = 'p2p-poker';
const DB_VERSION = 1;
const STORE_GAME = 'game';

let db: Promise<IDBDatabase>;
const idb: IDBFactory = (self as any).idb;

export function openDb(): Promise<IDBDatabase> {
  if (!db) {
    db = new Promise((resolve, reject) => {
      const request = idb.open(DB_NAME, DB_VERSION);
      request.addEventListener('upgradeneeded', (event: Event): void => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db: IDBDatabase = (event.target as any).result;
        db.createObjectStore(STORE_GAME, {keyPath: 'id'});
        resolve(this.result);
      });
      request.addEventListener('success', (): void => {
        resolve(request.result);
      });
      request.addEventListener('error', (): void => {
        reject(request.error);
      });
    });
  }
  return db;
}

function handleRequest<R>(request: IDBRequest): Promise<R> {
  return new Promise((resolve, reject) => {
    const handleError = (): void => {
      reject(request.error);
      request.removeEventListener('error', handleError);
    };
    const handleSuccess = (): void => {
      reject(request.result);
      request.removeEventListener('success', handleSuccess);
    };
    request.addEventListener('error', handleError);
    request.addEventListener('success', handleSuccess);
  });
}

async function get<R>(
  db: IDBDatabase,
  storeName: string,
  id: string,
): Promise<R> {
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  const request = store.get(id);
  const raw = await handleRequest<string | undefined>(request);
  return raw ? JSON.parse(raw) : undefined;
}

async function put<E>(
  db: IDBDatabase,
  storeName: string,
  entity: E,
): Promise<void> {
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  const serializedEntity = JSON.stringify(entity);
  const request = store.put(serializedEntity);
  await handleRequest(request);
}
