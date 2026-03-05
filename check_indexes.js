require('dotenv').config();
const mongoose = require('mongoose');

const checkIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const collections = ['users', 'teachers', 'students'];
        for (const colName of collections) {
            const indexes = await mongoose.connection.db.collection(colName).indexes();
            console.log(`--- ${colName.toUpperCase()} INDEXES ---`);
            console.log(JSON.stringify(indexes, null, 2));
        }
        await mongoose.connection.close();
    } catch (e) {
        console.error(e);
    }
};
checkIndexes();
