import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import useDeck from '../hooks/useDeck';

const PlayDeck = () => {
  const deckId = useParams().deckId;
  const { cards } = useDeck(deckId!);

  return (
    <>
      <Navbar />
      PlayDeck {deckId}
      {JSON.stringify(cards)}
    </>
  );
};

export default PlayDeck;
