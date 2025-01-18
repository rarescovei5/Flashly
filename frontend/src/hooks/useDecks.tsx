import { useState } from 'react';
import { DeckType } from '../types';

const useDecks = () => {
  const [decks, setDecks] = useState<DeckType[]>([]);

  return { decks, setDecks };
};
export default useDecks;
