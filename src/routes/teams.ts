import express from 'express';

const router = express.Router();

// GET /api/v1/teams
router.get('/teams', (req, res) => {
  res.json({ message: 'Teams endpoint not implemented yet' });
});

export default router;