class RenderSystem {
    constructor(ctx) {
        this.ctx = ctx;

        // --- PLAYER IDLE SPRITE ANIMATION ---
        // List of 6 idle frame URLs
        this.playerIdleFrameURLs = [
            "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/0f84fe06-5c42-40c3-b563-1a28d18f37cc/library/frames/RPG_SR_Idle_frame_1.png",
            "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/0f84fe06-5c42-40c3-b563-1a28d18f37cc/library/frames/RPG_SR_Idle_frame_2.png",
            "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/0f84fe06-5c42-40c3-b563-1a28d18f37cc/library/frames/RPG_SR_Idle_frame_3.png",
            "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/0f84fe06-5c42-40c3-b563-1a28d18f37cc/library/frames/RPG_SR_Idle_frame_4.png",
            "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/0f84fe06-5c42-40c3-b563-1a28d18f37cc/library/frames/RPG_SR_Idle_frame_5.png",
            "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/0f84fe06-5c42-40c3-b563-1a28d18f37cc/library/frames/RPG_SR_Idle_frame_6.png"
        ];
        this.playerIdleFrames = [];
        this.playerIdleFramesLoaded = false;
        this._loadPlayerIdleFrames();

        // --- ENEMY ANIMATION FRAMES CACHE ---
        // { enemyId: { frames: [Image,...], loaded: bool } }
        this.enemyAnimationFrames = {};

        // --- Overworld background image for first scene ---
        this.firstSceneBgUrl = "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/0f84fe06-5c42-40c3-b563-1a28d18f37cc/library/RPG_BG2_1757183786053.png";
        this.firstSceneBgImg = null;
        this.firstSceneBgLoaded = false;
        this._loadFirstSceneBg();
    }

    _loadPlayerIdleFrames() {
        // Only load once
        if (this.playerIdleFramesLoaded) return;
        let loaded = 0;
        for (let i = 0; i < this.playerIdleFrameURLs.length; ++i) {
            const img = new window.Image();
            img.src = this.playerIdleFrameURLs[i];
            img.onload = () => {
                loaded++;
                if (loaded === this.playerIdleFrameURLs.length) {
                    this.playerIdleFramesLoaded = true;
                }
            };
            this.playerIdleFrames.push(img);
        }
    }

    _loadFirstSceneBg() {
        if (this.firstSceneBgImg) return;
        this.firstSceneBgImg = new window.Image();
        this.firstSceneBgImg.src = this.firstSceneBgUrl;
        this.firstSceneBgImg.onload = () => {
            this.firstSceneBgLoaded = true;
        };
    }

    // Load enemy animation frames if needed (for battle)
    _ensureEnemyFrames(enemy) {
        if (!enemy || !enemy.animationFrames) return null;
        if (!this.enemyAnimationFrames[enemy.id]) {
            // Start loading
            let frames = [];
            let loaded = 0;
            let urls = enemy.animationFrames;
            for (let i = 0; i < urls.length; ++i) {
                const img = new window.Image();
                img.src = urls[i];
                img.onload = () => {
                    loaded++;
                    if (loaded === urls.length) {
                        this.enemyAnimationFrames[enemy.id].loaded = true;
                    }
                };
                frames.push(img);
            }
            this.enemyAnimationFrames[enemy.id] = { frames, loaded: false };
        }
        return this.enemyAnimationFrames[enemy.id];
    }

    // Modified: Accept grid/collision info for rendering grid/collision overlay
    renderOverworld(map, player, npcs, items, effects, collisionEditMode, collisionEditMap, collisionGridVisible) {
        const { ctx } = this;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        this.renderBackground(map.theme, map);
        // Only render tiles if in collision edit mode or grid is visible
        if (collisionEditMode || collisionGridVisible) {
            this.renderTiles(map);
        }
        this.renderItems(map, items);
        this.renderNPCs(map, npcs);
        this.renderPlayer(map, player);
        if (effects && effects.length) {
            effects.forEach(eff => this.renderEffect(eff));
        }
        // --- Draw grid/collision overlay if requested ---
        if (collisionGridVisible) {
            this.renderGridOverlay(map, collisionEditMode, collisionEditMap);
        }
    }

