import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Signin from './Signin';
import Signup from './Signup';
import Decks from './Decks';
import Deck from './Deck';
import PlayDeck from './PlayDeck';
import Discover from './Discover';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sign-in" element={<Signin />} />
        <Route path="/sign-up" element={<Signup />} />
        <Route path="/decks" element={<Decks />} />
        <Route path="/decks/:deckId" element={<Deck />} />
        <Route path="/decks/:deckId/play" element={<PlayDeck />} />
        <Route path="/decks/discover" element={<Discover />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
