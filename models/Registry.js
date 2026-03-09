const mongoose = require('mongoose');

const registrySchema = new mongoose.Schema({
    blocks: [{ type: String }],
    years: [{ type: String }],
    rooms: [{ type: String }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Registry', registrySchema);
