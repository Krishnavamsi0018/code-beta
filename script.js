/* --- CONFIGURATION & CONSTANTS --- */
const GAME_CONFIG = {
    XP: {
        READ: 10,        // XP for reading a chapter
        PRACTICE: 25,    // XP for variables/simple tasks
        GAME_WIN: 50,    // XP for winning a mini-game
        BOSS_WIN: 100    // XP for Module 3 final
    },
    PASSING_SCORE: 3     // Snake game wins needed
};

/* -------------------- STATE MANAGEMENT (THE BRAIN) -------------------- */
let gameState = {
    progress: 0,      // Current step index
    xp: 0,            // Total XP
    streak: 1,        // Daily Streak
    badges: [],       // 'beginner', 'logic'
    level: null,      // 'Beginner', 'Intermediate'
    lang: null        // 'Python', etc.
};

// Load data on startup
function initApp() {
    if (!localStorage.getItem("codeBetaSave")) {
        gameState.progress = 0;
        gameState.xp = 0;
        gameState.badges = [];
        saveProgress();
    }

    loadProgress();
    renderRoadmap();
    updateDashboard();
    loadProgress();
    renderRoadmap();
    updateDashboard();
}

function saveProgress() {
    localStorage.setItem('codeBetaSave', JSON.stringify(gameState));
    updateDashboard();
}

function loadProgress() {
    const saved = localStorage.getItem('codeBetaSave');
    if (saved) {
        gameState = JSON.parse(saved);
        // Sync local var with global state
        userProgress = gameState.progress;
    }
}

/* -------------------- NAVIGATION -------------------- */
function nav(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.getElementById('app-screen').scrollTop = 0;

    // If navigating to dashboard, refresh the stats
    if (id === 'scrn-dashboard') updateDashboard();
}

/* -------------------- SELECTION -------------------- */
function sel(el) {
    const text = el.innerText.toLowerCase();

    if (text.includes('intermediate') || text.includes('pro')) {
        showModal(
            "For this prototype, we focused on delivering a high-quality " +
            "Beginner learning experience.\n\n" +
            "Intermediate and Pro levels are part of our next development phase."
        );
        return;
    }

    if (text.includes('java') || text.includes('c++')) {
        showModal(
            "This demo showcases the Python learning path for beginners.\n\n" +
            "Support for Java and C++ is planned as part of the platform’s expansion."
        );
        return;
    }

    el.parentElement.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');

    if (text.includes('python')) {
        gameState.lang = "Python";
    } else {
        gameState.level = el.querySelector('h3')?.innerText || "Beginner";
    }
}




function goToLanguage() {
    if (!gameState.level) return alert("⚠️ Please select a level");
    nav('scrn-language');
}

function goToRoadmap() {
    if (!gameState.lang) return alert("⚠️ Please select a language");
    saveProgress(); // Save initial setup
    nav('scrn-roadmap');
}

/* -------------------- PROGRESSION LOGIC -------------------- */
let userProgress = 0;

const steps = [
    { id: 'chap1-node', type: 'normal', label: 'Comments', nav: 'scrn-chap1', xp: GAME_CONFIG.XP.READ },
    { id: 'chap2-node', type: 'normal', label: 'Print()', nav: 'scrn-chap2', xp: GAME_CONFIG.XP.READ },
    { id: 'chap3-node', type: 'normal', label: 'Math', nav: 'scrn-chap3', xp: GAME_CONFIG.XP.READ },
    { id: 'node-mod1-game', type: 'trophy', label: 'Fix It Game', nav: 'scrn-mod1-game', xp: GAME_CONFIG.XP.GAME_WIN, badge: 'beginner' },
    { id: 'node-mod2', type: 'normal', label: 'Variables', nav: 'scrn-mod2', modColor: '#F59E0B', xp: GAME_CONFIG.XP.PRACTICE },
    { id: 'node-mod3', type: 'normal', label: 'If/Else', nav: 'scrn-mod3', modColor: '#8B5CF6', xp: GAME_CONFIG.XP.PRACTICE },
    { id: 'node-mod3-game', type: 'trophy', label: 'Logic Battle', nav: 'scrn-mod3-game', modColor: '#8B5CF6', xp: GAME_CONFIG.XP.BOSS_WIN, badge: 'logic' }
];

