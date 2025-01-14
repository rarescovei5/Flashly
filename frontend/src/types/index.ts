import { Dispatch, SetStateAction } from 'react';

export type UserInfo = {
  username: string;
  email: string;
  password: string;
};
export type AuthContextType = {
  auth: {
    email: string;
    password: string;
    accessToken: string;
  };
  setAuth: Dispatch<
    SetStateAction<{ email: string; password: string; accessToken: string }>
  >;
};
