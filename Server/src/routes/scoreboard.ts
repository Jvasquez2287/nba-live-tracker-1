import express from 'express';
import { getScoreboard, getPlayByPlay } from '../services/scoreboard';
import { dataCache } from '../services/dataCache';

const router = express.Router();

// GET /api/scoreboard - Get live NBA scores
router.get('/', async (req, res) => {
  try {
    console.log('Scoreboard route called');
    const scoreboard = await dataCache.getScoreboard();
    console.log('Scoreboard data:', scoreboard ? 'found' : 'null');
    if (!scoreboard) {
      return res.status(503).json({ error: 'Scoreboard data not available' });
    }
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