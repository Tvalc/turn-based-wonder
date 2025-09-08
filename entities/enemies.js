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
        // Optional: animationSets for multi-animation enemies (idle/attack/death)
        this.animationSets = data.animationSets || null;
    }
    isAlive() {
        return this.stats.hp > 0;
    }
}

// --- EnemyData remains unchanged, as reduction is handled in constructor ---
const EnemyData = [
    {
        id: 'slime',
        name: 'WiFi Yeti',
        stats: { hp: 23, mp: 0, attack: 7, defense: 3, speed: 3 },
        skills: [{ name: 'Tackle', mp: 0, power: 1.1, desc: "Bouncy attack", target: "player" }],
        gold: 8,
        exp: 13,
        palette: ['#73b5e6','#3a71a8'],
        // --- WiFi Yeti animationSets (idle, attack, death) ---
        animationSets: {
            idle: [
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Wifi%20Yeti%20idle%20_frame_1.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Wifi_Yeti_idle__frame_1.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Wifi_Yeti_idle__frame_2.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Wifi_Yeti_idle__frame_3.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Wifi_Yeti_idle__frame_4.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Wifi_Yeti_idle__frame_5.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Wifi_Yeti_idle__frame_6.png"
            ],
            attack: [
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Attacking%20Wifi%20Yeti%201%20_frame_1.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Attacking_Wifi_Yeti_1__frame_1.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Attacking_Wifi_Yeti_1__frame_2.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Attacking_Wifi_Yeti_1__frame_3.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Attacking_Wifi_Yeti_1__frame_4.png"
            ],
            death: [
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Wifi%20Death%20_frame_1.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Wifi_Death__frame_1.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Wifi_Death__frame_2.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Wifi_Death__frame_3.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Wifi_Death__frame_4.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Wifi_Death__frame_5.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Wifi_Death__frame_6.png"
            ]
        }
    },
    {
        id: 'goblin',
        name: 'Space Roach Pirate',
        stats: { hp: 34, mp: 0, attack: 11, defense: 6, speed: 8 },
        skills: [{ name: 'Bash', mp: 0, power: 1.3, desc: "Heavy club", target: "player" }],
        gold: 17,
        exp: 19,
        palette: ['#74d13d','#415514'],
        // --- Add animationSets for Roach sprite animations ---
        animationSets: {
            idle: [
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Idle%20Roach_frame_1.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Idle_Roach_frame_1.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Idle_Roach_frame_2.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Idle_Roach_frame_3.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Idle_Roach_frame_4.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Idle_Roach_frame_5.png"
            ],
            attack: [
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Roach%20attack%20animation%20_frame_1.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Roach_attack_animation__frame_1.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Roach_attack_animation__frame_2.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Roach_attack_animation__frame_3.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Roach_attack_animation__frame_4.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Roach_attack_animation__frame_5.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Roach_attack_animation__frame_6.png"
            ],
            death: [
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Roach%20death%20animation%20_frame_1.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Roach_death_animation__frame_1.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Roach_death_animation__frame_2.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Roach_death_animation__frame_3.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Roach_death_animation__frame_4.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Roach_death_animation__frame_5.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Roach_death_animation__frame_6.png"
            ]
        }
    },
    // --- Galactic Pirate enemy with animationSets (idle, attack, death) ---
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
        animationSets: {
            idle: [
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Space%20pirate%201_frame_1.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Space_pirate_1_frame_1.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Space_pirate_1_frame_2.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Space_pirate_1_frame_3.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Space_pirate_1_frame_4.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Space_pirate_1_frame_5.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Space_pirate_1_frame_6.png"
            ],
            attack: [
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Space%20Pirate%20attack%20_frame_1.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Space_Pirate_attack__frame_1.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Space_Pirate_attack__frame_2.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Space_Pirate_attack__frame_3.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Space_Pirate_attack__frame_4.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Space_Pirate_attack__frame_5.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Space_Pirate_attack__frame_6.png"
            ],
            death: [
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Space%20Pirate%20death_frame_1.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Space_Pirate_death_frame_1.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Space_Pirate_death_frame_2.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Space_Pirate_death_frame_3.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/frames/Space_Pirate_death_frame_4.png"
            ]
        }
    },
    // --- Karenbot enemy with animationSets (idle, attack, death) ---
    {
        id: 'karenbot',
        name: 'Karenbot',
        stats: { hp: 40, mp: 0, attack: 15, defense: 8, speed: 9 },
        skills: [
            { name: 'Complain', mp: 0, power: 1.2, desc: "A loud, disruptive complaint", target: "player" },
            { name: 'Demand Manager', mp: 0, power: 1.5, desc: "Summons the power of escalation", target: "player" }
        ],
        gold: 25,
        exp: 30,
        palette: ['#e6b2f7','#a84c71'],
        animationSets: {
            idle: [
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/7e8b3c7d-5e2a-4b3c-9d2a-7c5b1e1b2d1e/library/frames/Karenbot_idle_1.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/7e8b3c7d-5e2a-4b3c-9d2a-7c5b1e1b2d1e/library/frames/Karenbot_idle_2.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/7e8b3c7d-5e2a-4b3c-9d2a-7c5b1e1b2d1e/library/frames/Karenbot_idle_3.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/7e8b3c7d-5e2a-4b3c-9d2a-7c5b1e1b2d1e/library/frames/Karenbot_idle_4.png"
            ],
            attack: [
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/7e8b3c7d-5e2a-4b3c-9d2a-7c5b1e1b2d1e/library/frames/Karenbot_attack_1.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/7e8b3c7d-5e2a-4b3c-9d2a-7c5b1e1b2d1e/library/frames/Karenbot_attack_2.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/7e8b3c7d-5e2a-4b3c-9d2a-7c5b1e1b2d1e/library/frames/Karenbot_attack_3.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/7e8b3c7d-5e2a-4b3c-9d2a-7c5b1e1b2d1e/library/frames/Karenbot_attack_4.png"
            ],
            death: [
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/7e8b3c7d-5e2a-4b3c-9d2a-7c5b1e1b2d1e/library/frames/Karenbot_death_1.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/7e8b3c7d-5e2a-4b3c-9d2a-7c5b1e1b2d1e/library/frames/Karenbot_death_2.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/7e8b3c7d-5e2a-4b3c-9d2a-7c5b1e1b2d1e/library/frames/Karenbot_death_3.png",
                "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/7e8b3c7d-5e2a-4b3c-9d2a-7c5b1e1b2d1e/library/frames/Karenbot_death_4.png"
            ]
        }
    }
];

window.Enemy = Enemy;
window.EnemyData = EnemyData;