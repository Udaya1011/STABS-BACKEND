const express = require('express');
const router = express.Router();
const { getRegistry, addRegistryItem, removeRegistryItem } = require('../controllers/registryController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', getRegistry);
router.post('/add', protect, admin, addRegistryItem);
router.post('/remove', protect, admin, removeRegistryItem);

module.exports = router;
