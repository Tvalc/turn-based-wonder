class InputSystem {
    constructor() {
        this.keys = {};
        this.lastKey = null;
        this.listeners();
    }
    listeners() {
        window.addEventListener('keydown', e => {
            this.keys[e.key] = true;
            this.lastKey = e.key;
        });
        window.addEventListener('keyup', e => {
            this.keys[e.key] = false;
        });
    }
    isDown(key) {
        return !!this.keys[key];
    }
    consumeKey(key) {
        const val = this.keys[key];
        this.keys[key] = false;
        return val;
    }
    latestKey() {
        return this.lastKey;
    }
    clearLast() {
        this.lastKey = null;
    }
}
window.InputSystem = InputSystem;