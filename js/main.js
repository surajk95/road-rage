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
//  UI event listeners (replace inline onclick handlers)
// =========================================================================
document.getElementById("select-auto").addEventListener("click",   () => startGame("auto"));
document.getElementById("select-scooty").addEventListener("click", () => startGame("scooty"));
document.getElementById("restart-btn").addEventListener("click",   restartGame);
document.getElementById("back-btn").addEventListener("click",      backToMenu);

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
