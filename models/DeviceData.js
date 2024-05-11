// models/DeviceData.js
const mongoose = require('mongoose');

const DeviceDataSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    deviceInfo: Object,
    osInfo: Object,
    browserInfo: Object,
    pageVisited: String,
    userAgent: String,
    language: String,
    platform: String,
    screenResolution: String,
    colorDepth: Number,
    referralURL: String,
    timezone: String,
    networkSpeed: String,
    networkType: String,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DeviceData', DeviceDataSchema);
