// ============================================================================
//  Entry point — animation loop, input, event wiring
// ============================================================================
import * as THREE from "three";
import { scene, camera, renderer, handleResize } from "./scene.js";
import { initRoad } from "./road.js";
import { obstacles, createMenuTraffic } from "./obstacles.js";
import { state, startGame, update, restartGame, backToMenu } from "./game.js";

// =========================================================================
//  Renderer → DOM
// =========================================================================
document.getElementById("game-container").appendChild(renderer.domElement);

// =========================================================================
//  Build the road environment
// =========================================================================
initRoad();

// =========================================================================
//  Input
// =========================================================================
const keys = {};

// Normalize e.key → e.code names so game.js only checks code-based keys
const KEY_MAP = {
    ArrowUp: "ArrowUp", ArrowDown: "ArrowDown",
    ArrowLeft: "ArrowLeft", ArrowRight: "ArrowRight",
    w: "KeyW", W: "KeyW", a: "KeyA", A: "KeyA",
    s: "KeyS", S: "KeyS", d: "KeyD", D: "KeyD",
    v: "KeyV", V: "KeyV",
    " ": "Space",
};
const KC_MAP = { 37: "ArrowLeft", 38: "ArrowUp", 39: "ArrowRight", 40: "ArrowDown", 32: "Space" };

window.addEventListener("keydown", (e) => {
    if (e.code) keys[e.code] = true;
    if (KEY_MAP[e.key]) keys[KEY_MAP[e.key]] = true;
    if (KC_MAP[e.keyCode]) keys[KC_MAP[e.keyCode]] = true;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code))
        e.preventDefault();
});
window.addEventListener("keyup", (e) => {
    if (e.code) keys[e.code] = false;
    if (KEY_MAP[e.key]) keys[KEY_MAP[e.key]] = false;
    if (KC_MAP[e.keyCode]) keys[KC_MAP[e.keyCode]] = false;
});
window.addEventListener("blur", () => { for (const k in keys) keys[k] = false; });

// =========================================================================
//  Touch/Mobile Controls
// =========================================================================
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let lastTapTime = 0;
let activeTouch = null;

// Touch control zones (percentage of screen)
const SWIPE_THRESHOLD = 30; // pixels
const TAP_TIME_THRESHOLD = 200; // ms
const DOUBLE_TAP_TIME = 300; // ms

window.addEventListener("touchstart", (e) => {
    if (state.current !== "playing") return;
    
    // Don't interfere with UI buttons
    const target = e.target;
    if (target.closest('.controls-tooltip') || target.closest('button')) {
        return;
    }
    
    const touch = e.touches[0];
    activeTouch = touch.identifier;
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartTime = Date.now();
    
    e.preventDefault();
}, { passive: false });

window.addEventListener("touchmove", (e) => {
    if (state.current !== "playing" || activeTouch === null) return;
    
    // Don't interfere with UI buttons
    const target = e.target;
    if (target.closest('.controls-tooltip') || target.closest('button')) {
        return;
    }
    
    const touch = Array.from(e.touches).find(t => t.identifier === activeTouch);
    if (!touch) return;
    
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    
    // Detect swipe direction and set keys accordingly
    if (Math.abs(deltaY) > SWIPE_THRESHOLD) {
        if (deltaY < -SWIPE_THRESHOLD) {
            // Swipe up = accelerate
            keys.KeyW = true;
            keys.KeyS = false;
        } else if (deltaY > SWIPE_THRESHOLD) {
            // Swipe down = brake
            keys.KeyS = true;
            keys.KeyW = false;
        }
    }
    
    // Lane switching based on horizontal position
    const screenWidth = window.innerWidth;
    if (touch.clientX < screenWidth * 0.35) {
        keys.KeyA = true;
        keys.KeyD = false;
    } else if (touch.clientX > screenWidth * 0.65) {
        keys.KeyD = true;
        keys.KeyA = false;
    } else {
        keys.KeyA = false;
        keys.KeyD = false;
    }
    
    e.preventDefault();
}, { passive: false });

