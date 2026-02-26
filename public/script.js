document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const form = document.getElementById('addHabitForm');
    const input = document.getElementById('habitNameInput');
    const habitsList = document.getElementById('habitsList');
    const emptyState = document.getElementById('emptyState');
    const dateDisplay = document.getElementById('dateDisplay');
    const toastContainer = document.getElementById('toastContainer');
    const addBtn = document.getElementById('addBtn');

    // State
    const API_URL = '/api/habits';
    let habits = [];

    // Get today's string (YYYY-MM-DD local timezone)
    const getTodayString = () => {
        const today = new Date();
        const offset = today.getTimezoneOffset();
        today.setMinutes(today.getMinutes() - offset);
        return today.toISOString().split('T')[0];
    };

    const todayStr = getTodayString();

    // Display formatted date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateDisplay.textContent = new Date().toLocaleDateString(undefined, options);

    // Initial Fetch
    fetchHabits();

    // Event Listeners
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const habitName = input.value.trim();

        if (!habitName) return;

        // UI Optimistic Update could go here, but let's just do a simple wait for MVP
        addBtn.disabled = true;
        addBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ habitName })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to create habit');
            }

            input.value = '';
            showToast('Habit added successfully!', 'success');
            await fetchHabits();
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            addBtn.disabled = false;
            addBtn.innerHTML = '<i class="fas fa-plus"></i> Add Habit';
        }
    });

    // Fetch Habits helper
    async function fetchHabits() {
        try {
            const res = await fetch(API_URL);
            habits = await res.json();
            renderHabits();
        } catch (error) {
            showToast('Failed to load habits', 'error');
        }
    }

    // Render Habits
    function renderHabits() {
        habitsList.innerHTML = '';

        if (habits.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');

            habits.forEach(habit => {
                const isCompletedToday = habit.records && habit.records[todayStr] === true;

                const card = document.createElement('div');
                card.className = `habit-card ${isCompletedToday ? 'completed-today' : ''}`;

                card.innerHTML = `
                    <button class="btn-check ${isCompletedToday ? 'completed' : ''}" data-id="${habit._id}" aria-label="Toggle completion">
                        <i class="fas fa-check"></i>
                    </button>
                    <div class="habit-info">
                        <div class="habit-name">${escapeHTML(habit.habitName)}</div>
                        <div class="habit-streak">
                            <i class="fas fa-fire streak-icon"></i>
                            <span class="streak-count">${habit.streakCount} day streak</span>
                        </div>
                    </div>
                    <div class="habit-actions">
                        <button class="btn-icon delete-btn" data-id="${habit._id}" title="Delete Habit">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;

                habitsList.appendChild(card);
            });

            attachCardEventListeners();
        }
    }

    function attachCardEventListeners() {
        const checkBtns = document.querySelectorAll('.btn-check');
        const deleteBtns = document.querySelectorAll('.delete-btn');

        checkBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = btn.getAttribute('data-id');
                const isCompleted = btn.classList.contains('completed');
                await toggleHabitStatus(id, isCompleted);
            });
        });

        deleteBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = btn.getAttribute('data-id');
                if (confirm('Are you sure you want to delete this habit?')) {
                    await deleteHabit(id);
                }
            });
        });
    }

    async function toggleHabitStatus(id, currentlyCompleted) {
        const action = currentlyCompleted ? 'unmark' : 'mark';

        try {
            const res = await fetch(`${API_URL}/${id}/${action}`, {
                method: 'POST'
            });

            if (!res.ok) throw new Error('Failed to update status');

            // Check for fun completion animation
            if (!currentlyCompleted) {
                showToast('Nice work! Streak updated 🔥', 'success');
            }

            fetchHabits();
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    async function deleteHabit(id) {
        try {
            const res = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error('Failed to delete habit');

            showToast('Habit deleted', 'success');
            fetchHabits();
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    // UI Utilities
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';

        toast.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('hiding');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 3000);
    }

    function escapeHTML(str) {
        // Basic escaping to prevent XSS
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});
