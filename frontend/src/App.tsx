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
const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sign-in" element={<Signin />} />
        <Route path="/sign-up" element={<Signup />} />

        <Route element={<PersistAuth />}>
          <Route path="/" element={<Home />} />
          <Route element={<RequireAuth />}>
            <Route path="/decks" element={<Decks />} />
            <Route path="/decks/:deckId" element={<Deck />} />
            <Route path="/decks/:deckId/play" element={<PlayDeck />} />
            <Route path="/decks/discover" element={<Discover />} />
          </Route>
        </Route>

        <Route path="/*" element={<h1>404</h1>}></Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
