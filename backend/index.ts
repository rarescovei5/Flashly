import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import crypto from 'crypto';

import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

//Connect to the database

const mysqlConnection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

//User related querys
const registerUser = (req: express.Request, res: express.Response) => {
  const q = `INSERT INTO users (username, email, password_hash)
VALUES (?);`;

  const password = req.body.password;

  if (password.length < 8) {
    res.status(500).send({ error: 'Password must be at least 8 characters' });
    return;
  } else if (password.length > 24) {
    res.status(500).send({ error: 'Password must be less than 24 characters' });
    return;
  } else if (!/(?=.*[a-z])/.test(password)) {
    res
      .status(500)
      .send({ error: 'Password must contain at least one lowercase letter' });
    return;
  } else if (!/(?=.*[A-Z])/.test(password)) {
    res
      .status(500)
      .send({ error: 'Password must contain at least one uppercase letter' });
    return;
  } else if (!/(?=.*\d)/.test(password)) {
    res
      .status(500)
      .send({ error: 'Password must contain at least one number' });
    return;
  }

  const values = [
    req.body.username,
    req.body.email,
    crypto.createHash('sha256').update(req.body.password).digest('hex'),
  ];
  mysqlConnection.query(q, [values], (err, data) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        let message: any = err.message.split(' ');
        message = message[message.length - 1].replace(/'/g, '');

        if (message == 'users.email') {
          return res.status(500).send({ error: 'Email already registered' });
        } else if (message == 'users.username_UNIQUE') {
          return res.status(500).send({ error: 'Username taken' });
        } else {
          return res.status(500).send({ error: err });
        }
      } else {
        console.log(err);
        return res.status(500).send({ error: err });
      }
    }

    return res.status(200).send({ error: 'No Error' });
  });
};
const loginUser = (req: express.Request, res: express.Response) => {
  const q = 'SELECT * FROM users WHERE email=? AND password_hash=?';

  const values = [
    req.body.email,
    crypto.createHash('sha256').update(req.body.password).digest('hex'),
  ];

  mysqlConnection.query(q, values, (err, data) => {
    //------------------Error Handling - Typescript screams at you if you don't do this
    if (err) return res.status(500).send({ error: err });
    if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
      return res.status(500).send({ error: 'Error while logging in' });
    }

    if ((data as any).length > 0) {
      const user_id = (data as any)[0].id;

      // Create tokens
      const accessToken = jwt.sign(
        { user_id },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '5m' }
      );
      const refreshToken = jwt.sign(
        { user_id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '1d' }
      );

      //Save Acces Token
      const q = 'UPDATE Users SET refresh_token=? WHERE id=?';
      mysqlConnection.query(q, [refreshToken, user_id], (err, data) => {
        if (err) return res.status(500).send({ error: err });
        return;
      });

      //Send Results
      res.cookie('jwt', refreshToken, {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        maxAge: 24 * 60 * 60 * 1000,
      });
      return res.status(200).send({ accessToken, error: 'No Error' });
    } else {
      return res.status(401).send({ error: 'Invalid credentials' });
    }
  });
};
const logoutUser = (req: express.Request, res: express.Response) => {
  //Remove refresh token from the user in the database
  const q = 'UPDATE users SET refresh_token=NULL WHERE refresh_token=?';

  const cookies = req.cookies;
  if (!cookies?.jwt) {
    res.status(204).send({ error: 'No content' });
    return;
  } //No content

  const refreshToken = cookies.jwt;
  mysqlConnection.query(q, [refreshToken], (err, data) => {
    if (err) return res.status(500).send({ error: err });

    res.clearCookie('jwt', {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
    });
    res.status(200).send({ error: 'No Error' });
  });
};

