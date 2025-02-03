import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import useAxiosPrivate from "../hooks/userAxiosPrivate";
import { Link, useParams } from "react-router-dom";
import Cardstack from "../components/Cardstack";

const Discover = () => {
  const searchQuery = useParams().query!;
  const AxiosPrivateInstance = useAxiosPrivate();
  const [decksSearch, setDecksSearch] = useState<
    { id: string; name: string; username: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  console.log(searchQuery);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await AxiosPrivateInstance.get(`/discover/${searchQuery}`);
        setDecksSearch(res.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching search results:", error);
      }
    };

    fetchData();
  }, []);

  const gridStyles = {
    display: "grid",
    gridTemplateColumns: `repeat(auto-fit, minmax(280px, ${
      decksSearch.length > 2 || window.innerWidth < 768 ? "1fr" : "240px"
    }))`,
    gridTemplateRows: "max-content",
    gap: "2rem",
  };

  return (
    <>
      <Navbar />
      {isLoading ? (
        <div className="w-[80%] max-md:w-[90%] flex-1 my-10 mx-auto flex justify-center items-center loading">
          <div></div>
          <div></div>
          <div></div>
        </div>
      ) : decksSearch.length > 0 ? (
        <div
          style={gridStyles}
          className="w-[80%] max-md:w-[90%] flex-1 my-10 mx-auto overflow-y-auto pr-4"
        >
          {decksSearch.map((deck) => {
            return (
              <div className="flex flex-col" key={deck.id}>
                <div className="relative h-60">
                  <Link to={`/decks/discover/${deck.id}`}>
                    <div className="absolute left-4 top-4 bg-c-dark px-2 py-2 rounded-full z-10">
                      <svg
                        width="8"
                        height="8"
                        viewBox="0 0 8 8"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M7.33034 2.94124C7.53258 3.0434 7.70175 3.1959 7.81971 3.38242C7.93768 3.56893 8 3.78242 8 4C8 4.21759 7.93768 4.43108 7.81971 4.61759C7.70175 4.8041 7.53258 4.95661 7.33034 5.05877L1.93564 7.84549C1.06698 8.29468 0 7.71069 0 6.78712V1.21329C0 0.289314 1.06698 -0.294268 1.93564 0.154118L7.33034 2.94124Z"
                          fill="white"
                        />
                      </svg>
                    </div>

                    {Math.random() * 3 > 1 ? (
                      Math.random() * 3 > 2 ? (
                        <Cardstack length={3} color={"c-primary"} />
                      ) : (
                        <Cardstack length={2} color={"c-primary"} />
                      )
                    ) : (
                      <Cardstack length={1} color={"c-primary"} />
                    )}
                  </Link>
                </div>
                <div className="mt-2">
                  <p className="p-body">{deck.name}</p>
                  <p className="p-small text-gray-300">@{deck.username}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="w-[80%] max-md:w-[90%] flex flex-col items-center justify-center mb-20 flex-1 mx-auto  ">
          <img src="/noDecks.svg" alt="" />
          <h3 className="h3 mb-6">No results found</h3>
        </div>
      )}
    </>
  );
};

export default Discover;
