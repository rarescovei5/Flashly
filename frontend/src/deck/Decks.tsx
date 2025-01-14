import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import useDecks from '../hooks/useDecks';
import useAxiosPrivate from '../hooks/userAxiosPrivate';
import { Link } from 'react-router-dom';
import Cardstack from '../components/Cardstack';
import ErrorPopup from '../components/ErrorPopup';

const getColor = (settings: string) => {
  if (settings.includes('c-light')) return 'c-light';
  if (settings.includes('c-primary')) return 'c-primary';
  if (settings.includes('c-blue')) return 'c-blue';
  if (settings.includes('c-green')) return 'c-green';
  if (settings.includes('c-orange')) return 'c-orange';
  if (settings.includes('c-pink')) return 'c-pink';
  return 'c-primary';
};

const Decks = () => {
  const { decks, setDecks } = useDecks();
  const [errorMsg, setErrorMsg] = useState('');
  const [creating, setCreating] = useState<boolean>(false);
  const axiosPrivateInstance = useAxiosPrivate();

  const gridStyles = {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fit, minmax(240px, ${
      decks.length > 5 ? '1fr' : '240px'
    }))`,
    gridTemplateRows: 'max-content',
    gap: '1rem',
  };

  //Send request to server
  const getDecks = async () => {
    try {
      const response = await axiosPrivateInstance.get('/flashcards');

      setDecks(response.data.decks);
    } catch (error) {
      console.log(error);
    }
  };

  const createFlashcard = async () => {
    try {
      await axiosPrivateInstance.post('/flashcards');
      getDecks();
    } catch (err) {
      setErrorMsg((err as any).response.data.error);
      console.log(errorMsg);
    }
  };

  //Use Effects
  useEffect(() => {
    getDecks();
  }, []);

  useEffect(() => {
    if (!creating) {
      return;
    }

    if (decks.length >= 10) {
      setCreating(false);
      setErrorMsg('You can only have 10 decks');
      return;
    }

    const timeout = setTimeout(() => {
      createFlashcard();
      setCreating(false);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [creating]);

  return (
    <>
      <ErrorPopup
        error={errorMsg}
        setError={setErrorMsg}
        xr={2}
        xl={2}
        yt={2}
      />
      <Navbar />

      {decks.length > 0 ? (
        <div
          style={gridStyles}
          className="w-[80%] flex-1 my-10 mx-auto overflow-y-auto pr-4"
        >
          {decks.map((deck) => {
            return (
              <div className="flex flex-col" key={`${deck.id}`}>
                <div className="relative h-80">
                  <Link to={`/decks/${deck.id}`}>
                    <div className="absolute left-4 top-4 bg-c-dark px-2 py-2 rounded-full">
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

                    {(deck.content.match(/;/g) || []).length > 1 ? (
                      (deck.content.match(/;/g) || []).length > 2 ? (
                        <Cardstack length={3} color={getColor(deck.settings)} />
                      ) : (
                        <Cardstack length={2} color={getColor(deck.settings)} />
                      )
                    ) : (
                      <Cardstack length={1} color={getColor(deck.settings)} />
                    )}
                  </Link>
                </div>
                <div className="mt-2">
                  <p className="p-small">{deck.name}</p>
                </div>
              </div>
            );
          })}
          <button
            className="flex flex-col items-center justify-center bg-c-light rounded-2xl h-80"
            onClick={() => {
              setErrorMsg('');
              setCreating(true);
            }}
          >
            <img src="/plus.svg" alt="" />
          </button>
        </div>
      ) : (
        <div className=" flex flex-col items-center justify-center mb-20 w-[80%] flex-1 mx-auto  ">
          <img src="/noDecks.svg" alt="" />
          <h3 className="h3 mb-6">You currently have no decks!</h3>
          <button className="p-button bg-c-primary text-c-dark px-4 py-2 rounded-2xl">
            Create Deck
          </button>
        </div>
      )}
    </>
  );
};

export default Decks;