//Flashcard related querys
const createDeck = (req: express.Request, res: express.Response) => {
  const user_id = req.body.user_id;
  const q = 'SELECT * FROM decks WHERE user_id=?';
  //Get the ammount of decks a user has
  mysqlConnection.query(q, [user_id], (err, data) => {
    const q = 'INSERT INTO decks (user_id, name, settings) VALUES (?)';
    const defaultSettings = JSON.stringify({
      defaultSettings: {
        deckColor: 'c-primary',
        timer: {
          maximumTime: 60,
          showTimer: false,
          calculateTime: false,
        },
        displayOrder: 'Display cards in increasing order',
        dailyLimits: {
          newCards: 20,
          maximumReviews: 999,
        },
      },
      dangerSettings: {
        public: false,
      },
    });

    const name = `Deck ${(data as any).length + 1}`;
    const values = [user_id, name, defaultSettings];

    mysqlConnection.query(q, [values], (err, data) => {
      if (err) {
        return res
          .status(500)
          .send({ error: 'Error on server side', details: err });
      }

      const deck_id = (data as any).insertId; // Get the newly inserted deck_id
      console.log('New deck created with ID:', deck_id);

      // Call createInitialFlashcard with the user_id and deck_id
      createInitialFlashcard(deck_id);

      // Respond with success and the new deck ID
      res.status(201).send({ success: true, deck_id });
    });
  });
};
const getUsersDecks = (req: express.Request, res: express.Response) => {
  const q = 'SELECT * FROM decks WHERE user_id=?';

  mysqlConnection.query(q, [req.body.user_id], (err, data) => {
    if (err) return res.status(500).send({ error: err });
    if (!data) return res.status(404).send({ error: 'No decks found' });
    return res.status(200).send({ decks: data, error: 'No Error' });
  });
};
const getUsersDeck = async (req: express.Request, res: express.Response) => {
  const q = 'SELECT * FROM decks WHERE id = ?';
  const deck_id = parseInt(req.params.id!);

  const values = [deck_id];

  mysqlConnection.query(q, values, async (err, data) => {
    if (err) {
      return res
        .status(500)
        .send({ error: 'Error on server side', details: err });
    }

    const deckData = data as any;
    if (deckData.length === 0) {
      return res.status(404).send({ error: 'Deck not found' });
    }

    const deck = deckData[0];

    try {
      // Fetch the flashcards associated with the deck
      const flashcards = await getFlashcardsFromDeck(deck_id);

      return res.status(200).send({
        deck: { ...deck, flashcards },
        error: 'No Error',
      });
    } catch (flashcardsErr) {
      return res.status(500).send({
        error: 'Error fetching flashcards',
        details: flashcardsErr,
      });
    }
  });
};
const updateDeck = (req: express.Request, res: express.Response) => {
  const q = `
    UPDATE decks 
    SET name = ?, settings = ?, updated_at = NOW() 
    WHERE id = ?`;

  const deck_id = parseInt(req.params.id!);
  const name = req.body.name;
  const settings = req.body.settings;
  const updatedFlashcards = req.body.flashcards; // Expect an array of updated flashcards
  const values = [name, JSON.stringify(settings), deck_id];

  // Update deck details
  mysqlConnection.query(q, values, (err, result) => {
    if (err) {
      return res
        .status(500)
        .send({ error: 'Error on server side', details: err });
    }

    const okResult = result as mysql.OkPacketParams;

    if (okResult.affectedRows === 0) {
      return res.status(404).send({ error: 'Deck not found' });
    }

    // Handle flashcard updates and deletions
    if (Array.isArray(updatedFlashcards)) {
      const existingFlashcardIds = updatedFlashcards.map((fc: any) => fc.id);
      console.log('Existing Flashcard IDs:', existingFlashcardIds);

      // Step 1: Delete flashcards not present in the updated flashcards
      const deleteQuery = `
        DELETE FROM flashcards 
        WHERE deck_id = ? AND id NOT IN (?)`;
      mysqlConnection.query(
        deleteQuery,
        [deck_id, existingFlashcardIds.length ? existingFlashcardIds : [-1]], // Prevent invalid SQL when no flashcards exist
        (deleteErr) => {
          if (deleteErr) {
            return res.status(500).send({
              error: 'Error deleting old flashcards',
              details: deleteErr,
            });
          }

          // Step 2: Update or insert flashcards
          const flashcardQueries = updatedFlashcards.map((flashcard: any) => {
            return new Promise((resolve, reject) => {
              const flashcardQuery = `
                INSERT INTO flashcards (deck_id, id, question, answer, ease_factor, repetitions, interval_days, last_reviewed_at, next_review_at)
                VALUES (?)
                ON DUPLICATE KEY UPDATE
                  question = VALUES(question),
                  answer = VALUES(answer),
                  ease_factor = VALUES(ease_factor),
                  repetitions = VALUES(repetitions),
                  interval_days = VALUES(interval_days),
                  last_reviewed_at = VALUES(last_reviewed_at),
                  next_review_at = VALUES(next_review_at)`;

              const flashcardValues = [
                deck_id,
                flashcard.id,
                flashcard.question,
                flashcard.answer,
                flashcard.ease_factor || 2.5, // Default ease factor
                flashcard.repetitions || 0,
                flashcard.interval_days || 0,
                flashcard.last_reviewed_at || null,
                flashcard.next_review_at || null,
              ];

              mysqlConnection.query(
                flashcardQuery,
                [flashcardValues],
                (err) => {
                  if (err) reject(err);
                  else resolve(null);
                }
              );
            });
          });

          // Execute all flashcard queries
          Promise.all(flashcardQueries)
            .then(() => {
              return res.status(200).send({ error: 'No Error' });
            })
            .catch((flashcardErr) => {
              return res.status(500).send({
                error: 'Error updating flashcards',
                details: flashcardErr,
              });
            });
        }
      );
    } else {
      // If no flashcards were provided, just update the deck
      return res.status(200).send({ error: 'No Error' });
    }
  });
};

