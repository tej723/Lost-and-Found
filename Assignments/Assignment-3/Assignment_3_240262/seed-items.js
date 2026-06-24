/**
 * seed-items.js — Insert sample Lost & Found items into PostgreSQL
 *
 * Usage:
 *   DATABASE_URL=postgres://user:pass@host:5432/dbname node seed-items.js
 *
 * The script is idempotent-safe: it creates the items table if it does not
 * already exist, then inserts 4 sample records.
 */

'use strict';

const { Pool } = require('pg');

/* ------------------------------------------------------------------ */
/*  Database connection                                                 */
/* ------------------------------------------------------------------ */
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set.');
  console.error('Usage: DATABASE_URL=<connection-string> node seed-items.js');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

/* ------------------------------------------------------------------ */
/*  Sample items                                                        */
/* ------------------------------------------------------------------ */
const sampleItems = [
  {
    name: 'Lost Phone',
    description:
      'Black Samsung Galaxy smartphone found near the reading tables. Screen has a small crack on the top-right corner.',
    status: 'found',
    location: 'Library',
    image: 'https://placehold.co/400x300/dee2e6/495057?text=Phone',
    contact_name: 'Raj Kumar',
    phone: '9876543210',
  },
  {
    name: 'Lost Wallet',
    description:
      'Brown leather bifold wallet containing some cash and an IITK ID card. Found on a cafeteria bench.',
    status: 'found',
    location: 'Cafeteria',
    image: 'https://placehold.co/400x300/dee2e6/495057?text=Wallet',
    contact_name: 'Priya Singh',
    phone: '9123456780',
  },
  {
    name: 'Lost Keys',
    description:
      'A bunch of 3 keys on a red keychain with a small whistle attached. Found near the basketball court entrance.',
    status: 'found',
    location: 'Sports Complex',
    image: 'https://placehold.co/400x300/dee2e6/495057?text=Keys',
    contact_name: 'Arjun Patel',
    phone: '9988776655',
  },
  {
    name: 'Lost Laptop Charger',
    description:
      'Dell 65W laptop charger (barrel connector) with a white cable. Left near the security desk.',
    status: 'found',
    location: 'Hostel Gate',
    image: 'https://placehold.co/400x300/dee2e6/495057?text=Charger',
    contact_name: 'Neha Sharma',
    phone: '9001122334',
  },
];

/* ------------------------------------------------------------------ */
/*  Main seed function                                                  */
/* ------------------------------------------------------------------ */
async function seed() {
  const client = await pool.connect();

  try {
    console.log('Connected to database.');

    /* Ensure the items table exists (mirrors server.js schema) */
    await client.query(`
      CREATE TABLE IF NOT EXISTS items (
        id           SERIAL PRIMARY KEY,
        name         VARCHAR(255) NOT NULL,
        description  TEXT,
        status       VARCHAR(50),
        location     VARCHAR(255),
        image        TEXT,
        contact_name VARCHAR(255),
        phone        VARCHAR(50)
      );
    `);
    console.log('Table "items" is ready.');

    /* Insert each sample item */
    let inserted = 0;
    for (const item of sampleItems) {
      const result = await client.query(
        `INSERT INTO items (name, description, status, location, image, contact_name, phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          item.name,
          item.description,
          item.status,
          item.location,
          item.image,
          item.contact_name,
          item.phone,
        ]
      );
      console.log(`  Inserted: "${item.name}" (id=${result.rows[0].id})`);
      inserted++;
    }

    console.log(`\nDone! ${inserted} item(s) inserted successfully.`);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
