import {makeRouteConfig, Route, createBrowserRouter} from 'found';
import React from 'react';
import GamePage from './pages/game';

export const routeConfig = makeRouteConfig(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <Route path="/:peers?" Component={GamePage as any} />,
);

export const BrowserRouter = createBrowserRouter({
  routeConfig,
});
