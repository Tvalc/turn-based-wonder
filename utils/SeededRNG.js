// Simple LCG-based seeded RNG
class SeededRNG {
    constructor(seed) {
        this.seed = seed || Date.now();
        this.m = 0x80000000;
        this.a = 1664525;
        this.c = 1013904223;
        this.state = this.seed % this.m;
    }
    nextInt() {
        this.state = (this.a * this.state + this.c) % this.m;
        return this.state;
    }
    nextFloat() {
        return this.nextInt() / (this.m - 1);
    }
    range(min, max) {
        return min + Math.floor(this.nextFloat() * (max - min + 1));
    }
    chance(prob) {
        return this.nextFloat() < prob;
    }
    pick(arr) {
        return arr[this.range(0, arr.length - 1)];
    }
}
window.SeededRNG = SeededRNG;