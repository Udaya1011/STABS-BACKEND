const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const attendanceController = require('../controllers/attendanceController');

// All routes are protected
router.use(protect);

// Only admin, teacher, or staff can submit attendance
router.post('/', authorize('admin', 'teacher', 'staff'), attendanceController.submitAttendance);

// Get attendance history for a subject (teacher/staff/admin)
router.get('/subject/:subjectId', authorize('admin', 'teacher', 'staff'), attendanceController.getSubjectAttendance);

// Get student's detailed attendance history
router.get('/student/:studentId', attendanceController.getStudentFullAttendance);

module.exports = router;
