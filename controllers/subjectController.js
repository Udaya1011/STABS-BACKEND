const Subject = require('../models/Subject');

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private
const getSubjects = async (req, res) => {
    const subjects = await Subject.find({}).populate('department', 'name').populate('teachers', 'name email');
    res.json(subjects);
};

// @desc    Create a subject
// @route   POST /api/subjects
// @access  Private/Admin
const createSubject = async (req, res) => {
    const { name, code, department, year, semester, teachers } = req.body;

    const subjectExists = await Subject.findOne({ code });

    if (subjectExists) {
        res.status(400);
        throw new Error('Subject with this code already exists');
    }

    const subject = await Subject.create({
        name,
        code,
        department,
        year,
        semester,
        teachers,
    });

    if (subject) {
        res.status(201).json(subject);
    } else {
        res.status(400);
        throw new Error('Invalid subject data');
    }
};

// @desc    Update a subject
// @route   PUT /api/subjects/:id
// @access  Private/Admin
const updateSubject = async (req, res) => {
    const subject = await Subject.findById(req.params.id);

    if (subject) {
        subject.name = req.body.name || subject.name;
        subject.code = req.body.code || subject.code;
        subject.department = req.body.department || subject.department;
        subject.year = req.body.year || subject.year;
        subject.semester = req.body.semester || subject.semester;
        subject.teachers = req.body.teachers || subject.teachers;

        const updatedSubject = await subject.save();
        res.json(updatedSubject);
    } else {
        res.status(404);
        throw new Error('Subject not found');
    }
};

// @desc    Delete a subject
// @route   DELETE /api/subjects/:id
// @access  Private/Admin
const deleteSubject = async (req, res) => {
    const subject = await Subject.findById(req.params.id);

    if (subject) {
        await subject.deleteOne();
        res.json({ message: 'Subject removed' });
    } else {
        res.status(404);
        throw new Error('Subject not found');
    }
};

module.exports = {
    getSubjects,
    createSubject,
    updateSubject,
    deleteSubject,
};
