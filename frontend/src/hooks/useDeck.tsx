import { useEffect, useState } from 'react';
import { DeckType } from '../types';
import useAxiosPrivate from './userAxiosPrivate';

type Flashcard = {
  deck_id: number;
  id: number;
  question: string;
  answer: string;
  ease_factor: number;
  repetitions: number;
  interval_days: number;
  last_reviewed_at: null;
  next_review_at: null;
};

const useDeck = (deckId: number) => {
  const [deck, setDeck] = useState<DeckType>();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const axiosPrivateInstance = useAxiosPrivate();

  const getDeck = async () => {
    try {
      const response = await axiosPrivateInstance.get(`/decks/${deckId}`);
      setDeck(response.data.deck);
      setCards(response.data.deck.flashcards);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getDeck();
  }, []);

  return { deck, setDeck, cards, setCards };
};
export default useDeck;
