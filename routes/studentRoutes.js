const express = require('express');
const {
    getStudents,
    updateStudent,
    deleteStudent,
} = require('../controllers/studentController');
const { protect, teacher } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .get(protect, teacher, getStudents);

router.route('/:id')
    .put(protect, teacher, updateStudent)
    .delete(protect, teacher, deleteStudent);

module.exports = router;
