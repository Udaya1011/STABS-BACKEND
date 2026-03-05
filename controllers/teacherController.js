const Teacher = require('../models/Teacher');
const User = require('../models/User');

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
        teacher.designation = req.body.designation || teacher.designation;
        teacher.qualifications = req.body.qualifications || teacher.qualifications;
        teacher.officeHours = req.body.officeHours || teacher.officeHours;
        teacher.maxAppointmentsPerDay = req.body.maxAppointmentsPerDay || teacher.maxAppointmentsPerDay;

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
            populate: { path: 'department', select: 'name' }
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
        // Update Teacher model fields
        teacher.designation = req.body.designation || teacher.designation;
        teacher.qualifications = req.body.qualifications || teacher.qualifications;
        teacher.officeHours = req.body.officeHours || teacher.officeHours;

        // Update User model fields if provided
        const user = await User.findById(teacher.user);
        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            if (req.body.department) user.department = req.body.department;
            await user.save();
        }

        const updatedTeacher = await teacher.save();
        res.json(updatedTeacher);
    } else {
        res.status(404);
        throw new Error('Teacher not found');
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

module.exports = {
    getTeacherProfile,
    updateTeacherProfile,
    updateAvailability,
    getTeachers,
    adminUpdateTeacher,
    deleteTeacher,
};
