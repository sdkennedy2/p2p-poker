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
}

export interface PlayersState {
  [playerId: string]: PlayerState;
}

export interface GameState {
  stateMachine: StateMachineState;
  players: PlayersState;
  selfId: string;
}

// Actions
export interface GameJoinAction {
  type: 'gameJoin';
  payload: PlayerState;
}

export type GameAction = GameJoinAction;
