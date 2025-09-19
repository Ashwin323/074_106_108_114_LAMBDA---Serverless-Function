const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /functions -> create new function
router.post('/', async (req, res) => {
  const { name, route, language, timeout } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO functions (name, route, language, timeout) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, route, language, timeout]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /functions -> list all functions
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM functions');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /functions/:id -> get function by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM functions WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Function not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

