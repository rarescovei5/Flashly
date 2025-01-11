import { useParams } from 'react-router-dom';

const Deck = () => {
  const deckId = useParams().deckId;
  return <div>Deck {deckId}</div>;
};

export default Deck;