function renderRoadmap() {
    const snake = document.getElementById('progress-path');

    // Sync local var with global state
    userProgress = gameState.progress;

    let progressPercent = userProgress / steps.length;
    let newOffset = 2500 - (1500 * progressPercent);
    snake.style.strokeDashoffset = newOffset;

    steps.forEach((step, index) => {
        const el = document.getElementById(step.id);
        el.className = 'map-node';
        el.innerHTML = '';

        if (index > userProgress) {
            el.classList.add('node-locked');
            let icon = '🔒';
            if (step.type === 'trophy') icon = '🏆';
            el.innerHTML = `<div class="node-circle">${icon}</div><div class="node-label">${step.label}</div>`;
        }
        else if (index === userProgress) {
            let style = step.modColor ? `background:${step.modColor}; border-color:${step.modColor};` : '';
            el.innerHTML = `<div class="node-current" style="${style}">${step.type === 'trophy' ? '🏆' : (index + 1)}</div><div class="node-label">${step.label}</div>`;
            el.onclick = function () { nav(step.nav); };
        }
        else {
            let style = step.modColor ? `background:${step.modColor};` : '';
            el.innerHTML = `<div class="node-done" style="${style}">✓</div><div class="node-label">${step.label}</div>`;
            el.onclick = function () { nav(step.nav); };
        }
    });
}
function completeStep(stepIndex, nextScreenId) {

    // Only reward if this is new progress
    if (stepIndex > gameState.progress) {

        const completedStep = steps[stepIndex - 1];

        // Update progress FIRST (important)
        gameState.progress = stepIndex;

        if (completedStep) {
            gameState.xp += completedStep.xp;

            if (completedStep.badge && !gameState.badges.includes(completedStep.badge)) {
                gameState.badges.push(completedStep.badge);
                showBadgeModal(completedStep.badge.toUpperCase() + " badge earned!");
                celebrate();
            }
        }

        saveProgress();
    }

    // Force sync & redraw
    userProgress = gameState.progress;
    renderRoadmap();
    nav(nextScreenId);
}


/* -------------------- DASHBOARD UPDATER -------------------- */
function updateDashboard() {
    // Update Text
    const xpEl = document.getElementById('dash-xp');
    const streakEl = document.getElementById('dash-streak');

    if (xpEl) xpEl.innerText = gameState.xp;
    if (streakEl) streakEl.innerText = gameState.streak;

    // Update Badges Visuals
    const b1 = document.getElementById('badge-beginner');
    const b2 = document.getElementById('badge-logic');

    if (b1 && b2) {
        // Reset
        b1.style.opacity = "0.5"; b1.querySelector('small').innerText = "Locked";
        b2.style.opacity = "0.5"; b2.querySelector('small').innerText = "Locked";

        if (gameState.badges.includes('beginner')) {
            b1.style.opacity = "1";
            b1.querySelector('small').innerText = "Unlocked!";
            b1.querySelector('small').style.color = "#22C55E";
        }
        if (gameState.badges.includes('logic')) {
            b2.style.opacity = "1";
            b2.querySelector('small').innerText = "Unlocked!";
            b2.querySelector('small').style.color = "#8B5CF6";
        }
    }
}

/* -------------------- GAME LOGIC -------------------- */

// 1. QUIZ LOGIC
function checkAnswer(el, isCorrect) {
    if (isCorrect) {
        playSuccess();
        celebrate();
        el.classList.add('correct');
        document.getElementById('feedback').innerHTML = "<span style='color:#4ADE80'>Correct! Module Completed 🥉</span>";
        document.querySelectorAll('.quiz-option').forEach(o => o.style.pointerEvents = 'none');

        const btn = document.getElementById('finish-mod-btn');
        if (btn) { btn.style.opacity = "1"; btn.style.pointerEvents = "auto"; }
    } else {
        playError();
        el.classList.add('wrong');
        el.style.pointerEvents = 'none';
        document.getElementById('feedback').innerHTML = "<span style='color:#EF4444'>Try Again!</span>";
    }
}

// 2. DOOR LOGIC
function checkDoor(age) {
    const door = document.getElementById('door-visual');
    const codeDisplay = document.getElementById('age-display');
    const finishBtn = document.getElementById('finish-demo-btn');

    codeDisplay.innerText = age;

    if (age >= 18) {
        door.style.background = "#22C55E"; door.innerHTML = "🔓";
        finishBtn.style.opacity = "1"; finishBtn.style.pointerEvents = "auto";
        finishBtn.className = "btn btn-green";
    } else {
        door.style.background = "#EF4444"; door.innerHTML = "🔒";
        alert("❌ Access Denied!");
    }
}

