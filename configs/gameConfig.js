const GameConfig = {
    playerStart: { x: 8, y: 10 }, // Changed from { x: 10, y: 7 }
    playerName: 'Hero',
    initialStats: {
        hp: 42,
        mp: 15,
        attack: 9,
        defense: 5,
        speed: 5,
        level: 1,
        exp: 0,
        gold: 30
    },
    skills: [
        { name: "Slash", mp: 0, power: 1.0, desc: "A basic attack.", target: "enemy" },
        { name: "Fireball", mp: 6, power: 1.7, desc: "A fiery spell.", target: "enemy" }
    ],
    items: [
        { id: "potion", name: "Potion", effect: { hp: 20 }, desc: "Restores 20 HP." },
        { id: "ether", name: "Ether", effect: { mp: 10 }, desc: "Restores 10 MP." }
    ],
    equipment: [
        { id: "sword1", name: "Rusty Sword", attack: 2, desc: "A dull blade." },
        { id: "shield1", name: "Wooden Shield", defense: 2, desc: "Light, basic protection." }
    ]
};
window.GameConfig = GameConfig;