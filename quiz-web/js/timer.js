/**
 * Quiz Timer Class
 * - Handles countdown timer functionality for quizzes
 * - Provides methods to start, pause, resume, and reset the timer
 * - Fires callback events for time updates and when timer expires
 */
class QuizTimer {
    /**
     * Create a new quiz timer
     * @param {Object} options - Configuration options
     * @param {number} options.duration - Duration in seconds
     * @param {Function} options.onTick - Callback function called on every second (receives remaining time in seconds)
     * @param {Function} options.onComplete - Callback function called when timer completes
     * @param {string} options.displayElement - ID of element to update with formatted time (optional)
     */
    constructor(options) {
        this.duration = options.duration || 0; // Duration in seconds
        this.remainingTime = this.duration;
        this.onTick = options.onTick || function () { };
        this.onComplete = options.onComplete || function () { };
        this.displayElement = options.displayElement ? document.getElementById(options.displayElement) : null;
        this.timerId = null;
        this.isRunning = false;
        this.startTime = null;
        this.pausedAt = null;
    }

    /**
     * Start the timer
     */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.startTime = Date.now();

        // Clear any existing timer
        if (this.timerId) {
            clearInterval(this.timerId);
        }

        // Start the countdown
        this.timerId = setInterval(() => {
            const elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
            this.remainingTime = Math.max(0, this.duration - elapsedTime);

            // Call the tick callback with remaining time
            this.onTick(this.remainingTime);

            // Update display if element provided
            if (this.displayElement) {
                this.displayElement.textContent = this.formatTime(this.remainingTime);
            }

            // Check if timer has expired
            if (this.remainingTime <= 0) {
                this.stop();
                this.onComplete();
            }
        }, 1000);
    }

    /**
     * Pause the timer
     */
    pause() {
        if (!this.isRunning) return;

        clearInterval(this.timerId);
        this.isRunning = false;
        this.pausedAt = Date.now();
    }

    /**
     * Resume the timer from where it was paused
     */
    resume() {
        if (this.isRunning || !this.pausedAt) return;

        // Adjust the start time to account for the pause duration
        const pauseDuration = Date.now() - this.pausedAt;
        this.startTime = this.startTime + pauseDuration;
        this.pausedAt = null;

        this.start();
    }

    /**
     * Stop the timer
     */
    stop() {
        clearInterval(this.timerId);
        this.isRunning = false;
    }

    /**
     * Reset the timer to its original duration
     */
    reset() {
        this.stop();
        this.remainingTime = this.duration;
        this.pausedAt = null;

        // Update display if element provided
        if (this.displayElement) {
            this.displayElement.textContent = this.formatTime(this.remainingTime);
        }
    }

    /**
     * Set a new duration for the timer
     * @param {number} newDuration - New duration in seconds
     * @param {boolean} resetTimer - Whether to reset the timer with the new duration
     */
    setDuration(newDuration, resetTimer = true) {
        this.duration = newDuration;

        if (resetTimer) {
            this.reset();
        }
    }

    /**
     * Format seconds into MM:SS display
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time string (MM:SS)
     */
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    /**
     * Format seconds into HH:MM:SS display for longer durations
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time string (HH:MM:SS)
     */
    formatTimeWithHours(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    /**
     * Get the current remaining time in seconds
     * @returns {number} Remaining time in seconds
     */
    getTimeRemaining() {
        return this.remainingTime;
    }

    /**
     * Check if the timer is currently running
     * @returns {boolean} True if running, false otherwise
     */
    isActive() {
        return this.isRunning;
    }
}

// Export the timer class
export default QuizTimer;
