import express from 'express';

const router = express.Router();

// GET /api/v1/standings
router.get('/standings', (req, res) => {
  res.json({ message: 'Standings endpoint not implemented yet' });
});

export default router;