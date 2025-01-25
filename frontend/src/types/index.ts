import { Dispatch, SetStateAction } from 'react';

export type UserInfo = {
  username: string;
  email: string;
  password: string;
};
export type AuthContextType = {
  auth: {
    email: string;
    password: string;
    accessToken: string;
  };
  setAuth: Dispatch<
    SetStateAction<{ email: string; password: string; accessToken: string }>
  >;
};
export type SettingsType = {
  defaultSettings: {
    deckColor: string;
    timer: {
      maximumTime: number;
      showTimer: boolean;
      calculateTime: boolean;
    };
    displayOrder: string;
    dailyLimits: {
      newCards: number;
      maximumReviews: number;
    };
  };
  dangerSettings: {
    public: boolean;
  };
};
export type Flashcard = {
  deck_id: number;
  id: number;
  question: string;
  answer: string;
  ease_factor: number;
  repetitions: number;
  interval_days: number;
  last_reviewed_at: string | null;
  next_review_at: string | null;
};

export type DeckType = {
  id: number;
  user_id: number;
  name: string;
  settings: SettingsType;
  created_at: string;
  updated_at: string;
  flashcards: Flashcard[];
};
