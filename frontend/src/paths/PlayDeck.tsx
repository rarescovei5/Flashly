import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import useDeck from '../hooks/useDeck';
import { useEffect, useState } from 'react';
import useAxiosPrivate from '../hooks/userAxiosPrivate';

//TODO: Add a sidebar that shows the current progress as a filled bar that goes from 0% to 100%

const PlayDeck = () => {
  const navigate = useNavigate();
  const axiosPrivateInstance = useAxiosPrivate();

  const colorMap: { [key: string]: string[] } = {
    'c-light': ['#212121', '#141414', '#070707'],
    'c-primary': ['#FBE87E', '#E1CF72', '#C7B666'],
    'c-blue': ['#1A87EC', '#1467B9', '#0F4786'],
    'c-green': ['#71F65A', '#5AC746', '#449832'],
    'c-orange': ['#FF7F3B', '#DB6F33', '#B75F2B'],
    'c-pink': ['#FD4798', '#D93C81', '#B4326B'],
  };

  //All Cards
  const deckId = parseInt(useParams().deckId!);
  const { deck, cards, setCards } = useDeck(deckId);

  //Review Cards
  const [hasReceivedCards, setHasReceivedCards] = useState(false);
  const [reviewCards, setReviewCards] = useState<number[]>([]);
  const [reviewedCards, setReviewedCards] = useState(0);

  //Current Card Logic
  const [currentCard, setCurrentCard] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  //Find Cards that need to be reviewed
  useEffect(() => {
    if (hasReceivedCards) {
      const newCardsLimit =
        deck?.settings.defaultSettings.dailyLimits.newCards!;
      const maxReviewsLimit =
        deck?.settings.defaultSettings.dailyLimits.maximumReviews!;

      const newReviewCards: number[] = [];

      // Add cards that have not been reviewed
      for (let i = 0; i < cards.length; i++) {
        if (
          newReviewCards.length < newCardsLimit &&
          cards[i].last_reviewed_at === null
        ) {
          newReviewCards.push(i);
        }
      }

      // Add cards that are due for review
      const today = new Date().getTime();
      for (let i = 0; i < cards.length; i++) {
        const nextReviewDate = new Date(cards[i].next_review_at!).getTime();
        const condition = today - nextReviewDate > 0;

        if (newReviewCards.length < maxReviewsLimit && condition) {
          newReviewCards.push(i);
        }
      }

      //if there are no cards to review or do, review cards in order of next_review_at
      if (newReviewCards.length === 0) {
        let tempCards = [...cards];
        tempCards = tempCards
          .sort((a, b) => {
            const dateA = new Date(a.next_review_at!).getTime();
            const dateB = new Date(b.next_review_at!).getTime();
            return dateA - dateB;
          })
          .splice(
            0,
            maxReviewsLimit > cards.length ? cards.length : maxReviewsLimit
          );

        tempCards.forEach((card) => {
          for (let i = 0; i < cards.length; i++) {
            if (cards[i].id === card.id) {
              newReviewCards.push(i);
              break;
            }
          }
        });
      }

      setReviewCards(newReviewCards);
    }
  }, [hasReceivedCards]);
  useEffect(() => {
    if (cards.length > 0) {
      setHasReceivedCards(true);
    }
  }, [cards]);

  //Save new Data
  useEffect(() => {
    if (!isEnding) return;

    const controller = new AbortController();

    const saveDeck = async () => {
      let updatedCards = cards.map((card) => {
        return { ...card, repetitions: 0 };
      });

      console.log(updatedCards);

      const data = {
        name: deck!.name,
        settings: deck!.settings,
        flashcards: updatedCards,
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

  const handleReveal = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsRunning(false);
    setIsRevealed(true);
  };

  const handleFeedback = async (
    feedback: 'Easy' | 'Normal' | 'Hard' | 'Challenging'
  ) => {
    setReviewedCards((prev) => prev + 1);
    // Calculate new values based on feedback
    const calculateCardFeedback = (feedback: string) => {
      const card = cards[reviewCards[currentCard]];
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
          newRepetitions += 1;
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
      calculateCardFeedback(feedback);

    // Update card with feedback given
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
      updatedCards[reviewCards[currentCard]] = {
        ...updatedCards[reviewCards[currentCard]],
        ...data,
      };
      return updatedCards;
    });

    // Update current Card
    const maxAllowedReviews =
      feedback !== 'Challenging' &&
      cards[reviewCards[currentCard]].repetitions >= 2;

    if (feedback === 'Easy' || feedback === 'Normal' || maxAllowedReviews) {
      const newReviewCards = [...reviewCards];
      newReviewCards.splice(currentCard, 1);
      setReviewCards(newReviewCards);

      // If all cards are mastered then set isEnding to true

      if (
        reviewCards.length <= 1 ||
        reviewedCards >=
          deck?.settings.defaultSettings.dailyLimits.newCards! +
            deck?.settings.defaultSettings.dailyLimits.maximumReviews!
      ) {
        setIsEnding(true);
        return;
      }
    } else {
      setCurrentCard((prev) => prev + 1);
    }

    if (currentCard >= reviewCards.length - 1) {
      setCurrentCard(0);
    }
    setIsRevealed(false);
    setTime(0);
    setIsRunning(true);
  };

  return (
    <>
      <Navbar />
      {reviewCards.length > 0 && (
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
                    colorMap[deck?.settings.defaultSettings.deckColor!][0],
                }}
              >
                <h4 className="h4 text-c-dark ">
                  {cards[reviewCards[currentCard]].question}
                </h4>
              </div>
            ) : (
              <div
                className="flex-1 px-4  rounded-2xl flex justify-center items-center"
                style={{
                  backgroundColor:
                    colorMap[deck?.settings.defaultSettings.deckColor!][1],
                }}
              >
                <h4 className="h4 text-c-dark ">
                  {cards[reviewCards[currentCard]].answer}
                </h4>
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
