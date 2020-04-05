import {Dispatch as BaseDispatch} from 'redux';

export type ActionContainer<ActionType extends string, Payload> = {
  type: ActionType;
  payload: Payload;
};
export type ActionCreator<Payload, Action> = (payload: Payload) => Action;

export const createActionCreator = <
  ActionType extends string,
  Payload,
  Dispatch extends BaseDispatch<ActionContainer<ActionType, Payload>>
>(
  dispatch: Dispatch,
  type: ActionType,
) => {
  return (payload: Payload): ActionContainer<ActionType, Payload> => {
    const action: ActionContainer<ActionType, Payload> = {
      type,
      payload,
    };
    dispatch(action);
    return action;
  };
};
