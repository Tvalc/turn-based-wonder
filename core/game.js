window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const overlay = document.getElementById('ui-overlay');
    window.gameManager = new GameManager(canvas, overlay);
    requestAnimationFrame(ts => gameManager.gameLoop(ts));
});