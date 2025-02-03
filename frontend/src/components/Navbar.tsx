import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { useEffect, useState, useRef } from "react";
import { logoutUser } from "../api";
import { initialAuthState } from "../context/AuthProvider";
import useAxiosPrivate from "../hooks/userAxiosPrivate";

const Navbar = () => {
  const AxiosPrivateInstance = useAxiosPrivate();
  const [isOpen, setIsOpen] = useState(false);
  const { auth, setAuth } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<
    { id: string; name: string; username: string }[]
  >([]);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const searchSubmitHandler = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/discover/${searchQuery}`);
    window.location.reload();
  };

  useEffect(() => {
    if (searchQuery.length === 0) {
      setSearchResults([]);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      const fetchData = async () => {
        try {
          const res = await AxiosPrivateInstance.get(
            `/discover/${searchQuery}`,
            { signal: controller.signal }
          );
          setSearchResults(res.data);
        } catch (error) {
          console.error("Error fetching search results:", error);
        }
      };

      fetchData();
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [searchQuery, AxiosPrivateInstance]);

  return (
    <div className="w-[80%] max-md:w-[90%] flex items-center mx-auto pt-4 z-[49]">
      <div className="md:flex-1 overflow-hidden flex items-center max-md:mr-2">
        <Link className="inline-block" to="/">
          <h3 className="h3 hidden md:block">Flashly</h3>
          <img
            className="md:hidden min-w-8 max-w-8"
            src="/web-ico.svg"
            alt="Logo"
          />
        </Link>
      </div>

      {/* Wrap the input and suggestions in a container for focus-within */}
      <div className="relative rounded-2xl bg-c-light flex-1 navbar-input-wrapper">
        <form
          className="w-full flex items-center max-md:px-2 px-4 py-2"
          onSubmit={searchSubmitHandler}
        >
          <input
            ref={inputRef}
            className="p-small navbar-input text-[#C6C6C6] placeholder:p-small flex-1 placeholder:text-[#C6C6C6] bg-transparent outline-none"
            type="text"
            placeholder="Search flash cards"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery.length > 0 ? (
            <button type="submit" className="ml-2 h-full">
              <img src="/search.svg" alt="Search" />
            </button>
          ) : (
            <img className="ml-2 h-full" src="/search.svg" alt="Search" />
          )}
        </form>

        {/* Render dropdown suggestions; CSS handles its visibility */}
        {searchResults.length > 0 && (
          <div className="navbar-input-results absolute top-[110%] left-0 right-0 bg-c-dark border overflow-hidden border-c-light rounded-2xl shadow-lg z-50">
            {searchResults.slice(0, 5).map((result) => (
              <Link
                key={result.id}
                reloadDocument
                className="p-2 cursor-pointer block hover:bg-c-light"
                to={`/decks/discover/${result.id}`}
              >
                <p className="p-body font-medium">{result.name}</p>
                <p className="p-small text-gray-500">By {result.username}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="md:flex-1 flex justify-end max-md:ml-2">
        {auth?.accessToken ? (
          <div className="inline-flex max-md:gap-2 gap-4 items-center">
            <Link className="p-small" to={"/decks"}>
              Decks
            </Link>
            <div className="relative">
              <button
                className="bg-c-primary p-2 rounded-full"
                onClick={() => setIsOpen((prev) => !prev)}
              >
                <img className="min-w-4 max-w-4" src="/man.svg" alt="User" />
              </button>
              {isOpen && (
                <div className="absolute flex flex-col items-center top-[150%] right-0 bg-c-light w-52 rounded-2xl p-4 border-2 border-c-dark">
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
          <div className="inline-flex gap-4">
            <Link
              className="p-small bg-c-light max-md:px-2 px-4 py-2 rounded-2xl"
              to="/sign-in"
            >
              Signin
            </Link>
            <Link
              className="p-small bg-c-primary text-c-dark max-md:px-2 px-4 py-2 rounded-2xl"
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
