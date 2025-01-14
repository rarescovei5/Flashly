import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Navbar = () => {
  const { auth } = useAuth();

  return (
    <div className="flex items-center w-[80%] mx-auto pt-4">
      <div className="flex-1">
        <Link className="h3" to="/">
          Flashly
        </Link>
      </div>
      <div className="rounded-2xl bg-c-light flex-1 px-4 py-2 flex">
        <img className=" mr-2" src="/search.svg" alt="" />
        <input
          className="flex-1 p-small text-[#C6C6C6] placeholder:p-small placeholder:text-[#C6C6C6] bg-transparent   rounded-2xl outline-none"
          type="text"
          placeholder="Search flash cards"
        />
      </div>
      <div className="flex-1 flex justify-end">
        {auth?.email ? (
          <div className="inline-flex gap-4 items-center ">
            <Link className="p-small" to={'/decks'}>
              Decks
            </Link>
            <button className="bg-c-primary p-2 rounded-full">
              <img src="/man.svg" alt="" />
            </button>
          </div>
        ) : (
          <div className="inline-flex gap-4 ">
            <Link
              className="p-small bg-c-light px-4 py-2 rounded-2xl"
              to="/sign-in"
            >
              Signin
            </Link>
            <Link
              className="p-small bg-c-primary text-c-dark px-4 py-2 rounded-2xl"
              to="/sign-up"
            >
              Signup
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
