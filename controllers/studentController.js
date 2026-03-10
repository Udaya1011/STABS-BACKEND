const Student = require('../models/Student');
const User = require('../models/User');

// @desc    Get all students
// @route   GET /api/students
// @access  Private/Admin
const getStudents = async (req, res) => {
    const query = {};
    if (req.query.subjectId) {
        query.subjects = req.query.subjectId;
    }

    const students = await Student.find(query)
        .populate({
            path: 'user',
            select: 'name email department avatar',
            populate: { path: 'department', select: 'name programme' }
        })
        .populate('attendance.subject', 'name code');

    // Log for debugging
    console.log(`Found ${students.length} students in database`);

    res.json(students);
};

// @desc    Update student (Admin)
// @route   PUT /api/students/:id
// @access  Private/Admin
const updateStudent = async (req, res) => {
    const student = await Student.findById(req.params.id);

    if (student) {
        student.registerNumber = req.body.registerNumber || student.registerNumber;
        student.academicYear = req.body.academicYear || student.academicYear;
        student.semester = req.body.semester || student.semester;

        const user = await User.findById(student.user);
        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            if (req.body.department) user.department = req.body.department;
            await user.save();
        }

        const updatedStudent = await student.save();
        res.json(updatedStudent);
    } else {
        res.status(404);
        throw new Error('Student not found');
    }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private/Admin
const deleteStudent = async (req, res) => {
    const student = await Student.findById(req.params.id);

    if (student) {
        await User.findByIdAndDelete(student.user);
        await student.deleteOne();
        res.json({ message: 'Student removed' });
    } else {
        res.status(404);
        throw new Error('Student not found');
    }
};

module.exports = {
    getStudents,
    updateStudent,
    deleteStudent,
};
