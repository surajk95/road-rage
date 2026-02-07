// ============================================================================
//  Road system — surface, markings, gutters, buildings, poles, skyscrapers
//  Designed to feel like a tight, congested Indian market road.
// ============================================================================
import * as THREE from "three";
import { scene } from "./scene.js";
import { ROAD_WIDTH, ROAD_LENGTH } from "./config.js";

// Internal references
let road, gutterLeft, gutterRight, footpathLeft, footpathRight;
let groundLeft, groundRight;

export const roadElements = {
    markings:           [],
    edgesLeft:          [],
    edgesRight:         [],
    buildingsLeft:      [],
    buildingsRight:     [],
    polesLeft:          [],
    polesRight:         [],
    skyscrapersLeft:    [],
    skyscrapersRight:   [],
};

// ----- Color palettes -----
const SHOP_COLORS = [
    0x1a73e8, 0x0d9488, 0xea580c, 0xdc2626, 0x16a34a,
    0x9333ea, 0xdb2777, 0xca8a04, 0x0891b2, 0x4f46e5,
];
const BUILDING_COLORS = [
    0xd4c5a0, 0xc9b99a, 0xb8a88a, 0xa3978a,
    0xe8dcc8, 0xd4a574, 0xc2956b, 0xcfbfa8,
];
const AWNING_COLORS = [
    0xe53935, 0x1e88e5, 0x43a047, 0xfb8c00,
    0x8e24aa, 0x00897b, 0xd81b60, 0x3949ab,
];
const SKYSCRAPER_COLORS = [
    0x6b7b8d, 0x7d8a96, 0x5a6a7a, 0x8899aa,
    0x4a5a6a, 0x9ab0c0, 0x708090, 0x5c6d7e,
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ----- Recycling constants -----
const BUILDING_SPACING = 3.4;
const BUILDING_COUNT   = 46;
const BUILDING_SPAN    = BUILDING_COUNT * BUILDING_SPACING;

const POLE_SPACING = 28;
const POLE_COUNT   = 12;
const POLE_SPAN    = POLE_COUNT * POLE_SPACING;

const SKYSCRAPER_SPACING = 14;
const SKYSCRAPER_COUNT   = 18;
const SKYSCRAPER_SPAN    = SKYSCRAPER_COUNT * SKYSCRAPER_SPACING;

// =========================================================================
//  Build the entire road environment once
// =========================================================================
export function initRoad() {
    const HW = ROAD_WIDTH / 2; // half-width

    // ---- Asphalt surface ----
    road = new THREE.Mesh(
        new THREE.PlaneGeometry(ROAD_WIDTH, ROAD_LENGTH),
        new THREE.MeshLambertMaterial({ color: 0x333333 }),
    );
    road.rotation.x = -Math.PI / 2;
    road.receiveShadow = true;
    scene.add(road);

    // ---- Gutters / drains (dark strips at road edge) ----
    const gutterMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    gutterLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.35, ROAD_LENGTH), gutterMat);
    gutterLeft.rotation.x = -Math.PI / 2;
    gutterLeft.position.set(-HW - 0.175, 0.003, 0);
    scene.add(gutterLeft);

    gutterRight = new THREE.Mesh(new THREE.PlaneGeometry(0.35, ROAD_LENGTH), gutterMat);
    gutterRight.rotation.x = -Math.PI / 2;
    gutterRight.position.set(HW + 0.175, 0.003, 0);
    scene.add(gutterRight);

    // ---- Narrow footpaths ----
    const pathMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
    footpathLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.7, ROAD_LENGTH), pathMat);
    footpathLeft.rotation.x = -Math.PI / 2;
    footpathLeft.position.set(-HW - 0.7, 0.006, 0);
    scene.add(footpathLeft);

    footpathRight = new THREE.Mesh(new THREE.PlaneGeometry(0.7, ROAD_LENGTH), pathMat);
    footpathRight.rotation.x = -Math.PI / 2;
    footpathRight.position.set(HW + 0.7, 0.006, 0);
    scene.add(footpathRight);

    // ---- Dirt ground behind buildings ----
    const dirtMat = new THREE.MeshLambertMaterial({ color: 0x8a7d6b });
    groundLeft = new THREE.Mesh(new THREE.PlaneGeometry(60, ROAD_LENGTH), dirtMat);
    groundLeft.rotation.x = -Math.PI / 2;
    groundLeft.position.set(-HW - 35, -0.02, 0);
    scene.add(groundLeft);

    groundRight = new THREE.Mesh(new THREE.PlaneGeometry(60, ROAD_LENGTH), dirtMat);
    groundRight.rotation.x = -Math.PI / 2;
    groundRight.position.set(HW + 35, -0.02, 0);
    scene.add(groundRight);

    // ---- Center lane dashes ----
    const markMat = new THREE.MeshBasicMaterial({ color: 0xcccccc });
    for (let i = 0; i < 60; i++) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 1.8), markMat);
        m.rotation.x = -Math.PI / 2;
        m.position.y = 0.02;
        scene.add(m);
        roadElements.markings.push(m);
    }

    // ---- Solid edge lines ----
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0x999999 });
    for (let i = 0; i < 30; i++) {
        const eL = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 8), edgeMat);
        eL.rotation.x = -Math.PI / 2;
        eL.position.set(-HW + 0.06, 0.02, 0);
        scene.add(eL);
        roadElements.edgesLeft.push(eL);

        const eR = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 8), edgeMat);
        eR.rotation.x = -Math.PI / 2;
        eR.position.set(HW - 0.06, 0.02, 0);
        scene.add(eR);
        roadElements.edgesRight.push(eR);
    }

    // ---- Buildings & shops (the main event) ----
    const buildingXLeft  = -HW - 1.05 - 1.2;
    const buildingXRight =  HW + 1.05 + 1.2;

    for (let i = 0; i < BUILDING_COUNT; i++) {
        const bL = makeBuildingPanel(buildingXLeft, -1);
        bL.position.z = -15 + i * BUILDING_SPACING;
        scene.add(bL);
        roadElements.buildingsLeft.push(bL);

        const bR = makeBuildingPanel(buildingXRight, 1);
        bR.position.z = -15 + i * BUILDING_SPACING + BUILDING_SPACING * 0.5;
        scene.add(bR);
        roadElements.buildingsRight.push(bR);
    }

    // ---- Utility poles (every ~28m, staggered sides) ----
    for (let i = 0; i < POLE_COUNT; i++) {
        const pL = makePole();
        pL.position.x = -HW - 0.5;
        pL.position.z = -15 + i * POLE_SPACING;
        scene.add(pL);
        roadElements.polesLeft.push(pL);

        const pR = makePole();
        pR.position.x = HW + 0.5;
        pR.position.z = -15 + i * POLE_SPACING + POLE_SPACING * 0.5;
        scene.add(pR);
        roadElements.polesRight.push(pR);
    }

    // ---- Skyscrapers (behind building row, fill the skyline) ----
    const skyXLeft  = -HW - 9;
    const skyXRight =  HW + 9;

    for (let i = 0; i < SKYSCRAPER_COUNT; i++) {
        const sL = makeSkyscraper(skyXLeft, -1);
        sL.position.z = -15 + i * SKYSCRAPER_SPACING;
        scene.add(sL);
        roadElements.skyscrapersLeft.push(sL);

        const sR = makeSkyscraper(skyXRight, 1);
        sR.position.z = -15 + i * SKYSCRAPER_SPACING + SKYSCRAPER_SPACING * 0.5;
        scene.add(sR);
        roadElements.skyscrapersRight.push(sR);
    }
}

