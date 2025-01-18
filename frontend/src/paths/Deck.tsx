import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import useDeck from '../hooks/useDeck';
import { useEffect, useState } from 'react';
import useAxiosPrivate from '../hooks/userAxiosPrivate';
import ErrorPopup from '../components/ErrorPopup';
import { DeckType } from '../types';

type Flashcard = {
  question: string;
  answer: string;
};

const Deck = () => {
  const deckId = useParams().deckId;
  const { deck, setDeck } = useDeck();
  const axiosPrivateInstance = useAxiosPrivate();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [selectedCard, setSelectedCard] = useState(-1);
  const [localQuestion, setLocalQuestion] = useState('');
  const [localAnswer, setLocalAnswer] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [cardChange, setCardChange] = useState(false);

  //Settigns Variables
  const [settingsOpen, setSettingsOpen] = useState(false);
  let colorMap: { [key: string]: string } = {
    'c-light': '#212121',
    'c-primary': '#FBE87E',
    'c-blue': '#1A87EC',
    'c-green': '#71F65A',
    'c-orange': '#FF7F3B',
    'c-pink': '#FD4798',
  };

  const contentToObjects = (encryptedString: string): Flashcard[] => {
    const result: Flashcard[] = [];

    let current = 0;
    let i = 0;
    while (i < encryptedString.length) {
      let j = i;
      while (encryptedString[j] !== '@') {
        j++;
      }
      let length = parseInt(encryptedString.slice(i, j), 10);

      if (current % 2 === 0) {
        result.push({ question: '', answer: '' });
        result[Math.floor(current / 2)].question = encryptedString.slice(
          j + 1,
          j + 1 + length
        );
      } else if (current % 2 === 1) {
        result[Math.floor(current / 2)].answer = encryptedString.slice(
          j + 1,
          j + 1 + length
        );
      }

      i = j + 1 + length;
      current++;
    }

    return result;
  };
  const contentToString = (): string => {
    let result = ``;
    for (let i = 0; i < cards.length; i++) {
      result += `${cards[i].question.length}@${cards[i].question}`;
      result += `${cards[i].answer.length}@${cards[i].answer}`;
    }
    return result;
  };
  const validCard = () => {
    if (localAnswer === '') {
      setErrorMsg('Answer is required.');
      return false;
    } else if (localQuestion === '') {
      setErrorMsg('Question is required.');
      return false;
    }
    return true;
  };
  const validDeck = () => {
    if (deck?.name === '') {
      setErrorMsg('Deck name is required.');
      return false;
    } else if (deck?.settings.defaultSettings.dailyLimits.newCards === 0) {
      setErrorMsg('Settings: Daily limit is required.');
      return false;
    } else if (
      deck?.settings.defaultSettings.dailyLimits.maximumReviews === 0
    ) {
      setErrorMsg('Settings: Maximum reviews is required.');
      return false;
    } else if (deck?.settings.defaultSettings.timer.maximumTime === 0) {
      setErrorMsg(`Settings: Maximum time is required.`);
      return false;
    }
    return true;
  };

  const getDeck = async () => {
    try {
      const response = await axiosPrivateInstance.get(`/flashcards/${deckId}`);
      setDeck(response.data.deck[0]);
      setCards(contentToObjects(response.data.deck[0].content));
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getDeck();
  }, []);

  useEffect(() => {
    if (cardChange) {
      const content = contentToString();

      setDeck({ ...deck, content } as DeckType);
      setCardChange(false);
    }
  }, [cardChange]);

  useEffect(() => {
    if (selectedCard === -1) return;

    const timeout = setTimeout(() => {
      if (!validCard()) return;
      const updatedCards = [...cards];
      updatedCards[selectedCard].question = localQuestion;
      updatedCards[selectedCard].answer = localAnswer;
      setCards(updatedCards);
      setCardChange(true);
    }, 500);

    return () => clearTimeout(timeout);
  }, [localQuestion, localAnswer]);

  useEffect(() => {
    if (!isSaving || !validDeck()) return;

    const controller = new AbortController();

    const saveDeck = async () => {
      try {
        await axiosPrivateInstance.put(`/flashcards/${deckId}`, deck, {
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
        <div className="w-[80%] mx-auto flex-1 my-10 flex flex-col gap-4">
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
                      'c-orange',
                      'c-green',
                      'c-blue',
                      'c-pink',
                      'c-primary',
                      'c-light',
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
                          style={{ backgroundColor: colorMap[color] }}
                          className={`h-full rounded-full ${
                            deck?.settings.defaultSettings.deckColor === color
                              ? 'scale-75'
                              : ''
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
                        Maximum Time{' '}
                        <span className="text-c-light">(Seconds)</span>
                      </p>
                      <input
                        type="number"
                        min="1"
                        max="999"
                        value={
                          deck?.settings.defaultSettings.timer.maximumTime || ''
                        }
                        onChange={(e) => {
                          const inputValue = e.target.value;

                          // Validate the input value
                          if (
                            inputValue === '' ||
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
                                        inputValue === ''
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
                              ? 'bg-c-dark'
                              : ''
                          } rounded-xl`}
                        ></div>
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="p-small">
                        Calculate Time{' '}
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
                                ? 'bg-c-dark'
                                : ''
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
                          ''
                        }
                        onChange={(e) => {
                          const inputValue = e.target.value;

                          // Validate the input value
                          if (
                            inputValue === '' ||
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
                            .maximumReviews || ''
                        }
                        onChange={(e) => {
                          const inputValue = e.target.value;

                          // Validate the input value
                          if (
                            inputValue === '' ||
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
                              ? 'bg-c-dark'
                              : ''
                          } rounded-xl`}
                        ></div>
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
        <div className="w-[80%] mx-auto flex-1 my-10 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <input
                className="h4 bg-transparent outline-none"
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
                className="p-body flex items-center gap-2 px-4 py-2 bg-c-green rounded-2xl"
                onClick={() => {
                  setIsSaving(true);
                }}
              >
                Save
              </button>
              <button
                className="p-body flex items-center gap-2 px-4 py-2 bg-c-light rounded-2xl"
                onClick={() => {
                  setSettingsOpen(true);
                }}
              >
                <img src="/sett.svg" alt="" />
                Settings
              </button>

              <Link
                className="p-body flex items-center gap-2 px-4 py-2 bg-c-primary rounded-2xl text-c-dark"
                to={`/decks/${deckId}/play`}
              >
                <img src="/play-big.svg" alt="" />
                Play
              </Link>
            </div>
          </div>
          <div className="flex flex-[2] justify-between">
            <div className="flex flex-col gap-2 basis-[55%] overflow-y-auto pr-4">
              {cards.map((card, index) => (
                <button
                  className="flex justify-start w-full bg-c-light p-4 rounded-2xl p-small"
                  key={index}
                  onClick={() => {
                    setSelectedCard(index);
                    setLocalAnswer(card.answer);
                    setLocalQuestion(card.question);
                  }}
                >
                  {index + 1}. {card.question}{' '}
                  <span className="text-c-dark">-</span> {card.answer}
                </button>
              ))}
              <button
                className="w-full bg-c-light h-10  rounded-2xl flex justify-center items-center"
                onClick={() => {
                  setSelectedCard(-1);
                  setLocalAnswer('');
                  setLocalQuestion('');
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
                      <h4 className="h4 mb-2">Card Question</h4>
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
                      <h4 className="h4 mb-2">Card Answer</h4>
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
                      <h4 className="h4 mb-2">Card Question</h4>
                      <textarea
                        className="text-[#fff] bg-c-light flex-1 w-full p-4 rounded-2xl resize-none outline-none p-small"
                        name="question"
                        id=""
                        value={localQuestion}
                        onChange={(e) => setLocalQuestion(e.target.value)}
                      ></textarea>
                    </div>
                    <div className="basis-[40%] flex flex-col">
                      <h4 className="h4 mb-2">Card Answer</h4>
                      <textarea
                        className="text-[#fff] bg-c-light flex-1 w-full p-4 rounded-2xl resize-none outline-none p-small"
                        name="answer"
                        id=""
                        value={localAnswer}
                        onChange={(e) => setLocalAnswer(e.target.value)}
                      ></textarea>
                    </div>
                  </div>

                  <button
                    className="mb-2 p-body px-4 py-2 bg-c-primary text-c-dark rounded-2xl"
                    onClick={() => {
                      if (!validCard()) return;

                      setCards((prev) => [
                        ...prev,
                        { question: localQuestion, answer: localAnswer },
                      ]);
                      setSelectedCard(cards.length);
                      setCardChange(true);
                    }}
                  >
                    Add Card
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-1 justify-between">
            <div className="basis-[30%]"></div>
            <div className="basis-[65%]">
              <div></div>
              <div></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Deck;
