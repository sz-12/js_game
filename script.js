
const game     = document.getElementById('game_wrapper');
const player   = document.getElementById('player');
const overlay  = document.getElementById('startOverlay');
const startBtn = document.getElementById('startButton');
const scoreEl  = document.getElementById('score');
const livesEl  = document.getElementById('lives');


const bgSky  = createLayer('bg-sky');
const bgFar  = createLayer('bg-far');
const bgMid  = createLayer('bg-mid');
const bgNear = createLayer('bg-near');

function createLayer(className) {
    const div = document.createElement('div');
    div.className = className;
    game.prepend(div);
    return div;
}

let bgOffset = 0;


let home = document.getElementById('home');
if (!home) {
    home = document.createElement('div');
    home.id = 'home';
    game.appendChild(home);
}
home.style.display = 'none'; 


const uiTop = document.querySelector('.ui-top');
const levelBadge = document.createElement('div');
levelBadge.id = 'level-badge';
if (uiTop) uiTop.appendChild(levelBadge);


const levelScreen = document.createElement('div');
levelScreen.id = 'level-screen';
levelScreen.style.cssText = `
    position:absolute;inset:0;z-index:50;display:none;
    flex-direction:column;align-items:center;justify-content:center;
    gap:20px;background:rgba(5,15,5,0.92);backdrop-filter:blur(6px);
    text-align:center;padding:40px;
`;
levelScreen.innerHTML = `
    <div id="ls-emoji" style="font-size:64px;">🐰</div>
    <h2 id="ls-title" style="font-family:'Fredoka One',cursive;font-size:44px;color:#a8e063;text-shadow:0 4px 0 #2d5a00;"></h2>
    <p id="ls-stats" style="font-size:18px;color:#c8e6a0;line-height:2;"></p>
    <button id="continueBtn" style="
        margin-top:8px;padding:16px 48px;font-family:'Fredoka One',cursive;
        font-size:26px;background:#ffcc00;color:#5e3023;border:none;
        border-bottom:5px solid #b28900;border-radius:14px;cursor:pointer;
        box-shadow:0 6px 20px rgba(255,200,0,0.3);
    ">Next Level →</button>
`;
game.appendChild(levelScreen);

const continueBtn = document.getElementById('continueBtn');



const LEVELS = [
    {
        level: 1,
        carrots: 5,
        enemyTypes: ['fox'],
        enemySpeed: 4,
        carrotSpeed: 3.5,
        carrotInterval: 2200,
        enemyInterval: 3000,
        intro: 'Collect 5 carrots then reach the burrow!',
    },
    {
        level: 2,
        carrots: 8,
        enemyTypes: ['fox', 'lion'],
        enemySpeed: 5.5,
        carrotSpeed: 4.5,
        carrotInterval: 1800,
        enemyInterval: 2400,
        intro: 'A lion has entered the forest! Collect 8 carrots.',
    },
    {
        level: 3,
        carrots: 12,
        enemyTypes: ['fox', 'fox', 'lion'],
        enemySpeed: 7,
        carrotSpeed: 5.5,
        carrotInterval: 1400,
        enemyInterval: 1800,
        intro: 'They\'re getting faster... Collect 12 carrots.',
    },
    {
        level: 4,
        carrots: 15,
        enemyTypes: ['fox', 'lion', 'lion'],
        enemySpeed: 9,
        carrotSpeed: 6.5,
        carrotInterval: 1100,
        enemyInterval: 1300,
        intro: 'Final level. Don\'t stop! Collect 15 carrots.',
    },
];


let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}

function playTone(freq, type, duration, volume = 0.3) {
    const ctx  = getAudioContext();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
}

function soundJump() {
    const ctx  = getAudioContext();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
}

function soundCollect() {
    playTone(880, 'sine', 0.08, 0.3);
    setTimeout(() => playTone(1320, 'sine', 0.12, 0.25), 80);
}

function soundHit()      { playTone(80, 'sawtooth', 0.3, 0.4); }