// =========================================================================
//  Reposition repeating elements each frame
// =========================================================================
export function updateRoadElements(playerZ) {
    // Center markings
    const mSpacing = 4;
    const mBase = Math.floor(playerZ / mSpacing) * mSpacing - 30;
    roadElements.markings.forEach((m, i) => { m.position.z = mBase + i * mSpacing; });

    // Edge lines
    const eSpacing = 8;
    const eBase = Math.floor(playerZ / eSpacing) * eSpacing - 30;
    roadElements.edgesLeft.forEach((e, i)  => { e.position.z = eBase + i * eSpacing; });
    roadElements.edgesRight.forEach((e, i) => { e.position.z = eBase + i * eSpacing; });

    // Buildings — recycle individually (no mass-snap)
    recycleLoop(roadElements.buildingsLeft,  playerZ, BUILDING_SPAN, 20);
    recycleLoop(roadElements.buildingsRight, playerZ, BUILDING_SPAN, 20);

    // Utility poles — same approach
    recycleLoop(roadElements.polesLeft,  playerZ, POLE_SPAN, 20);
    recycleLoop(roadElements.polesRight, playerZ, POLE_SPAN, 20);

    // Skyscrapers
    recycleLoop(roadElements.skyscrapersLeft,  playerZ, SKYSCRAPER_SPAN, 20);
    recycleLoop(roadElements.skyscrapersRight, playerZ, SKYSCRAPER_SPAN, 20);

    // Surfaces follow the player
    road.position.z          = playerZ;
    gutterLeft.position.z    = playerZ;
    gutterRight.position.z   = playerZ;
    footpathLeft.position.z  = playerZ;
    footpathRight.position.z = playerZ;
    groundLeft.position.z    = playerZ;
    groundRight.position.z   = playerZ;
}

