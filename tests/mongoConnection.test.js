const mongoose = require('mongoose');
require('dotenv').config();

test('MongoDB connection', async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://udaya1:udaya1@cluster0.ub6jv.mongodb.net/STABS';
    
    await mongoose.connect(mongoUri);
    expect(mongoose.connection.readyState).toBe(1); // 1 = connected
    await mongoose.connection.close();
}, 60000); // Higher timeout to be safe
