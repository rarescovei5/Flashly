import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import useDeck from '../hooks/useDeck';
import { useEffect, useState } from 'react';
import useAxiosPrivate from '../hooks/userAxiosPrivate';

const PlayDeck = () => {
  const navigate = useNavigate();

  const deckId = parseInt(useParams().deckId!);
  const { deck, cards, setCards } = useDeck(deckId);

  const [currentCard, setCurrentCard] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const axiosPrivateInstance = useAxiosPrivate();
  const [isEnding, setIsEnding] = useState(false);

  useEffect(() => {
    if (!isEnding) return;

    const controller = new AbortController();

    const saveDeck = async () => {
      const data = {
        name: deck!.name,
        settings: deck!.settings,
        flashcards: cards,
      };

      try {
        await axiosPrivateInstance.put(`/decks/${deckId}`, data, {
          signal: controller.signal,
        });
      } catch (error) {
        console.log(error);
      } finally {
        navigate(`/decks/${deckId}`);
      }
    };

    saveDeck();

    return () => controller.abort();
  }, [isEnding]);

  //Timer
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  useEffect(() => {
    let intervalId: any;
    if (isRunning) {
      intervalId = setInterval(() => setTime(time + 1), 10);
    }
    return () => clearInterval(intervalId);
  }, [isRunning, time]);
  const minutes = Math.floor((time % 360000) / 6000);
  const seconds = Math.floor((time % 6000) / 100);

  let colorMap: { [key: string]: string[] } = {
    'c-light': ['#212121', '#070707'],
    'c-primary': ['#FBE87E', '#C7B666'],
    'c-blue': ['#1A87EC', '#0F4786'],
    'c-green': ['#71F65A', '#449832'],
    'c-orange': ['#FF7F3B', '#B75F2B'],
    'c-pink': ['#FD4798', '#B4326B'],
  };

  const handleReveal = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsRunning(false);
    setIsRevealed(true);
  };

  const handleFeedback = async (
    feedback: 'Easy' | 'Normal' | 'Hard' | 'Challenging'
  ) => {
    // Placeholder function to update card data (replace with actual API call)
    const updateCardData = (feedback: string) => {
      const card = cards[currentCard];
      let newInterval = card.interval_days;
      let newEaseFactor = card.ease_factor;
      let newRepetitions = card.repetitions;

      switch (feedback) {
        case 'Easy':
          newEaseFactor += 0.1;
          newRepetitions += 1;
          newInterval *= newEaseFactor * 1.5;
          break;
        case 'Normal':
          newRepetitions += 1;
          newInterval *= newEaseFactor;
          break;
        case 'Hard':
          newEaseFactor = Math.max(1.3, newEaseFactor - 0.2);
          newInterval = Math.max(1, newInterval * 0.5);
          break;
        case 'Challenging':
          newEaseFactor = Math.max(1.3, newEaseFactor - 0.3);
          newInterval = 1; // Reset interval
          newRepetitions = 0; // Reset repetitions
          break;
      }

      return { newEaseFactor, newRepetitions, newInterval };
    };

    const { newEaseFactor, newRepetitions, newInterval } =
      updateCardData(feedback);

    const data = {
      ease_factor: newEaseFactor,
      repetitions: newRepetitions,
      interval_days: newInterval,
      last_reviewed_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      next_review_at: new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace('T', ' '),
    };

    setCards((prevCards) => {
      const updatedCards = [...prevCards];
      updatedCards[currentCard] = { ...updatedCards[currentCard], ...data };
      return updatedCards;
    });

    // Move to the next card
    if (
      currentCard >= deck?.settings.defaultSettings.dailyLimits.newCards! ||
      currentCard >= cards.length - 1
    ) {
      setIsEnding(true);
      return;
    }
    setCurrentCard((prev) => prev + 1);
    setIsRevealed(false);
    setTime(0);
    setIsRunning(true);
  };

  return (
    <>
      <Navbar />
      {deck && (
        <div className="w-[80%]  lg:w-[65%] 2xl:w-[50%] flex-1 mx-auto my-20 flex flex-col gap-8">
          <div className="">
            <h3 className="h3 text-center">{deck?.name}</h3>
          </div>
          <div className="flex-1 flex flex-col gap-2">
            {!isRevealed ? (
              <div
                className="flex-1 px-4 rounded-2xl flex justify-center items-center"
                style={{
                  backgroundColor:
                    colorMap[deck?.settings.defaultSettings.deckColor][0],
                }}
              >
                <h4 className="h4 text-c-dark ">
                  {cards[currentCard].question}
                </h4>
              </div>
            ) : (
              <div
                className="flex-1 px-4  rounded-2xl flex justify-center items-center"
                style={{
                  backgroundColor:
                    colorMap[deck?.settings.defaultSettings.deckColor][1],
                }}
              >
                <h4 className="h4 text-c-dark ">{cards[currentCard].answer}</h4>
              </div>
            )}

            <div className="flex justify-center">
              <h4 className="h4">
                {String(minutes).padStart(2, '0')}:
                {String(seconds).padStart(2, '0')}
              </h4>
            </div>
          </div>
          {!isRevealed ? (
            <div className="flex justify-center">
              <button
                className="px-8 py-3 bg-c-light rounded-2xl p-body"
                onClick={handleReveal}
              >
                Reveal Answer
              </button>
            </div>
          ) : (
            <div className="grid max-xl:grid-cols-2 grid-cols-4 gap-4 ">
              <button
                className="relative py-3 flex justify-center items-center gap-2 bg-c-light rounded-2xl"
                onClick={() => handleFeedback('Easy')}
              >
                <img className="absolute left-4" src="/easy.svg" alt="" />
                <p className="max-md:p-small p-body">Easy</p>
              </button>
              <button
                className="relative py-3 flex justify-center items-center gap-2 bg-c-light rounded-2xl"
                onClick={() => handleFeedback('Normal')}
              >
                <img className="absolute left-4" src="/normal.svg" alt="" />
                <p className="max-md:p-small p-body">Normal</p>
              </button>
              <button
                className="relative py-3 flex justify-center items-center gap-2 bg-c-light rounded-2xl"
                onClick={() => handleFeedback('Hard')}
              >
                <img className="absolute left-4" src="/hard.svg" alt="" />
                <p className="max-md:p-small p-body">Hard</p>
              </button>
              <button
                className="relative py-3 flex justify-center items-center gap-2 bg-c-light rounded-2xl"
                onClick={() => handleFeedback('Challenging')}
              >
                <img
                  className="absolute left-4"
                  src="/challenging.svg"
                  alt=""
                />
                <p className="max-md:p-small p-body">Challenging</p>
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default PlayDeck;
