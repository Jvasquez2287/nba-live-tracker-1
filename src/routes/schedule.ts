import express from 'express';

const router = express.Router();

// GET /api/v1/schedule
router.get('/schedule', (req, res) => {
  res.json({ message: 'Schedule endpoint not implemented yet' });
});

export default router;