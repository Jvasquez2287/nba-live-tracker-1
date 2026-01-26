"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const scoreboard_1 = require("../services/scoreboard");
const dataCache_1 = require("../services/dataCache");
const router = express_1.default.Router();
// GET /api/scoreboard - Get live NBA scores
router.get('/', async (req, res) => {
    try {
        console.log('Scoreboard route called');
        const scoreboard = await dataCache_1.dataCache.getScoreboard();
        console.log('Scoreboard data:', scoreboard ? 'found' : 'null');
        if (!scoreboard) {
            return res.status(503).json({ error: 'Scoreboard data not available' });
        }
        res.json(scoreboard);
    }
    catch (error) {
        console.error('Error fetching scoreboard:', error);
        res.status(500).json({ error: 'Failed to fetch scoreboard' });
    }
});
// GET /api/scoreboard/playbyplay/:gameId - Get play-by-play for a game
router.get('/playbyplay/:gameId', async (req, res) => {
    try {
        const { gameId } = req.params;
        const playByPlay = await (0, scoreboard_1.getPlayByPlay)(gameId);
        res.json(playByPlay);
    }
    catch (error) {
        console.error('Error fetching play-by-play:', error);
        res.status(500).json({ error: 'Failed to fetch play-by-play' });
    }
});
exports.default = router;
//# sourceMappingURL=scoreboard.js.map