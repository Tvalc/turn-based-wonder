class Player {
    constructor(cfg) {
        this.name = cfg.name || 'Hero';
        this.x = cfg.x;
        this.y = cfg.y;
        this.stats = Object.assign({}, cfg.stats);
        this.maxStats = Object.assign({}, cfg.stats);
        this.level = this.stats.level;
        this.exp = this.stats.exp;
        this.gold = this.stats.gold;
        this.skills = cfg.skills ? cfg.skills.slice() : [];
        this.inventory = [];
        this.equipment = {
            weapon: cfg.weapon || null,
            shield: cfg.shield || null
        };
        this.direction = 'down';
        this.moveCooldown = 0;
        this.isActing = false;
    }
    move(dx, dy, map) {
        if (this.isActing) return false;
        let tx = this.x + dx, ty = this.y + dy;
        if (map && map.isWalkable(tx, ty)) {
            this.x = tx; this.y = ty;
            return true;
        }
        return false;
    }
    gainExp(exp) {
        this.exp += exp;
        let next = this.calcExpToLevel();
        if (this.exp >= next) {
            this.exp -= next;
            this.levelUp();
            return true;
        }
        return false;
    }
    calcExpToLevel() {
        return Math.floor(GameConstants.baseExp * Math.pow(GameConstants.expGrowth, this.level-1));
    }
    levelUp() {
        this.level++;
        this.maxStats.hp += GameConstants.statGrowth.hp;
        this.maxStats.mp += GameConstants.statGrowth.mp;
        this.maxStats.attack += GameConstants.statGrowth.attack;
        this.maxStats.defense += GameConstants.statGrowth.defense;
        this.maxStats.speed += GameConstants.statGrowth.speed;
        this.stats = Object.assign({}, this.maxStats);
        this.skills.push({ name: "Spark", mp: 7, power: 2.0, desc: "Magical spark!", target: "enemy" });
    }
    heal(n) {
        this.stats.hp = clamp(this.stats.hp + n, 0, this.maxStats.hp);
    }
    restoreMP(n) {
        this.stats.mp = clamp(this.stats.mp + n, 0, this.maxStats.mp);
    }
    equip(item) {
        if (item.attack) this.equipment.weapon = item;
        if (item.defense) this.equipment.shield = item;
    }
    getAttack() {
        let val = this.maxStats.attack;
        if (this.equipment.weapon) val += this.equipment.weapon.attack;
        return val;
    }
    getDefense() {
        let val = this.maxStats.defense;
        if (this.equipment.shield) val += this.equipment.shield.defense;
        return val;
    }
}
window.Player = Player;