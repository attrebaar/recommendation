// src/routes/matchRoutes.js

const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');

// Route to get ranked matches for a user
// GET /api/matches/:matriid
router.get('/:matriid', matchController.getRankedMatches);

// Route to score a specific set of matches for a user
// POST /api/matches/:matriid/score
router.post('/:matriid/score', matchController.scoreMatches);

// Route to get a user's profile
// GET /api/matches/user/:matriid
router.get('/user/:matriid', matchController.getUserProfile);

module.exports = router;