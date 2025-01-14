import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import useDecks from '../hooks/useDecks';
import useAxiosPrivate from '../hooks/userAxiosPrivate';

const Decks = () => {
  const { decks, setDecks } = useDecks();
  const axiosPrivateInstance = useAxiosPrivate();

  useEffect(() => {
    const getDecks = async () => {
      try {
        const response = await axiosPrivateInstance.get('/flashcards');
        setDecks(response.data.decks);
      } catch (error) {
        console.log(error);
      }
    };
    getDecks();
  }, []);

  return (
    <>
      <Navbar />
      <div className="w-[80%] flex-1 mx-auto flex items-center justify-center ">
        {decks.length > 0 ? (
          <div></div>
        ) : (
          <div className=" flex flex-col items-center justify-center mb-20">
            <img src="/noDecks.svg" alt="" />
            <h3 className="h3 mb-6">You currently have no decks!</h3>
            <button className="p-button bg-c-primary text-c-dark px-4 py-2 rounded-2xl">
              Create Deck
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Decks;
