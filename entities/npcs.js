class NPC {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.x = data.x;
        this.y = data.y;
        this.dialogue = data.dialogue ? data.dialogue.slice() : [];
        this.palette = data.palette || ['#fff','#aaa'];
        this.quests = data.quests || [];
    }
}

const NPCData = [
    {
        id: 'villager1',
        name: 'Villager',
        x: 3,
        y: 7,
        dialogue: [
            "Welcome to our village, traveler!",
            "There are monsters around. Be careful."
        ],
        palette: ['#f7e6b2','#624c38']
    },
    {
        id: 'oldman',
        name: 'Old Man',
        x: 17,
        y: 3,
        dialogue: [
            "A treasure lies deep in the woods.",
            "They say only the bravest may find it."
        ],
        palette: ['#bfbfbf','#8a7a63']
    }
];

window.NPC = NPC;
window.NPCData = NPCData;