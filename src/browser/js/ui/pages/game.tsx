import {RouteProps} from 'found';
import React, {ReactNode} from 'react';

export default function GamePage(props: RouteProps): ReactNode {
  const peerIds: string[] = props.match.params.peers.split(',');
  return <div>{peerIds}</div>;
}
