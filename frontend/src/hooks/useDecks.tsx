import { useEffect, useState } from 'react';
import { DeckType } from '../types';
import useAxiosPrivate from './userAxiosPrivate';

const useDecks = () => {
  const [decks, setDecks] = useState<DeckType[]>([]);
  const axiosPrivateInstance = useAxiosPrivate();

  const getDecks = async () => {
    try {
      const response = await axiosPrivateInstance.get('/decks');
      setDecks(response.data.decks);
    } catch (error) {
      console.log(error);
    }
  };

  const createFlashcard = async () => {
    try {
      await axiosPrivateInstance.post('/decks');
      getDecks();
      return 0;
    } catch (err) {
      return err as any;
    }
  };

  useEffect(() => {
    getDecks();
  }, []);

  return { decks, createFlashcard };
};
export default useDecks;
