import {
  P2PPlayerSelf,
  P2PGame,
  P2PCreateGame,
  P2PPlayerOpponent,
  P2PPlayerOpponentId,
} from './interface';
import {createPeer, connectOutboundConnection} from './communication';

const createSelf = async (name: string): Promise<P2PPlayerSelf> => {
  const peer = await createPeer();
  return {
    name,
    peer,
  };
};

const createOpponent = async (
  self: P2PPlayerSelf,
  id: P2PPlayerOpponentId,
): Promise<P2PPlayerOpponent> => {
  const connection = await connectOutboundConnection(self.peer, id);
  return {
    connection,
  };
};

const createGame: P2PCreateGame = async (
  self: P2PPlayerSelf,
): Promise<P2PGame> => {
  return {
    self: self,
    opponents: [],
  };
};
