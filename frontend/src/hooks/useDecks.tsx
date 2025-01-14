import { useState } from 'react';

export const initialDeckState = {
  id: 5,
  user_id: 1,
  name: 'Deck [object Object]',
  content: '8@Question6@Answer',
  settings: '',
  upvotes: 0,
  downvotes: 0,
  created_at: '2025-01-14T09:25:36.000Z',
  updated_at: '2025-01-14T09:25:36.000Z',
};

const useDecks = () => {
  const [decks, setDecks] = useState<(typeof initialDeckState)[]>([]);

  return { decks, setDecks };
};
export default useDecks;
