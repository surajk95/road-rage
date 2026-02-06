// ============================================================================
//  Three.js scene, camera, renderer, and lights
// ============================================================================
import * as THREE from "three";
import { FOG_NEAR, FOG_FAR } from "./config.js";

// ----- Scene -----
export const scene = new THREE.Scene();
// Dusty hazy sky — not a clean blue, feels congested
const SKY = 0xa3b5c4;
scene.background = new THREE.Color(SKY);
scene.fog = new THREE.Fog(SKY, FOG_NEAR, FOG_FAR);

// ----- Camera -----
export const camera = new THREE.PerspectiveCamera(
    68,
    window.innerWidth / window.innerHeight,
    0.1,
    500,
);

// ----- Renderer -----
export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ----- Lights -----
const hemiLight = new THREE.HemisphereLight(0xffeedd, 0x8b7355, 0.6);
scene.add(hemiLight);

export const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 15);
dirLight.castShadow = true;
dirLight.shadow.camera.left = -30;
dirLight.shadow.camera.right = 30;
dirLight.shadow.camera.top = 30;
dirLight.shadow.camera.bottom = -30;
dirLight.shadow.camera.far = 60;
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
scene.add(dirLight);
scene.add(dirLight.target);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

// ----- Resize handler -----
export function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
