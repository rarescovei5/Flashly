import useAuth from './useAuth';
import { axiosInstance } from '../api';

const useRefreshToken = () => {
  const { setAuth } = useAuth();

  const refresh = async () => {
    try {
      const response = await axiosInstance.get('/refresh', {
        withCredentials: true,
      });
      setAuth((prev) => {
        // console.log(JSON.stringify(prev));
        // console.log(JSON.stringify(response.data.accessToken));
        return {
          ...prev,
          accessToken: response.data.accessToken,
        };
      });
      return response.data.accessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
  };

  return refresh;
};

export default useRefreshToken;
