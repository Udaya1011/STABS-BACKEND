const express = require('express');
const {
    getTeacherProfile,
    updateTeacherProfile,
    updateAvailability,
    getTeachers,
    adminUpdateTeacher,
    deleteTeacher,
} = require('../controllers/teacherController');
const { protect, teacher, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getTeachers);
router.get('/profile', protect, teacher, getTeacherProfile);
router.put('/profile', protect, teacher, updateTeacherProfile);
router.put('/availability', protect, teacher, updateAvailability);

router.route('/:id')
    .put(protect, admin, adminUpdateTeacher)
    .delete(protect, admin, deleteTeacher);

module.exports = router;
