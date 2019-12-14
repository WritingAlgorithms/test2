function AppTimer(initial_time, init_callback, init_reset_onElapsed) {
    this.time = initial_time;
    this.time_elapsed = 0;
    this.callback = init_callback;
    this.resetOnElapsed = init_reset_onElapsed;
    
    this.setTimer = function(amount_ms, callback_func) {
        this.time = amount_ms;
        this.callback = callback_func;
    };

    this.increment = function(amount_ms) {
        this.time_elapsed += amount_ms;
        if (this.resetOnElapsed == true) {
            this.callback();
            this.time_elapsed = 0;
        } else {
            this.callback();
        }
    };

    this.isDone = function() {
        if (this.time_elapsed >= this.time && !this.resetOnElapsed) {
            return true;
        } else {
            return false;
        }
    };
}