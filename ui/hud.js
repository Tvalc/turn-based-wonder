class HUD {
    constructor(uiRoot) {
        this.uiRoot = uiRoot;
        this.hudDiv = null;
    }
    render(player, enemy=null) {
        // Only show HUD if not blocked by menu (menuOpen is set on window.gameManager)
        // --- Always show HUD in battle (even if menu is open), but hide in collision edit mode ---
        const inBattle = window.gameManager && window.gameManager.stateManager.getState() === 'battle';
        if (window.gameManager && window.gameManager.menuOpen && !inBattle) {
            this.clear();
            return;
        }
        if (!this.hudDiv) {
            this.hudDiv = document.createElement('div');
            this.hudDiv.className = 'ui-hud';
            // Instead of appending to overlay, append to body so we can position below canvas
            document.body.appendChild(this.hudDiv);
        }
        this.hudDiv.innerHTML = '';
        // Player panel
        let pPanel = document.createElement('div');
        pPanel.className = 'hud-panel';
        pPanel.innerHTML = `<div class="hud-label">${player.name} Lv${player.level}</div>`;
        // HP
        let hpBar = this.makeBar('hp', player.stats.hp, player.maxStats.hp, "HP");
        pPanel.appendChild(hpBar);
        // MP
        let mpBar = this.makeBar('mp', player.stats.mp, player.maxStats.mp, "MP");
        pPanel.appendChild(mpBar);
        // EXP
        let expBar = this.makeBar('exp', player.exp, player.calcExpToLevel(), "EXP");
        pPanel.appendChild(expBar);
        // Gold
        let gold = document.createElement('div');
        gold.textContent = `Gold: ${player.gold}`;
        gold.style.marginTop = '4px';
        pPanel.appendChild(gold);
        // --- Show player stats in battle as well ---
        if (inBattle) {
            // Add attack, defense, speed in battle HUD
            let statsDiv = document.createElement('div');
            statsDiv.style.fontSize = '0.93em';
            statsDiv.style.color = '#ccc';
            statsDiv.style.marginTop = '4px';
            statsDiv.innerHTML =
                `<b>ATK:</b> ${player.getAttack()} &nbsp; ` +
                `<b>DEF:</b> ${player.getDefense()} &nbsp; ` +
                `<b>SPD:</b> ${player.maxStats.speed}`;
            pPanel.appendChild(statsDiv);
        }
        // Enemy panel (battle)
        let ePanel = null;
        if (enemy) {
            ePanel = document.createElement('div');
            ePanel.className = 'hud-panel';
            ePanel.innerHTML = `<div class="hud-label">${enemy.name}</div>`;
            let hpBar = this.makeBar('hp', enemy.stats.hp, enemy.maxStats.hp, "HP");
            ePanel.appendChild(hpBar);
            // --- Show enemy stats in battle HUD ---
            let statsDiv = document.createElement('div');
            statsDiv.style.fontSize = '0.93em';
            statsDiv.style.color = '#ccc';
            statsDiv.style.marginTop = '4px';
            statsDiv.innerHTML =
                `<b>ATK:</b> ${enemy.stats.attack} &nbsp; ` +
                `<b>DEF:</b> ${enemy.stats.defense} &nbsp; ` +
                `<b>SPD:</b> ${enemy.stats.speed}`;
            ePanel.appendChild(statsDiv);
        }

        // --- Move HUD below the canvas ---
        // Wait for DOM to be ready and #game-container to exist
        setTimeout(() => {
            const gameContainer = document.getElementById('game-container');
            if (gameContainer && this.hudDiv) {
                const rect = gameContainer.getBoundingClientRect();
                // Place HUD 18px below the canvas
                this.hudDiv.style.top = (rect.bottom + 18) + 'px';
                this.hudDiv.style.left = (rect.left + rect.width / 2) + 'px';
                this.hudDiv.style.transform = 'translate(-50%, 0)';
                this.hudDiv.style.position = 'fixed';
                this.hudDiv.style.zIndex = '1010';
                this.hudDiv.style.width = 'auto';
            }
        }, 0);

        // --- BATTLE HUD LAYOUT MODIFICATION ---
        // If in battle, move HUD to the right and stack vertically (player on top, enemy below), right-aligned
        if (inBattle && enemy) {
            this.hudDiv.style.display = 'flex';
            this.hudDiv.style.flexDirection = 'column';
            this.hudDiv.style.alignItems = 'flex-end';
            this.hudDiv.style.justifyContent = 'flex-start';
            this.hudDiv.innerHTML = '';
            // Move the panels to the right by 500px (was 300px, then 200px more)
            let wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.flexDirection = 'column';
            wrapper.style.alignItems = 'flex-end';
            wrapper.style.justifyContent = 'flex-start';
            wrapper.style.position = 'relative';
            // Move right by 500px
            wrapper.style.right = '0px';
            wrapper.style.marginRight = '0px'; // Ensure no extra margin
            wrapper.style.left = '500px'; // Move the wrapper to the right by 500px
            wrapper.appendChild(pPanel);
            wrapper.appendChild(ePanel);
            this.hudDiv.appendChild(wrapper);

            // Move HUD to the right side of the screen, below the canvas
            setTimeout(() => {
                const gameContainer = document.getElementById('game-container');
                if (gameContainer && this.hudDiv) {
                    const rect = gameContainer.getBoundingClientRect();
                    // Place HUD 18px below the canvas, aligned to the right edge with a margin
                    // 32px margin from right edge of canvas, then move right by 500px more (total 532px)
                    this.hudDiv.style.top = (rect.bottom + 18) + 'px';
                    this.hudDiv.style.left = (rect.right - 32 + 500) + 'px'; // MOVED RIGHT BY 500px
                    this.hudDiv.style.transform = 'translate(0, 0)';
                    this.hudDiv.style.position = 'fixed';
                    this.hudDiv.style.zIndex = '1010';
                    this.hudDiv.style.width = 'auto';
                }
            }, 0);
        } else {
            // Overworld: default layout (horizontal, centered)
            this.hudDiv.style.display = 'flex';
            this.hudDiv.style.flexDirection = 'row';
            this.hudDiv.style.alignItems = 'center';
            this.hudDiv.style.justifyContent = 'center';
            this.hudDiv.innerHTML = '';
            this.hudDiv.appendChild(pPanel);
            if (enemy) this.hudDiv.appendChild(ePanel);
        }
    }
    makeBar(type, val, max, label) {
        let wrap = document.createElement('div');
        wrap.className = 'hud-bar ' + type;
        let inner = document.createElement('div');
        inner.className = 'hud-bar-inner';
        inner.style.width = `${clamp((val/max)*100,0,100)}%`;
        wrap.appendChild(inner);
        let txt = document.createElement('div');
        txt.style.fontSize = '0.85rem';
        txt.style.position = 'absolute';
        txt.style.marginTop = '-18px';
        txt.style.marginLeft = '8px';
        txt.style.color = '#fff';
        txt.textContent = `${label}: ${val}/${max}`;
        wrap.appendChild(txt);
        wrap.style.position = 'relative';
        return wrap;
    }
    clear() {
        if (this.hudDiv) this.hudDiv.innerHTML = '';
    }
}
window.HUD = HUD;