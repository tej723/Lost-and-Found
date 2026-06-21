/**
 * seed.js — Inserts 4 sample items into the Lost & Found database.
 *
 * Usage:
 *   DATABASE_URL=<your-postgres-url> node seed.js
 *
 * The script is idempotent-safe: it checks whether each item already exists
 * (by name) before inserting, so running it multiple times won't duplicate rows.
 */

'use strict';

const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const sampleItems = [
  {
    name:         'Blue Backpack',
    description:  'A medium-sized blue Wildcraft backpack with a broken zipper on the front pocket. Contains a few notebooks.',
    status:       'found',
    location:     'Central Library, Reading Hall',
    image:        'https://via.placeholder.com/300x200?text=Blue+Backpack',
    contact_name: 'Arjun Sharma',
    phone:        '9876543210',
  },
  {
    name:         'Black Wallet',
    description:  'Slim black leather wallet. Contains an IITK ID card and some cash. No credit cards.',
    status:       'found',
    location:     'Hall 5 Mess',
    image:        'https://via.placeholder.com/300x200?text=Black+Wallet',
    contact_name: 'Priya Verma',
    phone:        '9123456780',
  },
  {
    name:         'Silver Wristwatch',
    description:  'Casio analog silver wristwatch with a metal strap. Engraved initials "R.K." on the back.',
    status:       'found',
    location:     'Sports Complex, Swimming Pool Area',
    image:        'https://via.placeholder.com/300x200?text=Silver+Watch',
    contact_name: 'Rohan Kulkarni',
    phone:        '9988776655',
  },
  {
    name:         'Wireless Earphones',
    description:  'White Sony WF-1000XM4 earphones in a charging case. Left earbud has a small scratch.',
    status:       'lost',
    location:     'Lecture Hall Complex, LHC 101',
    image:        'https://via.placeholder.com/300x200?text=Earphones',
    contact_name: 'Sneha Iyer',
    phone:        '9765432109',
  },
];

async function seed() {
  const client = await pool.connect();
  try {
    // Ensure the items table exists (mirrors server.js schema)
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
      )
    `);

    let inserted = 0;
    let skipped  = 0;

    for (const item of sampleItems) {
      // Skip if an item with the same name already exists
      const existing = await client.query(
        'SELECT id FROM items WHERE name = $1 LIMIT 1',
        [item.name]
      );

      if (existing.rows.length > 0) {
        console.log(`  SKIP  "${item.name}" — already exists (id=${existing.rows[0].id})`);
        skipped++;
        continue;
      }

      const result = await client.query(
        `INSERT INTO items (name, description, status, location, image, contact_name, phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [item.name, item.description, item.status, item.location, item.image, item.contact_name, item.phone]
      );
      console.log(`  INSERT "${item.name}" — id=${result.rows[0].id}`);
      inserted++;
    }

    console.log(`\nDone. ${inserted} item(s) inserted, ${skipped} skipped.`);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
