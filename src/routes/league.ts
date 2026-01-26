import express from 'express';

const router = express.Router();

// Placeholder routes for league
router.get('/', (req, res) => {
  res.json({ message: 'League endpoint not implemented yet' });
});

export default router;