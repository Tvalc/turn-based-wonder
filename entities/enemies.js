class Enemy {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        // --- Reduce enemy attack stats for all enemies ---
        this.stats = Object.assign({}, data.stats);
        this.maxStats = Object.assign({}, data.stats);
        // Reduce attack stat to 60% of original, minimum 1
        this.stats.attack = Math.max(1, Math.round(this.stats.attack * 0.6));
        this.maxStats.attack = this.stats.attack;
        this.skills = data.skills ? data.skills.slice() : [];
        this.gold = data.gold || 0;
        this.exp = data.exp || 0;
        this.palette = data.palette;
        // Optional: animationFrames for animated enemies
        this.animationFrames = data.animationFrames || null;
    }
    isAlive() {
        return this.stats.hp > 0;
    }
}

// --- EnemyData remains unchanged, as reduction is handled in constructor ---
const EnemyData = [
    {
        id: 'slime',
        name: 'Blue Slime',
        stats: { hp: 23, mp: 0, attack: 7, defense: 3, speed: 3 },
        skills: [{ name: 'Tackle', mp: 0, power: 1.1, desc: "Bouncy attack", target: "player" }],
        gold: 8,
        exp: 13,
        palette: ['#73b5e6','#3a71a8']
    },
    {
        id: 'goblin',
        name: 'Goblin',
        stats: { hp: 34, mp: 0, attack: 11, defense: 6, speed: 8 },
        skills: [{ name: 'Bash', mp: 0, power: 1.3, desc: "Heavy club", target: "player" }],
        gold: 17,
        exp: 19,
        palette: ['#74d13d','#415514']
    },
    {
        id: 'wolf',
        name: 'Wild Wolf',
        stats: { hp: 40, mp: 0, attack: 15, defense: 7, speed: 10 },
        skills: [{ name: 'Bite', mp: 0, power: 1.5, desc: "Sharp fangs", target: "player" }],
        gold: 22,
        exp: 28,
        palette: ['#a0a0a0','#2f2f2f']
    },
    // --- Galactic Pirate enemy with animation frames ---
    {
        id: 'galactic_pirate',
        name: 'Galactic Pirate',
        stats: { hp: 65, mp: 12, attack: 19, defense: 11, speed: 13 },
        skills: [
            { name: 'Plasma Slash', mp: 0, power: 1.4, desc: "A swift plasma blade attack", target: "player" },
            { name: 'Ion Shot', mp: 4, power: 1.7, desc: "Shoots a bolt of ion energy", target: "player" }
        ],
        gold: 44,
        exp: 55,
        palette: ['#e6c23a','#3a71a8'],
        animationFrames: [
            "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/0f84fe06-5c42-40c3-b563-1a28d18f37cc/library/frames/RPG_ESR_Idle_frame_1.png",
            "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/0f84fe06-5c42-40c3-b563-1a28d18f37cc/library/frames/RPG_ESR_Idle_frame_2.png",
            "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/0f84fe06-5c42-40c3-b563-1a28d18f37cc/library/frames/RPG_ESR_Idle_frame_3.png",
            // Frame 4 is broken, so we skip it by removing it from the array
            //"https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/0f84fe06-5c42-40c3-b563-1a28d18f37cc/library/frames/RPG_ESR_Idle_frame_4.png",
            "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/0f84fe06-5c42-40c3-b563-1a28d18f37cc/library/frames/RPG_ESR_Idle_frame_5.png",
            "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/0f84fe06-5c42-40c3-b563-1a28d18f37cc/library/frames/RPG_ESR_Idle_frame_6.png"
            // Removed frame 7 as per user request:
            // "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/0f84fe06-5c42-40c3-b563-1a28d18f37cc/library/frames/RPG_ESR_Idle_frame_7.png"
        ]
    }
];

window.Enemy = Enemy;
window.EnemyData = EnemyData;