//Helper Functions
const createInitialFlashcard = (deck_id: number) => {
  const q = 'INSERT INTO flashcards (deck_id, id, question, answer) VALUES (?)';

  const question = 'Question';
  const answer = 'Answer';

  const values = [deck_id, 1, question, answer];
  mysqlConnection.query(q, [values], (err, data) => {
    if (err) {
      console.error('Error adding initial flashcard:', err);
    } else {
      console.log('Initial flashcard created for deck:', deck_id);
    }
  });
};
const getFlashcardsFromDeck = (deck_id: number): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const q = 'SELECT * FROM flashcards WHERE deck_id = ?';

    const values = [deck_id];
    mysqlConnection.query(q, values, (err, data: any[]) => {
      if (err) {
        reject(err); // Handle error
      } else {
        resolve(data); // Ensure results are treated as an array
      }
    });
  });
};

// User / Verification related querys
const verifyJWT = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    res.sendStatus(401); // Respond with 401
    return; // Stop further execution
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    res.sendStatus(401); // Respond with 401
    return;
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!, (err, decoded) => {
    if (err) {
      res.sendStatus(403); // Respond with 403
      return;
    }

    req.body.user_id = (decoded as any).user_id;
    next(); // Pass control to the next middleware
  });
};
const handleRefreshToken = (req: express.Request, res: express.Response) => {
  const cookies = req.cookies;
  //console.log('------------------------------------------------------');
  //console.log('Cookies:', cookies); // Log cookies
  if (!cookies?.jwt) {
    //console.error('No JWT cookie found');
    res.sendStatus(401);
    return;
  }

  const refreshToken = cookies.jwt;
  const q = 'SELECT * FROM Users WHERE refresh_token=?';

  mysqlConnection.query(q, [refreshToken], (err, data) => {
    if (err) {
      //console.error('Database error:', err);
      return res.sendStatus(403);
    }
    if (!data || (data as any).length === 0) {
      //console.error('No user found for refresh token');
      return res.status(404).send({ error: 'User not found' });
    }

    //console.log('User found:', (data as any)[0].email); // Log query result
    const user_id = (data as any)[0].id;

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!,
      (err: any, decoded: any) => {
        if (err || user_id !== (decoded as any).user_id) {
          //console.error('Token verification failed:', err);
          return res.sendStatus(403);
        }

        const accessToken = jwt.sign(
          { user_id },
          process.env.ACCESS_TOKEN_SECRET!,
          { expiresIn: '5m' }
        );

        //console.log('Access token generated:', accessToken); // Log new token
        res.status(200).send({ accessToken, error: 'No Error' });
      }
    );
  });
};

//Cors Options
const allowedOrigins = [
  'http://localhost:5174',
  'https://flashly-chi.vercel.app',
];

const corsOptions = {
  origin: (origin: any, callback: any) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies and credentials
};

//Middleware
const app = express();
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

//Routes
app.route('/api/refresh').get(handleRefreshToken);
app.route('/api/users/register').post(registerUser);
app.route('/api/users/login').post(loginUser);
app.route('/api/users/logout').post(logoutUser);
app
  .route('/api/decks')
  .get(verifyJWT, getUsersDecks)
  .post(verifyJWT, createDeck);
app
  .route('/api/decks/:id')
  .get(verifyJWT, getUsersDeck)
  .put(verifyJWT, updateDeck);

// app
//   .route('/api/flashcardprogress')
//   .get(verifyJWT, getFlashcardProgress)
//   .post(verifyJWT, updateFlashcardProgress)
//   .put(verifyJWT, updateFlashcardProgress);
//Server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