    // Modified: Accept map as second argument to check for first scene
    renderBackground(theme, map) {
        const { ctx } = this;
        // If this is the first scene (player at start position), draw the custom image
        // We'll consider "first scene" as player at the default start position and map is the initial map
        // But since we don't have direct access to player here, we use a heuristic:
        // If the map is the initial overworld map (cols/rows/tileSize), we show the image
        // For robustness, always show the image in overworld (sceneManager handles other scenes)
        if (this.firstSceneBgLoaded) {
            ctx.save();
            ctx.drawImage(this.firstSceneBgImg, 0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.restore();
            return;
        }
        // Fallback: previous procedural background
        let grad = ctx.createLinearGradient(0, 0, ctx.canvas.width, ctx.canvas.height);
        if (theme === 'forest') {
            grad.addColorStop(0, "#2f4d2f");
            grad.addColorStop(1, "#539a51");
        } else if (theme === 'plains') {
            grad.addColorStop(0, "#6eaf7c");
            grad.addColorStop(1, "#e6e6c2");
        } else if (theme === 'mountain') {
            grad.addColorStop(0, "#b4b6b8");
            grad.addColorStop(1, "#6b7c8a");
        } else {
            grad.addColorStop(0, "#373d46");
            grad.addColorStop(1, "#6c7b8a");
        }
        ctx.save();
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
    }

    renderTiles(map) {
        const { ctx } = this;
        const tileSize = GameConstants.tileSize;
        for (let y = 0; y < map.rows; ++y) {
            for (let x = 0; x < map.cols; ++x) {
                let tx = x * tileSize, ty = y * tileSize;
                // Draw grass/terrain
                if (map.tiles[y][x] === 'grass') {
                    ctx.save();
                    ctx.fillStyle = "rgba(60,180,80,0.15)";
                    drawRoundedRect(ctx, tx+2, ty+2, tileSize-4, tileSize-4, 10);
                    ctx.fill();
                    ctx.restore();
                }
                if (map.tiles[y][x] === 'water') {
                    ctx.save();
                    ctx.fillStyle = "rgba(80,180,220,0.13)";
                    drawRoundedRect(ctx, tx+2, ty+2, tileSize-4, tileSize-4, 10);
                    ctx.fill();
                    ctx.restore();
                }
                if (map.tiles[y][x] === 'mountain') {
                    ctx.save();
                    ctx.fillStyle = "rgba(140,130,100,0.17)";
                    drawRoundedRect(ctx, tx+2, ty+2, tileSize-4, tileSize-4, 10);
                    ctx.fill();
                    ctx.restore();
                }
                if (map.tiles[y][x] === 'wall') {
                    ctx.save();
                    ctx.fillStyle = "rgba(70,70,70,0.25)";
                    drawRoundedRect(ctx, tx+2, ty+2, tileSize-4, tileSize-4, 10);
                    ctx.fill();
                    ctx.restore();
                }
                // Edges
                if (map.tiles[y][x] === 'edge') {
                    ctx.save();
                    ctx.strokeStyle = "rgba(0,0,0,0.1)";
                    ctx.lineWidth = 2;
                    drawRoundedRect(ctx, tx+2, ty+2, tileSize-4, tileSize-4, 10);
                    ctx.stroke();
                    ctx.restore();
                }
            }
        }
    }

    renderPlayer(map, player) {
        const { ctx } = this;
        const tileSize = GameConstants.tileSize;
        let tx = player.x * tileSize + tileSize/2, ty = player.y * tileSize + tileSize/2;

        // --- Use animated idle sprite ---
        // Animation: 6 frames, ~8 FPS (125ms per frame)
        const frameCount = 6;
        const frameDuration = 125; // ms per frame
        const now = performance.now();
        const frameIdx = Math.floor(now / frameDuration) % frameCount;

        if (this.playerIdleFramesLoaded && this.playerIdleFrames[frameIdx]) {
            // Draw shadow (make it a bit bigger)
            ctx.save();
            ctx.globalAlpha = 0.33;
            ctx.beginPath();
            ctx.ellipse(tx, ty + 20, 32, 14, 0, 0, Math.PI * 2);
            ctx.fillStyle = "#222";
            ctx.fill();
            ctx.restore();

            // Draw sprite centered
            const img = this.playerIdleFrames[frameIdx];
            // Make sprite bigger: was 48x48, now 64x64
            ctx.save();
            ctx.drawImage(img, tx - 32, ty - 40, 64, 64);
            ctx.restore();

            // Weapon overlay (if any)
            // REMOVED YELLOW LINE OVERLAY
            // if (player.equipment && player.equipment.weapon) {
            //     ctx.save();
            //     ctx.beginPath();
            //     ctx.moveTo(tx+12, ty+2);
            //     ctx.lineTo(tx+18, ty-8);
            //     ctx.lineWidth = 4;
            //     ctx.strokeStyle = "#efc453";
            //     ctx.shadowColor = "#efc453";
            //     ctx.shadowBlur = 8;
            //     ctx.stroke();
            //     ctx.restore();
            // }
        } else {
            // Fallback: old procedural circle (make it bigger)
            ctx.save();
            // Glow/shadow
            ctx.shadowColor = "#3cf9f9";
            ctx.shadowBlur = 24;
            // Body
            ctx.beginPath();
            ctx.arc(tx, ty-12, 28, 0, Math.PI*2, false);
            ctx.closePath();
            ctx.fillStyle = "url(#player-gradient)";
            // Fallback: procedural radial gradient
            let grad = ctx.createRadialGradient(tx, ty-12, 6, tx, ty-12, 28);
            grad.addColorStop(0, "#fff");
            grad.addColorStop(0.25, "#aef1e9");
            grad.addColorStop(0.7, "#3cf9f9");
            grad.addColorStop(1, "#2176a6");
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.shadowBlur = 0;
            // Eyes
            ctx.save();
            ctx.translate(tx, ty-12);
            ctx.rotate(0.01*Math.sin(Date.now()/400));
            ctx.beginPath();
            ctx.ellipse(-10, 4, 4, 8, 0, 0, Math.PI*2);
            ctx.closePath();
            ctx.fillStyle = "#111";
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(10, 4, 4, 8, 0, 0, Math.PI*2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            // Weapon (if any)
            if (player.equipment && player.equipment.weapon) {
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(tx+18, ty+4);
                ctx.lineTo(tx+28, ty-10);
                ctx.lineWidth = 6;
                ctx.strokeStyle = "#efc453";
                ctx.shadowColor = "#efc453";
                ctx.shadowBlur = 10;
                ctx.stroke();
                ctx.restore();
            }
            ctx.restore();
        }
    }

    renderNPCs(map, npcs) {
        const { ctx } = this;
        const tileSize = GameConstants.tileSize;
        for (let npc of npcs) {
            let tx = npc.x * tileSize + tileSize/2, ty = npc.y * tileSize + tileSize/2;
            ctx.save();
            ctx.beginPath();
            ctx.arc(tx, ty-7, 17, 0, Math.PI*2, false);
            ctx.closePath();
            let grad = ctx.createRadialGradient(tx, ty-7, 3, tx, ty-7, 17);
            grad.addColorStop(0, npc.palette[0]);
            grad.addColorStop(1, npc.palette[1]);
            ctx.fillStyle = grad;
            ctx.shadowColor = npc.palette[0];
            ctx.shadowBlur = 7;
            ctx.fill();
            ctx.shadowBlur = 0;
            // Face
            ctx.save();
            ctx.translate(tx, ty-7);
            ctx.beginPath();
            ctx.arc(0, 0, 7, 0, Math.PI, false);
            ctx.strokeStyle = "#351f0e";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
            ctx.restore();
        }
    }

    renderItems(map, items) {
        const { ctx } = this;
        const tileSize = GameConstants.tileSize;
        for (let item of items) {
            let tx = item.x * tileSize + tileSize/2, ty = item.y * tileSize + tileSize/2;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(tx, ty-10);
            for (let i = 1; i <= 5; ++i) {
                let angle = Math.PI * 0.4 * i - Math.PI/2;
                let r = (i%2===0)?14:7;
                ctx.lineTo(tx + r*Math.cos(angle), ty - 10 + r*Math.sin(angle));
            }
            ctx.closePath();
            // Glowing star
            let grad = ctx.createRadialGradient(tx, ty-10, 3, tx, ty-10, 14);
            grad.addColorStop(0, "#fffbe4");
            grad.addColorStop(0.5, "#e6e18c");
            grad.addColorStop(1, "#e6c23a");
            ctx.fillStyle = grad;
            ctx.shadowColor = "#e6c23a";
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.restore();
        }
    }

    renderEffect(eff) {
        // Used for future: e.g. spell, slash, etc
    }

    // --- GRID/COLLISION OVERLAY ---
    renderGridOverlay(map, collisionEditMode, collisionEditMap) {
        const { ctx } = this;
        const tileSize = GameConstants.tileSize;
        const rows = map.rows, cols = map.cols;
        // Draw grid lines
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.2;
        for (let y = 0; y <= rows; ++y) {
            ctx.beginPath();
            ctx.moveTo(0, y * tileSize);
            ctx.lineTo(cols * tileSize, y * tileSize);
            ctx.stroke();
        }
        for (let x = 0; x <= cols; ++x) {
            ctx.beginPath();
            ctx.moveTo(x * tileSize, 0);
            ctx.lineTo(x * tileSize, rows * tileSize);
            ctx.stroke();
        }
        ctx.restore();

        // If in collision edit mode, show blocked/walkable overlay
        if (collisionEditMode && collisionEditMap) {
            for (let y = 0; y < rows; ++y) {
                for (let x = 0; x < cols; ++x) {
                    if (collisionEditMap[y][x]) {
                        // Blocked: fill with red transparent
                        ctx.save();
                        ctx.globalAlpha = 0.33;
                        ctx.fillStyle = "#e64f4f";
                        ctx.fillRect(x * tileSize + 2, y * tileSize + 2, tileSize - 4, tileSize - 4);
                        ctx.restore();
                    } else {
                        // Walkable: fill with green transparent
                        ctx.save();
                        ctx.globalAlpha = 0.18;
                        ctx.fillStyle = "#3cf97a";
                        ctx.fillRect(x * tileSize + 2, y * tileSize + 2, tileSize - 4, tileSize - 4);
                        ctx.restore();
                    }
                    // --- Draw coordinates in each square in collision edit mode ---
                    ctx.save();
                    ctx.globalAlpha = 0.85;
                    ctx.font = "bold 14px monospace";
                    ctx.fillStyle = "#fff";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    // Draw a faint shadow for readability
                    ctx.shadowColor = "#222";
                    ctx.shadowBlur = 2;
                    ctx.fillText(`${x},${y}`, x * tileSize + tileSize / 2, y * tileSize + tileSize / 2);
                    ctx.shadowBlur = 0;
                    ctx.restore();
                }
            }
        }
    }

    renderBattleBackground(turn, time) {
        const { ctx } = this;
        let w = ctx.canvas.width, h = ctx.canvas.height;
        // Animated swirling radial gradient
        let cx = w/2, cy = h/2;
        let grad = ctx.createRadialGradient(cx, cy, 80+18*Math.sin(time/400), cx, cy, 360);
        grad.addColorStop(0, turn === 'player-turn' ? "#4fe6e6" : "#e64f4f");
        grad.addColorStop(0.3, "#2f4d4d");
        grad.addColorStop(1, "#212d2d");
        ctx.save();
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
        // Faint sparkles
        for (let i=0; i<28; ++i) {
            let x = Math.sin(time/370+i*0.2)*340 + cx;
            let y = Math.cos(time/570+i*0.4)*180 + cy;
            ctx.save();
            ctx.globalAlpha = 0.18 + 0.13*Math.sin(time/100 + i*0.3);
            ctx.beginPath();
            ctx.arc(x, y, 2 + 2*Math.abs(Math.sin(time/300 + i)), 0, Math.PI*2, false);
            ctx.closePath();
            ctx.fillStyle = "#fffbe4";
            ctx.fill();
            ctx.restore();
        }
    }

    renderBattleEntities(player, enemy, anim = null) {
        const { ctx } = this;
        // Player
        this.renderBattlePlayer(player, anim && anim.target === "player" ? anim : null);
        this.renderBattleEnemy(enemy, anim && anim.target === "enemy" ? anim : null);
    }

    renderBattlePlayer(player, anim) {
        const { ctx } = this;
        let tx = 200, ty = 400;

        // --- Use animated idle sprite in battle as well ---
        const frameCount = 6;
        const frameDuration = 125; // ms per frame
        const now = performance.now();
        const frameIdx = Math.floor(now / frameDuration) % frameCount;

        ctx.save();
        if (anim && anim.type === "hurt") ctx.globalAlpha = 0.6 + 0.4*Math.sin(Date.now()/60);

        if (this.playerIdleFramesLoaded && this.playerIdleFrames[frameIdx]) {
            // Shadow
            ctx.save();
            ctx.globalAlpha = 0.33;
            ctx.beginPath();
            ctx.ellipse(tx, ty + 36, 44, 18, 0, 0, Math.PI * 2);
            ctx.fillStyle = "#222";
            ctx.fill();
            ctx.restore();

            // Draw sprite centered (make it bigger in battle: was 48x64, now 72x96)
            const img = this.playerIdleFrames[frameIdx];
            ctx.save();
            ctx.drawImage(img, tx - 36, ty - 48, 72, 96);
            ctx.restore();

            // Weapon overlay (if any)
            // REMOVED YELLOW LINE OVERLAY
            // if (player.equipment && player.equipment.weapon) {
            //     ctx.save();
            //     ctx.beginPath();
            //     ctx.moveTo(tx+18, ty+8);
            //     ctx.lineTo(tx+34, ty-8);
            //     ctx.lineWidth = 7;
            //     ctx.strokeStyle = "#efc453";
            //     ctx.shadowColor = "#efc453";
            //     ctx.shadowBlur = 10;
            //     ctx.stroke();
            //     ctx.restore();
            // }
        } else {
            // Fallback: old procedural circle (make it bigger)
            // Body
            ctx.shadowColor = "#3cf9f9";
            ctx.shadowBlur = 24;
            ctx.beginPath();
            ctx.arc(tx, ty-12, 48, 0, Math.PI*2, false);
            ctx.closePath();
            let grad = ctx.createRadialGradient(tx, ty-12, 10, tx, ty-12, 48);
            grad.addColorStop(0, "#fff");
            grad.addColorStop(0.22, "#aef1e9");
            grad.addColorStop(0.68, "#3cf9f9");
            grad.addColorStop(1, "#2176a6");
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.shadowBlur = 0;
            // Eyes
            ctx.save();
            ctx.translate(tx, ty-12);
            ctx.beginPath();
            ctx.ellipse(-18, 6, 7, 14, 0, 0, Math.PI*2);
            ctx.closePath();
            ctx.fillStyle = "#111";
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(18, 6, 7, 14, 0, 0, Math.PI*2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            // Weapon effect
            if (player.equipment && player.equipment.weapon) {
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(tx+28, ty+12);
                ctx.lineTo(tx+48, ty-12);
                ctx.lineWidth = 10;
                ctx.strokeStyle = "#efc453";
                ctx.shadowColor = "#efc453";
                ctx.shadowBlur = 14;
                ctx.stroke();
                ctx.restore();
            }
        }
        ctx.restore();
    }

    renderBattleEnemy(enemy, anim) {
        const { ctx } = this;
        let tx = 600, ty = 320;

        // --- Check for animation frames (Galactic Pirate) ---
        let enemyAnim = this._ensureEnemyFrames(enemy);
        let usedAnim = false;
        if (enemy && enemy.animationFrames && enemyAnim && enemyAnim.frames.length > 0) {
            // Animation: use the number of frames in the array (broken frame removed)
            const frameCount = enemy.animationFrames.length;
            const frameDuration = 125;
            const now = performance.now();
            const frameIdx = Math.floor(now / frameDuration) % frameCount;

            ctx.save();
            if (anim && anim.type === "hurt") ctx.globalAlpha = 0.5 + 0.5*Math.abs(Math.sin(Date.now()/70));

            // Shadow
            ctx.save();
            ctx.globalAlpha = 0.33;
            ctx.beginPath();
            ctx.ellipse(tx, ty + 28, 36, 14, 0, 0, Math.PI * 2);
            ctx.fillStyle = "#222";
            ctx.fill();
            ctx.restore();

            // Draw sprite centered (bigger in battle)
            const img = enemyAnim.frames[frameIdx];
            // Use 64x80 for enemy sprite, adjust as needed
            ctx.save();
            ctx.drawImage(img, tx - 32, ty - 56, 64, 80);
            ctx.restore();

            ctx.restore();
            usedAnim = true;
        }

        // Fallback: procedural enemy (for non-animated enemies)
        if (!usedAnim) {
            ctx.save();
            if (anim && anim.type === "hurt") ctx.globalAlpha = 0.5 + 0.5*Math.abs(Math.sin(Date.now()/70));
            // Body
            ctx.shadowColor = enemy.palette[0];
            ctx.shadowBlur = 21;
            ctx.beginPath();
            ctx.arc(tx, ty-8, 38, 0, Math.PI*2, false);
            ctx.closePath();
            let grad = ctx.createRadialGradient(tx, ty-8, 8, tx, ty-8, 38);
            grad.addColorStop(0, enemy.palette[0]);
            grad.addColorStop(1, enemy.palette[1]);
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.restore();
            // Face/eyes
            ctx.save();
            ctx.translate(tx, ty-8);
            ctx.beginPath();
            ctx.ellipse(-16, 7, 6, 14, 0, 0, Math.PI*2);
            ctx.closePath();
            ctx.fillStyle = "#111";
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(16, 7, 6, 14, 0, 0, Math.PI*2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }
}
window.RenderSystem = RenderSystem;