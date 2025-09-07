class HUD {
    constructor(uiRoot) {
        this.uiRoot = uiRoot;
        this.hudDiv = null;
    }
    render(player, enemy=null) {
        // Only show HUD if not blocked by menu (menuOpen is set on window.gameManager)
        if (window.gameManager && window.gameManager.menuOpen) {
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
        this.hudDiv.appendChild(pPanel);
        // Enemy panel (battle)
        if (enemy) {
            let ePanel = document.createElement('div');
            ePanel.className = 'hud-panel';
            ePanel.innerHTML = `<div class="hud-label">${enemy.name}</div>`;
            let hpBar = this.makeBar('hp', enemy.stats.hp, enemy.maxStats.hp, "HP");
            ePanel.appendChild(hpBar);
            this.hudDiv.appendChild(ePanel);
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