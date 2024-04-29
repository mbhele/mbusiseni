const mongoose = require('mongoose');

const contactFormSchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: true
    },
    website: {
        type: String,
        required: false // Since it's optional
    },
    logo: {
        type: String,
        required: true,
        enum: ['yes', 'no']
    },
    numClients: {
        type: Number,
        required: true
    },
    websiteType: {
        type: String,
        required: true,
        enum: ['personal', 'small', 'medium', 'large', 'startup', 'corporate', 'educational', 'non_profit', 'entertainment', 'other']
    },
    industry: {
        type: String,
        required: true,
        enum: ['plumbing', 'technology', 'finance', 'healthcare', 'education', 'manufacturing', 'retail', 'food_service', 'real_estate', 'transportation', 'entertainment', 'non_profit', 'other']
    },
    agent: {
        type: String,
        required: true,
        enum: ['single', 'multiple']
    },
    phone: {
        type: String,
        required: true
    },
    adType: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('ContactForm', contactFormSchema);