// =========================================================================
//  Individual-wrap recycling — moves one element at a time, never snaps all
// =========================================================================
function recycleLoop(elements, playerZ, totalSpan, margin) {
    for (const el of elements) {
        while (el.position.z < playerZ - margin)            el.position.z += totalSpan;
        while (el.position.z > playerZ + totalSpan - margin) el.position.z -= totalSpan;
    }
}

// =========================================================================
//  Building / shop panel factory
//  `side` is -1 (left of road) or +1 (right of road)
// =========================================================================
const PANEL_Z = 3.5;

function makeBuildingPanel(xCenter, side) {
    const g = new THREE.Group();
    const isShop = Math.random() < 0.65;
    const height = isShop
        ? 2.5 + Math.random() * 2.5          // shops:  2.5 – 5.0
        : 4.0 + Math.random() * 6.0;         // buildings: 4.0 – 10.0
    const depth  = 1.8 + Math.random() * 1.2; // how far from road (x)
    const color  = isShop ? pick(SHOP_COLORS) : pick(BUILDING_COLORS);

    // ---- Main structure ----
    const mat = new THREE.MeshPhongMaterial({ color });
    const box = new THREE.Mesh(new THREE.BoxGeometry(depth, height, PANEL_Z), mat);
    box.position.y = height / 2;
    box.castShadow = true;
    box.receiveShadow = true;
    g.add(box);

    // ---- Awning (shops, toward the road) ----
    if (isShop && Math.random() < 0.7) {
        const awning = new THREE.Mesh(
            new THREE.BoxGeometry(1.0, 0.05, PANEL_Z * 0.92),
            new THREE.MeshPhongMaterial({ color: pick(AWNING_COLORS) }),
        );
        awning.position.set(-side * (depth / 2 + 0.45), height * 0.62, 0);
        // slight tilt
        awning.rotation.z = side * 0.12;
        g.add(awning);

        // awning support poles
        for (const dz of [-PANEL_Z * 0.38, PANEL_Z * 0.38]) {
            const pole = new THREE.Mesh(
                new THREE.CylinderGeometry(0.025, 0.025, height * 0.62, 4),
                new THREE.MeshPhongMaterial({ color: 0x555555 }),
            );
            pole.position.set(-side * (depth / 2 + 0.9), height * 0.31, dz);
            g.add(pole);
        }
    }

    // ---- Sign board (shops) ----
    if (isShop && Math.random() < 0.5) {
        const signH = 0.35 + Math.random() * 0.25;
        const sign = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, signH, PANEL_Z * 0.55),
            new THREE.MeshPhongMaterial({ color: 0xf5f5f0 }),
        );
        sign.position.set(-side * (depth / 2 + 0.01), height * 0.8, 0);
        g.add(sign);
    }

    // ---- Shutter / door ----
    if (isShop && Math.random() < 0.6) {
        const shutterColor = Math.random() < 0.5 ? 0x5c6b73 : 0x8b7355;
        const shutter = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 1.6, 1.0 + Math.random() * 0.8),
            new THREE.MeshPhongMaterial({ color: shutterColor }),
        );
        shutter.position.set(-side * (depth / 2 + 0.02), 0.8, 0);
        g.add(shutter);
    }

    // ---- Windows (taller buildings) ----
    if (!isShop && height > 4) {
        const winMat = new THREE.MeshPhongMaterial({
            color: 0x88ccff, transparent: true, opacity: 0.35,
        });
        const floors = Math.floor((height - 1.5) / 1.4);
        const winPerFloor = Math.min(3, Math.floor(PANEL_Z / 1.2));
        for (let f = 1; f <= floors; f++) {
            for (let w = 0; w < winPerFloor; w++) {
                const wz = (w - (winPerFloor - 1) / 2) * 1.1;
                const win = new THREE.Mesh(
                    new THREE.BoxGeometry(0.03, 0.65, 0.55),
                    winMat,
                );
                win.position.set(-side * (depth / 2 + 0.01), 1.2 + f * 1.4, wz);
                g.add(win);
            }
        }
    }

    // ---- AC unit / balcony clutter (taller buildings) ----
    if (!isShop && height > 5 && Math.random() < 0.5) {
        const ac = new THREE.Mesh(
            new THREE.BoxGeometry(0.35, 0.3, 0.5),
            new THREE.MeshPhongMaterial({ color: 0xcccccc }),
        );
        ac.position.set(
            -side * (depth / 2 + 0.2),
            2.5 + Math.random() * (height - 4),
            (Math.random() - 0.5) * PANEL_Z * 0.6,
        );
        g.add(ac);
    }

    g.position.x = xCenter;
    return g;
}

