import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Get the current directory name using import.meta.url
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

import crypto from "crypto";

import express from "express";
import mysql from "mysql2";
import cors from "cors";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

const isDebugging = process.env.DEBUG_PRINTS || false;

//Connect to the database
const mysqlConnection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

//User related querys
const registerUser = (req: express.Request, res: express.Response) => {
  isDebugging &&
    console.log(
      "\x1b[34m",
      `\n------${new Date().toISOString().slice(0, 19).replace("T", " ")}-----`
    );

  const q = `INSERT INTO users (username, email, password_hash) VALUES (?);`;
  const password = req.body.password;

  isDebugging && console.log("[registerUser]: Request body:", req.body); // Log the request body

  if (password.length < 8) {
    isDebugging &&
      console.warn("[registerUser]: Password validation failed: too short"); // Log validation failure
    res.status(500).send({ error: "Password must be at least 8 characters" });
    return;
  } else if (password.length > 24) {
    isDebugging &&
      console.warn("[registerUser]: Password validation failed: too long"); // Log validation failure
    res.status(500).send({ error: "Password must be less than 24 characters" });
    return;
  } else if (!/(?=.*[a-z])/.test(password)) {
    isDebugging &&
      console.warn(
        "[registerUser]: Password validation failed: no lowercase letter"
      ); // Log validation failure
    res
      .status(500)
      .send({ error: "Password must contain at least one lowercase letter" });
    return;
  } else if (!/(?=.*[A-Z])/.test(password)) {
    isDebugging &&
      console.warn(
        "[registerUser]: Password validation failed: no uppercase letter"
      ); // Log validation failure
    res
      .status(500)
      .send({ error: "Password must contain at least one uppercase letter" });
    return;
  } else if (!/(?=.*\d)/.test(password)) {
    isDebugging &&
      console.warn("[registerUser]: Password validation failed: no number"); // Log validation failure
    res
      .status(500)
      .send({ error: "Password must contain at least one number" });
    return;
  }

  isDebugging && console.log("[registerUser]: Password validation passed"); // Log password validation success

  const values = [
    req.body.username,
    req.body.email,
    crypto.createHash("sha256").update(req.body.password).digest("hex"),
  ];

  isDebugging && console.log("[registerUser]: Prepared query values:", values); // Log query values before execution

  mysqlConnection.query(q, [values], (err, data) => {
    if (err) {
      isDebugging && console.error("[registerUser]: Database error:", err); // Log database error

      if (err.code === "ER_DUP_ENTRY") {
        let message: any = err.message.split(" ");
        message = message[message.length - 1].replace(/'/g, "");

        if (message == "users.email") {
          isDebugging &&
            console.warn("[registerUser]: Duplicate entry for email"); // Log specific duplicate entry
          return res.status(500).send({ error: "Email already registered" });
        } else if (message == "users.username_UNIQUE") {
          isDebugging &&
            console.warn("[registerUser]: Duplicate entry for username"); // Log specific duplicate entry
          return res.status(500).send({ error: "Username taken" });
        } else {
          isDebugging &&
            console.error("[registerUser]: Unhandled duplicate entry:", err); // Log unhandled duplicate error
          return res.status(500).send({ error: err });
        }
      } else {
        isDebugging &&
          console.error("[registerUser]: Unhandled database error:", err); // Log other database errors
        return res.status(500).send({ error: err });
      }
    }

    isDebugging &&
      console.log("[registerUser]: Query executed successfully:", data); // Log successful query execution
    return res.status(200).send({ error: "No Error" });
  });
};

const loginUser = (req: express.Request, res: express.Response) => {
  isDebugging &&
    console.log(
      "\x1b[35m",
      `\n------${new Date().toISOString().slice(0, 19).replace("T", " ")}-----`
    );

  const q = "SELECT * FROM users WHERE email=? AND password_hash=?";
  const values = [
    req.body.email,
    crypto.createHash("sha256").update(req.body.password).digest("hex"),
  ];

  mysqlConnection.query(q, values, (err, data) => {
    if (err) {
      isDebugging && console.error("[loginUser]: Database query error:", err); // Log database error
      return res.status(500).send({ error: err });
    }

    isDebugging &&
      console.log("[loginUser]: Query result:", JSON.stringify(data as any));

    if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
      isDebugging &&
        console.error(
          "[loginUser]: Environment variables missing: ACCESS_TOKEN_SECRET or REFRESH_TOKEN_SECRET"
        ); // Log missing environment variables
      return res.status(500).send({ error: "Error while logging in" });
    }

    if ((data as any).length > 0) {
      isDebugging && console.log("[loginUser]: User found in database"); // Log successful user lookup
      const user_id = (data as any)[0].id;

      // Create tokens
      const accessToken = jwt.sign(
        { user_id },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "5m" }
      );
      const refreshToken = jwt.sign(
        { user_id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "1d" }
      );

      isDebugging &&
        console.log("[loginUser]: Access and refresh tokens created");

      // Save Access Token
      const q = "UPDATE users SET refresh_token=? WHERE id=?";

      isDebugging &&
        console.log(
          "[loginUser]: Update query values:",
          JSON.stringify([refreshToken, user_id])
        );

      let aborted = false;
      mysqlConnection.query(q, [refreshToken, user_id], (err, data) => {
        if (err) {
          isDebugging &&
            console.error(
              "[loginUser]: Error updating refresh token in database:",
              err
            ); // Log database error
          aborted = true;
          return res.status(500).send({ error: err });
        }
        isDebugging &&
          console.log("[loginUser]: Refresh token updated in database");
      });
      if (aborted) return;

      // Send Results
      isDebugging &&
        console.log("[loginUser]: Setting cookie with refresh token");
      res.cookie("jwt", refreshToken, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        maxAge: 24 * 60 * 60 * 1000,
      });
      return res.status(200).send({ accessToken, error: "No Error" });
    } else {
      isDebugging && console.warn("[loginUser]: Invalid credentials provided"); // Log invalid credentials
      return res.status(401).send({ error: "Invalid credentials" });
    }
  });
};
const logoutUser = (req: express.Request, res: express.Response) => {
  isDebugging &&
    console.log(
      "\x1b[35m",
      `\n------${new Date().toISOString().slice(0, 19).replace("T", " ")}-----`
    );

  const q = "UPDATE users SET refresh_token=NULL WHERE refresh_token=?";
  const cookies = req.cookies;

  isDebugging && console.log("[logoutUser]: Cookies received:", cookies);

  if (!cookies?.jwt) {
    isDebugging && console.log("[logoutUser]: No JWT cookie found"); // Log absence of JWT
    res.status(204).send({ error: "No content" });
    return;
  }

  const refreshToken = cookies.jwt;

  isDebugging &&
    console.log("[logoutUser]: Refresh token from cookie:", refreshToken);

  mysqlConnection.query(q, [refreshToken], (err, data) => {
    if (err) {
      isDebugging &&
        console.error(
          "[logoutUser]: Error while removing refresh token in database:",
          err
        ); // Log database error
      return res.status(500).send({ error: err });
    }

    isDebugging &&
      console.log("[logoutUser]: Refresh token removed from database");

    res.clearCookie("jwt", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });
    isDebugging && console.log("[logoutUser]: JWT cookie cleared");
    res.status(200).send({ error: "No Error" });
  });
};

