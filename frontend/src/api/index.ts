import axios from 'axios';
import { UserInfo } from '../types';

const registerURL = 'http://localhost:3000/api/users/register';
const loginURL = 'http://localhost:3000/api/users/login';

export const registerUser = async (user: UserInfo) => {
  try {
    //Create User in the Database
    const res1 = await axios.post(registerURL, user);
    if (res1.data.erorr !== 'error') return res1.data;
    return res1.data;
  } catch (error: any) {
    return error.response.data;
  }
};
export const loginUser = async (user: { email: string; password: string }) => {
  try {
    const response = await axios.post(loginURL, {
      email: user.email,
      password: user.password,
    });
    return response.data;
  } catch (error: any) {
    return error.response.data;
  }
};
