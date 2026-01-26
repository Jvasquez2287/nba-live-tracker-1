import express from 'express';

const router = express.Router();

// Placeholder routes for players
router.get('/', (req, res) => {
  res.json({ message: 'Players endpoint not implemented yet' });
});

export default router;