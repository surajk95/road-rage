// ============================================================================
//  Core game state, update loop, and UI wiring
// ============================================================================
import { scene, camera, dirLight } from "./scene.js";
import {
    LANE_LEFT, MIN_SPEED, MAX_SPEED, START_SPEED,
    ACCEL, BRAKE_DECEL, NATURAL_DECEL, LANE_SWITCH_SPEED,
    VEHICLE_PHYSICS,
    laneX, pickRandom, formatDistance,
    POTHOLE_MSGS, POLICE_MSGS, TRAFFIC_MSGS, COW_MSGS, DOG_MSGS, WRONGWAY_MSGS,
    SPEECH_BUBBLES,
} from "./config.js";
import { createAutoRickshaw, createScooty } from "./vehicles.js";
import {
    obstacles, manageSpawning, updateObstacles,
    checkCollisions, clearObstacles, honkNearby,
    resetSpawning, createMenuTraffic, isOnRoughPatch,
} from "./obstacles.js";
import { updateRoadElements } from "./road.js";

// =========================================================================
//  State (exported so main.js can read current status)
// =========================================================================
export const state = {
    current:   "menu",           // "menu" | "playing" | "gameover"
    vehicleType: "auto",
    lastVehicleType: "auto",
    playerMesh: null,
    playerZ:    0,
    playerSpeed: START_SPEED,
    playerLane: 0,               // 0 = left, 1 = right
    distance:   0,
    highScore:  parseInt(localStorage.getItem("roadrage_highscore") || "0", 10),
    honkCooldown: 0,
};

// =========================================================================
//  DOM refs (cached once)
// =========================================================================
const $menu       = document.getElementById("menu");
const $hud        = document.getElementById("hud");
const $speed      = document.getElementById("speed-display");
const $distance   = document.getElementById("distance-display");
const $highscore  = document.getElementById("highscore-display");
const $gameover   = document.getElementById("gameover");
const $goReason   = document.getElementById("gameover-reason");
const $goMessage  = document.getElementById("gameover-message");
const $goDist     = document.getElementById("go-dist");
const $goHS       = document.getElementById("gameover-highscore");
const $warning    = document.getElementById("warning");
const $speechBubbles = document.getElementById("speech-bubbles");

// =========================================================================
//  Start / restart / back-to-menu
// =========================================================================
export function startGame(type) {
    state.vehicleType     = type;
    state.lastVehicleType = type;
    state.current         = "playing";
    state.playerZ         = 0;
    state.playerSpeed     = START_SPEED;
    state.playerLane      = 0;
    state.distance        = 0;

    clearObstacles();
    resetSpawning(50);
    spokenObstacles.clear(); // clear speech bubble tracking
    
    // Clear active bubbles
    activeBubbles.forEach(b => b.remove());
    activeBubbles.length = 0;

    // Create player vehicle
    if (state.playerMesh) scene.remove(state.playerMesh);
    state.playerMesh = type === "auto"
        ? createAutoRickshaw(0x2e7d32)
        : createScooty(0x1565c0);
    state.playerMesh.position.set(LANE_LEFT, 0, 0);
    scene.add(state.playerMesh);

    // UI
    $menu.classList.add("hidden");
    $gameover.classList.add("hidden");
    $hud.classList.remove("hidden");
    refreshHighScoreHUD();
}

export function restartGame() {
    startGame(state.lastVehicleType);
}

export function backToMenu() {
    state.current = "menu";
    if (state.playerMesh) { scene.remove(state.playerMesh); state.playerMesh = null; }
    clearObstacles();
    resetSpawning(50);
    createMenuTraffic();

    $gameover.classList.add("hidden");
    $hud.classList.add("hidden");
    $menu.classList.remove("hidden");
}

