const Teacher = require('../models/Teacher');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

// Helper to sync free periods from timetable to available appointment slots
const syncFreeSlots = async (teacherId, userId, availability) => {
    try {
        // 1. Remove existing available slots for this teacher to avoid duplicates/conflicts
        await Appointment.deleteMany({
            teacher: userId,
            status: 'available',
            appointmentType: 'slot'
        });

        if (!availability || availability.length === 0) return 0;

        const slotsToCreate = [];
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // 2. Generate slots for TODAY ONLY
        const now = new Date();
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const dayName = daysOfWeek[date.getDay()];
        console.log(`Syncing slots for ${dayName} (${date.toDateString()}) for teacher ${userId}`);

        const daySchedule = availability.find(d => d.day === dayName);

        if (daySchedule && daySchedule.slots) {
            console.log(`Found ${daySchedule.slots.length} total periods for ${dayName}`);
            daySchedule.slots.forEach(slot => {
                // If no subject is assigned, it's a free period -> bookable slot
                if (!slot.subject) {
                    slotsToCreate.push({
                        teacher: userId,
                        date: new Date(date),
                        startTime: slot.start,
                        endTime: slot.end,
                        status: 'available',
                        appointmentType: 'slot'
                    });
                }
            });
        }

        let createdCount = 0;
        if (slotsToCreate.length > 0) {
            for (const slot of slotsToCreate) {
                // Check if a slot already exists for this teacher at this date and time
                const existing = await Appointment.findOne({
                    teacher: slot.teacher,
                    date: slot.date,
                    startTime: slot.startTime
                });

                if (!existing) {
                    await Appointment.create(slot);
                    createdCount++;
                }
            }
            console.log(`Successfully created ${createdCount} new slots for teacher ${userId}`);
        } else {
            console.log(`No free periods found in ${dayName}'s schedule for teacher ${userId}`);
        }

        return createdCount;
    } catch (error) {
        console.error('Error syncing free slots:', error);
        return 0;
    }
};

// @desc    Get teacher profile
// @route   GET /api/teachers/profile
// @access  Private
const getTeacherProfile = async (req, res) => {
    const teacher = await Teacher.findOne({ user: req.user._id }).populate('user', 'name email avatar').populate('subjects');

    if (teacher) {
        res.json(teacher);
    } else {
        res.status(404);
        throw new Error('Teacher profile not found');
    }
};

// @desc    Update teacher profile
// @route   PUT /api/teachers/profile
// @access  Private
const updateTeacherProfile = async (req, res) => {
    const teacher = await Teacher.findOne({ user: req.user._id });

    if (teacher) {
        console.log(`[PROFILE UPDATE] User: ${req.user._id}. New Phone: ${req.body.phoneNumber}`);
        teacher.set({
            designation: req.body.designation || teacher.designation,
            qualifications: req.body.qualifications || teacher.qualifications,
            phoneNumber: req.body.phoneNumber || req.body.officeHours || teacher.phoneNumber,
            specialization: req.body.specialization || teacher.specialization,
            maxAppointmentsPerDay: req.body.maxAppointmentsPerDay || teacher.maxAppointmentsPerDay
        });

        const user = await User.findById(teacher.user);
        if (user) {
            user.phone = req.body.phoneNumber || req.body.officeHours || user.phone;
            user.bio = req.body.specialization || user.bio;
            await user.save();
        }

        const updatedTeacher = await teacher.save();
        res.json(updatedTeacher);
    } else {
        res.status(404);
        throw new Error('Teacher profile not found');
    }
};

// @desc    Update teacher availability
// @route   PUT /api/teachers/availability
// @access  Private
const updateAvailability = async (req, res) => {
    const teacher = await Teacher.findOne({ user: req.user._id });

    if (teacher) {
        teacher.availability = req.body.availability;
        const updatedTeacher = await teacher.save();

        // Sync free slots to appointment system
        await syncFreeSlots(teacher._id, req.user._id, req.body.availability);

        res.json(updatedTeacher);
    } else {
        res.status(404);
        throw new Error('Teacher profile not found');
    }
};

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Private
const getTeachers = async (req, res) => {
    const teachers = await Teacher.find({})
        .populate({
            path: 'user',
            select: 'name email department avatar',
            populate: { path: 'department', select: 'name programme' }
        })
        .populate('subjects');
    res.json(teachers);
};

