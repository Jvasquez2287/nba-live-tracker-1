import express from 'express';
import { getScoreboard, getPlayByPlay } from '../services/scoreboard';

const router = express.Router();

// GET /api/scoreboard - Get live NBA scores
router.get('/', async (req, res) => {
  try {
    const scoreboard = await getScoreboard();
    res.json(scoreboard);
  } catch (error) {
    console.error('Error fetching scoreboard:', error);
    res.status(500).json({ error: 'Failed to fetch scoreboard' });
  }
});

// GET /api/scoreboard/playbyplay/:gameId - Get play-by-play for a game
router.get('/playbyplay/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const playByPlay = await getPlayByPlay(gameId);
    res.json(playByPlay);
  } catch (error) {
    console.error('Error fetching play-by-play:', error);
    res.status(500).json({ error: 'Failed to fetch play-by-play' });
  }
});

export default router;