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
        // { enemyId: { sets: {idle:[],attack:[],death:[]}, loaded: {idle:bool,attack:bool,death:bool} } }
        this.enemyAnimationSets = {};

        // --- Overworld background image for first scene ---
        this.firstSceneBgUrl = "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/0f84fe06-5c42-40c3-b563-1a28d18f37cc/library/RPG_BG2_1757183786053.png";
        this.firstSceneBgImg = null;
        this.firstSceneBgLoaded = false;
        this._loadFirstSceneBg();

        // === DEBUGGING: Set to true to enable Karenbot attack frame logging ===
        this.DEBUG_KAREN_ATTACK = true; // Set to false to disable debug logs
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

    // Load enemy animation sets if needed (for battle)
    _ensureEnemyAnimationSets(enemy) {
        if (!enemy || !enemy.animationSets) return null;
        if (!this.enemyAnimationSets[enemy.id]) {
            let sets = {};
            let loaded = { idle: false, attack: false, death: false };
            let keys = Object.keys(enemy.animationSets);
            keys.forEach(animType => {
                let urls = enemy.animationSets[animType];
                let frames = [];
                let loadedCount = 0;
                for (let i = 0; i < urls.length; ++i) {
                    const img = new window.Image();
                    img.src = urls[i];
                    img.onload = () => {
                        loadedCount++;
                        if (loadedCount === urls.length) {
                            loaded[animType] = true;
                        }
                    };
                    frames.push(img);
                }
                sets[animType] = frames;
            });
            this.enemyAnimationSets[enemy.id] = { sets, loaded };
        }
        return this.enemyAnimationSets[enemy.id];
    }

    // For backward compatibility: load animationFrames for enemies that only have idle animation
    _ensureEnemyFrames(enemy) {
        if (!enemy || !enemy.animationFrames) return null;
        if (!this.enemyAnimationSets[enemy.id]) {
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
                        this.enemyAnimationSets[enemy.id].loaded = true;
                    }
                };
                frames.push(img);
            }
            this.enemyAnimationSets[enemy.id] = { sets: { idle: frames }, loaded: { idle: false } };
        }
        return this.enemyAnimationSets[enemy.id];
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

        // 1.5x scale factor for all sprites
        const scale = 1.5;

        if (this.playerIdleFramesLoaded && this.playerIdleFrames[frameIdx]) {
            // Draw shadow (make it a bit bigger)
            ctx.save();
            ctx.globalAlpha = 0.33;
            ctx.beginPath();
            ctx.ellipse(tx, ty + 20 * scale, 32 * scale, 14 * scale, 0, 0, Math.PI * 2);
            ctx.fillStyle = "#222";
            ctx.fill();
            ctx.restore();

            // Draw sprite centered
            const img = this.playerIdleFrames[frameIdx];
            // Was 64x64, now 64*1.5=96x96
            ctx.save();
            ctx.drawImage(img, tx - 48, ty - 60, 96, 96);
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
            ctx.shadowBlur = 24 * scale;
            // Body
            ctx.beginPath();
            ctx.arc(tx, ty-12 * scale, 28 * scale, 0, Math.PI*2, false);
            ctx.closePath();
            ctx.fillStyle = "url(#player-gradient)";
            // Fallback: procedural radial gradient
            let grad = ctx.createRadialGradient(tx, ty-12 * scale, 6 * scale, tx, ty-12 * scale, 28 * scale);
            grad.addColorStop(0, "#fff");
            grad.addColorStop(0.25, "#aef1e9");
            grad.addColorStop(0.7, "#3cf9f9");
            grad.addColorStop(1, "#2176a6");
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.shadowBlur = 0;
            // Eyes
            ctx.save();
            ctx.translate(tx, ty-12 * scale);
            ctx.rotate(0.01*Math.sin(Date.now()/400));
            ctx.beginPath();
            ctx.ellipse(-10 * scale, 4 * scale, 4 * scale, 8 * scale, 0, 0, Math.PI*2);
            ctx.closePath();
            ctx.fillStyle = "#111";
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(10 * scale, 4 * scale, 4 * scale, 8 * scale, 0, 0, Math.PI*2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            // Weapon (if any)
            if (player.equipment && player.equipment.weapon) {
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(tx+18 * scale, ty+4 * scale);
                ctx.lineTo(tx+28 * scale, ty-10 * scale);
                ctx.lineWidth = 6 * scale;
                ctx.strokeStyle = "#efc453";
                ctx.shadowColor = "#efc453";
                ctx.shadowBlur = 10 * scale;
                ctx.stroke();
                ctx.restore();
            }
            ctx.restore();
        }
    }

    renderNPCs(map, npcs) {
        const { ctx } = this;
        const tileSize = GameConstants.tileSize;
        const scale = 1.5;
        for (let npc of npcs) {
            let tx = npc.x * tileSize + tileSize/2, ty = npc.y * tileSize + tileSize/2;
            ctx.save();
            ctx.beginPath();
            ctx.arc(tx, ty-7 * scale, 17 * scale, 0, Math.PI*2, false);
            ctx.closePath();
            let grad = ctx.createRadialGradient(tx, ty-7 * scale, 3 * scale, tx, ty-7 * scale, 17 * scale);
            grad.addColorStop(0, npc.palette[0]);
            grad.addColorStop(1, npc.palette[1]);
            ctx.fillStyle = grad;
            ctx.shadowColor = npc.palette[0];
            ctx.shadowBlur = 7 * scale;
            ctx.fill();
            ctx.shadowBlur = 0;
            // Face
            ctx.save();
            ctx.translate(tx, ty-7 * scale);
            ctx.beginPath();
            ctx.arc(0, 0, 7 * scale, 0, Math.PI, false);
            ctx.strokeStyle = "#351f0e";
            ctx.lineWidth = 2 * scale;
            ctx.stroke();
            ctx.restore();
            ctx.restore();
        }
    }

    renderItems(map, items) {
        const { ctx } = this;
        const tileSize = GameConstants.tileSize;
        const scale = 1.5;
        for (let item of items) {
            let tx = item.x * tileSize + tileSize/2, ty = item.y * tileSize + tileSize/2;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(tx, ty-10 * scale);
            for (let i = 1; i <= 5; ++i) {
                let angle = Math.PI * 0.4 * i - Math.PI/2;
                let r = (i%2===0)?14 * scale:7 * scale;
                ctx.lineTo(tx + r*Math.cos(angle), ty - 10 * scale + r*Math.sin(angle));
            }
            ctx.closePath();
            // Glowing star
            let grad = ctx.createRadialGradient(tx, ty-10 * scale, 3 * scale, tx, ty-10 * scale, 14 * scale);
            grad.addColorStop(0, "#fffbe4");
            grad.addColorStop(0.5, "#e6e18c");
            grad.addColorStop(1, "#e6c23a");
            ctx.fillStyle = grad;
            ctx.shadowColor = "#e6c23a";
            ctx.shadowBlur = 10 * scale;
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
        this.renderBattleEnemy(enemy, anim && anim.target === "enemy" ? anim : null, anim);
    }

    renderBattlePlayer(player, anim) {
        const { ctx } = this;
        // Was tx = 200, ty = 400
        let tx = 200, ty = 400;

        // --- Use animated idle sprite in battle as well ---
        const frameCount = 6;
        const frameDuration = 125; // ms per frame
        const now = performance.now();
        const frameIdx = Math.floor(now / frameDuration) % frameCount;

        // 1.5x scale factor for all sprites
        const scale = 1.5;

        ctx.save();
        if (anim && anim.type === "hurt") ctx.globalAlpha = 0.6 + 0.4*Math.sin(Date.now()/60);

        if (this.playerIdleFramesLoaded && this.playerIdleFrames[frameIdx]) {
            // Shadow
            ctx.save();
            ctx.globalAlpha = 0.33;
            ctx.beginPath();
            ctx.ellipse(tx, ty + 36 * scale, 44 * scale, 18 * scale, 0, 0, Math.PI * 2);
            ctx.fillStyle = "#222";
            ctx.fill();
            ctx.restore();

            // Draw sprite centered (was 72x96, now 108x144)
            const img = this.playerIdleFrames[frameIdx];
            ctx.save();
            ctx.drawImage(img, tx - 54, ty - 72, 108, 144);
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
            ctx.shadowBlur = 24 * scale;
            ctx.beginPath();
            ctx.arc(tx, ty-12 * scale, 48 * scale, 0, Math.PI*2, false);
            ctx.closePath();
            let grad = ctx.createRadialGradient(tx, ty-12 * scale, 10 * scale, tx, ty-12 * scale, 48 * scale);
            grad.addColorStop(0, "#fff");
            grad.addColorStop(0.22, "#aef1e9");
            grad.addColorStop(0.68, "#3cf9f9");
            grad.addColorStop(1, "#2176a6");
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.shadowBlur = 0;
            // Eyes
            ctx.save();
            ctx.translate(tx, ty-12 * scale);
            ctx.beginPath();
            ctx.ellipse(-18 * scale, 6 * scale, 7 * scale, 14 * scale, 0, 0, Math.PI*2);
            ctx.closePath();
            ctx.fillStyle = "#111";
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(18 * scale, 6 * scale, 7 * scale, 14 * scale, 0, 0, Math.PI*2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            // Weapon effect
            if (player.equipment && player.equipment.weapon) {
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(tx+28 * scale, ty+12 * scale);
                ctx.lineTo(tx+48 * scale, ty-12 * scale);
                ctx.lineWidth = 10 * scale;
                ctx.strokeStyle = "#efc453";
                ctx.shadowColor = "#efc453";
                ctx.shadowBlur = 14 * scale;
                ctx.stroke();
                ctx.restore();
            }
        }
        ctx.restore();
    }

    // Modified signature: add animFull (full anim object) as third argument for clarity
    renderBattleEnemy(enemy, anim, animFull) {
        const { ctx } = this;
        // Was tx = 600, ty = 320
        let tx = 600, ty = 320;

        // 1.5x scale factor for all sprites
        const scale = 1.5;

        // --- Check for animationSets (idle/attack/death) ---
        let usedAnim = false;
        let animSets = this._ensureEnemyAnimationSets(enemy);
        if (enemy && enemy.animationSets && animSets && animSets.sets) {
            let animType = "idle";

            // --- BEGIN MODIFIED LOGIC FOR ATTACK ANIMATION ---
            // If animFull is present and type is "hurt" and this is Roach or Karenbot, play attack animation
            // Otherwise, play idle or death as before

            // --- OVERRIDE: Always play attack animation for Roach Space Pirate and Karenbot when anim.type === "hurt" and anim.target === "player" ---
            if (
                animFull &&
                animFull.type === "hurt" &&
                animFull.target === "player" &&
                (
                    enemy.id === "goblin" // Roach Space Pirate
                    || enemy.id === "karenbot" // Karenbot
                ) &&
                animSets.sets.attack && animSets.sets.attack.length > 0
            ) {
                animType = "attack";
            } else if (animFull && animFull.type === "hurt") {
                // If enemy is dead, play death
                if (enemy.stats && enemy.stats.hp <= 0 && animSets.sets.death && animSets.sets.death.length > 0) {
                    animType = "death";
                }
                else if (animSets.sets.attack && animSets.sets.attack.length > 0) {
                    animType = "attack";
                } else {
                    animType = "idle";
                }
            }
            // If enemy is dead, force death animation
            if (enemy.stats && enemy.stats.hp <= 0 && animSets.sets.death && animSets.sets.death.length > 0) {
                animType = "death";
            }

            // Animation: use the number of frames in the array
            const frames = animSets.sets[animType];
            const frameCount = frames.length;

            // --- SLOW DOWN ALL ENEMY ANIMATIONS TO 1 FPS (1000ms per frame) ---
            // --- SPECIAL CASE: For Karenbot attack animation, stretch total animation time to cover all frames within the battleAnimTime ---
            let frameDuration;
            let frameIdx;
            const now = performance.now();

            // --- Special logic for Karenbot attack animation so all frames play within anim duration ---
            if (
                animType === "attack"
                && enemy.id === "karenbot"
                && animFull
                && animFull.type === "hurt"
                && animFull.target === "player"
                && animFull.start
            ) {
                // Use the total anim duration to spread all frames evenly
                // Use GameConstants.battleAnimTime if available, fallback to 500ms
                let totalDuration = (window.GameConstants && window.GameConstants.battleAnimTime) ? window.GameConstants.battleAnimTime : 500;
                // If user wants to see all frames, stretch the animation to fit all frames
                // If totalDuration < frameCount*120, increase totalDuration to frameCount*120ms minimum
                // --- FIX: For Karenbot, always force totalDuration to frameCount*120ms minimum ---
                if (totalDuration < frameCount * 120) totalDuration = frameCount * 120;
                frameDuration = totalDuration / frameCount;
                let elapsed = Date.now() - animFull.start;
                // --- FIX: Actually cycle through all frames, not just frame 0 ---
                let idx = Math.floor(elapsed / frameDuration);
                if (idx >= frameCount) idx = frameCount - 1;
                frameIdx = idx;

                // === DEBUGGING: Log Karenbot attack animation frames ===
                if (this.DEBUG_KAREN_ATTACK) {
                    if (!this._lastKarenFrameIdx || this._lastKarenFrameIdx !== frameIdx) {
                        // Only log when frame changes
                        this._lastKarenFrameIdx = frameIdx;
                        // Print frame info and time
                        // Show which frame, elapsed, total, and frame URL
                        let url = frames[frameIdx] && frames[frameIdx].src ? frames[frameIdx].src : "(no url)";
                        console.log(`[KAREN ATTACK DEBUG] Frame ${frameIdx+1}/${frameCount} | elapsed: ${elapsed}ms/${totalDuration}ms | url: ${url}`);
                    }
                }
            }
            // --- Special logic for Roach attack animation: same as above, but only for goblin id ---
            else if (
                animType === "attack"
                && enemy.id === "goblin"
                && animFull
                && animFull.type === "hurt"
                && animFull.target === "player"
                && animFull.start
            ) {
                let totalDuration = (window.GameConstants && window.GameConstants.battleAnimTime) ? window.GameConstants.battleAnimTime : 500;
                if (totalDuration < frameCount * 120) totalDuration = frameCount * 120;
                frameDuration = totalDuration / frameCount;
                let elapsed = Date.now() - animFull.start;
                let idx = Math.floor(elapsed / frameDuration);
                if (idx >= frameCount) idx = frameCount - 1;
                frameIdx = idx;
            }
            // --- Death animation: play through frames, then hold last frame ---
            else if (animType === "death" && enemy.stats && enemy.stats.hp <= 0) {
                frameDuration = 1000;
                if (animFull && animFull.start) {
                    let elapsed = Date.now() - animFull.start;
                    let idx = Math.floor(elapsed / frameDuration);
                    if (idx >= frameCount) idx = frameCount - 1;
                    frameIdx = idx;
                } else {
                    frameIdx = frameCount - 1;
                }
            }
            // --- Default: idle and others ---
            else {
                frameDuration = 1000;
                frameIdx = Math.floor(now / frameDuration) % frameCount;
            }

            ctx.save();
            if (animFull && animFull.type === "hurt") ctx.globalAlpha = 0.5 + 0.5*Math.abs(Math.sin(Date.now()/70));

            // Shadow
            ctx.save();
            ctx.globalAlpha = 0.33;
            ctx.beginPath();
            ctx.ellipse(tx, ty + 28 * scale, 36 * scale, 14 * scale, 0, 0, Math.PI * 2);
            ctx.fillStyle = "#222";
            ctx.fill();
            ctx.restore();

            // Draw sprite centered (was 64x80, now 96x120)
            const img = frames[frameIdx];
            ctx.save();
            ctx.drawImage(img, tx - 48, ty - 84, 96, 120);
            ctx.restore();

            ctx.restore();
            usedAnim = true;
        } else if (enemy && enemy.animationFrames) {
            // Fallback: enemies with only animationFrames (Galactic Pirate)
            let enemyAnim = this._ensureEnemyFrames(enemy);
            if (enemyAnim && enemyAnim.sets && enemyAnim.sets.idle && enemyAnim.sets.idle.length > 0) {
                const frames = enemyAnim.sets.idle;
                const frameCount = frames.length;
                // --- SLOW DOWN ALL ENEMY ANIMATIONS TO 1 FPS (1000ms per frame) ---
                const frameDuration = 1000;
                const now = performance.now();
                const frameIdx = Math.floor(now / frameDuration) % frameCount;

                ctx.save();
                if (animFull && animFull.type === "hurt") ctx.globalAlpha = 0.5 + 0.5*Math.abs(Math.sin(Date.now()/70));

                // Shadow
                ctx.save();
                ctx.globalAlpha = 0.33;
                ctx.beginPath();
                ctx.ellipse(tx, ty + 28 * scale, 36 * scale, 14 * scale, 0, 0, Math.PI * 2);
                ctx.fillStyle = "#222";
                ctx.fill();
                ctx.restore();

                // Draw sprite centered (was 64x80, now 96x120)
                const img = frames[frameIdx];
                ctx.save();
                ctx.drawImage(img, tx - 48, ty - 84, 96, 120);
                ctx.restore();

                ctx.restore();
                usedAnim = true;
            }
        }

        // Fallback: procedural enemy (for non-animated enemies)
        if (!usedAnim) {
            ctx.save();
            if (animFull && animFull.type === "hurt") ctx.globalAlpha = 0.5 + 0.5*Math.abs(Math.sin(Date.now()/70));
            // Body
            ctx.shadowColor = enemy.palette[0];
            ctx.shadowBlur = 21 * scale;
            ctx.beginPath();
            ctx.arc(tx, ty-8 * scale, 38 * scale, 0, Math.PI*2, false);
            ctx.closePath();
            let grad = ctx.createRadialGradient(tx, ty-8 * scale, 8 * scale, tx, ty-8 * scale, 38 * scale);
            grad.addColorStop(0, enemy.palette[0]);
            grad.addColorStop(1, enemy.palette[1]);
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.restore();
            // Face/eyes
            ctx.save();
            ctx.translate(tx, ty-8 * scale);
            ctx.beginPath();
            ctx.ellipse(-16 * scale, 7 * scale, 6 * scale, 14 * scale, 0, 0, Math.PI*2);
            ctx.closePath();
            ctx.fillStyle = "#111";
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(16 * scale, 7 * scale, 6 * scale, 14 * scale, 0, 0, Math.PI*2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }
}
window.RenderSystem = RenderSystem;t