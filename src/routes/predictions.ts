import express from 'express';
import { dataCache } from '../services/dataCache';

const router = express.Router();

// Simple prediction algorithm based on team record
function calculatePrediction(homeTeam: any, awayTeam: any): { prediction: string; confidence: number } {
  const homeWinPct = homeTeam.wins ? homeTeam.wins / (homeTeam.wins + homeTeam.losses) : 0.5;
  const awayWinPct = awayTeam.wins ? awayTeam.wins / (awayTeam.wins + awayTeam.losses) : 0.5;
  
  // Home court advantage (about 3% win probability boost)
  const homeAdvantage = 0.03;
  const adjustedHomeWinPct = homeWinPct + homeAdvantage;
  
  const totalProb = adjustedHomeWinPct + awayWinPct;
  const homeConfidence = (adjustedHomeWinPct / totalProb) * 100;
  
  const prediction = homeConfidence > 50 ? 'home' : 'away';
  const confidence = Math.max(homeConfidence, 100 - homeConfidence);

  return { prediction, confidence: parseFloat(confidence.toFixed(1)) };
}

// GET /api/v1/predictions - Get game predictions
router.get('/predictions', async (req, res) => {
  try {
    const scoreboardData = await dataCache.getScoreboard();
    const scoreboard = scoreboardData?.scoreboard;

    if (!scoreboard || !scoreboard.games) {
      return res.json({
        predictions: [],
        lastUpdated: new Date().toISOString()
      });
    }

    const predictions = scoreboard.games
      .filter((game: any) => game.gameStatus < 3) // Only live/upcoming games
      .map((game: any) => {
        const { prediction, confidence } = calculatePrediction(game.homeTeam, game.awayTeam);
        
        return {
          gameId: game.gameId,
          awayTeam: game.awayTeam?.teamName,
          homeTeam: game.homeTeam?.teamName,
          prediction,
          confidence,
          predictedWinner: prediction === 'home' ? game.homeTeam?.teamName : game.awayTeam?.teamName,
          homeTeamRecord: `${game.homeTeam?.wins || 0}-${game.homeTeam?.losses || 0}`,
          awayTeamRecord: `${game.awayTeam?.wins || 0}-${game.awayTeam?.losses || 0}`,
          gameStatus: game.gameStatus,
          gameStatusText: game.gameStatusText
        };
      });

    res.json({
      predictions: predictions.sort((a: any, b: any) => b.confidence - a.confidence),
      total: predictions.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching predictions:', error);
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

// GET /api/v1/predictions/:gameId - Get prediction for specific game
router.get('/predictions/:gameId', async (req, res) => {
  try {
    const gameId = req.params.gameId;
    const scoreboardData = await dataCache.getScoreboard();
    const scoreboard = scoreboardData?.scoreboard;

    if (!scoreboard || !scoreboard.games) {
      return res.status(404).json({
        error: 'Game not found',
        gameId
      });
    }

    const game = scoreboard.games.find((g: any) => g.gameId === gameId);

    if (!game) {
      return res.status(404).json({
        error: 'Game not found',
        gameId
      });
    }

    const { prediction, confidence } = calculatePrediction(game.homeTeam, game.awayTeam);

    res.json({
      gameId,
      awayTeam: game.awayTeam?.teamName,
      homeTeam: game.homeTeam?.teamName,
      prediction,
      confidence,
      predictedWinner: prediction === 'home' ? game.homeTeam?.teamName : game.awayTeam?.teamName,
      homeTeamRecord: `${game.homeTeam?.wins || 0}-${game.homeTeam?.losses || 0}`,
      awayTeamRecord: `${game.awayTeam?.wins || 0}-${game.awayTeam?.losses || 0}`,
      gameStatus: game.gameStatus,
      gameStatusText: game.gameStatusText,
      notes: 'Predictions based on team win percentage and home court advantage'
    });
  } catch (error) {
    console.error('Error fetching game prediction:', error);
    res.status(500).json({ error: 'Failed to fetch game prediction' });
  }
});

export default router;