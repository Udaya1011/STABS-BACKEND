const express = require('express');
const {
    getTeacherProfile,
    updateTeacherProfile,
    updateAvailability,
    getTeachers,
    adminUpdateTeacher,
    adminUpdateTimetable,
    deleteTeacher,
    syncMyFreeSlots,
} = require('../controllers/teacherController');
const { protect, teacher, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getTeachers);
router.get('/profile', protect, teacher, getTeacherProfile);
router.put('/profile', protect, teacher, updateTeacherProfile);
router.put('/availability', protect, teacher, updateAvailability);
router.post('/sync-slots', protect, teacher, syncMyFreeSlots);

router.route('/:id')
    .put(protect, admin, adminUpdateTeacher)
    .delete(protect, admin, deleteTeacher);

router.put('/:id/timetable', protect, admin, adminUpdateTimetable);

module.exports = router;
