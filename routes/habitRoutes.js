const express = require('express');
const router = express.Router();
const {
    getAllHabits,
    createHabit,
    deleteHabit,
    markHabitCompleted,
    unmarkHabit
} = require('../controllers/habitController');

router.route('/').get(getAllHabits).post(createHabit);
router.route('/:id').delete(deleteHabit);
router.route('/:id/mark').post(markHabitCompleted);
router.route('/:id/unmark').post(unmarkHabit);

module.exports = router;
