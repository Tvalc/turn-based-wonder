class MenuUI {
    constructor(uiRoot) {
        this.uiRoot = uiRoot;
        this.menuStack = [];
        this.currentMenu = null;
        this._keydownHandler = null;

        // --- Drag state for menu panels ---
        this._dragInfo = null;
    }

    showMenu(menuObj) {
        this.closeMenu();
        this.currentMenu = menuObj;
        let div = document.createElement('div');
        div.className = 'ui-panel';

        // --- Battle menu: move to bottom third and horizontal layout ---
        // Detect if this is the battle menu by html/title
        let isBattleMenu = false;
        if (menuObj.html && menuObj.html.indexOf('Choose Action') !== -1 && menuObj.list && menuObj.list.length === 5) {
            isBattleMenu = true;
            div.classList.add('battle-menu-panel');
        }

        div.tabIndex = 0;
        div.innerHTML = menuObj.html;
        let ul = null;
        let listEls = [];
        let selected = typeof menuObj.selected === 'number' ? menuObj.selected : 0;

        // Buttons
        if (menuObj.buttons) {
            menuObj.buttons.forEach(btn => {
                let b = document.createElement('button');
                b.textContent = btn.label;
                b.className = 'ui-btn' + (btn.className ? ' '+btn.className : '');
                b.onclick = () => { btn.onClick && btn.onClick(); };
                // Ensure button is always clickable
                b.disabled = false;
                b.tabIndex = 0;
                b.style.pointerEvents = 'auto';
                div.appendChild(b);
            });
        }

        // List (menu options)
        if (menuObj.list) {
            ul = document.createElement('ul');
            ul.className = 'ui-list';
            // --- Horizontal layout for battle menu ---
            if (isBattleMenu) {
                ul.classList.add('horizontal');
            }
            menuObj.list.forEach((li, i) => {
                let el = document.createElement('li');
                el.textContent = li.label;
                if (i === selected) el.classList.add('selected');
                el.tabIndex = 0;
                el.onclick = () => { 
                    this._removeKeyHandler();
                    menuObj.onSelect && menuObj.onSelect(i); 
                };
                // Ensure list item is always clickable
                el.style.pointerEvents = 'auto';
                ul.appendChild(el);
                listEls.push(el);
            });
            div.appendChild(ul);
        }

        // Make sure the panel allows pointer events for its children (buttons)
        div.style.pointerEvents = 'auto';

        // --- Move battle menu to below the canvas ---
        if (isBattleMenu) {
            div.style.position = 'fixed';
            div.style.top = 'unset';
            div.style.bottom = 'unset';
            div.style.left = '50%';
            div.style.transform = 'translate(-50%, 0)';
            div.style.minWidth = 'unset';
            div.style.maxWidth = 'unset';
            div.style.width = 'auto';
            div.style.padding = '24px 28px 18px 28px';
        } else {
            // --- For all other menus: move panel OUTSIDE the playable canvas area ---
            // Place menu panel below the canvas, centered horizontally
            div.style.position = 'fixed';
            // Instead of top:24px, use top based on canvas position + canvas height + spacing
            // But since the overlay is inside #game-container, we want to place the menu below #game-container
            // So we append the menu to document.body, not uiRoot, and position it below #game-container

            // We'll handle this below after appending to DOM (so we can measure #game-container)
            div.style.top = 'unset';
            div.style.bottom = 'unset';
            div.style.left = '50%';
            div.style.transform = 'translate(-50%, 0)';
            div.style.zIndex = '2000';
            div.style.pointerEvents = 'auto';
        }

        // --- DRAGGABLE MENU SUPPORT ---
        this._makeDraggable(div, isBattleMenu);

        // --- Append menu panel ---
        // All menus (including battle) are now appended to body and positioned below the canvas
        document.body.appendChild(div);

        // After appending, position below #game-container
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            const rect = gameContainer.getBoundingClientRect();
            // Place menu 24px below the canvas
            div.style.top = (rect.bottom + 24) + 'px';
            div.style.left = (rect.left + rect.width / 2) + 'px';
            div.style.transform = 'translate(-50%, 0)';
            div.style.position = 'fixed';
            div.style.zIndex = '2000';
        }

        div.focus();
        this.menuStack.push(div);

        // Keyboard navigation for lists
        if (menuObj.list && listEls.length > 0) {
            // Remove any previous handler
            this._removeKeyHandler();

            // Handler for arrow keys and enter
            this._keydownHandler = (e) => {
                if (!this.currentMenu || !this.currentMenu.list) return;
                let handled = false;
                // --- Horizontal navigation for battle menu ---
                if (isBattleMenu) {
                    if (e.key === 'ArrowLeft') {
                        selected = (selected - 1 + listEls.length) % listEls.length;
                        handled = true;
                    } else if (e.key === 'ArrowRight') {
                        selected = (selected + 1) % listEls.length;
                        handled = true;
                    }
                }
                // Vertical for others
                if (!isBattleMenu) {
                    if (e.key === 'ArrowUp') {
                        selected = (selected - 1 + listEls.length) % listEls.length;
                        handled = true;
                    } else if (e.key === 'ArrowDown') {
                        selected = (selected + 1) % listEls.length;
                        handled = true;
                    }
                }
                if (e.key === 'Enter' || e.key === ' ') {
                    this._removeKeyHandler();
                    menuObj.onSelect && menuObj.onSelect(selected);
                    handled = true;
                }
                if (handled) {
                    // Update selection
                    listEls.forEach((el, i) => {
                        if (i === selected) el.classList.add('selected');
                        else el.classList.remove('selected');
                    });
                    e.preventDefault();
                }
            };
            window.addEventListener('keydown', this._keydownHandler);
        }
    }

    // --- DRAGGABLE MENU PANEL LOGIC ---
    _makeDraggable(panel, isBattleMenu) {
        // Only make draggable if not battle menu (optional: allow for all, but battle menu is at bottom)
        // We'll allow dragging for all menus, including battle menu, for user request.
        let dragInfo = {
            dragging: false,
            offsetX: 0,
            offsetY: 0,
            origMouseX: 0,
            origMouseY: 0,
            origLeft: null,
            origTop: null
        };

        // Helper to get mouse position
        function getMousePos(e) {
            if (e.touches && e.touches.length > 0) {
                return { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
            return { x: e.clientX, y: e.clientY };
        }

        // Only drag with left mouse button
        panel.addEventListener('mousedown', (e) => {
            // Only left click
            if (e.button !== 0) return;
            // Don't start drag if clicking on a button or input
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'LI') return;
            dragInfo.dragging = true;
            let mouse = getMousePos(e);
            dragInfo.origMouseX = mouse.x;
            dragInfo.origMouseY = mouse.y;
            // Get current panel position
            // Get bounding rect relative to viewport
            let rect = panel.getBoundingClientRect();
            dragInfo.offsetX = mouse.x - rect.left;
            dragInfo.offsetY = mouse.y - rect.top;
            // Store original left/top in px
            dragInfo.origLeft = rect.left;
            dragInfo.origTop = rect.top;

            // Set panel to absolute/fixed if not already
            // Use fixed for all menus (since all are fixed by default except battle)
            panel.style.position = 'fixed';
            // Remove transform so we can set left/top directly
            panel.style.transform = 'none';
            // Set left/top to current position in px
            panel.style.left = rect.left + 'px';
            panel.style.top = rect.top + 'px';
            // Remove bottom if present (for battle menu)
            panel.style.bottom = 'unset';

            // Prevent text selection while dragging
            document.body.style.userSelect = 'none';

            e.preventDefault();
        });

        // Touch support
        panel.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            // Don't start drag if touching a button or input
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'LI') return;
            dragInfo.dragging = true;
            let mouse = getMousePos(e);
            dragInfo.origMouseX = mouse.x;
            dragInfo.origMouseY = mouse.y;
            let rect = panel.getBoundingClientRect();
            dragInfo.offsetX = mouse.x - rect.left;
            dragInfo.offsetY = mouse.y - rect.top;
            dragInfo.origLeft = rect.left;
            dragInfo.origTop = rect.top;
            panel.style.position = 'fixed';
            panel.style.transform = 'none';
            panel.style.left = rect.left + 'px';
            panel.style.top = rect.top + 'px';
            panel.style.bottom = 'unset';
            document.body.style.userSelect = 'none';
            e.preventDefault();
        }, { passive: false });

        // Mouse move
        let onMouseMove = (e) => {
            if (!dragInfo.dragging) return;
            let mouse = getMousePos(e);
            let newLeft = mouse.x - dragInfo.offsetX;
            let newTop = mouse.y - dragInfo.offsetY;

            // Clamp to viewport (keep at least 40px visible horizontally and vertically)
            let minX = 40 - panel.offsetWidth;
            let minY = 20 - panel.offsetHeight;
            let maxX = window.innerWidth - 40;
            let maxY = window.innerHeight - 20;
            newLeft = Math.max(minX, Math.min(newLeft, maxX));
            newTop = Math.max(minY, Math.min(newTop, maxY));

            panel.style.left = newLeft + 'px';
            panel.style.top = newTop + 'px';
            panel.style.right = 'unset';
            panel.style.bottom = 'unset';
            e.preventDefault();
        };

        // Touch move
        let onTouchMove = (e) => {
            if (!dragInfo.dragging) return;
            if (e.touches.length !== 1) return;
            let mouse = getMousePos(e);
            let newLeft = mouse.x - dragInfo.offsetX;
            let newTop = mouse.y - dragInfo.offsetY;

            let minX = 40 - panel.offsetWidth;
            let minY = 20 - panel.offsetHeight;
            let maxX = window.innerWidth - 40;
            let maxY = window.innerHeight - 20;
            newLeft = Math.max(minX, Math.min(newLeft, maxX));
            newTop = Math.max(minY, Math.min(newTop, maxY));

            panel.style.left = newLeft + 'px';
            panel.style.top = newTop + 'px';
            panel.style.right = 'unset';
            panel.style.bottom = 'unset';
            e.preventDefault();
        };

        // Mouse up
        let onMouseUp = (e) => {
            if (dragInfo.dragging) {
                dragInfo.dragging = false;
                document.body.style.userSelect = '';
            }
        };

        // Touch end
        let onTouchEnd = (e) => {
            if (dragInfo.dragging) {
                dragInfo.dragging = false;
                document.body.style.userSelect = '';
            }
        };

        // Attach listeners to window so drag is smooth even if mouse leaves panel
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend', onTouchEnd);

        // Clean up listeners when menu is closed
        panel._cleanupDragListeners = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
        };
    }

    _removeKeyHandler() {
        if (this._keydownHandler) {
            window.removeEventListener('keydown', this._keydownHandler);
            this._keydownHandler = null;
        }
    }
    closeMenu() {
        this._removeKeyHandler();
        while (this.menuStack.length) {
            let el = this.menuStack.pop();
            // Remove drag listeners if present
            if (el && el._cleanupDragListeners) {
                el._cleanupDragListeners();
            }
            if (el && el.parentNode) el.parentNode.removeChild(el);
        }
        this.currentMenu = null;
    }
}
window.MenuUI = MenuUI;