import axios from 'axios';
import { UserInfo } from '../types';

const baseURL = 'http://localhost:3000/api';
const registerURL = '/users/register';
const loginURL = '/users/login';
const logoutURL = '/users/logout';

export const axiosPrivateInstance = axios.create({
  baseURL: baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const axiosInstance = axios.create({
  baseURL: baseURL, // Adjust your API base URL
  withCredentials: true, // Include cookies/credentials
  headers: {
    'Content-Type': 'application/json', // Explicitly set content type
  },
});

export const registerUser = async (user: UserInfo) => {
  try {
    //Create User in the Database
    const res1 = await axiosInstance.post(registerURL, user);
    if (res1.data.erorr !== 'error') return res1.data;
    return res1.data;
  } catch (error: any) {
    return error.response.data;
  }
};
export const loginUser = async (user: { email: string; password: string }) => {
  try {
    const response = await axiosInstance.post(loginURL, {
      email: user.email,
      password: user.password,
    });
    return response.data;
  } catch (error: any) {
    return error.response.data;
  }
};
export const logoutUser = async () => {
  try {
    await axiosInstance.post(logoutURL);
  } catch (err) {
    console.log(err);
  }
};
