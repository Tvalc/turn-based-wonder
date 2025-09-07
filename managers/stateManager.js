class StateManager {
    constructor() {
        this.gameState = 'overworld'; // 'overworld', 'battle', 'menu', 'inventory', 'dialogue', 'gameover', 'victory'
        this.battleState = null; // 'player-turn', 'enemy-turn', 'anim', etc
        this.currentScene = 'overworld';
        this.dialogue = null;
        this.menu = null;
        this.overlay = null;
        this.quest = null;
    }
    setState(state) {
        this.gameState = state;
        this.currentScene = state;
    }
    getState() {
        return this.gameState;
    }
}
window.StateManager = StateManager;