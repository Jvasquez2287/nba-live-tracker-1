import express from 'express';
import { dataCache } from '../services/dataCache';
import { getHistoricalGames } from '../services/historicalData';

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

// GET /api/v1/schedule/date/:date - Get schedule for a specific date (including historical)
router.get('/schedule/date/:date', async (req, res) => {
  try {
    const dateParam = req.params.date; // Format: YYYY-MM-DD
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return res.status(400).json({
        error: 'Invalid date format',
        format: 'YYYY-MM-DD',
        example: '2026-01-25'
      });
    }

    const todayDate = new Date().toISOString().split('T')[0];
    
    let games: any[] = [];
    let source = '';

    // For today's date, use cache (real-time data)
    if (dateParam === todayDate) {
      let scoreboardData = await dataCache.getScoreboard();
      
      // If no data in cache, refresh from NBA API
      if (!scoreboardData || !scoreboardData.scoreboard?.games || scoreboardData.scoreboard.games.length === 0) {
        scoreboardData = await dataCache.refreshScoreboard();
      }
      
      const scoreboard = scoreboardData?.scoreboard;
      games = scoreboard?.games || [];
      source = 'cdn.nba.com (live)';
    } else {
      // For historical or future dates, use stats.nba.com
      try {
        const historicalGames = await getHistoricalGames(dateParam);
        games = historicalGames.map((game: any) => ({
          gameId: game.gameId,
          gameDate: game.gameDate,
          gameStatus: game.gameStatus,
          gameStatusText: game.gameStatusText,
          homeTeam: {
            teamName: game.homeTeam.teamName,
            teamTricode: game.homeTeam.teamTricode,
            teamId: game.homeTeam.teamId,
            wins: game.homeTeam.wins,
            losses: game.homeTeam.losses,
            score: game.homeTeam.score
          },
          awayTeam: {
            teamName: game.awayTeam.teamName,
            teamTricode: game.awayTeam.teamTricode,
            teamId: game.awayTeam.teamId,
            wins: game.awayTeam.wins,
            losses: game.awayTeam.losses,
            score: game.awayTeam.score
          }
        }));
        source = 'stats.nba.com (official)';
      } catch (historicalError) {
        console.error(`Failed to fetch historical games for ${dateParam}:`, historicalError);
        // Return empty with helpful message
        return res.json({
          date: dateParam,
          games: [],
          total: 0,
          source: 'stats.nba.com',
          error: 'Unable to fetch games for this date',
          note: 'stats.nba.com is temporarily unavailable',
          suggestion: `Try /api/v1/schedule for today's games (${todayDate})`
        });
      }
    }

    // Format the response
    const schedule = {
      date: dateParam,
      games: games.map((game: any) => ({
        gameId: game.gameId,
        startTime: game.gameTimeUTC || game.gameDate,
        awayTeam: {
          name: game.awayTeam?.teamName,
          tricode: game.awayTeam?.teamTricode,
          id: game.awayTeam?.teamId,
          wins: game.awayTeam?.wins,
          losses: game.awayTeam?.losses,
          score: game.awayTeam?.score
        },
        homeTeam: {
          name: game.homeTeam?.teamName,
          tricode: game.homeTeam?.teamTricode,
          id: game.homeTeam?.teamId,
          wins: game.homeTeam?.wins,
          losses: game.homeTeam?.losses,
          score: game.homeTeam?.score
        },
        status: game.gameStatus,
        statusText: game.gameStatusText,
        period: game.period,
        gameClock: game.gameClock
      })),
      total: games.length,
      source: source
    };

    res.json(schedule);
  } catch (error) {
    console.error('Error fetching schedule by date:', error);
    res.status(500).json({ 
      error: 'Failed to fetch schedule by date', 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
});

export default router;