const express = require('express');
const { getAIResponse } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/chat', protect, getAIResponse);

module.exports = router;
