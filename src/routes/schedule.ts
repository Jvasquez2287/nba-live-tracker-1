import express from 'express';
import { dataCache } from '../services/dataCache';

const router = express.Router();

// GET /api/v1/schedule - Get today's schedule
router.get('/schedule', async (req, res) => {
  try {
    let scoreboardData = await dataCache.getScoreboard();
    
    // If no data in cache, refresh from NBA API
    if (!scoreboardData || !scoreboardData.scoreboard?.games || scoreboardData.scoreboard.games.length === 0) {
      scoreboardData = await dataCache.refreshScoreboard();
    }
    
    const scoreboard = scoreboardData?.scoreboard;
    
    if (!scoreboard || !scoreboard.games || scoreboard.games.length === 0) {
      return res.json({
        date: new Date().toISOString().split('T')[0],
        games: [],
        message: 'No games scheduled for today'
      });
    }

    const schedule = {
      date: scoreboard.gameDate || new Date().toISOString().split('T')[0],
      games: scoreboard.games.map((game: any) => ({
        gameId: game.gameId,
        startTime: game.gameTimeUTC,
        awayTeam: {
          name: game.awayTeam?.teamName,
          tricode: game.awayTeam?.teamTricode,
          score: game.awayTeam?.score
        },
        homeTeam: {
          name: game.homeTeam?.teamName,
          tricode: game.homeTeam?.teamTricode,
          score: game.homeTeam?.score
        },
        status: game.gameStatus,
        statusText: game.gameStatusText,
        period: game.period,
        gameClock: game.gameClock
      }))
    };

    res.json(schedule);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

export default router;