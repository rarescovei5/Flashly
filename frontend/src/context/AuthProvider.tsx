import { createContext, useState } from 'react';
import React from 'react';
import { AuthContextType } from '../types';

const initialAuthState = {
  email: '',
  password: '',
  accessToken: '',
};

const AuthContext = createContext<AuthContextType>({
  auth: initialAuthState,
  setAuth: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [auth, setAuth] = useState<typeof initialAuthState>(initialAuthState);

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
