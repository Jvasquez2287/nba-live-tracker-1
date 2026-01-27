import express from 'express';

const router = express.Router();

// GET /api/v1/search - Search for players, teams, etc
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    
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
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
});

export default router;