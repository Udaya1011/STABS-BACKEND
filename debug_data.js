require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/Student');
const User = require('./models/User');
const Department = require('./models/Department');

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const mcaDept = await Department.findOne({ programme: /MCA/i });
        console.log('MCA Dept:', mcaDept ? mcaDept._id : 'NOT FOUND');

        const query = { semester: 4 };
        const students = await Student.find(query).populate('user');
        console.log(`Found ${students.length} students in Semester 4`);
        
        students.forEach(s => {
            console.log(`- ${s.user?.name} | Reg: ${s.registerNumber} | Year: ${s.academicYear} | Dept: ${s.user?.department}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