function soundGameOver() {
    playTone(440, 'sine', 0.2, 0.3);
    setTimeout(() => playTone(330, 'sine', 0.2, 0.3), 200);
    setTimeout(() => playTone(220, 'sine', 0.4, 0.3), 400);
}

function soundLevelComplete() {
    [523, 659, 784, 1047].forEach((f, i) =>
        setTimeout(() => playTone(f, 'sine', 0.2, 0.35), i * 130)
    );
}

function soundFinalWin() {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
        setTimeout(() => playTone(f, 'sine', 0.25, 0.4), i * 120)
    );
}

// === GAME STATE ===
let playerX  = 80;
let playerY  = 60;
let velocity = 0;
const gravity  = 0.8;
let jumping  = false;
let moveLeft = false;
let moveRight= false;

let carrots      = 0;
let lives        = 3;
let running      = false;
let currentLevel = 0; // index into LEVELS array

let carrotInterval = null;
let enemyInterval  = null;
let animationId    = null;


function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function cfg() { return LEVELS[currentLevel]; }


function resetForLevel() {
    playerX  = 80;
    playerY  = 60;
    velocity = 0;
    jumping  = false;
    moveLeft = moveRight = false;
    carrots  = 0;
    bgOffset = 0;

    document.querySelectorAll('.carrot, .enemy').forEach(n => n.remove());
    home.style.display = 'none';
    home.classList.remove('unlocked');

    if (player) {
        player.style.left    = playerX + 'px';
        player.style.bottom  = playerY + 'px';
        player.style.opacity = '1';
    }

    levelBadge.textContent = 'Level ' + cfg().level;
    updateUI();
}


function startGame() {
    currentLevel = 0;
    lives = 3;
    overlay.style.display = 'none';
    levelScreen.style.display = 'none';
    beginLevel();
}


function beginLevel() {
    resetForLevel();
    running = true;

    if (carrotInterval) clearInterval(carrotInterval);
    if (enemyInterval)  clearInterval(enemyInterval);

    carrotInterval = setInterval(spawnCarrot, cfg().carrotInterval);
    enemyInterval  = setInterval(spawnEnemy,  cfg().enemyInterval);

    if (animationId) cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(loop);
}


function completeLevel() {
    running = false;
    clearInterval(carrotInterval); carrotInterval = null;
    clearInterval(enemyInterval);  enemyInterval  = null;
    cancelAnimationFrame(animationId); animationId = null;

    const isLast = currentLevel === LEVELS.length - 1;
    isLast ? soundFinalWin() : soundLevelComplete();

    document.getElementById('ls-emoji').textContent  = isLast ? '🏆' : '🎉';
    document.getElementById('ls-title').textContent  = isLast ? 'You Win!' : 'Level ' + cfg().level + ' Complete!';
    document.getElementById('ls-stats').innerHTML    =
        `Carrots collected: <b>${carrots}/${cfg().carrots}</b><br>
        Lives remaining: <b>${lives}</b><br><br>
        ${isLast ? '🐰 Pip reached home safely!' : LEVELS[currentLevel + 1].intro}`;

    continueBtn.textContent = isLast ? 'Play Again' : 'Next Level →';
    levelScreen.style.display = 'flex';
}


function gameOver() {
    running = false;
    clearInterval(carrotInterval); carrotInterval = null;
    clearInterval(enemyInterval);  enemyInterval  = null;
    cancelAnimationFrame(animationId); animationId = null;

    soundGameOver();

    const h = overlay.querySelector('h1');
    if (h) h.textContent = 'Game Over 💀';
    if (startBtn) startBtn.textContent = 'Try Again';
    overlay.style.display = 'flex';
}


continueBtn.addEventListener('click', () => {
    levelScreen.style.display = 'none';
    const isLast = currentLevel === LEVELS.length - 1;

    if (isLast) {
        const h = overlay.querySelector('h1');
        if (h) h.textContent = 'Survival Bunny Game';
        if (startBtn) startBtn.textContent = 'Play Again';
        overlay.style.display = 'flex';
    } else {
        currentLevel++;
        beginLevel();
    }
});


