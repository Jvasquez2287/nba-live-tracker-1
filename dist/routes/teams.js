"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dataCache_1 = require("../services/dataCache");
const router = express_1.default.Router();
// GET /api/v1/teams - Get all teams
router.get('/teams', async (req, res) => {
    try {
        const scoreboardData = await dataCache_1.dataCache.getScoreboard();
        const scoreboard = scoreboardData?.scoreboard;
        if (!scoreboard || !scoreboard.games) {
            return res.json({
                teams: [],
                total: 0,
                message: 'No games data available'
            });
        }
        // Extract unique teams from games
        const teamsMap = new Map();
        scoreboard.games.forEach((game) => {
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
    }
    catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});
// GET /api/v1/teams/:id - Get team details
router.get('/teams/:id', async (req, res) => {
    try {
        const teamId = parseInt(req.params.id);
        const scoreboardData = await dataCache_1.dataCache.getScoreboard();
        const scoreboard = scoreboardData?.scoreboard;
        if (!scoreboard || !scoreboard.games) {
            return res.status(404).json({
                error: 'Team not found',
                teamId
            });
        }
        // Find team in games
        let teamData = null;
        let teamStats = {
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            totalPoints: 0,
            avgPointsPerGame: 0
        };
        scoreboard.games.forEach((game) => {
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
                    }
                    else {
                        teamStats.losses++;
                    }
                }
            }
            else if (game.awayTeam?.teamId === teamId) {
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
                    }
                    else {
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
    }
    catch (error) {
        console.error('Error fetching team details:', error);
        res.status(500).json({ error: 'Failed to fetch team details' });
    }
});
exports.default = router;
//# sourceMappingURL=teams.js.map