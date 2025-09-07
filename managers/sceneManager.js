class SceneManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.scenes = {};
    }
    registerScene(name, sceneObj) {
        this.scenes[name] = sceneObj;
    }
    goto(name) {
        if (this.scenes[name]) {
            this.stateManager.setState(name);
        }
    }
    getCurrentScene() {
        return this.scenes[this.stateManager.getState()];
    }
}
window.SceneManager = SceneManager;