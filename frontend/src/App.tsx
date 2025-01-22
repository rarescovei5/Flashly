import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './paths/Home';
import Signin from './paths/Signin';
import Signup from './paths/Signup';
import Decks from './paths/Decks';
import Deck from './paths/Deck';
import PlayDeck from './paths/PlayDeck';
import Discover from './paths/Discover';
import RequireAuth from './auth/RequireAuth';
import PersistAuth from './auth/PersistAuth';
import NotFound from './paths/NotFound';
const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/Flashly/sign-in" element={<Signin />} />
        <Route path="/Flashly/sign-up" element={<Signup />} />

        <Route element={<PersistAuth />}>
          <Route path="/Flashly/" element={<Home />} />
          <Route element={<RequireAuth />}>
            <Route path="/Flashly/decks" element={<Decks />} />
            <Route path="/Flashly/decks/:deckId" element={<Deck />} />
            <Route path="/Flashly/decks/:deckId/play" element={<PlayDeck />} />
            <Route path="/Flashly/decks/discover" element={<Discover />} />
          </Route>
        </Route>

        <Route path="/Flashly/*" element={<NotFound />}></Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
