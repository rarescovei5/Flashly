import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import crypto from 'crypto';

import express from 'express';
import mysql from 'mysql2';

const mysqlConnection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const app = express();
app.use(express.json());

//Create User
app.post('/api/users', (req, res) => {
  const q = `INSERT INTO Users (username, email, password_hash)
VALUES (?);`;

  const password = req.body.password;

  if (password.length < 8) {
    res.send({ error: 'Password must be at least 8 characters' });
    return;
  } else if (password.length > 24) {
    res.send({ error: 'Password must be less than 24 characters' });
    return;
  } else if (!/(?=.*[a-z])/.test(password)) {
    res.send({ error: 'Password must contain at least one lowercase letter' });
    return;
  } else if (!/(?=.*[A-Z])/.test(password)) {
    res.send({ error: 'Password must contain at least one uppercase letter' });
    return;
  } else if (!/(?=.*\d)/.test(password)) {
    res.send({ error: 'Password must contain at least one number' });
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
          return res.send({ error: 'Email already registered' });
        } else if (message == 'users.username_UNIQUE') {
          return res.send({ error: 'Username taken' });
        } else {
          return res.send({ error: 'idk what happened' });
        }
      } else {
        return res.send({ error: 'idk what happened' });
      }
    }

    return res.send({ error: '' });
  });
});
//Create Flashcard
app.post('/api/flashcard', (req, res) => {
  const q = `INSERT INTO Flashcards (user_id, name, content,settings)
VALUES (?);`;

  const user_id = req.body.id;
  const name = req.body.name;
  const content = '8@Question@Answer';
  const defaultSettings = '';

  const values = [user_id, name, content, defaultSettings];
  mysqlConnection.query(q, [values], (err, data) => {
    if (err) return res.send({ error: err });

    return res.send({ error: '' });
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