// @desc    Update teacher (Admin)
// @route   PUT /api/teachers/:id
// @access  Private/Admin
const adminUpdateTeacher = async (req, res) => {
    const teacher = await Teacher.findById(req.params.id);

    if (teacher) {
        console.log(`[ADMIN UPDATE] TeacherID: ${req.params.id}. New Phone: ${req.body.phoneNumber}`);
        // Update Teacher model fields
        teacher.set({
            designation: req.body.designation || teacher.designation,
            qualifications: req.body.qualifications || teacher.qualifications,
            phoneNumber: req.body.phoneNumber || req.body.officeHours || teacher.phoneNumber,
            specialization: req.body.specialization || teacher.specialization
        });

        // Update User model fields if provided
        const user = await User.findById(teacher.user);
        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.phone = req.body.phoneNumber || req.body.officeHours || user.phone;
            user.bio = req.body.specialization || user.bio;
            if (req.body.department) user.department = req.body.department;
            await user.save();
        }

        const updatedTeacher = await teacher.save();
        const populatedTeacher = await Teacher.findById(updatedTeacher._id)
            .populate({
                path: 'user',
                select: 'name email department avatar',
                populate: { path: 'department', select: 'name programme' }
            })
            .populate('subjects');
        res.json(populatedTeacher);
    } else {
        res.status(404);
        throw new Error('Teacher not found');
    }
};

// @desc    Update teacher timetable (Admin)
// @route   PUT /api/teachers/:id/timetable
// @access  Private/Admin
const adminUpdateTimetable = async (req, res) => {
    try {
        const updatedTeacher = await Teacher.findByIdAndUpdate(
            req.params.id,
            { availability: req.body.availability },
            { new: true, runValidators: true }
        )
            .populate({
                path: 'user',
                select: 'name email department avatar',
                populate: { path: 'department', select: 'name programme' }
            })
            .populate('subjects')
            .populate({
                path: 'availability.slots.subject',
                model: 'Subject',
                select: 'name code'
            });
        if (!updatedTeacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        // Sync free slots to appointment system
        // Note: For admin update, we use the teacher's linked user ID
        await syncFreeSlots(updatedTeacher._id, updatedTeacher.user._id || updatedTeacher.user, req.body.availability);

        res.json(updatedTeacher);
    } catch (err) {
        console.error('Error updating timetable:', err);
        res.status(500).json({
            message: 'Server error while updating timetable',
            error: err.message,
            details: err.errors // If it's a validation error
        });
    }
};

// @desc    Delete teacher
// @route   DELETE /api/teachers/:id
// @access  Private/Admin
const deleteTeacher = async (req, res) => {
    const teacher = await Teacher.findById(req.params.id);

    if (teacher) {
        await User.findByIdAndDelete(teacher.user);
        await teacher.deleteOne();
        res.json({ message: 'Teacher removed' });
    } else {
        res.status(404);
        throw new Error('Teacher not found');
    }
};

// @desc    Sync teacher free slots from timetable
// @route   POST /api/teachers/sync-slots
// @access  Private
const syncMyFreeSlots = async (req, res) => {
    try {
        console.log('Syncing for user:', req.user._id, 'Role:', req.user.role);
        const teacher = await Teacher.findOne({ user: req.user._id });
        if (teacher) {
            console.log('Teacher profile found:', teacher._id);
            const count = await syncFreeSlots(teacher._id, req.user._id, teacher.availability);
            res.json({
                message: count > 0 ? `${count} slots synchronized successfully` : 'Already in sync - No new free slots found',
                count
            });
        } else {
            console.warn('Teacher profile NOT FOUND for user ID:', req.user._id);
            res.status(404).json({ message: 'Teacher profile not found for this user account' });
        }
    } catch (error) {
        console.error('Error in syncMyFreeSlots:', error);
        res.status(500).json({ message: 'Server error while syncing slots' });
    }
};

module.exports = {
    getTeacherProfile,
    updateTeacherProfile,
    updateAvailability,
    getTeachers,
    adminUpdateTeacher,
    adminUpdateTimetable,
    deleteTeacher,
    syncMyFreeSlots,
};
