window.drawRoundedRect = function(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
};

window.lerp = function(a, b, t) {
    return a + (b - a) * t;
};

window.clamp = function(val, min, max) {
    return Math.max(min, Math.min(max, val));
};

window.centerText = function(ctx, text, x, y, maxWidth) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y, maxWidth);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
};

window.shakeCanvas = function(canvas, strength = 6, duration = 200) {
    const orig = { left: canvas.style.left || "0px", top: canvas.style.top || "0px" };
    let start = performance.now();
    function shake(now) {
        let elapsed = now - start;
        if (elapsed < duration) {
            let dx = (Math.random()-0.5) * strength;
            let dy = (Math.random()-0.5) * strength;
            canvas.style.position = 'relative';
            canvas.style.left = `${dx}px`;
            canvas.style.top = `${dy}px`;
            requestAnimationFrame(shake);
        } else {
            canvas.style.left = orig.left;
            canvas.style.top = orig.top;
        }
    }
    requestAnimationFrame(shake);
};

window.wait = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};