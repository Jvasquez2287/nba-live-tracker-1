import express from 'express';

const router = express.Router();

// GET /api/v1/players
router.get('/players', (req, res) => {
  res.json({ message: 'Players endpoint not implemented yet' });
});

export default router;