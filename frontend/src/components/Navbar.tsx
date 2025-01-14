import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useState } from 'react';
import { logoutUser } from '../api';
import { initialAuthState } from '../context/AuthProvider';
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { auth, setAuth } = useAuth();

  return (
    <div className="flex items-center w-[80%] mx-auto pt-4 z-[100]">
      <div className="flex-1 overflow-hidden">
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
            <div className="relative">
              <button
                className="bg-c-primary p-2 rounded-full"
                onClick={() => {
                  setIsOpen((prev) => !prev);
                }}
              >
                <img src="/man.svg" alt="" />
              </button>
              {isOpen && (
                <div className="absolute flex flex-col items-center top-[150%] right-0 bg-c-light w-52 rounded-2xl p-4 border-2 border-c-dark">
                  <Link className="mb-4" to="/profile">
                    View profile
                  </Link>
                  <button
                    className="text-c-blue"
                    onClick={() => {
                      logoutUser();
                      setAuth(initialAuthState);
                      window.location.reload();
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
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
