class Equipment {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.attack = data.attack || 0;
        this.defense = data.defense || 0;
        this.desc = data.desc;
    }
}
const EquipmentData = [
    { id: "sword1", name: "Rusty Sword", attack: 2, desc: "A dull blade." },
    { id: "shield1", name: "Wooden Shield", defense: 2, desc: "Light, basic protection." }
];
window.Equipment = Equipment;
window.EquipmentData = EquipmentData;