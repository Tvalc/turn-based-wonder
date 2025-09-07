class Item {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.effect = data.effect;
        this.desc = data.desc;
    }
}

const ItemData = [
    { id: "potion", name: "Potion", effect: { hp: 20 }, desc: "Restores 20 HP." },
    { id: "ether", name: "Ether", effect: { mp: 10 }, desc: "Restores 10 MP." },
    { id: "antidote", name: "Antidote", effect: { status: "cure" }, desc: "Cures poison." }
];

window.Item = Item;
window.ItemData = ItemData;