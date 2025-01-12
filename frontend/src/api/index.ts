import axios from 'axios';
import { UserInfo } from '../types';

export const api = axios.create({
  baseURL: 'http://localhost:3000',
});

const registerURL = '/api/users';

export const createUser = async (user: UserInfo) => {
  let response;
  try {
    response = await api.post(registerURL, user);
  } catch (error) {
    console.error(error);
  }

  if (response!.data.error !== '') return response!.data.error;
};
