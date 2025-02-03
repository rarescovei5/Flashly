import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import useDeck from "../hooks/useDeck";
import useAxiosPrivate from "../hooks/userAxiosPrivate";

const DeckDiscover = () => {
  const AxiosPrivateInstance = useAxiosPrivate();

  const { deckId: deckIdParam } = useParams();
  const deckId = parseInt(deckIdParam!, 10);
  const navigate = useNavigate();
  const { deck, cards } = useDeck(deckId);

  const handleSave = async () => {
    try {
      const res = await AxiosPrivateInstance.post(`/decks/save/${deckId}`, {
        deck: deck,
      });
      if (res.data.success) {
        navigate("/decks");
      } else {
        alert("Something went wrong while saving the deck.");
      }
    } catch (err) {
      console.error("Error saving deck:", err);
      alert("Error saving deck. Please try again.");
    }
  };

  return (
    <>
      <Navbar />
      {deck && (
        <div className="w-[80%] max-md:w-[90%] mx-auto flex-1 my-10 flex flex-col gap-4 items-center overflow-y-auto pr-4">
          <h3 className="text-center h3">{deck.name}</h3>
          <div className="flex-1 w-min flex pr-2 gap-2 flex-col overflow-y-auto">
            {cards.map((card, idx) => (
              <div
                key={idx}
                className="flex gap-2 text-nowrap select-none bg-c-light px-4 py-2 rounded-2xl"
              >
                {`${idx + 1}. ${card.question}`}
                <span className="text-c-dark">-</span>
                {card.answer}
              </div>
            ))}
          </div>
          <div className="basis-[10%]">
            <button
              className="p-body flex items-center gap-2 px-4 max-md:px-2 py-2 bg-c-green rounded-2xl transition-[background] hover:bg-[#449832]"
              onClick={handleSave}
            >
              <img
                className="min-w-4 aspect-square"
                src="/save.svg"
                alt="Save"
              />
              <p className="p-body max-md:hidden">Save</p>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default DeckDiscover;
