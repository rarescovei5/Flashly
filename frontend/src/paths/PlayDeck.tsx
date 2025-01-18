import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';

const PlayDeck = () => {
  const deckId = useParams().deckId;

  return (
    <>
      <Navbar />
      PlayDeck {deckId}
    </>
  );
};

export default PlayDeck;