// =========================================================================
//  Main per-frame update (called from main.js only when state === "playing")
// =========================================================================
export function update(rawDelta, keys) {
    const delta = Math.min(rawDelta, 0.05); // clamp for tab-switch safety

    // ---- Read input ----
    const accel   = keys.ArrowUp    || keys.KeyW;
    const brake   = keys.ArrowDown  || keys.KeyS;
    const goLeft  = keys.ArrowLeft  || keys.KeyA;
    const goRight = keys.ArrowRight || keys.KeyD;
    const honk    = keys.Space;

    // ---- Per-vehicle physics ----
    const phys = VEHICLE_PHYSICS[state.vehicleType];

    // ---- Speed ----
    if (accel) {
        state.playerSpeed = Math.min(phys.maxSpeed, state.playerSpeed + phys.accel * delta);
    } else if (brake) {
        state.playerSpeed = Math.max(MIN_SPEED * 0.5, state.playerSpeed - phys.brakeDecel * delta);
    } else {
        const cruise = MIN_SPEED + (phys.maxSpeed - MIN_SPEED) * 0.3;
        if (state.playerSpeed > cruise)   state.playerSpeed -= phys.naturalDecel * delta;
        else if (state.playerSpeed < MIN_SPEED) state.playerSpeed += phys.accel * 0.5 * delta;
    }

    // ---- Forward movement ----
    const dz = state.playerSpeed * delta;
    state.playerZ += dz;
    state.distance += dz;

    // ---- Lane switching ----
    // Only switch lane if one key is pressed (not both)
    if (goLeft && !goRight)  state.playerLane = 1;  // lane 1 = right (+1.3)
    if (goRight && !goLeft) state.playerLane = 0;  // lane 0 = left (-1.3)

    const targetX = laneX(state.playerLane);
    const prevX   = state.playerMesh.position.x;
    state.playerMesh.position.x += (targetX - prevX) * phys.laneSwitchSpeed * delta;
    state.playerMesh.position.z  = state.playerZ;

    // ---- Vehicle tilt on lane change ----
    state.playerMesh.rotation.z = -(state.playerMesh.position.x - prevX) * 2.5;

    // ---- Road vibration & bumps (feel the Indian road) ----
    const speedNorm = state.playerSpeed / phys.maxSpeed;
    const pz = state.playerZ;
    let bumpAmp = 0.02 + speedNorm * 0.04;
    
    // Check if on rough patch - extra bumps!
    const onRoughPatch = isOnRoughPatch(state.playerMesh, state.vehicleType);
    if (onRoughPatch) {
        bumpAmp *= 2.5; // Much bumpier on rough patches
    }
    
    const bump = Math.sin(pz * 2.3) * bumpAmp
               + Math.sin(pz * 5.7) * bumpAmp * 0.35
               + Math.sin(pz * 0.7) * bumpAmp * 0.6
               + (onRoughPatch ? Math.sin(pz * 12.5) * bumpAmp * 0.5 : 0); // extra high-frequency bumps
    state.playerMesh.position.y = bump;
    // subtle forward pitch wobble (more intense on rough patches)
    state.playerMesh.rotation.x = Math.sin(pz * 3.1) * 0.02 * speedNorm * (onRoughPatch ? 1.8 : 1);

    // ---- Honk ----
    if (honk) doHonk();
    state.honkCooldown = Math.max(0, state.honkCooldown - delta);

    // ---- Obstacles ----
    manageSpawning(state.playerZ, state.distance);
    updateObstacles(delta, state.playerZ);

    const hit = checkCollisions(state.playerMesh, state.vehicleType);
    if (hit) { triggerGameOver(hit); return; }

    // ---- Speech Bubbles (when passing obstacles) ----
    for (const o of obstacles) {
        // Only show speech for obstacles close to player and not already spoken
        const relativeZ = o.mesh.position.z - state.playerZ;
        
        // Trigger when obstacle is ahead (4-12 units) - appear a bit earlier
        if (relativeZ > 4 && relativeZ < 12 && !spokenObstacles.has(o)) {
            // Check if obstacle has speech bubbles
            if (SPEECH_BUBBLES[o.type]) {
                const bubble = showSpeechBubble(o);
                if (bubble) {
                    activeBubbles.push(bubble);
                }
                spokenObstacles.add(o);
            }
        }
        
        // Clean up spoken obstacles that are far behind
        if (relativeZ < -30) {
            spokenObstacles.delete(o);
        }
    }

    // ---- Update Speech Bubble Positions ----
    for (let i = activeBubbles.length - 1; i >= 0; i--) {
        const bubble = activeBubbles[i];
        const { obstacle, startTime } = bubble.userData;
        
        // Check if bubble has expired (600ms)
        const elapsed = Date.now() - startTime;
        if (elapsed > 600) {
            bubble.classList.add("fade-out");
            setTimeout(() => bubble.remove(), 300);
            activeBubbles.splice(i, 1);
            continue;
        }
        
        // Convert obstacle 3D position to screen position
        const position = obstacle.mesh.position.clone();
        position.y += 1.5; // Position bubble above obstacle
        position.project(camera);
        
        // Convert to screen coordinates
        const screenX = (position.x * 0.5 + 0.5) * window.innerWidth;
        const screenY = (-(position.y * 0.5) + 0.5) * window.innerHeight;
        
        // Check if on screen
        if (position.z < 1 && screenX >= 0 && screenX <= window.innerWidth && 
            screenY >= 0 && screenY <= window.innerHeight) {
            bubble.style.left = `${screenX}px`;
            bubble.style.top = `${screenY}px`;
            bubble.style.transform = "translateX(-50%)";
            bubble.style.display = "block";
        } else {
            // Hide if off screen
            bubble.style.display = "none";
        }
    }

    // ---- Road ----
    updateRoadElements(state.playerZ);

    // ---- Camera (low & close for claustrophobic speed feel) ----
    const camTargetX = state.playerMesh.position.x * 0.5;
    camera.position.x += (camTargetX - camera.position.x) * 5 * delta;
    camera.position.y  = 3.0;
    camera.position.z  = state.playerZ - 5.5;
    camera.lookAt(state.playerMesh.position.x * 0.6, 0.5, state.playerZ + 12);

    // Camera shake / vibration — scales with speed (extra intense on rough patches)
    let shakeAmp = 0.012 + speedNorm * 0.05;
    if (onRoughPatch) shakeAmp *= 2.0;
    camera.position.x += Math.sin(pz * 7.3)  * shakeAmp * 0.5;
    camera.position.y += Math.sin(pz * 11.1) * shakeAmp * 0.25
                       + Math.sin(pz * 5.7)  * shakeAmp * 0.15
                       + (onRoughPatch ? Math.sin(pz * 15.3) * shakeAmp * 0.3 : 0);

    // Dynamic FOV — tight at low speed, wide at high speed
    const targetFov = 58 + speedNorm * 30;
    camera.fov += (targetFov - camera.fov) * 3 * delta;
    camera.updateProjectionMatrix();

    // ---- Light follows player ----
    dirLight.position.set(state.playerMesh.position.x + 10, 20, state.playerZ + 15);
    dirLight.target.position.set(state.playerMesh.position.x, 0, state.playerZ);
    dirLight.target.updateMatrixWorld();

    // ---- HUD ----
    const speedKmh = Math.floor(state.playerSpeed * 3.6);
    $speed.innerHTML = `${speedKmh}<span class="gauge-unit">km/h</span>`;
    $distance.textContent = formatDistance(state.distance);
}

