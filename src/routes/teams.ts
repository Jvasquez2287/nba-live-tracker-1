import express from 'express';

const router = express.Router();

// Placeholder routes for teams
router.get('/', (req, res) => {
  res.json({ message: 'Teams endpoint not implemented yet' });
});

export default router;