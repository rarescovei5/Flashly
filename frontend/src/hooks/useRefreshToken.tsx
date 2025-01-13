import axios from 'axios';
import useAuth from './useAuth';
import { axiosInstance } from '../api';

const useRefreshToken = () => {
  const { setAuth } = useAuth();

  const refresh = async () => {
    try {
      const response = await axiosInstance.get('/refresh', {
        withCredentials: true,
      });
      console.log('Response:', response.data); // Check if JSON is received
      setAuth((prev) => ({
        ...prev,
        accessToken: response.data.accessToken,
      }));
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
  };

  return refresh;
};

export default useRefreshToken;
