const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));


const JWT_SECRET = process.env.JWT_SECRET;


const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.get('/items', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lostandfound.items ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});


app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const userExists = await pool.query(
      'SELECT * FROM lostandfound.users WHERE username=$1',
      [username]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }


    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO lostandfound.users (username, password) VALUES ($1, $2)',
      [username, hashed]
    );
    
    res.status(201).json({ message: 'User registered successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed due to a server error' });
  }
});


app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM lostandfound.users WHERE username=$1',
      [username]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid password' });
    }


    const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    res.json({ message: 'Login successful', token: token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});


function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 

  if (token == null) {
    return res.sendStatus(401); 
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403); 
    }
    req.user = user;
    next();
  });
}


app.post('/items', authenticateToken, async (req, res) => {
  const { name, description, status, location, image, contact_name, phone } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO lostandfound.items (name, description, status, location, image, contact_name, phone) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, description, status, location, image, contact_name, phone]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

app.put('/items/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, description, status, location, image, contact_name, phone } = req.body;
  try {
    const result = await pool.query(
      'UPDATE lostandfound.items SET name=$1, description=$2, status=$3, location=$4, image=$5, contact_name=$6, phone=$7 WHERE id=$8 RETURNING *',
      [name, description, status, location, image, contact_name, phone, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

app.delete('/items/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM lostandfound.items WHERE id=$1', [id]);
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});





});


