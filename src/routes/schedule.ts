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

// GET /api/v1/schedule/date/:date - Get schedule for a specific date
router.get('/schedule/date/:date', async (req, res) => {
  try {
    const dateParam = req.params.date; // Format: YYYY-MM-DD
    
    let scoreboardData = await dataCache.getScoreboard();
    
    // If no data in cache, refresh from NBA API
    if (!scoreboardData || !scoreboardData.scoreboard?.games || scoreboardData.scoreboard.games.length === 0) {
      scoreboardData = await dataCache.refreshScoreboard();
    }
    
    const scoreboard = scoreboardData?.scoreboard;
    
    if (!scoreboard || !scoreboard.games) {
      return res.json({
        date: dateParam,
        games: [],
        total: 0,
        message: 'No games scheduled for this date',
        cacheStatus: 'empty'
      });
    }

    // Format date for matching
    // Input: YYYY-MM-DD (e.g., 2026-01-25)
    // NBA API format: YYYYMMDD (e.g., 20260125)
    const formattedDateNoHyphens = dateParam.replace(/-/g, ''); // 20260125
    
    // Also support matching by gameTimeUTC which contains full ISO datetime
    const datePrefix = dateParam.substring(0, 10); // Extract YYYY-MM-DD part
    
    const filteredGames = scoreboard.games.filter((game: any) => {
      // Check gameDate field (could be YYYY-MM-DD or YYYYMMDD)
      if (game.gameDate) {
        const normalizedGameDate = String(game.gameDate).replace(/-/g, '');
        if (normalizedGameDate === formattedDateNoHyphens) return true;
        if (game.gameDate === dateParam) return true;
      }
      
      // Check gameTimeUTC (ISO format: 2026-01-25T20:00:00Z)
      if (game.gameTimeUTC && game.gameTimeUTC.substring(0, 10) === datePrefix) return true;
      
      // Check by gameId pattern (first 8 digits: YYYYMMDD)
      if (game.gameId) {
        const gameIdDatePart = String(game.gameId).substring(0, 8);
        if (gameIdDatePart === formattedDateNoHyphens) return true;
      }
      
      return false;
    });

    const schedule = {
      date: dateParam,
      games: filteredGames.map((game: any) => ({
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
      })),
      total: filteredGames.length,
      allGamesDate: scoreboard.gameDate,
      message: filteredGames.length === 0 ? 'No games scheduled for this date' : undefined
    };

    res.json(schedule);
  } catch (error) {
    console.error('Error fetching schedule by date:', error);
    res.status(500).json({ error: 'Failed to fetch schedule by date', details: error instanceof Error ? error.message : String(error) });
  }
});

export default router;