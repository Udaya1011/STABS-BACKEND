const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Subject = require('../models/Subject');

// @desc    Submit attendance for a subject
// @route   POST /api/attendance
// @access  Private (Teacher or Staff)
exports.submitAttendance = async (req, res) => {
    try {
        const { subjectId, attendanceData, date, slot } = req.body;

        if (!subjectId || !attendanceData || attendanceData.length === 0) {
            return res.status(400).json({ message: 'Missing subject or attendance data' });
        }

        // 0. Check for duplicate attendance for the same slot/date/subject
        const searchDate = new Date(date || new Date());
        searchDate.setHours(0, 0, 0, 0);
        
        const existingAttendance = await Attendance.findOne({
            subject: subjectId,
            slot: slot,
            date: {
                $gte: searchDate,
                $lt: new Date(searchDate.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        if (existingAttendance) {
            return res.status(400).json({ 
                message: `Attendance has already been marked for this subject in slot ${slot} on this date.` 
            });
        }

        // 1. Create the attendance record
        const attendanceRecord = await Attendance.create({
            subject: subjectId,
            faculty: req.user._id,
            students: attendanceData.map(item => ({
                student: item.studentId,
                status: item.status
            })),
            date: date || new Date(),
            slot: slot
        });

        // 2. Update Student summary records
        for (const item of attendanceData) {
            const student = await Student.findOne({ _id: item.studentId });
            if (student) {
                // Find or create subject summary in student's record
                let subjectSummary = student.attendance.find(a => a.subject && a.subject.toString() === subjectId);
                
                if (!subjectSummary) {
                    subjectSummary = {
                        subject: subjectId,
                        totalClasses: 0,
                        attendedClasses: 0,
                        percentage: 0
                    };
                    student.attendance.push(subjectSummary);
                    // Get the newly added summary
                    subjectSummary = student.attendance[student.attendance.length - 1];
                }

                subjectSummary.totalClasses += 1;
                if (item.status === 'Present') {
                    subjectSummary.attendedClasses += 1;
                }
                
                // Recalculate percentage
                if (subjectSummary.totalClasses > 0) {
                    subjectSummary.percentage = Math.round((subjectSummary.attendedClasses / subjectSummary.totalClasses) * 100);
                }
                
                await student.save();
            }
        }

        res.status(201).json({
            success: true,
            data: attendanceRecord
        });
    } catch (error) {
        console.error('Attendance Submission Error:', error);
        res.status(500).json({ message: error.message || 'Server error marking attendance' });
    }
};

// @desc    Get attendance history for a subject
// @route   GET /api/attendance/:subjectId
// @access  Private (Teacher/Staff/Admin)
exports.getSubjectAttendance = async (req, res) => {
    try {
        const records = await Attendance.find({ subject: req.params.subjectId })
            .populate('faculty', 'name email')
            .populate({
                path: 'students.student',
                populate: {
                    path: 'user',
                    select: 'name'
                }
            })
            .sort('-date');

        res.status(200).json({
            success: true,
            data: records
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching records' });
    }
};

// @desc    Get attendance for a student
// @route   GET /api/attendance/student/:studentId
// @access  Private
exports.getStudentFullAttendance = async (req, res) => {
    try {
        // Here we get individual records where this student is present
        // Actually, searching the students array in Attendance record
        const records = await Attendance.find({
            'students.student': req.params.studentId
        })
        .populate('subject', 'name code')
        .populate('faculty', 'name')
        .sort('-date');

        // Extract student-specific status for each record
        const history = records.map(record => ({
            _id: record._id,
            date: record.date,
            slot: record.slot,
            subject: record.subject,
            faculty: record.faculty,
            status: record.students.find(s => s.student.toString() === req.params.studentId).status
        }));

        res.status(200).json({
            success: true,
            data: history
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching history' });
    }
};
