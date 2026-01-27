import express from 'express';

const router = express.Router();

// GET /api/v1/league
router.get('/league', (req, res) => {
  res.json({ message: 'League endpoint not implemented yet' });
});

export default router;