// =========================================================================
//  Honk
// =========================================================================
const HONK_TEXTS = ["HONK!", "BEEP BEEP!", "PEE PEE PEE!", "HORN OK!"];

function doHonk() {
    if (state.honkCooldown > 0) return;
    state.honkCooldown = 0.5;

    $warning.textContent = pickRandom(HONK_TEXTS);
    $warning.classList.add("show");
    setTimeout(() => $warning.classList.remove("show"), 300);

    honkNearby(state.playerZ);
}

// =========================================================================
//  Speech Bubbles
// =========================================================================
function showSpeechBubble(obstacle) {
    // Get dialogue for this obstacle type
    const dialogues = SPEECH_BUBBLES[obstacle.type];
    if (!dialogues) return;

    const text = pickRandom(dialogues);
    
    const bubble = document.createElement("div");
    bubble.className = "speech-bubble";
    bubble.textContent = text;
    
    // Store reference to obstacle and camera for positioning
    bubble.userData = { obstacle, startTime: Date.now() };
    
    $speechBubbles.appendChild(bubble);
    
    return bubble;
}

// Track active speech bubbles
const activeBubbles = [];

// Track which obstacles have already spoken
const spokenObstacles = new Set();

// =========================================================================
//  Game over
// =========================================================================
const MESSAGES_BY_TYPE = {
    pothole:  { msgs: POTHOLE_MSGS,  reason: "You hit a pothole!" },
    police:   { msgs: POLICE_MSGS,   reason: "Caught by Traffic Police!" },
    cow:      { msgs: COW_MSGS,      reason: "You hit a cow!" },
    dog:      { msgs: DOG_MSGS,      reason: "You hit a street dog!" },
    wrongway: { msgs: WRONGWAY_MSGS, reason: "Head-on collision!" },
};

function triggerGameOver(obstacle) {
    state.current = "gameover";

    const entry  = MESSAGES_BY_TYPE[obstacle.type] ||
                   { msgs: TRAFFIC_MSGS, reason: "Traffic collision!" };
    const dist   = Math.floor(state.distance);

    if (dist > state.highScore) {
        state.highScore = dist;
        localStorage.setItem("roadrage_highscore", state.highScore.toString());
    }

    $goReason.textContent  = pickRandom(entry.msgs);
    $goMessage.textContent = entry.reason;
    $goDist.textContent    = formatDistance(dist);
    $goHS.textContent      = "Best: " + formatDistance(state.highScore);
    $gameover.classList.remove("hidden");
    $hud.classList.add("hidden");
}

// =========================================================================
//  HUD high-score refresh
// =========================================================================
function refreshHighScoreHUD() {
    $highscore.textContent = state.highScore > 0
        ? formatDistance(state.highScore)
        : "---";
}