function spawnCarrot() {
    if (!running) return;
    const c = document.createElement('div');
    c.className = 'carrot';
    c.style.left = (game.clientWidth + 50) + 'px';
    game.appendChild(c);

    let x = game.clientWidth + 50;
    const speed = cfg().carrotSpeed + Math.random() * 1.5;

    const t = setInterval(() => {
        if (!running) return;
        x -= speed;
        c.style.left = x + 'px';

        if (isColliding(player, c)) {
            carrots++;
            soundCollect();
            updateUI();
            if (carrots >= cfg().carrots) {
                home.style.display = 'block';
                home.classList.add('unlocked');
            }
            c.remove(); clearInterval(t);
            return;
        }
        if (x < -100) { c.remove(); clearInterval(t); }
    }, 20);
}


function spawnEnemy() {
    if (!running) return;
    const e = document.createElement('div');
    const types = cfg().enemyTypes;
    const type  = types[Math.floor(Math.random() * types.length)];
    e.className = 'enemy ' + type;
    e.style.left = (game.clientWidth + 50) + 'px';
    game.appendChild(e);

    let x = game.clientWidth + 50;
    const speed = cfg().enemySpeed + Math.random() * 2;

    const t = setInterval(() => {
        if (!running) return;
        x -= speed;
        e.style.left = x + 'px';

        if (isColliding(player, e)) {
            lives--;
            soundHit();
            updateUI();
            if (player) {
                player.classList.add('hit');
                player.style.opacity = '0.4';
                setTimeout(() => {
                    player.classList.remove('hit');
                    player.style.opacity = '1';
                }, 300);
            }
            e.remove(); clearInterval(t);
            if (lives <= 0) gameOver();
            return;
        }
        if (x < -100) { e.remove(); clearInterval(t); }
    }, 20);
}


function loop() {
    if (!running) return;

    bgOffset += 2;
    bgFar.style.backgroundPositionX  = -(bgOffset * 0.2) + 'px';
    bgMid.style.backgroundPositionX  = -(bgOffset * 0.5) + 'px';
    bgNear.style.backgroundPositionX = -(bgOffset * 1.0) + 'px';


    if (moveLeft)  playerX -= 6;
    if (moveRight) playerX += 6;
    playerX = clamp(playerX, 0, game.clientWidth - 50);

    
    velocity -= gravity;
    playerY  += velocity;
    if (playerY <= 60) { playerY = 60; velocity = 0; jumping = false; }

    if (player) {
        player.style.left   = playerX + 'px';
        player.style.bottom = playerY + 'px';
    }


    if (carrots >= cfg().carrots && isColliding(player, home)) {
        completeLevel();
        return;
    }

    animationId = requestAnimationFrame(loop);
}


function isColliding(a, b) {
    if (!a || !b) return false;
    const r1 = a.getBoundingClientRect();
    const r2 = b.getBoundingClientRect();
    return r1.left < r2.right && r1.right > r2.left &&
        r1.bottom > r2.top && r1.top < r2.bottom;
}


function updateUI() {
    if (scoreEl) scoreEl.textContent = `Carrots: ${carrots}/${cfg().carrots}`;
    if (livesEl) livesEl.textContent = `Lives: ${lives}`;
}


window.addEventListener('keydown', (e) => {
    if (!running && (e.code === 'Space' || e.code === 'Enter')) {
        if (overlay.style.display !== 'none') startGame();
        return;
    }
    if (e.code === 'ArrowLeft'  || e.code === 'KeyA') moveLeft  = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') moveRight = true;
    if ((e.code === 'Space' || e.code === 'ArrowUp') && !jumping && running) {
        velocity = 14; jumping = true;
        soundJump();
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft'  || e.code === 'KeyA') moveLeft  = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') moveRight = false;
});

if (startBtn) startBtn.addEventListener('click', startGame);


if (overlay) overlay.style.display = 'flex';