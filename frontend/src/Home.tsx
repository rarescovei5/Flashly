import useAuth from './hooks/useAuth';
import { Link } from 'react-router-dom';
import useRefreshToken from './hooks/useRefreshToken';
import { useEffect } from 'react';
import Navbar from './components/Navbar';

const Home = () => {
  const { auth } = useAuth();
  const refresh = useRefreshToken();

  useEffect(() => {
    console.log(auth);
  }, [auth]);

  return (
    <div className="flex flex-col gap-4">
      <Navbar />
    </div>
  );
};

export default Home;
