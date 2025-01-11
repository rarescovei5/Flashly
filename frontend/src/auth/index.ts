import axios from 'axios';

export const Signup = async () => {
  const response = await axios.post('/api/auth/signup');
  return response.data;
};
export const Authenticate = async () => {};
