import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Signin from './auth/Signin';
import Signup from './auth/Signup';
import Decks from './deck/Decks';
import Deck from './deck/Deck';
import PlayDeck from './deck/PlayDeck';
import Discover from './deck/Discover';
import RequireAuth from './RequireAuth';
const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sign-in" element={<Signin />} />
        <Route path="/sign-up" element={<Signup />} />

        <Route element={<RequireAuth />}>
          <Route path="/decks" element={<Decks />} />
          <Route path="/decks/:deckId" element={<Deck />} />
          <Route path="/decks/:deckId/play" element={<PlayDeck />} />
          <Route path="/decks/discover" element={<Discover />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
