class PhysicsSystem {
    updatePlayerMovement(player, dir, map) {
        let dx = 0, dy = 0;
        if (dir === 'up') dy = -1;
        if (dir === 'down') dy = 1;
        if (dir === 'left') dx = -1;
        if (dir === 'right') dx = 1;
        return player.move(dx, dy, map);
    }
}
window.PhysicsSystem = PhysicsSystem;