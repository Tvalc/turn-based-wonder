class GameManager {
    constructor(canvas, overlay) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.overlay = overlay;
        this.rng = new SeededRNG(Date.now());
        this.stateManager = new StateManager();
        this.inputSystem = new InputSystem();
        this.physicsSystem = new PhysicsSystem();
        this.renderSystem = new RenderSystem(this.ctx);
        this.uiManager = new UIManager();
        this.sceneManager = new SceneManager(this.stateManager);

        this.player = null;
        this.npcs = [];
        this.items = [];
        this.map = null;
        this.effects = [];
        this.battle = {
            enemy: null,
            turn: 'player-turn',
            anim: null
        };
        this.lastRender = 0;
        this.moveDelay = 0;
        this.menuOpen = false; // Track if menu is open
        this.menuTab = 0; // Track current tab in menu

        // --- Collision Edit Mode ---
        this.collisionEditMode = false;
        this.collisionEditMap = null; // 2D array, same size as map
        this._collisionEditExportPanel = null;

        // --- Collision Grid Toggle ---
        this.collisionGridVisible = false;

        // --- Grid Key Toggle ([) ---
        this._gridKeyDown = false; // Track if [ is held

        // --- Custom collision map for first scene ---
        this._firstSceneCollisionMap = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1],
            [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1]
        ];

        this.init();
        this._setupMenuKeyListener();
        this._setupCollisionEditListener();
        this._setupGridKeyListener(); // NEW: setup [ key listener
    }

    init() {
        this.initOverworld();
        this.sceneManager.registerScene('overworld', { render: () => this.renderOverworld(), update: dt => this.updateOverworld(dt) });
        this.sceneManager.registerScene('battle', { render: () => this.renderBattle(), update: dt => this.updateBattle(dt) });
        this.sceneManager.registerScene('menu', { render: () => {}, update: dt => {} });
        this.sceneManager.registerScene('gameover', { render: () => { this.renderSystem.ctx.clearRect(0,0,1280,960); }, update: dt => {} });
        this.sceneManager.registerScene('victory', { render: () => { this.renderSystem.ctx.clearRect(0,0,1280,960); }, update: dt => {} });
    }

    initOverworld() {
        // --- Use custom collision map for first scene ---
        const theme = this.rng.pick(GameConstants.overworldThemes);
        this.map = this.generateMap(theme, true); // true = use custom collision map for first scene

        // --- Spawn player at (8,10) ---
        let playerPos = { x: 8, y: 10 };

        this.player = new Player({
            name: GameConfig.playerName,
            x: playerPos.x,
            y: playerPos.y,
            stats: Object.assign({}, GameConfig.initialStats),
            skills: GameConfig.skills.slice(),
            weapon: EquipmentData[0],
            shield: EquipmentData[1]
        });

        // Place NPCs in walkable spots (not on collision)
        let npcSpots = this._findNPCWalkableTiles(this._firstSceneCollisionMap, 2, [playerPos]);
        // Assign NPC positions
        let npcDatas = NPCData.map((d, i) => {
            let pos = npcSpots[i] || { x: 1 + i, y: 1 };
            return Object.assign({}, d, { x: pos.x, y: pos.y });
        });
        this.npcs = npcDatas.map(d => new NPC(d));

        // Place the item in a walkable spot not occupied by player or NPCs
        let itemSpot = this._findFirstWalkableTile(this._firstSceneCollisionMap, [playerPos, ...npcSpots]);
        this.items = [{ id: "potion", name: "Potion", x: itemSpot.x, y: itemSpot.y }];
        this.effects = [];
        // --- Reset collision edit mode on new map ---
        this.collisionEditMode = false;
        this.collisionEditMap = null;
        this._removeCollisionEditExportPanel();
        this.collisionGridVisible = false; // Hide grid on new map
    }

    // Helper: Find the first walkable tile (0) in the collision map, not in exclude list
    _findFirstWalkableTile(collisionMap, exclude=[]) {
        for (let y = 0; y < collisionMap.length; ++y) {
            for (let x = 0; x < collisionMap[0].length; ++x) {
                if (collisionMap[y][x] === 0 && !exclude.some(e => e.x === x && e.y === y)) {
                    return { x, y };
                }
            }
        }
        // Fallback
        return { x: 1, y: 1 };
    }

    // Helper: Find N walkable tiles for NPCs, not in exclude list
    _findNPCWalkableTiles(collisionMap, count, exclude=[]) {
        let spots = [];
        for (let y = 0; y < collisionMap.length; ++y) {
            for (let x = 0; x < collisionMap[0].length; ++x) {
                if (collisionMap[y][x] === 0 && !exclude.some(e => e.x === x && e.y === y)) {
                    spots.push({ x, y });
                    if (spots.length >= count) return spots;
                }
            }
        }
        // Fallbacks
        while (spots.length < count) spots.push({ x: 1 + spots.length, y: 1 });
        return spots;
    }

    generateMap(theme, useFirstSceneCollisionMap = false) {
        const cols = GameConstants.overworldCols, rows = GameConstants.overworldRows;
        let tiles = [];
        if (useFirstSceneCollisionMap) {
            // Use the custom collision map to generate tiles
            for (let y = 0; y < rows; ++y) {
                let row = [];
                for (let x = 0; x < cols; ++x) {
                    if (this._firstSceneCollisionMap[y][x] === 1) {
                        row.push('wall');
                    } else {
                        row.push('grass');
                    }
                }
                tiles.push(row);
            }
        } else {
            // Default procedural generation (not used for first scene)
            for (let y=0; y<rows; ++y) {
                let row = [];
                for (let x=0; x<cols; ++x) {
                    if (x === 0 || y === 0 || x === cols-1 || y === rows-1) row.push('wall');
                    else if (this.rng.chance(0.07) && (x > 2 && y > 2 && x < cols-3 && y < rows-3)) row.push('mountain');
                    else if (this.rng.chance(0.07)) row.push('water');
                    else row.push('grass');
                }
                tiles.push(row);
            }
        }
        return {
            theme, cols, rows, width: cols*GameConstants.tileSize, height: rows*GameConstants.tileSize,
            tiles,
            isWalkable: function(x, y) {
                if (x<0 || y<0 || x>=cols || y>=rows) return false;
                let t = tiles[y][x];
                // --- Collision edit mode override ---
                if (window.gameManager && window.gameManager.collisionEditMode && window.gameManager.collisionEditMap) {
                    if (window.gameManager.collisionEditMap[y] && typeof window.gameManager.collisionEditMap[y][x] !== "undefined") {
                        return !window.gameManager.collisionEditMap[y][x];
                    }
                }
                return !(t === 'wall' || t === 'water' || t === 'mountain');
            }
        };
    }

    gameLoop(ts) {
        let dt = ts - this.lastRender;
        this.lastRender = ts;
        let scene = this.sceneManager.getCurrentScene();
        if (scene && scene.update) scene.update(dt);
        if (scene && scene.render) scene.render();
        requestAnimationFrame(t => this.gameLoop(t));
    }

    renderOverworld() {
        // Pass grid/collision info to renderSystem
        // --- Only show grid overlay if collisionEditMode OR collisionGridVisible OR [ is held ---
        let showGrid = this.collisionEditMode || this.collisionGridVisible || this._gridKeyDown;
        this.renderSystem.renderOverworld(
            this.map,
            this.player,
            this.npcs,
            this.items,
            this.effects,
            this.collisionEditMode,
            this.collisionEditMap,
            showGrid // Only show grid if edit mode, toggle, or [ is held
        );
        // Only show HUD if menu is not open
        if (!this.menuOpen && !this.collisionEditMode) {
            this.uiManager.showHUD(this.player);
        } else {
            this.uiManager.clearHUD();
        }
    }

    updateOverworld(dt) {
        // If menu is open, block gameplay input
        if (this.menuOpen || this.uiManager.menuUI.currentMenu || this.collisionEditMode) return; // Menu/dialogue/collision edit open
        if (this.moveDelay > 0) {
            this.moveDelay -= dt;
            return;
        }
        let dir = null;
        if (this.inputSystem.isDown('ArrowUp')) dir = 'up';
        else if (this.inputSystem.isDown('ArrowDown')) dir = 'down';
        else if (this.inputSystem.isDown('ArrowLeft')) dir = 'left';
        else if (this.inputSystem.isDown('ArrowRight')) dir = 'right';
        if (dir) {
            let dx = 0, dy = 0;
            if (dir === 'up') dy = -1;
            if (dir === 'down') dy = 1;
            if (dir === 'left') dx = -1;
            if (dir === 'right') dx = 1;
            let tx = this.player.x + dx, ty = this.player.y + dy;
            if (!CollisionSystem.isColliding(tx, ty, this.npcs, this.items, this.map)) {
                this.player.direction = dir;
                this.player.move(dx, dy, this.map);
                this.moveDelay = GameConstants.playerMoveDelay;
                if (this.rng.chance(GameConstants.encounterChance)) {
                    this.startBattle();
                    return;
                }
            }
        } else if (this.inputSystem.consumeKey(' ')) {
            // Attempt NPC interaction
            let facing = this.player.direction;
            let d = GameConstants.directions.find(d=>d.name===facing);
            let tx = this.player.x + d.x, ty = this.player.y + d.y;
            let npc = CollisionSystem.findNPCAt(tx, ty, this.npcs);
            if (npc) {
                this.uiManager.showDialogue(npc.dialogue, () => this.uiManager.menuUI.closeMenu());
                this.moveDelay = 120;
                return;
            }
            // Attempt pickup item
            let itemInfo = CollisionSystem.findItemAt(tx, ty, this.items);
            if (itemInfo) {
                this.player.inventory.push({ id: itemInfo.item.id, name: itemInfo.item.name });
                this.items.splice(itemInfo.idx, 1);
                this.uiManager.showMessage(`You picked up a ${itemInfo.item.name}!`, () => this.uiManager.menuUI.closeMenu());
                this.moveDelay = 120;
                return;
            }
        } else if (this.inputSystem.consumeKey('i')) {
            // Inventory
            if (this.player.inventory.length)
                this.uiManager.showInventory(this.player.inventory, idx => {
                    let item = this.player.inventory[idx];
                    this.useItem(item, idx);
                }, () => this.uiManager.menuUI.closeMenu());
            else
                this.uiManager.showMessage("Inventory is empty.", () => this.uiManager.menuUI.closeMenu());
        }
    }

    useItem(item, idx) {
        if (item.id === 'potion') {
            this.player.heal(20);
        } else if (item.id === 'ether') {
            this.player.restoreMP(10);
        } // Add more logic for other items
        this.player.inventory.splice(idx, 1);
        this.uiManager.menuUI.closeMenu();
    }

    startBattle() {
        let enemyData = this.rng.pick(EnemyData);
        this.battle.enemy = new Enemy(enemyData);
        this.battle.turn = 'player-turn';
        this.battle.anim = null;
        this.stateManager.setState('battle');
        this.uiManager.closeAll();
    }

    renderBattle() {
        let time = performance.now();
        this.renderSystem.renderBattleBackground(this.battle.turn, time);
        this.renderSystem.renderBattleEntities(this.player, this.battle.enemy, this.battle.anim);
        this.uiManager.showHUD(this.player, this.battle.enemy);
        // Battle menu/overlay handled in updateBattle
    }

    updateBattle(dt) {
        if (this.uiManager.menuUI.currentMenu) return;
        if (!this.player.stats.hp || this.player.stats.hp <= 0) {
            this.endGame(false);
            return;
        }
        if (!this.battle.enemy.stats.hp || this.battle.enemy.stats.hp <= 0) {
            this.winBattle();
            return;
        }
        if (this.battle.turn === 'player-turn') {
            this.uiManager.showBattleMenu(GameConstants.actions, actIdx => this.handlePlayerAction(actIdx));
            this.battle.turn = 'wait-player-action';
        } else if (this.battle.turn === 'wait-player-action') {
            // Wait for action selection
        } else if (this.battle.turn === 'enemy-turn') {
            this.handleEnemyAction();
        } else if (this.battle.turn === 'anim') {
            // Wait for animation to finish
        }
    }

    async handlePlayerAction(actIdx) {
        this.uiManager.menuUI.closeMenu();
        let action = GameConstants.actions[actIdx];
        if (action === 'Attack') {
            await this.doBattleAttack(this.player, this.battle.enemy, 'player');
            if (this.battle.enemy.stats.hp > 0) {
                this.battle.turn = 'enemy-turn';
            }
        } else if (action === 'Skill') {
            // Show skills menu
            this.uiManager.menuUI.showMenu({
                html: `<div class="ui-title">Choose Skill</div>`,
                list: this.player.skills.map(s => ({ label: `${s.name} (${s.mp} MP)` })),
                selected: 0,
                onSelect: async (idx) => {
                    let skill = this.player.skills[idx];
                    if (this.player.stats.mp < skill.mp) {
                        this.uiManager.showMessage("Not enough MP!", () => this.uiManager.menuUI.closeMenu());
                        return;
                    }
                    this.player.stats.mp -= skill.mp;
                    await this.doBattleAttack(this.player, this.battle.enemy, 'player', skill);
                    if (this.battle.enemy.stats.hp > 0) {
                        this.battle.turn = 'enemy-turn';
                    }
                },
                buttons: [{ label: "Back", onClick: () => this.uiManager.menuUI.closeMenu() }]
            });
            this.battle.turn = 'wait-player-action';
            return;
        } else if (action === 'Item') {
            if (this.player.inventory.length)
                this.uiManager.showInventory(this.player.inventory, async (idx) => {
                    let item = this.player.inventory[idx];
                    this.useItem(item, idx);
                    this.battle.turn = 'enemy-turn';
                }, () => this.uiManager.menuUI.closeMenu());
            else
                this.uiManager.showMessage("Inventory is empty.", () => this.uiManager.menuUI.closeMenu());
            this.battle.turn = 'wait-player-action';
            return;
        } else if (action === 'Defend') {
            // Reduce next damage
            this.player.isDefending = true;
            this.battle.turn = 'enemy-turn';
        } else if (action === 'Run') {
            if (this.rng.chance(0.5)) {
                this.uiManager.showMessage("You escaped!", () => {
                    this.stateManager.setState('overworld');
                    this.uiManager.menuUI.closeMenu();
                });
            } else {
                this.uiManager.showMessage("Couldn't escape!", () => this.uiManager.menuUI.closeMenu());
                this.battle.turn = 'enemy-turn';
            }
        }
        if (this.battle.turn === 'enemy-turn') {
            await wait(320);
        }
    }

    async doBattleAttack(attacker, defender, side, skill = null) {
        let atk = attacker.getAttack ? attacker.getAttack() : attacker.stats.attack;
        let def = defender.getDefense ? defender.getDefense() : defender.stats.defense;
        let pow = skill ? skill.power : 1.0;
        let dmg = Math.max(1, Math.floor(atk * pow - def));

        // --- Reduce enemy damage to player ---
        if (side === 'enemy') {
            dmg = Math.ceil(dmg * 0.25); // Enemies deal only 1/4 damage (was 1/3)
            if (defender.isDefending) {
                dmg = Math.floor(dmg / 2);
                defender.isDefending = false;
            }
        }

        // --- Make player 1-shot kill all enemies for testing ---
        if (side === 'player') {
            dmg = Math.max(defender.stats.hp, 1); // Always deal at least as much as enemy's current HP
        }

        defender.stats.hp = Math.max(0, defender.stats.hp - dmg);
        this.battle.anim = { type: "hurt", target: side === 'player' ? 'enemy' : 'player', start: Date.now() };
        if (side === 'player') shakeCanvas(this.canvas, 9, 180);
        await wait(GameConstants.battleAnimTime);
        this.battle.anim = null;
    }

    async handleEnemyAction() {
        let skill = this.rng.pick(this.battle.enemy.skills);
        await this.doBattleAttack(this.battle.enemy, this.player, 'enemy', skill);
        this.battle.turn = 'player-turn';
    }

    winBattle() {
        let enemy = this.battle.enemy;
        let exp = enemy.exp, gold = enemy.gold;
        let leveled = this.player.gainExp(exp);
        this.player.gold += gold;
        this.uiManager.showMessage(
            `Victory!<br>Gained ${exp} EXP, ${gold} Gold.${leveled?'<br><b>Level Up!</b>':''}`,
            () => {
                this.stateManager.setState('overworld');
                this.uiManager.menuUI.closeMenu();
            }
        );
    }

    endGame(won) {
        if (won) this.stateManager.setState('victory');
        else this.stateManager.setState('gameover');
        this.uiManager.closeAll();
        setTimeout(() => {
            if (won) this.uiManager.showVictory(() => this.restartGame());
            else this.uiManager.showGameOver(() => this.restartGame());
        }, 200);
    }

    restartGame() {
        this.uiManager.closeAll();
        this.initOverworld();
        this.stateManager.setState('overworld');
    }

    // --- MENU KEY HANDLING AND MENU LOGIC ---
    _setupMenuKeyListener() {
        window.addEventListener('keydown', (e) => {
            // Only in overworld and not in battle/dialogue/other menu
            if (this.stateManager.getState() !== 'overworld') return;
            if (this.uiManager.menuUI.currentMenu) return;
            if (e.key === 'm' || e.key === 'M') {
                if (!this.menuOpen) {
                    this.openMainMenu();
                } else {
                    this.closeMainMenu();
                }
            }
        });
    }

    openMainMenu() {
        this.menuOpen = true;
        this.menuTab = 0;
        this._showMainMenuTab(this.menuTab);
    }

    closeMainMenu() {
        this.menuOpen = false;
        this.uiManager.menuUI.closeMenu();
    }

    _showMainMenuTab(tabIdx) {
        const tabs = [
            { name: "Character", render: () => this._renderCharacterTab() },
            { name: "Equipment", render: () => this._renderEquipmentTab() },
            { name: "Inventory", render: () => this._renderInventoryTab() },
            { name: "Skills", render: () => this._renderSkillsTab() },
            { name: "Spells", render: () => this._renderSpellsTab() }
        ];
        this.menuTab = clamp(tabIdx, 0, tabs.length-1);

        // Tab bar
        let tabBarHtml = `<ul class="ui-list horizontal" style="margin-bottom:14px;">`;
        for (let i = 0; i < tabs.length; ++i) {
            tabBarHtml += `<li class="${i === this.menuTab ? 'selected' : ''}" data-tab="${i}" tabindex="0">${tabs[i].name}</li>`;
        }
        tabBarHtml += `</ul>`;

        // Content
        let contentHtml = tabs[this.menuTab].render();

        // Buttons
        let buttons = [
            { label: "Close (M)", onClick: () => this.closeMainMenu() }
        ];

        // Show menu
        this.uiManager.menuUI.showMenu({
            html: `<div class="ui-title">Menu</div>${tabBarHtml}<div class="ui-section" style="min-height:180px;text-align:left;">${contentHtml}</div>`,
            buttons,
        });

        // Add tab click handlers
        let panel = this.uiManager.menuUI.menuStack[this.uiManager.menuUI.menuStack.length-1];
        if (panel) {
            let tabEls = panel.querySelectorAll('ul.ui-list.horizontal li');
            tabEls.forEach(el => {
                el.onclick = (e) => {
                    let idx = parseInt(el.getAttribute('data-tab'), 10);
                    if (idx !== this.menuTab) {
                        this._showMainMenuTab(idx);
                    }
                };
            });
            // Keyboard navigation for tabs (left/right)
            panel.onkeydown = (e) => {
                if (e.key === "ArrowLeft") {
                    let next = (this.menuTab - 1 + tabs.length) % tabs.length;
                    this._showMainMenuTab(next);
                    e.preventDefault();
                } else if (e.key === "ArrowRight") {
                    let next = (this.menuTab + 1) % tabs.length;
                    this._showMainMenuTab(next);
                    e.preventDefault();
                } else if (e.key === "m" || e.key === "M" || e.key === "Escape") {
                    this.closeMainMenu();
                    e.preventDefault();
                }
            };
        }
    }

    // --- TAB CONTENT RENDERERS ---
    _renderCharacterTab() {
        const p = this.player;
        let html = `
            <b>Name:</b> ${p.name}<br>
            <b>Level:</b> ${p.level}<br>
            <b>HP:</b> ${p.stats.hp} / ${p.maxStats.hp}<br>
            <b>MP:</b> ${p.stats.mp} / ${p.maxStats.mp}<br>
            <b>EXP:</b> ${p.exp} / ${p.calcExpToLevel()}<br>
            <b>Gold:</b> ${p.gold}<br>
            <b>Attack:</b> ${p.getAttack()}<br>
            <b>Defense:</b> ${p.getDefense()}<br>
            <b>Speed:</b> ${p.maxStats.speed}<br>
        `;
        return html;
    }

    _renderEquipmentTab() {
        const p = this.player;
        let html = `
            <b>Weapon:</b> ${p.equipment.weapon ? p.equipment.weapon.name : 'None'}<br>
            <span style="font-size:0.95em;color:#aaa;">${p.equipment.weapon ? p.equipment.weapon.desc : ''}</span><br>
            <b>Shield:</b> ${p.equipment.shield ? p.equipment.shield.name : 'None'}<br>
            <span style="font-size:0.95em;color:#aaa;">${p.equipment.shield ? p.equipment.shield.desc : ''}</span><br>
        `;
        return html;
    }

    _renderInventoryTab() {
        const p = this.player;
        if (!p.inventory.length) {
            return `<i>Inventory is empty.</i>`;
        }
        let html = `<ul style="padding-left:0;margin:0;">`;
        for (let i = 0; i < p.inventory.length; ++i) {
            let item = p.inventory[i];
            let itemData = ItemData.find(it => it.id === item.id) || {};
            html += `<li style="margin-bottom:6px;">
                <b>${item.name}</b>
                <span style="font-size:0.95em;color:#aaa;">${itemData.desc ? ' - ' + itemData.desc : ''}</span>
            </li>`;
        }
        html += `</ul>`;
        return html;
    }

    _renderSkillsTab() {
        const p = this.player;
        if (!p.skills.length) {
            return `<i>No skills learned.</i>`;
        }
        let html = `<ul style="padding-left:0;margin:0;">`;
        for (let i = 0; i < p.skills.length; ++i) {
            let s = p.skills[i];
            html += `<li style="margin-bottom:6px;">
                <b>${s.name}</b> <span style="color:#3cf9f9;">(MP: ${s.mp})</span>
                <span style="font-size:0.95em;color:#aaa;"> - ${s.desc}</span>
            </li>`;
        }
        html += `</ul>`;
        return html;
    }

    _renderSpellsTab() {
        // For now, spells = skills with mp > 0
        const p = this.player;
        let spells = p.skills.filter(s => s.mp > 0);
        if (!spells.length) {
            return `<i>No spells learned.</i>`;
        }
        let html = `<ul style="padding-left:0;margin:0;">`;
        for (let i = 0; i < spells.length; ++i) {
            let s = spells[i];
            html += `<li style="margin-bottom:6px;">
                <b>${s.name}</b> <span style="color:#3cf9f9;">(MP: ${s.mp})</span>
                <span style="font-size:0.95em;color:#aaa;"> - ${s.desc}</span>
            </li>`;
        }
        html += `</ul>`;
        return html;
    }

    // --- COLLISION EDITOR ---
    _setupCollisionEditListener() {
        window.addEventListener('keydown', (e) => {
            // Only in overworld, not in menu, not in battle, not already editing
            if (e.key === ']' && this.stateManager.getState() === 'overworld' && !this.menuOpen && !this.uiManager.menuUI.currentMenu && !this.collisionEditMode) {
                this._enterCollisionEditMode();
            }
            // --- Grid toggle ---
            if (e.key === ']' && this.stateManager.getState() === 'overworld' && !this.menuOpen && !this.uiManager.menuUI.currentMenu && !this.collisionEditMode) {
                // Already handled above, but also toggle grid
                this.collisionGridVisible = !this.collisionGridVisible;
            }
            // If in edit mode, pressing ']' again just toggles grid
            if (e.key === ']' && this.collisionEditMode) {
                this.collisionGridVisible = !this.collisionGridVisible;
            }
        });

        // Mouse click on canvas for toggling collision
        this.canvas.addEventListener('mousedown', (e) => {
            if (!this.collisionEditMode || !this.collisionEditMap) return;
            // Get mouse position relative to canvas
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const tileSize = GameConstants.tileSize;
            const x = Math.floor(mx / tileSize);
            const y = Math.floor(my / tileSize);
            if (x >= 0 && y >= 0 && y < this.collisionEditMap.length && x < this.collisionEditMap[0].length) {
                // Toggle collision
                this.collisionEditMap[y][x] = !this.collisionEditMap[y][x];
            }
        });
    }

    _enterCollisionEditMode() {
        // Create collision map: 2D array, true = blocked, false = walkable
        const rows = this.map.rows, cols = this.map.cols;
        // If already have a map, keep it; else, generate from current map
        if (!this.collisionEditMap) {
            this.collisionEditMap = [];
            for (let y = 0; y < rows; ++y) {
                let row = [];
                for (let x = 0; x < cols; ++x) {
                    // Blocked if not walkable
                    row.push(!this.map.isWalkable(x, y));
                }
                this.collisionEditMap.push(row);
            }
        }
        this.collisionEditMode = true;
        this.collisionGridVisible = true; // Always show grid in edit mode
        this._showCollisionEditExportPanel();
    }

    _exitCollisionEditMode() {
        this.collisionEditMode = false;
        this.collisionGridVisible = false;
        this._removeCollisionEditExportPanel();
    }

    _showCollisionEditExportPanel() {
        this._removeCollisionEditExportPanel();
        // Create a floating export panel
        const panel = document.createElement('div');
        panel.className = 'ui-panel';
        // --- MOVE PANEL TO THE SAME SPOT AS THE HUD ---
        // We'll position the panel below the canvas, centered horizontally, just like the HUD.
        panel.style.position = 'fixed';
        panel.style.left = '50%';
        panel.style.right = 'unset';
        panel.style.top = 'unset';
        panel.style.bottom = 'unset';
        panel.style.transform = 'translate(-50%, 0)';
        panel.style.zIndex = 3000;
        panel.style.minWidth = '320px';
        panel.style.maxWidth = '600px';
        panel.style.pointerEvents = 'auto';
        // Add a custom class for styling if needed
        panel.classList.add('collision-edit-panel');
        panel.innerHTML = `
            <div class="ui-title">Collision Edit Mode</div>
            <div class="ui-section" style="font-size:1.02em;">
                Click tiles to toggle collision.<br>
                <b>Red = blocked, Green = walkable.</b><br>
                <br>
                <button id="collision-export-btn" class="ui-btn" style="margin:8px 0 0 0;">Export Collision Map</button>
                <button id="collision-exit-btn" class="ui-btn" style="margin:8px 0 0 8px;">Exit Edit Mode</button>
            </div>
        `;
        document.body.appendChild(panel);
        this._collisionEditExportPanel = panel;

        // Position the panel below the canvas, just like the HUD
        setTimeout(() => {
            const gameContainer = document.getElementById('game-container');
            if (gameContainer && panel) {
                const rect = gameContainer.getBoundingClientRect();
                // Place panel 18px below the canvas (same as HUD)
                panel.style.top = (rect.bottom + 18) + 'px';
                panel.style.left = (rect.left + rect.width / 2) + 'px';
                panel.style.transform = 'translate(-50%, 0)';
                panel.style.position = 'fixed';
                panel.style.zIndex = '3000';
                panel.style.width = 'auto';
            }
        }, 0);

        // Export button
        const exportBtn = panel.querySelector('#collision-export-btn');
        exportBtn.onclick = () => {
            this._exportCollisionMapToConsole();
        };
        // Exit button
        const exitBtn = panel.querySelector('#collision-exit-btn');
        exitBtn.onclick = () => {
            this._exitCollisionEditMode();
        };
    }

    _removeCollisionEditExportPanel() {
        if (this._collisionEditExportPanel && this._collisionEditExportPanel.parentNode) {
            this._collisionEditExportPanel.parentNode.removeChild(this._collisionEditExportPanel);
        }
        this._collisionEditExportPanel = null;
    }

    _exportCollisionMapToConsole() {
        if (!this.collisionEditMap) return;
        // Export as a 2D array of 0/1 (1 = blocked, 0 = walkable)
        const arr = this.collisionEditMap.map(row => row.map(cell => cell ? 1 : 0));
        // Pretty print for copy-paste
        const str = JSON.stringify(arr, null, 2);
        console.log("=== COLLISION MAP EXPORT ===");
        console.log(str);
        alert("Collision map exported to console!");
    }

    // --- GRID KEY LISTENER ([) ---
    _setupGridKeyListener() {
        window.addEventListener('keydown', (e) => {
            if (e.key === '[') {
                this._gridKeyDown = true;
            }
        });
        window.addEventListener('keyup', (e) => {
            if (e.key === '[') {
                this._gridKeyDown = false;
            }
        });
        // Defensive: on window blur, clear flag
        window.addEventListener('blur', () => {
            this._gridKeyDown = false;
        });
    }
}
window.GameManager = GameManager;