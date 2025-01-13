import useAuth from './hooks/useAuth';
import { Link } from 'react-router-dom';
import useRefreshToken from './hooks/useRefreshToken';
import { useEffect } from 'react';

const Home = () => {
  const { auth } = useAuth();
  const refresh = useRefreshToken();

  useEffect(() => {
    console.log(auth);
  }, [auth]);

  return (
    <div className="flex flex-col gap-4">
      <Link to={'/sign-in'}>Sign In</Link>
      <Link to={'/sign-up'}>Sign Up</Link>
      <Link to={'/decks'}>decks</Link>
      <Link to={'/decks/discover'}>discover</Link>
      <br />
      <br />
      <br />
      <button onClick={() => refresh()}>Ceva</button>
      <br />
      <br />
      <h1 className="h1">
        {auth?.email ? `Welcome ${auth.email}` : 'You are not logged in'}
      </h1>
    </div>
  );
};

export default Home;
