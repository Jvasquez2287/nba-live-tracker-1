import express from 'express';

const router = express.Router();

// GET /api/v1/predictions
router.get('/predictions', (req, res) => {
  res.json({ message: 'Predictions endpoint not implemented yet' });
});

export default router;