class CollisionSystem {
    // For overworld: check collision with NPCs, items, walls
    static isColliding(x, y, npcs, items, map) {
        // Walls
        if (!map.isWalkable(x, y)) return true;
        // NPCs
        for (let npc of npcs) {
            if (npc.x === x && npc.y === y) return true;
        }
        // Items - allow standing on
        return false;
    }
    static findNPCAt(x, y, npcs) {
        for (let npc of npcs) {
            if (npc.x === x && npc.y === y) return npc;
        }
        return null;
    }
    static findItemAt(x, y, items) {
        for (let i=0; i<items.length; ++i) {
            let item = items[i];
            if (item.x === x && item.y === y) return { item, idx: i };
        }
        return null;
    }
}
window.CollisionSystem = CollisionSystem;