import express from 'express';

const router = express.Router();

// Placeholder routes for predictions
router.get('/', (req, res) => {
  res.json({ message: 'Predictions endpoint not implemented yet' });
});

export default router;