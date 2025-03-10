import { useEffect, useState } from "react";
import { DeckType, Flashcard } from "../types";
import useAxiosPrivate from "./userAxiosPrivate";
import { useNavigate } from "react-router-dom";

const useDeck = (deckId: number) => {
  const navigate = useNavigate();
  const [deck, setDeck] = useState<DeckType>();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const axiosPrivateInstance = useAxiosPrivate();

  const getDeck = async () => {
    try {
      const response = await axiosPrivateInstance.get(`/decks/${deckId}`);

      //Check if User is on deck page and is getting his own deck
      if (
        !response.data.same_user &&
        window.location.pathname === `/decks/${deckId}`
      ) {
        navigate("/decks");
      }

      setDeck({
        ...response.data.deck,
        is_public: response.data.deck.is_public === 0 ? false : true,
      });
      setCards(response.data.deck.flashcards);
    } catch (error) {
      navigate("/decks");
    }
  };

  useEffect(() => {
    getDeck();
  }, []);

  return { deck, setDeck, cards, setCards };
};
export default useDeck;
