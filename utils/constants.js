const GameConstants = {
    tileSize: 64,
    overworldCols: 20,
    overworldRows: 15,
    overworldWidth: 20 * 64,
    overworldHeight: 15 * 64,
    overworldMoveSpeed: 1,
    playerMoveDelay: 180, // ms between moves
    encounterChance: 0.17,
    maxInventory: 20,
    maxParty: 1,
    battleAnimTime: 500,
    baseExp: 10,
    expGrowth: 1.5,
    baseGold: 5,
    goldGrowth: 1.3,
    statGrowth: {
        hp: 18,
        mp: 9,
        attack: 3,
        defense: 2,
        speed: 2,
    },
    maxLevel: 20,
    directions: [
        { x: 0, y: -1, name: 'up' },
        { x: 0, y: 1, name: 'down' },
        { x: -1, y: 0, name: 'left' },
        { x: 1, y: 0, name: 'right' },
    ],
    menuKeys: ['ArrowUp', 'ArrowDown', 'Enter', ' '],
    actions: ['Attack', 'Skill', 'Item', 'Defend', 'Run'],
    // For procedural map generation
    overworldThemes: ['forest', 'plains', 'mountain', 'ruins'],
};
window.GameConstants = GameConstants;