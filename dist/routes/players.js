"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dataCache_1 = require("../services/dataCache");
const router = express_1.default.Router();
// GET /api/v1/players - Get player list
router.get('/players', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const team = req.query.team;
        const scoreboardData = await dataCache_1.dataCache.getScoreboard();
        const scoreboard = scoreboardData?.scoreboard;
        if (!scoreboard || !scoreboard.games) {
            return res.json({
                page,
                limit,
                total: 0,
                players: []
            });
        }
        // Extract unique players from games (from game leaders)
        const playersMap = new Map();
        scoreboard.games.forEach((game) => {
            // Home team game leaders
            if (game.gameLeaders?.homeLeaders) {
                const leader = game.gameLeaders.homeLeaders;
                if (leader.personId && !playersMap.has(leader.personId)) {
                    playersMap.set(leader.personId, {
                        playerId: leader.personId,
                        name: leader.name || 'Unknown',
                        team: game.homeTeam?.teamTricode,
                        teamId: game.homeTeam?.teamId,
                        points: leader.points || 0,
                        rebounds: leader.rebounds || 0,
                        assists: leader.assists || 0,
                        position: leader.position || 'Unknown'
                    });
                }
            }
            // Away team game leaders
            if (game.gameLeaders?.awayLeaders) {
                const leader = game.gameLeaders.awayLeaders;
                if (leader.personId && !playersMap.has(leader.personId)) {
                    playersMap.set(leader.personId, {
                        playerId: leader.personId,
                        name: leader.name || 'Unknown',
                        team: game.awayTeam?.teamTricode,
                        teamId: game.awayTeam?.teamId,
                        points: leader.points || 0,
                        rebounds: leader.rebounds || 0,
                        assists: leader.assists || 0,
                        position: leader.position || 'Unknown'
                    });
                }
            }
        });
        let players = Array.from(playersMap.values());
        // Filter by team if specified
        if (team) {
            players = players.filter(p => p.team?.toLowerCase() === team.toLowerCase());
        }
        // Pagination
        const total = players.length;
        const startIdx = (page - 1) * limit;
        const endIdx = startIdx + limit;
        const paginatedPlayers = players.slice(startIdx, endIdx);
        res.json({
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            players: paginatedPlayers
        });
    }
    catch (error) {
        console.error('Error fetching players:', error);
        res.status(500).json({ error: 'Failed to fetch players' });
    }
});
// GET /api/v1/players/:id - Get player details
router.get('/players/:id', async (req, res) => {
    try {
        const playerId = parseInt(req.params.id);
        const scoreboardData = await dataCache_1.dataCache.getScoreboard();
        const scoreboard = scoreboardData?.scoreboard;
        if (!scoreboard || !scoreboard.games) {
            return res.status(404).json({
                error: 'Player not found',
                playerId
            });
        }
        // Find player in game leaders
        let playerData = null;
        let stats = {
            gamesPlayed: 0,
            totalPoints: 0,
            totalRebounds: 0,
            totalAssists: 0,
            avgPoints: 0,
            avgRebounds: 0,
            avgAssists: 0
        };
        scoreboard.games.forEach((game) => {
            // Check home team leaders
            if (game.gameLeaders?.homeLeaders?.personId === playerId) {
                const leader = game.gameLeaders.homeLeaders;
                if (!playerData) {
                    playerData = {
                        playerId: leader.personId,
                        name: leader.name || 'Unknown',
                        team: game.homeTeam?.teamTricode,
                        teamId: game.homeTeam?.teamId,
                        teamName: game.homeTeam?.teamName,
                        position: leader.position || 'Unknown'
                    };
                }
                stats.gamesPlayed++;
                stats.totalPoints += leader.points || 0;
                stats.totalRebounds += leader.rebounds || 0;
                stats.totalAssists += leader.assists || 0;
            }
            // Check away team leaders
            if (game.gameLeaders?.awayLeaders?.personId === playerId) {
                const leader = game.gameLeaders.awayLeaders;
                if (!playerData) {
                    playerData = {
                        playerId: leader.personId,
                        name: leader.name || 'Unknown',
                        team: game.awayTeam?.teamTricode,
                        teamId: game.awayTeam?.teamId,
                        teamName: game.awayTeam?.teamName,
                        position: leader.position || 'Unknown'
                    };
                }
                stats.gamesPlayed++;
                stats.totalPoints += leader.points || 0;
                stats.totalRebounds += leader.rebounds || 0;
                stats.totalAssists += leader.assists || 0;
            }
        });
        if (!playerData) {
            return res.status(404).json({
                error: 'Player not found',
                playerId
            });
        }
        if (stats.gamesPlayed > 0) {
            stats.avgPoints = parseFloat((stats.totalPoints / stats.gamesPlayed).toFixed(1));
            stats.avgRebounds = parseFloat((stats.totalRebounds / stats.gamesPlayed).toFixed(1));
            stats.avgAssists = parseFloat((stats.totalAssists / stats.gamesPlayed).toFixed(1));
        }
        res.json({
            player: playerData,
            stats
        });
    }
    catch (error) {
        console.error('Error fetching player details:', error);
        res.status(500).json({ error: 'Failed to fetch player details' });
    }
});
exports.default = router;
//# sourceMappingURL=players.js.map