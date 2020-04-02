// 160 bit number
export type DHTID = number;
export type DHTLocation = {};
export type DHTLocationIdTuple = {location: DHTLocation; id: DHTID};
export type DHTLocationIdTuples = Array<DHTLocationIdTuple>;
export type DHTValue = string;
export type DHTResponse<Payload> = Promise<{rpdId: DHTID; payload: Payload}>;

export type DHTRPCPing = (rpcId: DHTID) => DHTResponse<void>;
export type DHTRPCStore = (rpcId: DHTID) => DHTResponse<void>;
export type DHTRPCFindNode = (
  rpcId: DHTID,
  nodeId: DHTID,
) => DHTResponse<DHTLocationIdTuples>;
export type DHTRPCFindValue = (
  rpcId: DHTID,
  nodeId: DHTID,
) => DHTResponse<DHTLocationIdTuples | DHTValue>;

export interface DHTRPCs {
  ping: DHTRPCPing;
  store: DHTRPCStore;
  findNode: DHTRPCFindNode;
  findValue: DHTRPCFindValue;
}

export interface DHTParameters {
  /*
  Used for finding k closest nodes for a key.
  */
  kBucketSize: number;
  /*
  Number of concurrent requests to different receipients that are sent at a time.
  */
  concurrency: number;
}
