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
  setAuth: (auth: {
    email: string;
    password: string;
    accessToken: string;
  }) => void;
};