// 3. SNAKE GAME LOGIC
let sGameScore = 0; let sCompScore = 0;
function playSnakeGame(userChoice) {
    const choices = ['Snake', 'Water', 'Gun'];
    const compChoice = choices[Math.floor(Math.random() * 3)];
    let result = ""; let color = "white";

    if (userChoice === compChoice) {
        result = "Draw!"; color = "#FCD34D";
    } else if (
        (userChoice === "Snake" && compChoice === "Water") ||
        (userChoice === "Water" && compChoice === "Gun") ||
        (userChoice === "Gun" && compChoice === "Snake")
    ) {
        result = "Win!"; sGameScore++; color = "#76ff03";
    } else {
        playError();
        result = "Lost!"; sCompScore++; color = "#f44336";
    }

    const resEl = document.getElementById("game-result");
    resEl.innerText = `${result} (${userChoice} vs ${compChoice})`;
    resEl.style.color = color;
    document.getElementById("user-score").innerText = sGameScore;
    document.getElementById("comp-score").innerText = sCompScore;

    if (sGameScore >= GAME_CONFIG.PASSING_SCORE) {
        playSuccess();
        document.getElementById("btn-finish-demo-game").style.opacity = "1";
        document.getElementById("btn-finish-demo-game").style.pointerEvents = "auto";
        resEl.innerHTML = "🏆 YOU WON! 🏆";
    }
    const battle = document.getElementById("battle-area");

    battle.innerHTML = "🤜 🤛";

    setTimeout(() => {
        if (result === "Win!") battle.innerHTML = "😎 💥 💀";
        else if (result === "Lost!") battle.innerHTML = "💀 💥 🤖";
        else battle.innerHTML = "😐 🤝 😐";
    }, 300);

}

// 4. VARIABLE NAME LOGIC
function checkVarName(btn, isValid, msg) {
    const feedback = document.getElementById('var-feedback');
    const nextBtn = document.getElementById('btn-mod2-next');
    document.querySelectorAll('.var-btn').forEach(b => {
        b.style.border = "1px solid #ddd"; b.style.background = "white"; b.style.color = "#333";
    });

    if (isValid) {
        btn.style.background = "#22C55E"; btn.style.color = "white";
        feedback.style.color = "#15803d"; feedback.innerHTML = msg;
        nextBtn.style.opacity = "1"; nextBtn.style.pointerEvents = "auto";
    } else {
        btn.style.background = "#EF4444"; btn.style.color = "white";
        feedback.style.color = "#B91C1C"; feedback.innerHTML = msg;
    }
}
function celebrate() {
    const duration = 1500;
    const end = Date.now() + duration;

    const interval = setInterval(() => {
        if (Date.now() > end) {
            clearInterval(interval);
            return;
        }

        confetti({
            particleCount: 40,
            spread: 360,
            startVelocity: 25,
            origin: {
                x: Math.random(),
                y: Math.random() - 0.2
            }
        });
    }, 250);
}
function showAiHint(text) {
    showModal("🤖 Mentor Hint\n\n" + text);
}


let resetClicks = 0;

function showModal(message) {
    const modal = document.getElementById("coming-soon-modal");
    document.getElementById("modal-message").innerText = message;
    modal.style.display = "block";
    setTimeout(() => modal.classList.add("show"), 10);
}

function closeModal() {
    const modal = document.getElementById("coming-soon-modal");
    modal.classList.remove("show");
    setTimeout(() => modal.style.display = "none", 300);
}
function checkMathTask() {
    const val = document.getElementById("math-answer").value.trim();
    const fb = document.getElementById("math-feedback");
    const next = document.getElementById("math-next-btn");

    if (val === "25") {
        playSuccess();
        fb.innerHTML = "🎉 Perfect! Final Exam Unlocked.";
        fb.style.color = "#22C55E";
        next.style.opacity = "1";
        next.style.pointerEvents = "auto";
        next.className = "btn btn-green";
        

        celebrate();
        gameState.xp += 15;
        saveProgress();
    } else {
        fb.innerHTML = "❌ Incorrect. Try again.";
        fb.style.color = "#EF4444";
        playError();
    }
}
function showBadgeModal(text) {
    document.getElementById("badge-text").innerText = text;
    document.getElementById("badge-modal").style.display = "block";
    setTimeout(()=>document.getElementById("badge-modal").classList.add("show"),10);
}

function closeBadgeModal() {
    const modal = document.getElementById("badge-modal");
    modal.classList.remove("show");
    setTimeout(()=>modal.style.display="none",300);
}
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, duration = 0.08, type = "sine", volume = 0.15) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}
function playClick() {
    playTone(600, 0.05, "triangle", 0.08);
}

function playSuccess() {
    playTone(880, 0.12, "sine", 0.18);
    setTimeout(() => playTone(1320, 0.12, "sine", 0.16), 120);
}

function playError() {
    playTone(220, 0.15, "square", 0.18);
}
function resetApp() {
    if (confirm("Reset all progress and start fresh?")) {
        localStorage.removeItem("codeBetaSave");

        gameState = {
            progress: 0,
            xp: 0,
            streak: 1,
            badges: [],
            level: null,
            lang: null
        };

        saveProgress();
        nav('scrn-home');
        location.reload();
    }
}










