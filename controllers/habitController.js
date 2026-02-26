const Habit = require('../models/Habit');

// @desc    Get all habits
// @route   GET /api/habits
exports.getAllHabits = async (req, res) => {
    try {
        const habits = await Habit.find().sort({ createdAt: -1 });
        res.status(200).json(habits);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new habit
// @route   POST /api/habits
exports.createHabit = async (req, res) => {
    try {
        const { habitName } = req.body;
        if (!habitName) {
            return res.status(400).json({ message: 'Habit name is required' });
        }

        const habitExists = await Habit.findOne({ habitName });
        if (habitExists) {
            return res.status(400).json({ message: 'Habit already exists' });
        }

        const habit = await Habit.create({ habitName });
        res.status(201).json(habit);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete habit
// @route   DELETE /api/habits/:id
exports.deleteHabit = async (req, res) => {
    try {
        const habit = await Habit.findById(req.params.id);
        if (!habit) {
            return res.status(404).json({ message: 'Habit not found' });
        }

        await habit.deleteOne();
        res.status(200).json({ message: 'Habit removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper function to get yesterday's date string YYYY-MM-DD
const getYesterdayString = (todayStr) => {
    const date = new Date(todayStr);
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
};

// @desc    Mark habit completed for today
// @route   POST /api/habits/:id/mark
exports.markHabitCompleted = async (req, res) => {
    try {
        const habit = await Habit.findById(req.params.id);
        if (!habit) {
            return res.status(404).json({ message: 'Habit not found' });
        }

        const todayStr = new Date().toISOString().split('T')[0];

        // If already marked today, do nothing or return current habit
        if (habit.records.get(todayStr)) {
            return res.status(200).json(habit);
        }

        habit.records.set(todayStr, true);

        // Streak logic
        const yesterdayStr = getYesterdayString(todayStr);
        if (habit.records.get(yesterdayStr)) {
            habit.streakCount += 1;
        } else {
            habit.streakCount = 1;
        }

        await habit.save();
        res.status(200).json(habit);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Unmark habit
// @route   POST /api/habits/:id/unmark
exports.unmarkHabit = async (req, res) => {
    try {
        const habit = await Habit.findById(req.params.id);
        if (!habit) {
            return res.status(404).json({ message: 'Habit not found' });
        }

        const todayStr = new Date().toISOString().split('T')[0];

        // If not marked today, do nothing
        if (!habit.records.get(todayStr)) {
            return res.status(200).json(habit);
        }

        habit.records.delete(todayStr);

        // Streak logic revert:
        // If they unmark today, and yesterday was marked, their streak just goes back
        // to what it was yesterday (which is current streak - 1).
        // If yesterday was NOT marked, then they had just started a new streak today of 1, so it becomes 0.
        const yesterdayStr = getYesterdayString(todayStr);
        if (habit.records.get(yesterdayStr)) {
            habit.streakCount = Math.max(0, habit.streakCount - 1);
        } else {
            habit.streakCount = 0;
        }

        await habit.save();
        res.status(200).json(habit);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
