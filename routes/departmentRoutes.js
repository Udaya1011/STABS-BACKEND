const express = require('express');
const {
    getDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
} = require('../controllers/departmentController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .get(protect, getDepartments)
    .post(protect, admin, createDepartment);

router.route('/:id')
    .put(protect, admin, updateDepartment)
    .delete(protect, admin, deleteDepartment);

module.exports = router;