// =========================================================================
//  Skyscraper factory — tall buildings behind the shopfronts
// =========================================================================
function makeSkyscraper(xCenter, side) {
    const g = new THREE.Group();

    // Main tower
    const height = 15 + Math.random() * 35;
    const width  = 3 + Math.random() * 4;
    const depth  = 3 + Math.random() * 4;
    const color  = pick(SKYSCRAPER_COLORS);
    const mat    = new THREE.MeshPhongMaterial({ color });

    const box = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat);
    box.position.y = height / 2;
    box.castShadow = true;
    g.add(box);

    // Top accent / roof structure
    if (Math.random() < 0.6) {
        const topH = 1.5 + Math.random() * 3;
        const topMat = new THREE.MeshPhongMaterial({
            color: pick([0xccddee, 0x445566, 0x99aabb, 0x667788]),
        });
        const top = new THREE.Mesh(
            new THREE.BoxGeometry(width * 0.6, topH, depth * 0.6),
            topMat,
        );
        top.position.y = height + topH / 2;
        g.add(top);
    }

    // Window strips (horizontal bands of glass)
    const winMat = new THREE.MeshPhongMaterial({
        color: 0x88bbdd, transparent: true, opacity: 0.25,
    });
    const numStrips = Math.min(6, Math.floor(height / 7));
    for (let i = 0; i < numStrips; i++) {
        const strip = new THREE.Mesh(
            new THREE.BoxGeometry(width + 0.05, 1.0, depth + 0.05),
            winMat,
        );
        strip.position.y = 4 + i * ((height - 4) / Math.max(1, numStrips));
        g.add(strip);
    }

    // Antenna on some tall buildings
    if (height > 35 && Math.random() < 0.4) {
        const antenna = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 4, 4),
            new THREE.MeshPhongMaterial({ color: 0x888888 }),
        );
        antenna.position.y = height + 2;
        g.add(antenna);
    }

    g.position.x = xCenter;
    return g;
}

// =========================================================================
//  Utility pole factory
// =========================================================================
function makePole() {
    const g = new THREE.Group();
    const mat = new THREE.MeshPhongMaterial({ color: 0x666666 });

    // vertical pole
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 5.5, 5), mat);
    pole.position.y = 2.75;
    g.add(pole);

    // cross-arm
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 0.05), mat);
    arm.position.y = 5.2;
    g.add(arm);

    // insulators
    for (const dx of [-0.5, 0, 0.5]) {
        const ins = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 0.12, 4),
            new THREE.MeshPhongMaterial({ color: 0x444444 }),
        );
        ins.position.set(dx, 5.28, 0);
        g.add(ins);
    }

    return g;
}
