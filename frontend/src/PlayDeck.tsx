import { useParams } from 'react-router-dom';

const PlayDeck = () => {
  const deckId = useParams().deckId;

  return <div>PlayDeck {deckId}</div>;
};

export default PlayDeck;
