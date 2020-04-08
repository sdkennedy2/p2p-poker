import {ACTION_TYPE_JOIN_GAME, ACTION_TYPE_INIT_GAME} from './constants';
import {ActionCreator, ActionContainer} from '../../util/action-creators';
import Peer, {DataConnection} from 'peerjs';

// State
export enum StateMachineState {
  Lobby,
  Preflop,
  Flop,
  Turn,
  River,
  PostRiver,
  Shuffling,
}
/*
Lobby
- Pool of decks are each decided on
- 50% of player click ready transitions to Preflop
Preflop
- Key transmission
  - All players transmit preflop card private keys
  - If player doesn't transmit their key within timeout
    - They are no longer sitting at a table
    - Next deck is used
- Parties record time of last private key as start of 1st player betting timer

*/

export interface PlayerState {
  id: string;
  name: string;
  balance: number;
  publicKey: string;
}

export interface PlayersState {
  [playerId: string]: PlayerState;
}

export interface SelfState {
  id: string;
  publicKey: string;
  privateKey: string;
}

export enum LoadingStatus {
  Unloaded,
  Loading,
  Ready,
  Error,
}

export interface GameState {
  id: string;
  status: LoadingStatus;
  stateMachine: StateMachineState;
  players: PlayersState;
}

// Actions
export type PeerId = string;
export type GameInitAction = ActionContainer<
  typeof ACTION_TYPE_INIT_GAME,
  GameState
>;

export type GameJoinAction = ActionContainer<
  typeof ACTION_TYPE_JOIN_GAME,
  PlayerState
>;
export type GameAction = GameInitAction | GameJoinAction;

// Action creator
export type GameInitActionCreator = (options: {
  peers: PeerId[];
}) => Promise<void>;
export type GameJoinActionCreator = ActionCreator<PlayerState, GameJoinAction>;
export interface GameActionCreators {
  initGame: GameInitActionCreator;
  joinGame: GameJoinActionCreator;
}
