import express from 'express';
import { dataCache } from '../services/dataCache';

const router = express.Router();

// GET /api/v1/teams - Get all teams
router.get('/teams', async (req, res) => {
  try {
    let scoreboardData = await dataCache.getScoreboard();
    
    // If no data in cache, refresh from NBA API
    if (!scoreboardData || !scoreboardData.scoreboard?.games || scoreboardData.scoreboard.games.length === 0) {
      scoreboardData = await dataCache.refreshScoreboard();
    }
    
    const scoreboard = scoreboardData?.scoreboard;
    
    if (!scoreboard || !scoreboard.games || scoreboard.games.length === 0) {
      return res.json({
        teams: [],
        total: 0,
        message: 'No games data available'
      });
    }

    // Extract unique teams from games
    const teamsMap = new Map();
    
    scoreboard.games.forEach((game: any) => {
      if (game.homeTeam && !teamsMap.has(game.homeTeam.teamId)) {
        teamsMap.set(game.homeTeam.teamId, {
          teamId: game.homeTeam.teamId,
          name: game.homeTeam.teamName,
          city: game.homeTeam.teamCity,
          tricode: game.homeTeam.teamTricode,
          wins: game.homeTeam.wins || 0,
          losses: game.homeTeam.losses || 0
        });
      }
      
      if (game.awayTeam && !teamsMap.has(game.awayTeam.teamId)) {
        teamsMap.set(game.awayTeam.teamId, {
          teamId: game.awayTeam.teamId,
          name: game.awayTeam.teamName,
          city: game.awayTeam.teamCity,
          tricode: game.awayTeam.teamTricode,
          wins: game.awayTeam.wins || 0,
          losses: game.awayTeam.losses || 0
        });
      }
    });

    res.json({
      teams: Array.from(teamsMap.values()),
      total: teamsMap.size,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// GET /api/v1/teams/stats - Get team statistics
router.get('/teams/stats', async (req, res) => {
  try {
    const season = req.query.season as string || '2024-25';
    let scoreboardData = await dataCache.getScoreboard();
    
    // If no data in cache, refresh from NBA API
    if (!scoreboardData || !scoreboardData.scoreboard?.games || scoreboardData.scoreboard.games.length === 0) {
      scoreboardData = await dataCache.refreshScoreboard();
    }
    
    const scoreboard = scoreboardData?.scoreboard;
    
    if (!scoreboard || !scoreboard.games || scoreboard.games.length === 0) {
      return res.json({
        season,
        teams: [],
        total: 0,
        message: 'No games data available'
      });
    }

    // Extract team stats from games
    const teamsStatsMap = new Map();
    
    scoreboard.games.forEach((game: any) => {
      // Home team
      if (game.homeTeam) {
        if (!teamsStatsMap.has(game.homeTeam.teamId)) {
          teamsStatsMap.set(game.homeTeam.teamId, {
            teamId: game.homeTeam.teamId,
            name: game.homeTeam.teamName,
            city: game.homeTeam.teamCity,
            tricode: game.homeTeam.teamTricode,
            wins: game.homeTeam.wins || 0,
            losses: game.homeTeam.losses || 0,
            pointsFor: 0,
            pointsAgainst: 0,
            gamesPlayed: 0,
            avgPointsPerGame: 0,
            avgPointsAllowed: 0,
            winPercentage: 0
          });
        }
        
        const teamStats = teamsStatsMap.get(game.homeTeam.teamId);
        teamStats.pointsFor += game.homeTeam.score || 0;
        teamStats.pointsAgainst += game.awayTeam?.score || 0;
        teamStats.gamesPlayed++;
      }
      
      // Away team
      if (game.awayTeam) {
        if (!teamsStatsMap.has(game.awayTeam.teamId)) {
          teamsStatsMap.set(game.awayTeam.teamId, {
            teamId: game.awayTeam.teamId,
            name: game.awayTeam.teamName,
            city: game.awayTeam.teamCity,
            tricode: game.awayTeam.teamTricode,
            wins: game.awayTeam.wins || 0,
            losses: game.awayTeam.losses || 0,
            pointsFor: 0,
            pointsAgainst: 0,
            gamesPlayed: 0,
            avgPointsPerGame: 0,
            avgPointsAllowed: 0,
            winPercentage: 0
          });
        }
        
        const teamStats = teamsStatsMap.get(game.awayTeam.teamId);
        teamStats.pointsFor += game.awayTeam.score || 0;
        teamStats.pointsAgainst += game.homeTeam?.score || 0;
        teamStats.gamesPlayed++;
      }
    });

    // Calculate averages
    const teamsStats = Array.from(teamsStatsMap.values()).map((team: any) => {
      if (team.gamesPlayed > 0) {
        team.avgPointsPerGame = parseFloat((team.pointsFor / team.gamesPlayed).toFixed(1));
        team.avgPointsAllowed = parseFloat((team.pointsAgainst / team.gamesPlayed).toFixed(1));
        team.winPercentage = parseFloat(((team.wins / (team.wins + team.losses)) * 100).toFixed(1));
      }
      return team;
    });

    res.json({
      season,
      teams: teamsStats.sort((a: any, b: any) => b.wins - a.wins),
      total: teamsStats.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching team stats:', error);
    res.status(500).json({ error: 'Failed to fetch team statistics' });
  }
});

// GET /api/v1/teams/:id - Get team details
router.get('/teams/:id', async (req, res) => {
  try {
    const teamId = parseInt(req.params.id);
    const scoreboardData = await dataCache.getScoreboard();
    const scoreboard = scoreboardData?.scoreboard;
    
    if (!scoreboard || !scoreboard.games) {
      return res.status(404).json({
        error: 'Team not found',
        teamId
      });
    }

    // Find team in games
    let teamData: any = null;
    let teamStats = {
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      totalPoints: 0,
      avgPointsPerGame: 0
    };

    scoreboard.games.forEach((game: any) => {
      if (game.homeTeam?.teamId === teamId) {
        if (!teamData) {
          teamData = {
            teamId: game.homeTeam.teamId,
            name: game.homeTeam.teamName,
            city: game.homeTeam.teamCity,
            tricode: game.homeTeam.teamTricode,
            wins: game.homeTeam.wins || 0,
            losses: game.homeTeam.losses || 0
          };
        }
        teamStats.gamesPlayed++;
        teamStats.totalPoints += game.homeTeam.score || 0;
        if (game.gameStatus === 3) { // Final
          if (game.homeTeam.score > game.awayTeam.score) {
            teamStats.wins++;
          } else {
            teamStats.losses++;
          }
        }
      } else if (game.awayTeam?.teamId === teamId) {
        if (!teamData) {
          teamData = {
            teamId: game.awayTeam.teamId,
            name: game.awayTeam.teamName,
            city: game.awayTeam.teamCity,
            tricode: game.awayTeam.teamTricode,
            wins: game.awayTeam.wins || 0,
            losses: game.awayTeam.losses || 0
          };
        }
        teamStats.gamesPlayed++;
        teamStats.totalPoints += game.awayTeam.score || 0;
        if (game.gameStatus === 3) { // Final
          if (game.awayTeam.score > game.homeTeam.score) {
            teamStats.wins++;
          } else {
            teamStats.losses++;
          }
        }
      }
    });

    if (!teamData) {
      return res.status(404).json({
        error: 'Team not found',
        teamId
      });
    }

    if (teamStats.gamesPlayed > 0) {
      teamStats.avgPointsPerGame = teamStats.totalPoints / teamStats.gamesPlayed;
    }

    res.json({
      team: teamData,
      stats: teamStats,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching team details:', error);
    res.status(500).json({ error: 'Failed to fetch team details' });
  }
});

export default router;