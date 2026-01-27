"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// GET /api/v1/search - Search for players, teams, etc
router.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query || query.length < 2) {
            return res.json({
                query,
                results: [],
                message: 'Search query must be at least 2 characters'
            });
        }
        res.json({
            query,
            results: [],
            total: 0,
            message: 'Search endpoint - to be implemented with live API data'
        });
    }
    catch (error) {
        console.error('Error searching:', error);
        res.status(500).json({ error: 'Failed to perform search' });
    }
});
exports.default = router;
//# sourceMappingURL=search.js.map