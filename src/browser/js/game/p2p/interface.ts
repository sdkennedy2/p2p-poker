import {
  BaseGame,
  BasePlayer,
  OperationsGame,
  OperationsRoundCommunial,
  OperationsRoundPlayer,
  Round,
} from '../interface';
import Peer, {DataConnection} from 'peerjs';

// Data structures
export type P2PCard = {
  value: number;
};

export type P2PDeck = Array<P2PCard>;

export interface P2PPlayer extends BasePlayer {
  name: string;
}

export type P2PPlayerOpponentId = string;

export interface P2PPlayerOpponent extends P2PPlayer {
  name: string;
  connection: DataConnection;
}

export interface P2PPlayerSelf extends P2PPlayer {
  name: string;
  peer: Peer;
}

export interface P2PGame extends BaseGame {
  self: P2PPlayerSelf;
  opponents: Array<P2PPlayerOpponent>;
}

// Game Api
export type P2PCreateGame = (
  self: P2PPlayerSelf,
  opponents: Array<P2PPlayerOpponent>,
) => Promise<P2PGame>;

export type P2PAddOpponent = (
  game: P2PGame,
  opponent: P2PPlayerOpponent,
) => Promise<P2PGame>;

export type P2PRemoveOpponent = (
  game: P2PGame,
  opponent: P2PPlayerOpponent,
) => Promise<P2PGame>;

export interface P2POperationsGame extends OperationsGame<P2PGame, P2PPlayer> {
  createGame: P2PCreateGame;
  addOpponent: P2PAddOpponent;
  removeOpponent: P2PRemoveOpponent;
}

// Communial Round Api
export interface P2POperationsRoundCommunial
  extends OperationsRoundCommunial<P2PGame, P2PCard, P2PDeck> {
  createDeck(game: P2PGame): Promise<P2PDeck>;
  showFlop(game: P2PGame, deck: P2PDeck): Promise<[P2PCard, P2PCard, P2PCard]>;
  showRiver(game: P2PGame, deck: P2PDeck): Promise<[P2PCard]>;
  showTurn(game: P2PGame, deck: P2PDeck): Promise<[P2PCard]>;
}

export interface P2POperationsRoundPlayer
  extends OperationsRoundPlayer<P2PGame, P2PPlayer, P2PDeck, P2PCard> {
  drawHand(
    game: P2PGame,
    player: P2PPlayer,
    deck: P2PDeck,
  ): Promise<{deck: P2PDeck; hand: [P2PCard, P2PCard]}>;
  betOn(
    game: P2PGame,
    player: P2PPlayer,
    afterRound: Round,
    amount: number,
  ): Promise<void>;
  foldOn(
    game: P2PGame,
    player: P2PPlayer,
    afterRound: Round,
    amount: number,
  ): Promise<void>;
}
