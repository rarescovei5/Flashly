import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Deck = () => {
  const deckId = useParams().deckId;
  return (
    <>
      <Navbar />
    </>
  );
};

export default Deck;
