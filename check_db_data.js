require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Teacher = require('./models/Teacher');
const Student = require('./models/Student');
const Department = require('./models/Department');
const Subject = require('./models/Subject');

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const userCount = await User.countDocuments();
        const teacherCount = await Teacher.countDocuments();
        const studentCount = await Student.countDocuments();
        const departmentCount = await Department.countDocuments();
        const subjectCount = await Subject.countDocuments();

        console.log('--- Database Stats ---');
        console.log(`Users: ${userCount}`);
        console.log(`Teachers: ${teacherCount}`);
        console.log(`Students: ${studentCount}`);
        console.log(`Departments: ${departmentCount}`);
        console.log(`Subjects: ${subjectCount}`);

        if (userCount === 0) {
            console.log('WARNING: No users found in the database.');
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error checking data:', error);
        process.exit(1);
    }
};

checkData();
