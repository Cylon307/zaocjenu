const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /goals - Dohvaća i prikazuje sve ciljeve za trenutnog korisnika
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : 1; // Ako autentifikacija postoji, koristi req.user.id; inače privremeno 1
    const connection = await db.getConnection();
    const [goals] = await connection.query('SELECT * FROM goals WHERE user_id = ?', [userId]);
    connection.release();
    res.render('goals/index', { goals: goals });
  } catch (error) {
    console.error('Greška prilikom dohvaćanja ciljeva:', error.message);
    next(error);
  }
});

// GET /create - Prikazuje obrazac za stvaranje novog cilja
router.get('/create', (req, res) => {
  res.render('goals/create');
});

// POST /create - Sprema novi cilj u bazu
router.post('/create', async (req, res, next) => {
  const { description } = req.body;
  const userId = req.user ? req.user.id : 1; // Ako autentifikacija postoji, koristi req.user.id; inače privremeno 1
  const connection = await db.getConnection();
  try {
    await connection.query(
      'INSERT INTO goals (user_id, description, is_achieved) VALUES (?, ?, FALSE)',
      [userId, description]
    );
    res.redirect('/goals');
  } catch (error) {
    console.error('Greška prilikom dodavanja cilja:', error.message);
    res.status(500).send('Greška prilikom dodavanja cilja');
  } finally {
    connection.release();
  }
});

// POST /achieve/:id - Označava cilj kao postignut
router.post('/achieve/:id', async (req, res, next) => {
  const goalId = req.params.id;
  const connection = await db.getConnection();
  try {
    const result = await connection.query(
      'UPDATE goals SET is_achieved = TRUE, achieved_at = ? WHERE id = ?',
      [new Date(), goalId]
    );
    if (result.affectedRows === 0) {
      res.status(404).send('Cilj nije pronađen');
    } else {
      res.redirect('/goals');
    }
  } catch (error) {
    console.error('Greška prilikom označavanja cilja:', error.message);
    res.status(500).send('Greška prilikom označavanja cilja');
  } finally {
    connection.release();
  }
});

module.exports = router;