window.addEventListener("touchend", (e) => {
    if (state.current !== "playing") return;
    
    // Don't interfere with UI buttons
    const target = e.target;
    if (target.closest('.controls-tooltip') || target.closest('button')) {
        // Release all touch-activated keys if we touched a UI element
        keys.KeyW = false;
        keys.KeyS = false;
        keys.KeyA = false;
        keys.KeyD = false;
        activeTouch = null;
        return;
    }
    
    const touch = Array.from(e.changedTouches).find(t => t.identifier === activeTouch);
    if (!touch) return;
    
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    const deltaTime = Date.now() - touchStartTime;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Detect tap (short touch with minimal movement)
    if (distance < SWIPE_THRESHOLD && deltaTime < TAP_TIME_THRESHOLD) {
        const screenWidth = window.innerWidth;
        const tapX = touch.clientX;
        const screenCenter = screenWidth * 0.5;
        
        // Check for double tap (camera toggle)
        const timeSinceLastTap = Date.now() - lastTapTime;
        if (timeSinceLastTap < DOUBLE_TAP_TIME) {
            // Double tap = toggle camera
            keys.KeyV = true;
            setTimeout(() => { keys.KeyV = false; }, 50);
            lastTapTime = 0; // Reset to prevent triple tap
        } else {
            // Single tap in center = honk
            if (Math.abs(tapX - screenCenter) < screenWidth * 0.2) {
                keys.Space = true;
                setTimeout(() => { keys.Space = false; }, 100);
            }
            lastTapTime = Date.now();
        }
    }
    
    // Release all touch-activated keys
    keys.KeyW = false;
    keys.KeyS = false;
    keys.KeyA = false;
    keys.KeyD = false;
    activeTouch = null;
    
    e.preventDefault();
}, { passive: false });

window.addEventListener("touchcancel", () => {
    // Release all keys on touch cancel
    keys.KeyW = false;
    keys.KeyS = false;
    keys.KeyA = false;
    keys.KeyD = false;
    activeTouch = null;
});

// =========================================================================
//  UI event listeners (replace inline onclick handlers)
// =========================================================================
document.getElementById("select-auto").addEventListener("click",   () => startGame("auto"));
document.getElementById("select-scooty").addEventListener("click", () => startGame("scooty"));
document.getElementById("restart-btn").addEventListener("click",   restartGame);
document.getElementById("back-btn").addEventListener("click",      backToMenu);

// Controls tooltip toggle
const controlsButton = document.getElementById("controls-button");
const controlsPanel = document.getElementById("controls-panel");
let controlsPanelOpen = false;

function toggleControlsPanel(e) {
    e.stopPropagation();
    e.preventDefault();
    controlsPanelOpen = !controlsPanelOpen;
    if (controlsPanelOpen) {
        controlsPanel.classList.add("show");
    } else {
        controlsPanel.classList.remove("show");
    }
}

// Support both click and touch events
controlsButton.addEventListener("click", toggleControlsPanel);
controlsButton.addEventListener("touchend", toggleControlsPanel);

// Close controls panel when clicking/touching outside
function closeControlsPanel(e) {
    if (controlsPanelOpen && !controlsPanel.contains(e.target) && 
        !controlsButton.contains(e.target)) {
        controlsPanelOpen = false;
        controlsPanel.classList.remove("show");
    }
}

document.addEventListener("click", closeControlsPanel);
document.addEventListener("touchend", (e) => {
    // Only close if the touch didn't start on the controls button
    if (!controlsButton.contains(e.target)) {
        closeControlsPanel(e);
    }
});

// =========================================================================
//  Window resize
// =========================================================================
window.addEventListener("resize", handleResize);

// =========================================================================
//  Menu background scene
// =========================================================================
createMenuTraffic();
camera.position.set(0, 5, -5);
camera.lookAt(0, 0.5, 8);

// =========================================================================
//  Animation loop
// =========================================================================
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (state.current === "playing") {
        update(delta, keys);
    } else if (state.current === "menu") {
        // Gentle camera orbit for the title screen
        const t = clock.elapsedTime;
        camera.position.set(Math.sin(t * 0.15) * 4, 5.5, Math.cos(t * 0.15) * 4 - 3);
        camera.lookAt(0, 0.5, 10);

        // Slowly animate background traffic
        for (const o of obstacles) {
            if (o.speed > 0) o.mesh.position.z += o.speed * delta * 0.4;
        }
    }

    renderer.render(scene, camera);
}

animate();
