import express from 'express';

const router = express.Router();

// GET /api/v1/search
router.get('/search', (req, res) => {
  res.json({ message: 'Search endpoint not implemented yet' });
});

export default router;