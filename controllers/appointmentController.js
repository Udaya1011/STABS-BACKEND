const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const Message = require('../models/Message');

// Helper function to send automated chat message for appointment approval
const sendAppointmentApprovalMessage = async (req, appointment) => {
    try {
        const appointmentDate = new Date(appointment.date).toLocaleDateString();
        const content = `🗓️ *Appointment Confirmed*\n\nYour appointment regarding "${appointment.reason || 'General Consultation'}" has been scheduled.\n\n📅 Date: ${appointmentDate}\n⏰ Time: ${appointment.startTime} - ${appointment.endTime}\n📍 Status: Approved\n\nSee you then!`;

        const message = await Message.create({
            sender: appointment.teacher,
            receiver: appointment.student,
            content,
            messageType: 'text',
        });

        if (message) {
            const populatedMessage = await Message.findById(message._id).populate('sender', 'name avatar');
            const io = req.app.get('socketio');
            if (io) {
                // Emit to student
                io.to(appointment.student.toString()).emit('newMessage', populatedMessage);
                // Also notify unread count change to student
                const unreadCount = await Message.countDocuments({
                    receiver: appointment.student,
                    isRead: false,
                    sender: appointment.teacher
                });
                io.to(appointment.student.toString()).emit('unreadUpdate', {
                    sender: appointment.teacher,
                    count: unreadCount,
                    lastMessageTime: populatedMessage.createdAt
                });
            }
        }
    } catch (error) {
        console.error('Error sending auto-message:', error);
    }
};

// @desc    Book an appointment
// @route   POST /api/appointments
// @access  Private/Student
const bookAppointment = async (req, res) => {
    const { teacher, subject, date, startTime, endTime, reason, priority } = req.body;

    const appointment = await Appointment.create({
        student: req.user._id,
        teacher,
        subject,
        date,
        startTime,
        endTime,
        reason,
        priority,
    });

    if (appointment) {
        // Create notification for teacher
        const notification = await Notification.create({
            recipient: teacher,
            sender: req.user._id,
            type: 'appointment_request',
            title: 'New Appointment Request',
            message: `${req.user.name} wants to book an appointment on ${new Date(date).toLocaleDateString()}`,
            relatedId: appointment._id,
        });

        const io = req.app.get('socketio');
        if (io && notification) {
            const populatedNotif = await Notification.findById(notification._id).populate('sender', 'name avatar');
            io.to(teacher.toString()).emit('newNotification', populatedNotif);
        }

        res.status(201).json(appointment);
    } else {
        res.status(400);
        throw new Error('Invalid appointment data');
    }
};

// @desc    Get user appointments
// @route   GET /api/appointments
// @access  Private
const getMyAppointments = async (req, res) => {
    let appointments;
    if (req.user.role === 'student') {
        appointments = await Appointment.find({ student: req.user._id })
            .populate('teacher', 'name email avatar')
            .populate('subject', 'name code');
    } else if (req.user.role === 'teacher') {
        appointments = await Appointment.find({ teacher: req.user._id })
            .populate('student', 'name email avatar')
            .populate('subject', 'name code');
    } else {
        appointments = await Appointment.find({})
            .populate('student', 'name email avatar')
            .populate('teacher', 'name email avatar')
            .populate('subject', 'name code');
    }
    res.json(appointments);
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private
const updateAppointmentStatus = async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);

    if (appointment) {
        const oldStatus = appointment.status;
        appointment.status = req.body.status || appointment.status;
        appointment.meetingLink = req.body.meetingLink || appointment.meetingLink;
        appointment.teacherNote = req.body.teacherNote || appointment.teacherNote;

        const updatedAppointment = await appointment.save();

        // If status changed to approved, send chat message
        if (oldStatus !== 'approved' && updatedAppointment.status === 'approved') {
            await sendAppointmentApprovalMessage(req, updatedAppointment);
        }

        // Notify student
        const notification = await Notification.create({
            recipient: appointment.student,
            sender: req.user._id,
            type: 'appointment_update',
            title: 'Appointment Status Updated',
            message: `Your appointment status is now ${appointment.status}`,
            relatedId: appointment._id,
        });

        const io = req.app.get('socketio');
        if (io && notification) {
            const populatedNotif = await Notification.findById(notification._id).populate('sender', 'name avatar');
            io.to(appointment.student.toString()).emit('newNotification', populatedNotif);
        }

        res.json(updatedAppointment);
    } else {
        res.status(404);
        throw new Error('Appointment not found');
    }
};

// @desc    Add a free slot (Teacher only)
// @route   POST /api/appointments/slots
// @access  Private/Teacher
const createFreeSlot = async (req, res) => {
    const { date, startTime, endTime } = req.body;

    const slot = await Appointment.create({
        teacher: req.user._id,
        date,
        startTime,
        endTime,
        status: 'available',
        appointmentType: 'slot',
    });

    if (slot) {
        res.status(201).json(slot);
    } else {
        res.status(400);
        throw new Error('Invalid slot data');
    }
};

// @desc    Get all available slots for students
// @route   GET /api/appointments/slots
// @access  Private
const getAvailableSlots = async (req, res) => {
    const slots = await Appointment.find({
        status: 'available',
        appointmentType: 'slot',
        date: { $gte: new Date() }
    })
        .populate('teacher', 'name email avatar')
        .sort({ date: 1, startTime: 1 });

    res.json(slots);
};

// @desc    Student books an available slot
// @route   PUT /api/appointments/slots/:id/book
// @access  Private/Student
const bookSlot = async (req, res) => {
    const { reason, priority, subject } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment || appointment.status !== 'available') {
        res.status(404);
        throw new Error('Slot not available');
    }

    appointment.student = req.user._id;
    appointment.status = 'approved'; // Auto-approve since teacher opened it
    appointment.appointmentType = 'appointment';
    appointment.reason = reason;
    appointment.priority = priority;
    appointment.subject = subject;

    const updated = await appointment.save();

    // Send auto-message from teacher for the approved slot
    await sendAppointmentApprovalMessage(req, updated);

    // Notify teacher
    const notification = await Notification.create({
        recipient: appointment.teacher,
        sender: req.user._id,
        type: 'appointment_update',
        title: 'Slot Booked',
        message: `${req.user.name} booked your free slot on ${new Date(appointment.date).toLocaleDateString()}`,
        relatedId: appointment._id,
    });

    const io = req.app.get('socketio');
    if (io && notification) {
        const populatedNotif = await Notification.findById(notification._id).populate('sender', 'name avatar');
        io.to(appointment.teacher.toString()).emit('newNotification', populatedNotif);
    }

    res.json(updated);
};

module.exports = {
    bookAppointment,
    getMyAppointments,
    updateAppointmentStatus,
    createFreeSlot,
    getAvailableSlots,
    bookSlot,
};
