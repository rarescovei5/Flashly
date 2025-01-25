import { useEffect, useState } from 'react';
import { DeckType, Flashcard } from '../types';
import useAxiosPrivate from './userAxiosPrivate';
import { useNavigate } from 'react-router-dom';

const useDeck = (deckId: number) => {
  const navigate = useNavigate();
  const [deck, setDeck] = useState<DeckType>();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const axiosPrivateInstance = useAxiosPrivate();

  const getDeck = async () => {
    try {
      const response = await axiosPrivateInstance.get(`/decks/${deckId}`);

      setDeck(response.data.deck);
      setCards(response.data.deck.flashcards);
    } catch (error) {
      navigate('/decks');
    }
  };

  useEffect(() => {
    getDeck();
  }, []);

  return { deck, setDeck, cards, setCards };
};
export default useDeck;
