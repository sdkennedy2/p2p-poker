import {Signal, SignalEvent} from './signal';

export function createPeer({
  signal,
  destinationId,
  initialEvent,
  polite,
}: {
  signal: Signal;
  destinationId: string;
  initialEvent?: SignalEvent;
  polite: boolean;
}): RTCDataChannel {
  const pc = new RTCPeerConnection({
    iceServers: [{urls: 'stun:stun.l.google.com:19302'}],
  });
  const dc = pc.createDataChannel('both', {negotiated: true, id: 0});

  // Perfect negotiation
  // https://w3c.github.io/webrtc-pc/#perfect-negotiation-example

  // keep track of some negotiation state to prevent races and errors
  let makingOffer = false;
  let ignoreOffer = false;

  pc.onicecandidate = ({candidate}): void => {
    if (!candidate) return;
    signal.candidate({candidate, destinationId});
  };

  // let the "negotiationneeded" event trigger offer generation
  pc.onnegotiationneeded = async (): Promise<void> => {
    try {
      makingOffer = true;
      const offer = await pc.createOffer();
      if (pc.signalingState != 'stable') return;
      await pc.setLocalDescription(offer);
      signal.description({
        description: pc.localDescription,
        destinationId,
      });
    } catch (err) {
      console.error(err);
    } finally {
      makingOffer = false;
    }
  };

  const handleEvent = async (event: SignalEvent): Promise<void> => {
    if (event.action === 'description') {
      const {description} = event.payload;

      const offerCollision =
        description.type == 'offer' &&
        (makingOffer || pc.signalingState != 'stable');

      ignoreOffer = false;
      if (offerCollision) {
        if (!polite) {
          ignoreOffer = true;
          return;
        }
        await Promise.all([
          pc.setLocalDescription({type: 'rollback'}),
          pc.setRemoteDescription(description),
        ]);
      } else {
        await pc.setRemoteDescription(description);
      }
      if (description.type == 'offer') {
        await pc.setLocalDescription(await pc.createAnswer());
        signal.description({description: pc.localDescription, destinationId});
      }
    } else if (event.action === 'candidate') {
      const {candidate} = event.payload;
      try {
        await pc.addIceCandidate(candidate);
      } catch (err) {
        if (!ignoreOffer) throw err; // Suppress ignored offer's candidates
      }
    }
  };
  if (initialEvent) {
    handleEvent(initialEvent);
  }

  signal.addEventListener((event) => {
    if (event !== initialEvent) {
      handleEvent(event);
    }
  }, destinationId);

  return dc;
}
