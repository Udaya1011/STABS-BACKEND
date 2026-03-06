const mongoose = require('mongoose');
const Appointment = require('./models/Appointment');
require('dotenv').config();

const cleanup = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const allSlots = await Appointment.find({ appointmentType: 'slot' });
        const seen = new Set();
        let deletedCount = 0;

        for (const slot of allSlots) {
            const key = `${slot.teacher}_${new Date(slot.date).toDateString()}_${slot.startTime}`;
            if (seen.has(key)) {
                await Appointment.findByIdAndDelete(slot._id);
                deletedCount++;
            } else {
                seen.add(key);
            }
        }

        console.log(`Cleanup complete. Deleted ${deletedCount} duplicate slots.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

cleanup();
