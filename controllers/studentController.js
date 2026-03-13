const Student = require('../models/Student');
const User = require('../models/User');

// @desc    Get all students
// @route   GET /api/students
// @access  Private/Admin
const getStudents = async (req, res) => {
    try {
        const { subjectId, department, year, semester } = req.query;
        console.log('--- STUDENT SYNCHRONIZATION (V4) ---');
        console.log('Query Params:', { subjectId, department, year, semester });
        
        const semNum = semester && semester !== 'undefined' ? Number(semester) : null;
        let students = [];

        // PRIORITY 1: Subject-Specific Enrollment
        // If a teacher selects a subject, we show ALL students linked to that subject
        // regardless of whether their Year/Sem labels match the current selection.
        if (subjectId && subjectId.match(/^[0-9a-fA-F]{24}$/)) {
            console.log(`Syncing via Subject ID: ${subjectId}`);
            students = await Student.find({ subjects: subjectId }).populate('user');
        }

        // PRIORITY 2: Profile-based Fallback (No Subject match or No Subject Selected)
        if (students.length === 0) {
            console.log('Subject match empty or missing. Falling back to Profile-based search...');
            let profileQuery = {};
            
            // Semester Matching (Reliable)
            if (semNum !== null) {
                profileQuery.$or = [{ semester: semNum }, { semester: String(semNum) }];
            }
            
            // Year Matching (Regex for "Year 2" -> "2" etc)
            if (year && year !== 'undefined' && year !== '') {
                profileQuery.academicYear = { $regex: year, $options: 'i' };
            }

            // Department Matching
            if (department && department !== 'undefined' && department.match(/^[0-9a-fA-F]{24}$/)) {
                const users = await User.find({ department }).select('_id');
                if (users.length > 0) {
                    profileQuery.user = { $in: users.map(u => u._id) };
                } else {
                    profileQuery.user = null;
                }
            }

            console.log('Profile Query Map:', JSON.stringify(profileQuery));
            students = await Student.find(profileQuery).populate('user');
        }

        // PRIORITY 3: Global Semester Safeguard
        if (students.length === 0 && semNum !== null) {
            console.log('Profile match empty. Falling back to Semester-only safeguard...');
            students = await Student.find({ 
                $or: [{ semester: semNum }, { semester: String(semNum) }] 
            }).populate('user');
        }

        // Hydrate all data for the frontend
        students = await Student.populate(students, [
            { path: 'user', populate: { path: 'department' } },
            { path: 'subjects' },
            { path: 'attendance.subject' }
        ]);

        console.log(`Roster complete: ${students.length} students found.`);
        res.json(students);
    } catch (error) {
        console.error('SERVER ERROR (getStudents):', error);
        res.status(500).json({ message: 'Failed to synchronize student registry' });
    }
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
