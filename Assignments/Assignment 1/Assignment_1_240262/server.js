const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: 'lostandfound_comefixthy',
  host: '5vggh.h.filess.io',
  database: 'lostandfound_comefixthy',
  password: '0ba8e43123e8244dfe535585869c639b8fd248dd',
  port: 5433,
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


app.post('/items', async (req, res) => {
  const { name, description, status, location, image, contact_name, phone } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO lostandfound.items (name, description, status, location, image, contact_name, phone) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, description, status, location, image, contact_name, phone]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add item' });
  }
});


app.put('/items/:id', async (req, res) => {
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


app.delete('/items/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM lostandfound.items WHERE id=$1', [id]);
    res.json({ message: 'Item deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});




app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO lostandfound.users (username, password) VALUES ($1, $2)',
      [username, hashed]
    );
    res.json({ message: 'User registered' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
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
    const valid = await bcrypt.compare(password, result.rows[0].password);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid password' });
    }
    res.json({ message: 'Login successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});


app.listen(3000, () => {
  console.log('Server running on port 3000');
});
