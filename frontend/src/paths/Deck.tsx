import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import useDeck from "../hooks/useDeck";
import { useEffect, useState } from "react";
import useAxiosPrivate from "../hooks/userAxiosPrivate";
import ErrorPopup from "../components/ErrorPopup";
import { DeckType, Flashcard } from "../types";

/*
TODO:
  Hightlight the current card you are editing
  Fix the hardcoded value in the overflow-y auto div so the cards are displayed right
*/

const Deck = () => {
  const deckId = parseInt(useParams().deckId!, 10);
  const { deck, setDeck, cards, setCards } = useDeck(deckId!);
  const [shareInput, setShareInput] = useState("");
  const navigate = useNavigate();

  const contentToObjects = (encryptedString: string): Flashcard[] | null => {
    const result: Flashcard[] = [];
    let current = 0;
    let i = 0;

    if (encryptedString[0] === "[") {
      encryptedString = contentToString(JSON.parse(encryptedString));
    }

    while (i < encryptedString.length) {
      // Find the position of the next "@" delimiter.
      let j = i;
      while (j < encryptedString.length && encryptedString[j] !== "@") {
        j++;
      }
      if (j >= encryptedString.length) {
        setErrorMsg(`Invalid input format: missing '@' after position ${i}`);
        return null;
      }

      // Extract the number before the '@'
      const numberString = encryptedString.slice(i, j);
      const length = parseInt(numberString, 10);
      if (isNaN(length) || length < 0) {
        setErrorMsg(
          `Invalid number for length at position ${i}: "${numberString}"`
        );
        return null;
      }

      // The word should start after the '@'
      const startOfWord = j + 1;
      const endOfWord = startOfWord + length;
      if (endOfWord > encryptedString.length) {
        setErrorMsg(
          `Invalid input: expected a word of length ${length} starting at position ${startOfWord}, but input is too short.`
        );
        return null;
      }

      const word = encryptedString.slice(startOfWord, endOfWord);

      // Process the word as question or answer.
      if (current % 2 === 0) {
        // Create a new flashcard for the question.
        result.push({
          deck_id: deckId, // Assumes deckId is defined in the scope.
          id: result.length + 1,
          question: word,
          answer: "",
          ease_factor: 2.5,
          repetitions: 0,
          interval_days: 0,
          last_reviewed_at: null,
          next_review_at: null,
        });
      } else {
        // There should be a flashcard already for the answer.
        const cardIndex = Math.floor(current / 2);
        if (cardIndex >= result.length) {
          throw new Error(
            `Invalid input: found answer word without a corresponding question at position ${i}.`
          );
        }
        result[cardIndex].answer = word;
      }

      // Update the position for the next iteration.
      i = endOfWord;
      current++;
    }

    // Optionally, check that we ended on an answer (i.e. even number of items).
    if (current % 2 !== 0) {
      setErrorMsg("Invalid input: unmatched question without an answer.");
      return null;
    }

    return result;
  };
  const contentToString = (cards: Flashcard[]): string => {
    let result = ``;
    for (let i = 0; i < cards.length; i++) {
      result += `${cards[i].question.length}@${cards[i].question}`;
      result += `${cards[i].answer.length}@${cards[i].answer}`;
    }
    return result;
  };

  const getCardsNew = () => {
    let amount = 0;
    const limit = deck!.settings.defaultSettings.dailyLimits.newCards;
    for (let i = 0; i < cards.length; i++) {
      if (cards[i].last_reviewed_at === null) {
        amount++;
      }
    }
    return amount > limit ? limit : amount;
  };
  const getCardsToReview = () => {
    let amount = 0;
    const today = new Date().getTime();
    for (let i = 0; i < cards.length; i++) {
      const nextReviewDate = new Date(cards[i].next_review_at!).getTime();
      const diff = today - nextReviewDate;
      const condition = 24 * 60 * 60 * 1000 > diff && diff > 0;

      if (condition) {
        amount++;
      }
    }
    return amount;
  };
  const getCardsDue = () => {
    let amount = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set the time to midnight to ignore the time part

    for (let i = 0; i < cards.length; i++) {
      if (cards[i].next_review_at === null) {
        continue;
      }

      const nextReviewDate = new Date(cards[i].next_review_at!);
      nextReviewDate.setHours(0, 0, 0, 0); // Set the time to midnight to ignore the time part

      if (today >= nextReviewDate) {
        amount++;
      }
    }

    return amount;
  };

  const axiosPrivateInstance = useAxiosPrivate();

  const [selectedCard, setSelectedCard] = useState(-1);
  const [localQuestion, setLocalQuestion] = useState("");
  const [localAnswer, setLocalAnswer] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  //Settigns Variables
  const [settingsOpen, setSettingsOpen] = useState(false);
  let colorMap: { [key: string]: string[] } = {
    "c-light": ["#212121", "#1a1a1a"],
    "c-primary": ["#FBE87E", "#C7B666"],
    "c-blue": ["#1A87EC", "#0F4786"],
    "c-green": ["#71F65A", "#449832"],
    "c-orange": ["#FF7F3B", "#B75F2B"],
    "c-pink": ["#FD4798", "#B4326B"],
  };

  const validCard = () => {
    if (localAnswer === "") {
      setErrorMsg("Answer is required.");
      return false;
    } else if (localQuestion === "") {
      setErrorMsg("Question is required.");
      return false;
    }
    return true;
  };
  const validDeck = () => {
    if (deck?.name === "") {
      setErrorMsg("Deck name is required.");
      return false;
    } else if (deck?.settings.defaultSettings.dailyLimits.newCards === 0) {
      setErrorMsg("Settings: Daily limit is required.");
      return false;
    } else if (
      deck?.settings.defaultSettings.dailyLimits.maximumReviews === 0
    ) {
      setErrorMsg("Settings: Maximum reviews is required.");
      return false;
    } else if (deck?.settings.defaultSettings.timer.maximumTime === 0) {
      setErrorMsg(`Settings: Maximum time is required.`);
      return false;
    }

    if (cards.length === 0) {
      setErrorMsg("Deck must have at least one card.");
      return false;
    }
    return true;
  };

  //Update The Cards Automatically
  useEffect(() => {
    if (selectedCard === -1) return;

    const timeout = setTimeout(() => {
      if (!validCard()) return;
      const updatedCards = [...cards];
      updatedCards[selectedCard].question = localQuestion;
      updatedCards[selectedCard].answer = localAnswer;
      setCards(updatedCards);
    }, 100);

    return () => clearTimeout(timeout);
  }, [localQuestion, localAnswer]);

  //Save the deck
  useEffect(() => {
    if (!isSaving || !validDeck()) return;

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
        setIsSaving(false); // Ensure this is called even if an error occurs.
      }
    };

    saveDeck();

    return () => controller.abort();
  }, [isSaving]);

  return (
    <>
      <ErrorPopup
        error={errorMsg}
        setError={setErrorMsg}
        xl={0}
        xr={0}
        yt={4}
      />
      <Navbar />
      {settingsOpen && (
        <div className="w-[80%] max-md:w-[90%] mx-auto flex-1 my-10 flex flex-col gap-4 overflow-y-auto pr-4">
          <div className="mb-6">
            <div className="flex justify-between">
              <div>
                <h4 className="h4">Default Settings</h4>
              </div>
              <div>
                <button onClick={() => setSettingsOpen(false)}>
                  <img src="/close.svg" alt="" />
                </button>
              </div>
            </div>
            <hr className="my-6" />
            <div className="flex justify-between">
              <div className="basis-[45%]">
                <div className="mb-12">
                  <p className="p-body mb-6">Deck Color</p>
                  <div className="flex justify-between gap-4 *:rounded-full">
                    {[
                      "c-orange",
                      "c-green",
                      "c-blue",
                      "c-pink",
                      "c-primary",
                      "c-light",
                    ].map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          setDeck((prevDeck) => {
                            if (!prevDeck) return prevDeck;
                            return {
                              ...prevDeck,
                              settings: {
                                ...prevDeck.settings,
                                defaultSettings: {
                                  ...prevDeck.settings.defaultSettings,
                                  deckColor: color,
                                },
                              },
                            };
                          });
                        }}
                        className="flex-1 aspect-square"
                      >
                        <div
                          style={{ backgroundColor: colorMap[color][0] }}
                          className={`h-full rounded-full ${
                            deck?.settings.defaultSettings.deckColor === color
                              ? "scale-75"
                              : ""
                          }`}
                        ></div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="p-body mb-6">Timer</p>
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <p className="p-small mr-6">
                        Maximum Time{" "}
                        <span className="text-c-light">(Seconds)</span>
                      </p>
                      <input
                        type="number"
                        min="1"
                        max="999"
                        value={
                          deck?.settings.defaultSettings.timer.maximumTime || ""
                        }
                        onChange={(e) => {
                          const inputValue = e.target.value;

                          // Validate the input value
                          if (
                            inputValue === "" ||
                            (Number(inputValue) >= 0 &&
                              Number(inputValue) <= 999)
                          ) {
                            setDeck((prevDeck) => {
                              if (!prevDeck) return prevDeck;

                              return {
                                ...prevDeck,
                                settings: {
                                  ...prevDeck.settings,
                                  defaultSettings: {
                                    ...prevDeck.settings.defaultSettings,
                                    timer: {
                                      ...prevDeck.settings.defaultSettings
                                        .timer,
                                      maximumTime:
                                        inputValue === ""
                                          ? 0
                                          : Number(inputValue),
                                    },
                                  },
                                },
                              };
                            });
                          }
                        }}
                        className="flex-1 p-small outline-none bg-c-light py-2 rounded-2xl text-center"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="p-small">Show Timer</p>
                      <button
                        className="flex items-center justify-center bg-c-light h-10 w-10 rounded-2xl"
                        onClick={() => {
                          setDeck((prevDeck) => {
                            if (!prevDeck) return prevDeck;
                            return {
                              ...prevDeck,
                              settings: {
                                ...prevDeck.settings,
                                defaultSettings: {
                                  ...prevDeck.settings.defaultSettings,
                                  timer: {
                                    ...prevDeck.settings.defaultSettings.timer,
                                    showTimer:
                                      !prevDeck.settings.defaultSettings.timer
                                        .showTimer,
                                  },
                                },
                              },
                            };
                          });
                        }}
                      >
                        <div
                          className={`w-[2rem] h-[2rem] ${
                            deck?.settings.defaultSettings.timer.showTimer
                              ? "bg-c-dark"
                              : ""
                          } rounded-xl`}
                        ></div>
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="p-small">
                        Calculate Time{" "}
                        <span className="text-c-light">(on Answer)</span>
                      </p>
                      <div>
                        <button
                          className="flex items-center justify-center bg-c-light h-10 w-10 rounded-2xl"
                          onClick={() => {
                            setDeck((prevDeck) => {
                              if (!prevDeck) return prevDeck;
                              return {
                                ...prevDeck,
                                settings: {
                                  ...prevDeck.settings,
                                  defaultSettings: {
                                    ...prevDeck.settings.defaultSettings,
                                    timer: {
                                      ...prevDeck.settings.defaultSettings
                                        .timer,
                                      calculateTime:
                                        !prevDeck.settings.defaultSettings.timer
                                          .calculateTime,
                                    },
                                  },
                                },
                              };
                            });
                          }}
                        >
                          <div
                            className={`w-[2rem] h-[2rem] ${
                              deck?.settings.defaultSettings.timer.calculateTime
                                ? "bg-c-dark"
                                : ""
                            } rounded-xl`}
                          ></div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="basis-[45%] ">
                <div className="mb-12">
                  <p className="p-body mb-6">Display Order</p>

                  <div className="flex relative">
                    <select
                      className="p-small bg-c-light rounded-2xl outline-none appearance-none px-8 py-4 flex-1"
                      value={deck?.settings.defaultSettings.displayOrder}
                      onChange={(e) => {
                        setDeck((prevDeck) => {
                          if (!prevDeck) return prevDeck;
                          return {
                            ...prevDeck,
                            settings: {
                              ...prevDeck.settings,
                              defaultSettings: {
                                ...prevDeck.settings.defaultSettings,
                                displayOrder: e.target.value,
                              },
                            },
                          };
                        });
                      }}
                    >
                      <option value="Display cards in increasing order">
                        Display cards in increasing order
                      </option>
                      <option value="Display cards in random order">
                        Display cards in random order
                      </option>
                    </select>
                    <img
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                      src="/dropdown.svg"
                      alt=""
                    />
                  </div>
                </div>
                <div>
                  <p className="p-body mb-6">Daily Limits</p>
                  <div className="flex flex-col gap-4 ">
                    <div className="flex justify-between items-center">
                      <p className="p-small mr-6">New Cards</p>
                      <input
                        type="number"
                        min="1"
                        max="999"
                        value={
                          deck?.settings.defaultSettings.dailyLimits.newCards ||
                          ""
                        }
                        onChange={(e) => {
                          const inputValue = e.target.value;

                          // Validate the input value
                          if (
                            inputValue === "" ||
                            (Number(inputValue) >= 0 &&
                              Number(inputValue) <= 999)
                          ) {
                            setDeck((prevDeck) => {
                              if (!prevDeck) return prevDeck;

                              return {
                                ...prevDeck,
                                settings: {
                                  ...prevDeck.settings,
                                  defaultSettings: {
                                    ...prevDeck.settings.defaultSettings,
                                    dailyLimits: {
                                      ...prevDeck.settings.defaultSettings
                                        .dailyLimits,
                                      newCards: Number(inputValue),
                                    },
                                  },
                                },
                              };
                            });
                          }
                        }}
                        className="flex-1 p-small outline-none bg-c-light py-2 rounded-2xl text-center"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="p-small mr-6">Maximum Reviews</p>
                      <input
                        type="number"
                        min="1"
                        max="999"
                        value={
                          deck?.settings.defaultSettings.dailyLimits
                            .maximumReviews || ""
                        }
                        onChange={(e) => {
                          const inputValue = e.target.value;

                          // Validate the input value
                          if (
                            inputValue === "" ||
                            (Number(inputValue) >= 0 &&
                              Number(inputValue) <= 999)
                          ) {
                            setDeck((prevDeck) => {
                              if (!prevDeck) return prevDeck;

                              return {
                                ...prevDeck,
                                settings: {
                                  ...prevDeck.settings,
                                  defaultSettings: {
                                    ...prevDeck.settings.defaultSettings,
                                    dailyLimits: {
                                      ...prevDeck.settings.defaultSettings
                                        .dailyLimits,
                                      maximumReviews: Number(inputValue),
                                    },
                                  },
                                },
                              };
                            });
                          }
                        }}
                        className="flex-1 p-small outline-none bg-c-light py-2 rounded-2xl text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h4 className="h4">Danger Zone</h4>

            <hr className="my-6" />
            <div className="flex justify-between">
              <div className="basis-[45%]">
                <div className="mb-12">
                  <p className="p-body mb-6">Publish Deck</p>
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <p className="p-small">Publish</p>
                      <button
                        className="flex items-center justify-center bg-c-light h-10 w-10 rounded-2xl"
                        onClick={() => {
                          setDeck((prevDeck) => {
                            if (!prevDeck) return prevDeck;
                            return {
                              ...prevDeck,
                              settings: {
                                ...prevDeck.settings,
                                dangerSettings: {
                                  ...prevDeck.settings.dangerSettings,
                                  public:
                                    !prevDeck.settings.dangerSettings.public,
                                },
                              },
                            };
                          });
                        }}
                      >
                        <div
                          className={`w-[2rem] h-[2rem] ${
                            deck?.settings.dangerSettings.public
                              ? "bg-c-dark"
                              : ""
                          } rounded-xl`}
                        ></div>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mb-12">
                  <div className=" mb-6">
                    <p className="p-body">Share</p>
                  </div>
                  <input
                    type="text"
                    className="p-small w-full bg-c-light rounded-2xl py-2 mb-2 outline-none px-2"
                    value={shareInput}
                    onChange={(e) => setShareInput(e.target.value)}
                  />
                  <div className="flex flex-col gap-4 my-2">
                    <div className="flex justify-between items-center">
                      <button
                        className="flex items-center justify-center bg-c-green text-c-dark font-medium basis-[45%] p-small py-2 rounded-2xl"
                        onClick={() => {
                          if (shareInput.length === 0) {
                            setErrorMsg("Share input is empty");
                            return;
                          }
                          const newCards = contentToObjects(shareInput);
                          if (newCards === null) {
                            return;
                          }
                          setCards(newCards);
                        }}
                      >
                        Import
                      </button>
                      <button
                        className="flex items-center justify-center bg-c-green text-c-dark font-medium basis-[45%] p-small py-2 rounded-2xl"
                        onClick={() => {
                          const deckSchema = contentToString(cards);
                          setShareInput(deckSchema);
                        }}
                      >
                        Export
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="basis-[45%]">
                <div className="mb-12">
                  <p className="p-body mb-6">Delete Deck</p>
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <p className="p-small">
                        If you click this there is no going back
                      </p>
                      <button
                        className="flex items-center justify-center bg-red-800 px-4 py-2 rounded-2xl"
                        onClick={() => {
                          navigate("/decks");
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {deck && !settingsOpen && (
        <div className="w-[80%] max-md:w-[90%] mx-auto my-10 flex-1  grid grid-cols-1 grid-rows-[max-content_1fr_max-content] gap-6">
          <div className="flex justify-between items-center ">
            <div className=" flex-1">
              <input
                style={{
                  width: `${
                    deck.name.length > 0 ? `${deck.name.length}ch` : "100%"
                  }`,
                }}
                className="h4 max-md:p-body bg-transparent outline-none"
                type="text"
                value={deck.name}
                onChange={(e) => {
                  setDeck((prevDeck) => {
                    return { ...prevDeck, name: e.target.value } as DeckType;
                  });
                }}
              />
            </div>
            <div className="flex gap-6">
              <button
                className="p-body flex items-center gap-2 px-4 max-md:px-2 py-2 bg-c-green rounded-2xl transition-[background] hover:bg-[#449832]"
                onClick={() => {
                  /* This fixed the following issue: Cards Example: [{id:1},{id:2}]
                  If you delete the first one you get: [{id:2}]
                  If you add another card after you get: [{id:2},{id:2}]
                  */
                  for (let i = 0; i < cards.length; i++) {
                    setCards((prevCards) => {
                      const newCards = [...prevCards];
                      newCards[i].id = i;
                      return newCards;
                    });
                  }
                  setIsSaving(true);
                }}
              >
                <img className="min-w-4 aspect-square" src="/save.svg" alt="" />
                <p className="p-body max-md:hidden">Save</p>
              </button>
              <button
                className="flex items-center gap-2 px-4 max-md:px-2 py-2 bg-c-light rounded-2xl"
                onClick={() => {
                  setSettingsOpen(true);
                }}
              >
                <img className="min-w-4 aspect-square" src="/sett.svg" alt="" />
                <p className="p-body max-md:hidden">Settings</p>
              </button>

              <Link
                className="flex items-center gap-2 px-4 max-md:px-2 py-2 bg-c-primary rounded-2xl "
                to={`/decks/${deckId}/play`}
              >
                <img
                  className="min-w-4 aspect-square"
                  src="/play-big.svg"
                  alt=""
                />
                <p className="p-body text-c-dark max-md:hidden">Play</p>
              </Link>
            </div>
          </div>
          <div className="flex justify-between">
            <div className="basis-[55%] max-h-[50vh] flex flex-col gap-2 overflow-y-auto pr-2">
              {cards.map((card, index) => (
                <button
                  className={`${
                    selectedCard === index ? "w-[95%]" : ""
                  } group relative bg-c-light p-4 rounded-2xl`}
                  key={index}
                  onClick={() => {
                    setSelectedCard(index);
                    setLocalAnswer(card.answer);
                    setLocalQuestion(card.question);
                  }}
                >
                  <p className="p-small text-left max-md:mr-4">
                    {`${index + 1}. ${card.question}`}
                    <span className="text-c-dark">-</span> {card.answer}
                  </p>
                  <div
                    className="group-hover:block hidden absolute right-4 top-1/2 -translate-y-1/2 hover:bg-c-dark px-2 py-2 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (cards.length === 1) {
                        setErrorMsg("You cannot delete the last card");
                        return;
                      }

                      if (index === selectedCard) setSelectedCard(-1);
                      setCards((prevCards) => {
                        return prevCards.filter((_, i) => i !== index);
                      });
                    }}
                  >
                    <img className=" w-2 h-2" src="/close.svg" alt="" />
                  </div>
                </button>
              ))}
              <button
                className=" bg-c-light  py-4  rounded-2xl flex justify-center items-center"
                onClick={() => {
                  setSelectedCard(-1);
                  setLocalAnswer("Answer");
                  setLocalQuestion("Question");

                  setCards((prev) => [
                    ...prev,
                    {
                      deck_id: deckId,
                      id: cards.length + 1,
                      question: localQuestion,
                      answer: localAnswer,
                      ease_factor: 2.5,
                      repetitions: 0,
                      interval_days: 0,
                      last_reviewed_at: null,
                      next_review_at: null,
                    },
                  ]);
                  setSelectedCard(cards.length);
                }}
              >
                <img src="/plus-small.svg" alt="" />
              </button>
            </div>

            <div className="basis-[40%] flex justify-between flex-col items-center">
              {selectedCard !== -1 ? (
                <>
                  <div className="flex flex-col gap-4 basis-[80%] w-full">
                    <div className="basis-[40%] flex flex-col">
                      <h4 className="h4 max-md:p-body mb-2">Card Question</h4>
                      <textarea
                        className="text-[#fff] bg-c-light flex-1 w-full p-4 rounded-2xl resize-none outline-none p-small"
                        name="question"
                        id=""
                        value={localQuestion}
                        onChange={(e) => {
                          setLocalQuestion(e.target.value);
                        }}
                      ></textarea>
                    </div>
                    <div className="basis-[40%] flex flex-col">
                      <h4 className="h4 max-md:p-body  mb-2">Card Answer</h4>
                      <textarea
                        className="text-[#fff] bg-c-light flex-1 w-full p-4 rounded-2xl resize-none outline-none p-small"
                        name="answer"
                        id=""
                        value={localAnswer}
                        onChange={(e) => {
                          setLocalAnswer(e.target.value);
                        }}
                      ></textarea>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-4 basis-[80%] w-full">
                    <div className="basis-[40%] flex flex-col">
                      <h4 className="h4 max-md:p-body mb-2">Card Question</h4>
                      <textarea
                        className="text-[#fff] bg-c-light flex-1 w-full p-4 rounded-2xl resize-none outline-none p-small"
                        name="question"
                        id=""
                        value={localQuestion}
                        onChange={(e) => setLocalQuestion(e.target.value)}
                      ></textarea>
                    </div>
                    <div className="basis-[40%] flex flex-col">
                      <h4 className="h4 max-md:p-body mb-2">Card Answer</h4>
                      <textarea
                        className="text-[#fff] bg-c-light flex-1 w-full p-4 rounded-2xl resize-none outline-none p-small"
                        name="answer"
                        id=""
                        value={localAnswer}
                        onChange={(e) => setLocalAnswer(e.target.value)}
                      ></textarea>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex justify-between">
            <div className="basis-[30%] h-full bg-c-light rounded-2xl p-4 flex flex-col gap-2">
              <p className="h4 max-md:p-body">Deck Stats</p>
              <hr />
              <p className="p-small flex items-center justify-between">
                New <span>{getCardsNew()}</span>
              </p>
              <p className="p-small flex items-center justify-between">
                Review
                <span>{getCardsToReview()}</span>
              </p>
              <p className="p-small flex items-center justify-between">
                Due
                <span>{getCardsDue()}</span>
              </p>
              <p className="p-small flex items-center justify-between">
                Total
                <span>{cards.length}</span>
              </p>
            </div>
            <div className="basis-[65%] flex justify-between">
              <div
                className="basis-[49%] px-4  rounded-2xl flex justify-center items-center"
                style={{
                  backgroundColor:
                    colorMap[deck.settings.defaultSettings.deckColor][0],
                }}
              >
                <p className="text-c-dark p-body">{localQuestion}</p>
              </div>
              <div
                className="basis-[49%] px-4   rounded-2xl flex justify-center items-center"
                style={{
                  backgroundColor:
                    colorMap[deck.settings.defaultSettings.deckColor][1],
                }}
              >
                <p className="text-c-dark p-body">{localAnswer}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Deck;
