class UIManager {
    constructor() {
        this.overlay = document.getElementById('ui-overlay');
        this.menuUI = new MenuUI(this.overlay);
        this.hud = new HUD(this.overlay);
    }
    showDialogue(lines, onClose) {
        let idx = 0;
        let next = () => {
            if (idx < lines.length) {
                this.menuUI.showMenu({
                    html: `<div class="ui-title">Dialogue</div><div class="ui-section">${lines[idx]}</div>`,
                    buttons: [{ label: idx === lines.length-1 ? 'Close' : 'Next', onClick: () => { idx++; next(); } }]
                });
            } else {
                this.menuUI.closeMenu();
                onClose && onClose();
            }
        };
        next();
    }
    showGameOver(onRestart) {
        this.menuUI.showMenu({
            html: `<div class="ui-title">Game Over</div><div class="ui-section">Your journey ends here.</div>`,
            buttons: [{
                label: 'Restart',
                className: 'danger',
                onClick: () => {
                    this.menuUI.closeMenu();
                    if (typeof onRestart === "function") onRestart();
                }
            }]
        });
    }
    showVictory(onRestart) {
        this.menuUI.showMenu({
            html: `<div class="ui-title">Victory!</div><div class="ui-section">You have triumphed!</div>`,
            buttons: [{
                label: 'Restart',
                className: 'success',
                onClick: () => {
                    this.menuUI.closeMenu();
                    if (typeof onRestart === "function") onRestart();
                }
            }]
        });
    }
    showBattleMenu(actions, onSelect) {
        this.menuUI.showMenu({
            html: `<div class="ui-title">Choose Action</div>`,
            list: actions.map(a => ({ label: a })),
            selected: 0,
            onSelect: onSelect
        });
    }
    showInventory(items, onSelect, onClose) {
        this.menuUI.showMenu({
            html: `<div class="ui-title">Inventory</div>`,
            list: items.map(it => ({ label: it.name })),
            selected: 0,
            onSelect: onSelect,
            buttons: [{ label: "Close", onClick: onClose }]
        });
    }
    showMessage(msg, onClose) {
        this.menuUI.showMenu({
            html: `<div class="ui-title">Message</div><div class="ui-section">${msg}</div>`,
            buttons: [{ label: 'OK', onClick: onClose }]
        });
    }
    showHUD(player, enemy=null) {
        this.hud.render(player, enemy);
    }
    clearHUD() {
        this.hud.clear();
    }
    closeAll() {
        this.menuUI.closeMenu();
        this.clearHUD();
    }
}
window.UIManager = UIManager;