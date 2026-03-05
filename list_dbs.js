require('dotenv').config();
const mongoose = require('mongoose');

const listDBs = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();

        console.log('--- Databases on this cluster ---');
        dbs.databases.forEach(db => console.log(`- ${db.name}`));

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error listing databases:', error);
        process.exit(1);
    }
};

listDBs();
