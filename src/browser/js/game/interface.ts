// Data structures
export enum Round {
  PreFlop = 1,
  Flop,
  Turn,
  River,
}

export interface BasePlayer {
  name: string;
}
export type BaseGame = {};

// Game API
export interface OperationsGame<Game, Player extends BasePlayer> {
  createGame(self: Player, opponents: Array<Player>): Promise<Game>;
  addOpponent(game: Game, opponent: Player): Promise<Game>;
  removeOpponent(game: Game, opponent: Player): Promise<Game>;
}

export interface OperationsRoundCommunial<Game, Card, Deck> {
  createDeck(game: Game): Promise<Deck>;
  showFlop(game: Game, deck: Deck): Promise<[Card, Card, Card]>;
  showRiver(game: Game, deck: Deck): Promise<[Card]>;
  showTurn(game: Game, deck: Deck): Promise<[Card]>;
}

export interface OperationsRoundPlayer<
  Game,
  Player extends BasePlayer,
  Deck,
  Card
> {
  drawHand(
    game: Game,
    player: Player,
    deck: Deck,
  ): Promise<{deck: Deck; hand: [Card, Card]}>;
  betOn(
    game: Game,
    player: Player,
    afterRound: Round,
    amount: number,
  ): Promise<void>;
  foldOn(
    game: Game,
    player: Player,
    afterRound: Round,
    amount: number,
  ): Promise<void>;
}
