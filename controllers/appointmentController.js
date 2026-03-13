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
            .populate('teacher', 'name email avatar')
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

    // Check for duplicates
    const existing = await Appointment.findOne({
        teacher: req.user._id,
        date,
        startTime
    });

    if (existing) {
        res.status(400);
        throw new Error('You already have a session or slot scheduled for this time.');
    }

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const slots = await Appointment.find({
        status: 'available',
        appointmentType: 'slot',
        date: { $gte: today }
    })
        .populate('teacher', 'name email avatar')
        .populate('subject', 'name code')
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
    appointment.appointmentType = 'slot'; // Keep as slot for tracking in free slots view
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

// @desc    Cancel a slot (Teacher only)
// @route   PUT /api/appointments/slots/:id/cancel
// @access  Private/Teacher
const cancelSlot = async (req, res) => {
    const { reason } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
        res.status(404);
        throw new Error('Slot not found');
    }

    if (appointment.teacher.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to cancel this slot');
    }

    appointment.status = 'cancelled';
    appointment.cancelReason = reason;
    const updated = await appointment.save();

    // If there was a student, notify them
    if (appointment.student) {
        const notification = await Notification.create({
            recipient: appointment.student,
            sender: req.user._id,
            type: 'appointment_update',
            title: 'Appointment Cancelled',
            message: `Teacher cancelled the appointment: ${reason || 'No reason provided'}`,
            relatedId: appointment._id,
        });

        const io = req.app.get('socketio');
        if (io && notification) {
            const populatedNotif = await Notification.findById(notification._id).populate('sender', 'name avatar');
            io.to(appointment.student.toString()).emit('newNotification', populatedNotif);
        }
    }

    res.json(updated);
};

// @desc    Sync timetable free periods to appointment slots (Teacher only)
// @route   POST /api/appointments/sync-slots
// @access  Private/Teacher
const syncTimetableSlots = async (req, res) => {
    const Teacher = require('../models/Teacher');
    const teacherProfile = await Teacher.findOne({ user: req.user._id });

    if (!teacherProfile) {
        res.status(404);
        throw new Error('Teacher profile not found');
    }

    if (!teacherProfile.availability || teacherProfile.availability.length === 0) {
        res.status(400);
        throw new Error('No timetable/availability found to sync.');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // REMOVE FINISHED DAYS: Delete available slots that are older than today
    await Appointment.deleteMany({
        teacher: req.user._id,
        status: 'available',
        appointmentType: 'slot',
        date: { $lt: today }
    });

    const createdSlots = [];
    const dayMapping = {
        'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
        'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };

    // Iterate through teacher's availability (timetable)
    for (const dayAvail of teacherProfile.availability) {
        const dayName = dayAvail.day;
        const targetDayIndex = dayMapping[dayName];

        if (targetDayIndex === undefined) continue;

        // Calculate the next occurrence of this day within the next 7 days
        let targetDate = new Date(today);
        let daysUntilTarget = (targetDayIndex - today.getDay() + 7) % 7;
        
        // If it's today, we might want to sync for today or next week.
        // Let's assume we sync for the upcoming occurrence (including today if it's earlier in the day)
        targetDate.setDate(today.getDate() + daysUntilTarget);

        for (const slot of dayAvail.slots) {
            // ONLY sync slots that are marked as "Free" (no subject assigned)
            // If subject is null/undefined, it's a free period
            if (!slot.subject) {
                // Check if this slot already exists for this teacher on this date
                const existing = await Appointment.findOne({
                    teacher: req.user._id,
                    date: targetDate,
                    startTime: slot.start
                });

                if (!existing) {
                    const newSlot = await Appointment.create({
                        teacher: req.user._id,
                        date: targetDate,
                        startTime: slot.start,
                        endTime: slot.end,
                        status: 'available',
                        appointmentType: 'slot',
                    });
                    createdSlots.push(newSlot);
                }
            }
        }
    }

    res.status(201).json({
        message: `Successfully synced ${createdSlots.length} free periods as available slots.`,
        count: createdSlots.length
    });
};

module.exports = {
    bookAppointment,
    getMyAppointments,
    updateAppointmentStatus,
    createFreeSlot,
    getAvailableSlots,
    bookSlot,
    cancelSlot,
    syncTimetableSlots,
};
