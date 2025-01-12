import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import crypto from 'crypto';

import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { error } from 'console';

const mysqlConnection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
const registerUser = (req: express.Request, res: express.Response) => {
  const q = `INSERT INTO Users (username, email, password_hash)
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
          return res.status(500).send({ error: 'idk what happened' });
        }
      } else {
        return res.status(500).send({ error: 'idk what happened' });
      }
    }

    return res.status(200).send({ error: 'No Error' });
  });
};
const loginUser = (req: express.Request, res: express.Response) => {
  const q = 'SELECT * FROM Users WHERE email=? AND password_hash=?';

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

    if (data) {
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
  const q = 'UPDATE Users SET refresh_token=NULL WHERE refresh_token=?';

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
    res.status(204).send({ error: 'No Error' });
  });
};
const createFlashCard = (req: express.Request, res: express.Response) => {
  const q = `INSERT INTO Flashcards (user_id, name, content,settings)
VALUES (?);`;

  const user_id = req.body.user_id;
  const name = req.body.name;
  const content = req.body.content;
  const defaultSettings = '';

  const values = [user_id, name, content, defaultSettings];
  mysqlConnection.query(q, [values], (err, data) => {
    if (err) return res.status(500).send({ error: err });

    return res.status(200).send({ error: 'No Error' });
  });
};
const getUsersFlashcards = (req: express.Request, res: express.Response) => {
  const q = 'SELECT * FROM flashcards WHERE user_id=?';

  mysqlConnection.query(q, [req.body.user_id], (err, data) => {
    if (err) return res.status(500).send({ error: err });
    if (!data) return res.status(404).send({ error: 'No flashcards found' });
    return res.status(200).send({ data, error: 'No Error' });
  });
};

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
  if (!cookies?.jwt) {
    res.sendStatus(401);
    return;
  }

  const refreshToken = cookies.jwt;
  const q = 'SELECT * FROM Users WHERE refresh_token=?';

  mysqlConnection.query(q, [refreshToken], (err, data) => {
    if (err) return res.sendStatus(403);
    if (!data) return res.status(404).send({ error: 'User not found' });

    const user_id = (data as any)[0].id;

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!,
      (err: any, decoded: any) => {
        if (err || user_id !== (decoded as any).user_id) {
          return res.sendStatus(403);
        }

        const accessToken = jwt.sign(
          { user_id },
          process.env.ACCESS_TOKEN_SECRET!,
          { expiresIn: '5m' }
        );

        res.status(200).send({ accessToken, error: 'No Error' });
      }
    );
  });
};

//Middleware
const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

//Routes
app.route('/api/refresh').post(handleRefreshToken);
app.route('/api/users/register').post(registerUser);
app.route('/api/users/login').post(loginUser);
app.route('/api/users/logout').post(logoutUser);
app
  .route('/api/flashcards')
  .post(verifyJWT, createFlashCard)
  .get(verifyJWT, getUsersFlashcards);

//Server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
