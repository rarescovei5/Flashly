import { useState } from 'react';
import { DeckType } from '../types';

const useDeck = () => {
  const [deck, setDeck] = useState<DeckType>();

  return { deck, setDeck };
};
export default useDeck;
