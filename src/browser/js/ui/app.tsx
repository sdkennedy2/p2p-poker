import React, {ReactNode} from 'react';
import {createBrowserRouter, makeRouteConfig, Route, RouteProps} from 'found';
import {Provider} from 'react-redux';
import {ClientStore} from '../worker/comlink/worker-thread/apis/store/client/interface';

function GamePage(props: RouteProps): ReactNode {
  const {peers = ''} = props.match.params || {};
  const peerIds: string[] = peers.split(',');
  return <div>{peerIds}</div>;
}

const BrowserRouter = createBrowserRouter({
  routeConfig: makeRouteConfig(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Route path="/:peers?" Component={GamePage as any} />,
  ),
});

export default function App({store}: {store: ClientStore}): JSX.Element {
  return (
    <Provider store={store}>
      <BrowserRouter />
    </Provider>
  );
}