//Flashcard related querys
const createDeck = (req: express.Request, res: express.Response) => {
  isDebugging &&
    console.log(
      "\x1b[34m",
      `\n------${new Date().toISOString().slice(0, 19).replace("T", " ")}-----`
    );
  const user_id = req.body.user_id;
  const q = "SELECT * FROM decks WHERE user_id=?";

  // Debugging statement for the user_id and query
  isDebugging &&
    console.log(`[createDeck]: Debugging - user_id: ${user_id}, query: ${q}`);

  // Get the amount of decks a user has
  mysqlConnection.query(q, [user_id], (err, data) => {
    if (err) {
      // Debugging statement for query error
      isDebugging &&
        console.log(`[createDeck]: Debugging - Error fetching decks:`, err);
    }

    const q = "INSERT INTO decks (user_id, name, settings) VALUES (?)";
    const defaultSettings = JSON.stringify({
      defaultSettings: {
        deckColor: "c-primary",
        timer: {
          maximumTime: 60,
          showTimer: false,
          calculateTime: false,
        },
        displayOrder: "Display cards in increasing order",
        dailyLimits: {
          newCards: 20,
          maximumReviews: 999,
        },
      },
    });

    const name = `Deck ${(data as any).length + 1}`;
    const values = [user_id, name, defaultSettings];

    // Debugging statement for the insert query and deck name
    isDebugging &&
      console.log(
        `[createDeck]: Debugging - Insert query: ${q}, values: ${JSON.stringify(
          values
        )}`
      );

    mysqlConnection.query(q, [values], (err, data) => {
      if (err) {
        // Debugging statement for query error during insert
        isDebugging &&
          console.log(`[createDeck]: Debugging - Error inserting deck:`, err);

        return res
          .status(500)
          .send({ error: "Error on server side", details: err });
      }

      const deck_id = (data as any).insertId; // Get the newly inserted deck_id
      // Debugging statement for the new deck ID
      isDebugging &&
        console.log(
          `[createDeck]: Debugging - New deck created with ID:`,
          deck_id
        );

      // Call createInitialFlashcard with the user_id and deck_id
      createInitialFlashcard(deck_id);

      // Respond with success and the new deck ID
      res.status(201).send({ success: true, deck_id });
    });
  });
};
const getUsersDecks = (req: express.Request, res: express.Response) => {
  isDebugging &&
    console.log(
      "\x1b[32m",
      `\n------${new Date().toISOString().slice(0, 19).replace("T", " ")}-----`
    );

  const q = "SELECT * FROM decks WHERE user_id=?";

  mysqlConnection.query(q, [req.body.user_id], (err, data) => {
    if (err) {
      // Debugging statement for query error
      isDebugging &&
        console.log(`[getUsersDecks]: Debugging - Error fetching decks:`, err);
      return res.status(500).send({ error: err });
    }

    if (!data) {
      // Debugging statement for no data found
      isDebugging &&
        console.log(
          `[getUsersDecks]: Debugging - No decks found for user_id: ${req.body.user_id}`
        );
      return res.status(404).send({ error: "No decks found" });
    }

    // Debugging statement for successful data retrieval
    isDebugging &&
      console.log(
        `[getUsersDecks]: Debugging - Found decks for user_id: ${req.body.user_id}`
      );

    return res.status(200).send({ decks: data, error: "No Error" });
  });
};
const getUsersDeck = async (req: express.Request, res: express.Response) => {
  isDebugging &&
    console.log(
      "\x1b[32m",
      `\n------${new Date().toISOString().slice(0, 19).replace("T", " ")}-----`
    );

  const q = "SELECT * FROM decks WHERE id = ?";
  const deck_id = parseInt(req.params.id!);
  const user_id = req.body.user_id;

  const values = [deck_id];

  // Debugging statement for the query and parameters
  isDebugging &&
    console.log(
      `[getUsersDeck]: Getting deck_id ${deck_id} for user_id ${user_id}`
    );

  mysqlConnection.query(q, values, async (err, data) => {
    if (err) {
      // Debugging statement for query error
      isDebugging &&
        console.log(`[getUsersDeck]: Debugging - Error fetching deck:`, err);

      return res
        .status(500)
        .send({ error: "Error on server side", details: err });
    }

    const deckData = data as any;
    if (deckData.length === 0) {
      // Debugging statement for no deck found
      isDebugging &&
        console.log(
          `[getUsersDeck]: Debugging - Deck not found for deck_id: ${deck_id}`
        );
      return res.status(404).send({ error: "Deck not found" });
    }

    const deck = deckData[0];

    if (deck.user_id !== user_id) {
      // Debugging statement for unauthorized access
      isDebugging &&
        console.log(
          `[getUsersDeck]: Debugging - Unauthorized access to deck_id: ${deck_id} by user_id: ${user_id}`
        );
      return res.status(401).send({ error: "Unauthorized" });
    }

    try {
      // Fetch the flashcards associated with the deck
      const flashcards = await getFlashcardsFromDeck(deck_id);

      // Debugging statement for flashcards fetched
      isDebugging &&
        console.log(
          `[getUsersDeck]: Debugging - Flashcards fetched for deck_id: ${deck_id}`
        );

      flashcards.forEach((card: any) => {
        if (!card.next_review_at) return;
        card.next_review_at = formatTimestamp(card.next_review_at);
        card.last_reviewed_at = formatTimestamp(card.last_reviewed_at);
      });

      return res.status(200).send({
        deck: { ...deck, flashcards },
        error: "No Error",
      });
    } catch (flashcardsErr) {
      // Debugging statement for error fetching flashcards
      isDebugging &&
        console.log(
          `[getUsersDeck]: Debugging - Error fetching flashcards for deck_id: ${deck_id}`,
          flashcardsErr
        );

      return res.status(500).send({
        error: "Error fetching flashcards",
        details: flashcardsErr,
      });
    }
  });
};
const updateDeck = (req: express.Request, res: express.Response) => {
  //Ignoring the fapt that other users can update your deck
  isDebugging &&
    console.log(
      "\x1b[36m",
      `\n------${new Date().toISOString().slice(0, 19).replace("T", " ")}-----`
    );

  const q = `
    UPDATE decks 
    SET name = ?, settings = ?, is_public = ?, updated_at = NOW() 
    WHERE id = ?`;

  const deck_id = parseInt(req.params.id!);
  const { name, settings, is_public } = req.body;
  const updatedFlashcards = req.body.flashcards;

  const values = [name, JSON.stringify(settings), is_public ? 1 : 0, deck_id];
  console.log(values);

  // Update deck details
  mysqlConnection.query(q, values, (err, result) => {
    if (err) {
      // Debugging statement for query error
      isDebugging &&
        console.log(`[updateDeck]: Debugging - Error updating deck:`, err);
      return res
        .status(500)
        .send({ error: "Error on server side", details: err });
    }

    const okResult = result as mysql.OkPacketParams;

    if (okResult.affectedRows === 0) {
      // Debugging statement for deck not found
      isDebugging &&
        console.log(`[updateDeck]: Deck not found for deck_id: ${deck_id}`);
      return res.status(404).send({ error: "Deck not found" });
    }

    // Handle flashcard updates and deletions
    if (Array.isArray(updatedFlashcards)) {
      const existingFlashcardIds = updatedFlashcards.map((fc: any) => fc.id);

      // Debugging statement for updated flashcards
      isDebugging && console.log(`[updateDeck]: Updated flashcards:`);

      // Step 1: Delete flashcards not present in the updated flashcards
      const deleteQuery = `
        DELETE FROM flashcards 
        WHERE deck_id = ? AND id NOT IN (?)`;

      mysqlConnection.query(
        deleteQuery,
        [deck_id, existingFlashcardIds.length ? existingFlashcardIds : [-1]], // Prevent invalid SQL when no flashcards exist
        (deleteErr) => {
          if (deleteErr) {
            // Debugging statement for error deleting flashcards
            isDebugging &&
              console.log(
                `[updateDeck]: Debugging - Error deleting old flashcards for deck_id: ${deck_id}`,
                deleteErr
              );
            return res.status(500).send({
              error: "Error deleting old flashcards",
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

          // Debugging statement for flashcard queries being executed
          isDebugging &&
            console.log(
              `[updateDeck]: Executing flashcard queries for deck_id: ${deck_id}`
            );

          // Execute all flashcard queries
          Promise.all(flashcardQueries)
            .then(() => {
              // Debugging statement for successful update of flashcards
              isDebugging &&
                console.log(
                  `[updateDeck]: Flashcards updated successfully for deck_id: ${deck_id}`
                );
              return res.status(200).send({ error: "No Error" });
            })
            .catch((flashcardErr) => {
              // Debugging statement for error updating flashcards
              isDebugging &&
                console.log(
                  `[updateDeck]: Debugging - Error updating flashcards for deck_id: ${deck_id}`,
                  flashcardErr
                );
              return res.status(500).send({
                error: "Error updating flashcards",
                details: flashcardErr,
              });
            });
        }
      );
    } else {
      // If no flashcards were provided, just update the deck
      return res.status(200).send({ error: "No Error" });
    }
  });
};
const deleteDeck = async (req: express.Request, res: express.Response) => {
  isDebugging &&
    console.log(
      "\x1b[32m",
      `\n------${new Date().toISOString().slice(0, 19).replace("T", " ")}-----`
    );
  const deck_id = req.params.id;
  const user_id = req.body.user_id;

  const q = "DELETE FROM decks WHERE id = ? AND user_id = ?";
  mysqlConnection.query(q, [deck_id, user_id], (err, results) => {
    if (err) {
      console.error("[deleteDeck]: Error deleting deck", err);
      return res.status(500).send({ error: "Server error", details: err });
    }

    isDebugging &&
      console.log(`[deleteDeck]: Deleted deck with id: ${deck_id}`);

    return res.status(200).send({ error: "No Error" });
  });
};
const searchDecks = async (req: express.Request, res: express.Response) => {
  isDebugging &&
    console.log(
      "\x1b[32m",
      `\n------${new Date().toISOString().slice(0, 19).replace("T", " ")}-----`
    );

  const input = req.params.query;

  if (!input) {
    res.status(400).send({ error: "Input is required" });
    return;
  }

  // Modified query: join decks with users to get the username.
  const query = `
    SELECT d.id, d.name, u.username 
    FROM decks d 
    JOIN users u ON d.user_id = u.id
    WHERE d.is_public = 1 AND d.name LIKE ?
  `;
  const values = [`%${input}%`];

  mysqlConnection.query(query, values, (err, results) => {
    if (err) {
      console.error("[searchDecks]: Error fetching decks", err);
      return res.status(500).send({ error: "Server error", details: err });
    }
    isDebugging &&
      console.log(`[searchDecks]: Found ${(results as any).length} decks`);

    return res.status(200).json(results);
  });
};

const saveDeck = (req: express.Request, res: express.Response) => {
  isDebugging &&
    console.log(
      "\x1b[35m",
      `\n------${new Date().toISOString().slice(0, 19).replace("T", " ")}-----`
    );

  // Get the current user id and the deck id to copy
  const currentUserId = req.body.user_id;
  const originalDeckId = req.params.deckId; // e.g. /decks/save/:deckId
  // The original deck information is provided by the frontend in req.body.deck
  const originalDeck = req.body.deck;
  const flashcards = req.body.deck.flashcards;

  isDebugging &&
    console.log(
      `[saveDeck]: currentUserId: ${currentUserId}, originalDeckId: ${originalDeckId}`
    );

  if (!currentUserId || !originalDeckId || !originalDeck) {
    isDebugging &&
      console.log(
        "[saveDeck]: Missing currentUserId, originalDeckId, or deck data"
      );
    res
      .status(400)
      .send({ error: "User id, deck id, and deck data are required." });
    return;
  }

  // Create a new deck for the current user. We prefix the name to indicate it’s a copy.
  const newDeckName = `Copy of ${originalDeck.name}`;
  const newDeckSettings = originalDeck.settings; // Copy settings as-is
  // Decide if you want the copied deck to be public or private.
  const newDeckIsPublic = 0; // For example, we copy it as a private deck.

  const insertDeckQuery =
    "INSERT INTO decks (user_id, name, settings) VALUES (?)";
  const deckValues = [
    currentUserId,
    newDeckName,
    JSON.stringify(newDeckSettings),
  ];

  isDebugging &&
    console.log(
      `[saveDeck]: Inserting new deck for user ${currentUserId} with name "${newDeckName}"`
    );

  mysqlConnection.query(insertDeckQuery, [deckValues], (err, result) => {
    if (err) {
      isDebugging && console.error("[saveDeck]: Error creating new deck", err);
      return res
        .status(500)
        .send({ error: "Error creating new deck", details: err });
    }

    const newDeckId = (result as any).insertId;
    isDebugging &&
      console.log(`[saveDeck]: New deck created with ID: ${newDeckId}`);

    // Copy flashcards into the new deck.
    const flashcardInsertPromises = flashcards.map((flashcard: any) => {
      return new Promise<void>((resolve, reject) => {
        const insertFlashcardQuery = `
          INSERT INTO flashcards 
            (deck_id, id, question, answer)
          VALUES (?)
        `;
        const flashcardValues = [
          newDeckId,
          flashcard.id,
          flashcard.question,
          flashcard.answer,
        ];

        isDebugging &&
          console.log(
            `[saveDeck]: Copying flashcard: ${flashcard.question} -> ${flashcard.answer}`
          );

        mysqlConnection.query(
          insertFlashcardQuery,
          [flashcardValues],
          (err) => {
            if (err) {
              isDebugging &&
                console.error("[saveDeck]: Error inserting flashcard", err);
              return reject(err);
            }
            resolve();
          }
        );
      });
    });

    Promise.all(flashcardInsertPromises)
      .then(() => {
        isDebugging &&
          console.log(
            `[saveDeck]: All flashcards copied successfully for new deck ID: ${newDeckId}`
          );
        return res.status(201).send({ success: true, newDeckId });
      })
      .catch((err) => {
        isDebugging &&
          console.error("[saveDeck]: Error copying flashcards", err);
        return res
          .status(500)
          .send({ error: "Error copying flashcards", details: err });
      });
  });
};

//Helper Functions
const formatTimestamp = (isoString: string) => {
  return new Date(isoString).toISOString().slice(0, 19).replace("T", " ");
};
const createInitialFlashcard = (deck_id: number) => {
  const q = "INSERT INTO flashcards (deck_id, id, question, answer) VALUES (?)";

  const question = "Question";
  const answer = "Answer";

  const values = [deck_id, 1, question, answer];
  mysqlConnection.query(q, [values], (err, data) => {
    if (err) {
      console.error("Error adding initial flashcard:", err);
    } else {
      console.log("Initial flashcard created for deck:", deck_id);
    }
  });
};
const getFlashcardsFromDeck = (deck_id: number): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const q = "SELECT * FROM flashcards WHERE deck_id = ?";

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
  isDebugging &&
    console.log(
      "\x1b[90m",
      `\n------${new Date().toISOString().slice(0, 19).replace("T", " ")}-----`
    );

  const authHeader = req.headers["authorization"];

  // Debugging statement for missing authorization header
  if (!authHeader) {
    isDebugging && console.log(`[verifyJWT]: No authorization header found.`);
    res.sendStatus(401); // Respond with 401
    return; // Stop further execution
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    // Debugging statement for missing token
    isDebugging &&
      console.log(`[verifyJWT]: No token found in authorization header.`);
    res.sendStatus(401); // Respond with 401
    return;
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!, (err, decoded) => {
    if (err) {
      // Debugging statement for error verifying token
      isDebugging && console.log(`[verifyJWT]: Error verifying token:`, err);
      res.sendStatus(403); // Respond with 403
      return;
    }

    req.body.user_id = (decoded as any).user_id;
    // Debugging statement for successful token verification
    isDebugging &&
      console.log(
        `[verifyJWT]: Token verified successfully, user_id: ${
          (decoded as any).user_id
        }`
      );
    next(); // Pass control to the next middleware
  });
};
const handleRefreshToken = (req: express.Request, res: express.Response) => {
  isDebugging &&
    console.log(
      "\x1b[90m",
      `\n------${new Date().toISOString().slice(0, 19).replace("T", " ")}-----`
    );

  const cookies = req.cookies;

  // Debugging statement for missing JWT cookie
  if (!cookies?.jwt) {
    isDebugging &&
      console.log(`[handleRefreshToken]: Debugging - No JWT cookie found.`);
    res.sendStatus(401);
    return;
  }

  const refreshToken = cookies.jwt;
  const q = "SELECT * FROM users WHERE refresh_token=?";

  // Debugging statement for the refresh token being used in the query
  isDebugging &&
    console.log(`[handleRefreshToken]: Using refresh token: ${refreshToken}`);

  mysqlConnection.query(q, [refreshToken], (err, data) => {
    if (err) {
      // Debugging statement for database error
      isDebugging && console.log(`[handleRefreshToken]: Database error:`, err);
      return res.sendStatus(403);
    }
    if (!data || (data as any).length === 0) {
      // Debugging statement for no user found for refresh token
      isDebugging &&
        console.log(`[handleRefreshToken]: No user found for refresh token.`);
      return res.status(404).send({ error: "User not found" });
    }

    const user_id = (data as any)[0].id;

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!,
      (err: any, decoded: any) => {
        if (err || user_id !== (decoded as any).user_id) {
          // Debugging statement for token verification failure
          isDebugging &&
            console.log(
              `[handleRefreshToken]: Token verification failed:`,
              err
            );
          return res.sendStatus(403);
        }

        const accessToken = jwt.sign(
          { user_id },
          process.env.ACCESS_TOKEN_SECRET!,
          { expiresIn: "5m" }
        );

        // Debugging statement for new access token generated
        isDebugging &&
          console.log(
            `[handleRefreshToken]: Access token generated: ${accessToken}`
          );

        res.status(200).send({ accessToken, error: "No Error" });
      }
    );
  });
};

//Cors Options
const allowedOrigins = ["http://localhost:5173", process.env.FRONTEND_PATH];
const corsOptions = {
  origin: (origin: any, callback: any) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["POST", "GET", "PUT", "DELETE"],
  credentials: true, // Allow cookies and credentials
};

//Update user activity
const updateUserActivity = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user_id = req.body.user_id;
  if (!user_id) {
    res.sendStatus(401);
    return;
  }

  isDebugging &&
    console.log(
      "[updateUserActivity]: Updating user activity for user:",
      user_id
    );

  const q = `UPDATE users SET last_active_at = NOW() WHERE id = ?`;

  mysqlConnection.query(q, [user_id], (err, result) => {
    if (err) {
      isDebugging &&
        console.error(`[updateUserActivity]: Database error:`, err);
      return res.sendStatus(500);
    }

    next();
  });
};

//Middleware
const app = express();
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

//Routes
app.route("/api/refresh").get(handleRefreshToken);
app.route("/api/users/register").post(registerUser);
app.route("/api/users/login").post(loginUser);
app.route("/api/users/logout").post(logoutUser);

app.use(verifyJWT);
app.use(updateUserActivity);
app.route("/api/decks").get(getUsersDecks).post(createDeck);
app
  .route("/api/decks/:id")
  .get(getUsersDeck)
  .put(updateDeck)
  .delete(deleteDeck);
app.route("/api/discover/:query").get(searchDecks);
app.route("/api/decks/save/:deckId").post(saveDeck);

//Server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  isDebugging && console.log("\x1b[0m", "[server]: Debug mode on");
  console.log(`[server]: Allowed origins ${JSON.stringify(allowedOrigins)}`);
  console.log(`[server]: Running...`);
  console.log(`-------------------------------`);
});
