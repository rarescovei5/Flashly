import { useEffect, useState } from 'react';
import { DeckType } from '../types';
import useAxiosPrivate from './userAxiosPrivate';

type Flashcard = {
  question: string;
  answer: string;
};

export const contentToObjects = (encryptedString: string): Flashcard[] => {
  const result: Flashcard[] = [];

  let current = 0;
  let i = 0;
  while (i < encryptedString.length) {
    let j = i;
    while (encryptedString[j] !== '@') {
      j++;
    }
    let length = parseInt(encryptedString.slice(i, j), 10);

    if (current % 2 === 0) {
      result.push({ question: '', answer: '' });
      result[Math.floor(current / 2)].question = encryptedString.slice(
        j + 1,
        j + 1 + length
      );
    } else if (current % 2 === 1) {
      result[Math.floor(current / 2)].answer = encryptedString.slice(
        j + 1,
        j + 1 + length
      );
    }

    i = j + 1 + length;
    current++;
  }

  return result;
};
export const contentToString = (cards: Flashcard[]): string => {
  let result = ``;
  for (let i = 0; i < cards.length; i++) {
    result += `${cards[i].question.length}@${cards[i].question}`;
    result += `${cards[i].answer.length}@${cards[i].answer}`;
  }
  return result;
};

const useDeck = (deckId: string) => {
  const [deck, setDeck] = useState<DeckType>();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const axiosPrivateInstance = useAxiosPrivate();

  const getDeck = async () => {
    try {
      const response = await axiosPrivateInstance.get(`/flashcards/${deckId}`);
      setDeck(response.data.deck[0]);
      setCards(contentToObjects(response.data.deck[0].content));
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
