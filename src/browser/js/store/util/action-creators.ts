import {Dispatch, AnyAction} from 'redux';

export type ActionContainer<ActionType extends string, Payload> = {
  type: ActionType;
  payload: Payload;
};
export type ActionCreator<Payload> = (payload: Payload) => void;

export const createActionCreator = <ActionType extends string, Payload>(
  dispatch: Dispatch<AnyAction>,
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
