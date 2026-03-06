const express = require('express');
const {
    bookAppointment,
    getMyAppointments,
    updateAppointmentStatus,
    createFreeSlot,
    getAvailableSlots,
    bookSlot,
    cancelSlot,
} = require('../controllers/appointmentController');
const { protect, student, teacher } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .get(protect, getMyAppointments)
    .post(protect, student, bookAppointment);

router.route('/slots')
    .get(protect, getAvailableSlots)
    .post(protect, teacher, createFreeSlot);

router.route('/slots/:id/book')
    .put(protect, student, bookSlot);

router.route('/slots/:id/cancel')
    .put(protect, teacher, cancelSlot);

router.route('/:id/status')
    .put(protect, teacher, updateAppointmentStatus);

module.exports = router;
