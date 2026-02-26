const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
    habitName: {
        type: String,
        required: [true, 'Please provide a habit name'],
        unique: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Map to store date strings "YYYY-MM-DD" as keys and boolean as values
    records: {
        type: Map,
        of: Boolean,
        default: {}
    },
    streakCount: {
        type: Number,
        default: 0
    }
});

const Habit = mongoose.model('Habit', habitSchema);
module.exports = Habit;
