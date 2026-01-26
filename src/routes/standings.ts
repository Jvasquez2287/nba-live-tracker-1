import express from 'express';

const router = express.Router();

// Placeholder routes for standings
router.get('/', (req, res) => {
  res.json({ message: 'Standings endpoint not implemented yet' });
});

export default router;