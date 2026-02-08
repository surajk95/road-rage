// ============================================================================
//  3-D model factories for every vehicle / obstacle type
// ============================================================================
import * as THREE from "three";

// ---- Shared material helpers ----
const black   = () => new THREE.MeshPhongMaterial({ color: 0x111111 });
const glass   = () => new THREE.MeshPhongMaterial({ color: 0x88ccff, transparent: true, opacity: 0.4 });
const wheel   = (r = 0.2, h = 0.12) => new THREE.CylinderGeometry(r, r, h, 8);

function addWheels(group, positions, radius = 0.2, height = 0.12) {
    const geo = wheel(radius, height);
    const mat = black();
    for (const [x, y, z] of positions) {
        const w = new THREE.Mesh(geo, mat);
        w.rotation.z = Math.PI / 2;
        w.position.set(x, y, z);
        group.add(w);
    }
}

// =========================================================================
//  Player vehicles
// =========================================================================
export function createAutoRickshaw(color = 0x2e7d32) {
    const g   = new THREE.Group();
    const mat = new THREE.MeshPhongMaterial({ color });
    const yMat = new THREE.MeshPhongMaterial({ color: 0xffd600 });

    // body
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.0, 1.8), mat);
    body.position.set(0, 0.85, -0.1);
    body.castShadow = true;
    g.add(body);

    // roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 1.9), mat);
    roof.position.set(0, 1.4, -0.1);
    g.add(roof);

    // front
    const front = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.5), mat);
    front.position.set(0, 0.65, 0.85);
    g.add(front);

    // yellow stripe
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.2, 1.82), yMat);
    stripe.position.set(0, 0.38, -0.1);
    g.add(stripe);

    // windshield
    const ws = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.04), glass());
    ws.position.set(0, 1.05, 1.05);
    g.add(ws);

    // headlight
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), yMat);
    hl.position.set(0, 0.6, 1.12);
    g.add(hl);

    // wheels (1 front, 2 rear)
    addWheels(g, [[0, 0.18, 0.8], [-0.65, 0.18, -0.6], [0.65, 0.18, -0.6]], 0.18);
    return g;
}

export function createScooty(color = 0x1565c0) {
    const g       = new THREE.Group();
    const mat     = new THREE.MeshPhongMaterial({ color });
    const blkMat  = new THREE.MeshPhongMaterial({ color: 0x222222 });
    const skinMat = new THREE.MeshPhongMaterial({ color: 0xd7a86e });

    // body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.4, 1.4), mat);
    body.position.set(0, 0.45, 0);
    body.castShadow = true;
    g.add(body);

    // seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.65), blkMat);
    seat.position.set(0, 0.7, -0.1);
    g.add(seat);

    // handlebar stem
    const stem = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.55, 0.08),
        new THREE.MeshPhongMaterial({ color: 0x666666 }),
    );
    stem.position.set(0, 0.75, 0.6);
    g.add(stem);

    // handlebars
    const hb = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 0.06), blkMat);
    hb.position.set(0, 1.05, 0.6);
    g.add(hb);

    // wheels
    addWheels(g, [[0, 0.22, 0.6], [0, 0.22, -0.55]], 0.22, 0.1);

    // rider torso
    const torso = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.5, 0.25),
        new THREE.MeshPhongMaterial({ color: 0x5d4037 }),
    );
    torso.position.set(0, 1.1, -0.05);
    g.add(torso);

    // rider head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), skinMat);
    head.position.set(0, 1.5, -0.05);
    g.add(head);

    // helmet
    const helmet = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 8, 6),
        new THREE.MeshPhongMaterial({ color: 0x333333 }),
    );
    helmet.position.set(0, 1.55, -0.05);
    helmet.scale.set(1, 0.7, 1);
    g.add(helmet);

    return g;
}

// =========================================================================
//  Traffic vehicles
// =========================================================================
const TRUCK_COLORS = [0xe53935, 0x1e88e5, 0x43a047, 0xfb8c00, 0x8e24aa, 0x00897b];
const CAR_COLORS   = [0xeeeeee, 0x37474f, 0xc62828, 0x1565c0, 0x6a1b9a, 0x2e7d32, 0xf9a825, 0x4e342e];
const BUS_COLORS   = [0xd32f2f, 0x1976d2, 0xf57c00, 0x388e3c];

function randomColor(palette) {
    return palette[Math.floor(Math.random() * palette.length)];
}

export function createTruck() {
    const g   = new THREE.Group();
    const mat = new THREE.MeshPhongMaterial({ color: randomColor(TRUCK_COLORS) });

    // cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.6, 1.6), mat);
    cabin.position.set(0, 1.3, 1.3);
    cabin.castShadow = true;
    g.add(cabin);

    // cargo
    const cargo = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.0, 3.5), mat);
    cargo.position.set(0, 1.5, -1.0);
    cargo.castShadow = true;
    g.add(cargo);

    // "HORN OK PLEASE" panel
    const panel = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.4, 0.04),
        new THREE.MeshPhongMaterial({ color: 0xffeb3b }),
    );
    panel.position.set(0, 0.7, -2.78);
    g.add(panel);

    // decorative dots
    for (const [x, y] of [[-0.4, 1.0], [0, 1.0], [0.4, 1.0]]) {
        const dot = new THREE.Mesh(
            new THREE.SphereGeometry(0.06, 6, 6),
            new THREE.MeshBasicMaterial({ color: 0xff0000 }),
        );
        dot.position.set(x, y, -2.78);
        g.add(dot);
    }

    // mudflaps
    const flapMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
    for (const x of [-0.9, 0.9]) {
        const flap = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.04), flapMat);
        flap.position.set(x, 0.2, -2.75);
        g.add(flap);
    }

    // wheels (6)
    const positions = [];
    for (const x of [-0.9, 0.9])
        for (const z of [0.8, -0.8, -1.8])
            positions.push([x, 0.28, z]);
    addWheels(g, positions, 0.28, 0.18);
    return g;
}

export function createCar() {
    const g   = new THREE.Group();
    const mat = new THREE.MeshPhongMaterial({ color: randomColor(CAR_COLORS) });

    // body
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 3.2), mat);
    body.position.set(0, 0.6, 0);
    body.castShadow = true;
    g.add(body);

    // cabin
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 1.6), mat);
    cab.position.set(0, 1.25, -0.2);
    g.add(cab);

    // windshield
    const ws = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.04), glass());
    ws.position.set(0, 1.2, 0.55);
    ws.rotation.x = 0.2;
    g.add(ws);

    // rear window
    const rw = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.04), glass());
    rw.position.set(0, 1.2, -0.95);
    rw.rotation.x = -0.2;
    g.add(rw);

    // wheels (4)
    const positions = [];
    for (const x of [-0.75, 0.75])
        for (const z of [0.9, -0.9])
            positions.push([x, 0.22, z]);
    addWheels(g, positions, 0.22);

    // headlights
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
    for (const x of [-0.5, 0.5]) {
        const hl = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), hlMat);
        hl.position.set(x, 0.5, 1.62);
        g.add(hl);
    }
    return g;
}

export function createBus() {
    const g      = new THREE.Group();
    const mat    = new THREE.MeshPhongMaterial({ color: randomColor(BUS_COLORS) });
    const winMat = new THREE.MeshPhongMaterial({ color: 0x88ccff, transparent: true, opacity: 0.35 });

    // body
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.0, 5.5), mat);
    body.position.set(0, 1.5, 0);
    body.castShadow = true;
    g.add(body);

    // white stripe
    const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(2.12, 0.25, 5.52),
        new THREE.MeshPhongMaterial({ color: 0xeeeeee }),
    );
    stripe.position.set(0, 1.0, 0);
    g.add(stripe);

    // windows
    for (let i = -2; i <= 2; i++) {
        for (const x of [-1.06, 1.06]) {
            const win = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.6, 0.7), winMat);
            win.position.set(x, 1.8, i * 1.0);
            g.add(win);
        }
    }

    // wheels (4)
    const positions = [];
    for (const x of [-1.0, 1.0])
        for (const z of [1.8, -1.8])
            positions.push([x, 0.3, z]);
    addWheels(g, positions, 0.3, 0.2);
    return g;
}

// =========================================================================
//  Static obstacles
// =========================================================================
export function createCow() {
    const g        = new THREE.Group();
    const bodyMat  = new THREE.MeshPhongMaterial({ color: 0xf5f5dc });
    const brownMat = new THREE.MeshPhongMaterial({ color: 0x8d6e63 });
    const blkMat   = new THREE.MeshPhongMaterial({ color: 0x111111 });

    // Sitting body — low to the ground
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.65, 1.4), bodyMat);
    body.position.set(0, 0.35, 0);
    body.castShadow = true;
    g.add(body);

    // Folded front legs (visible bumps)
    for (const x of [-0.3, 0.3]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.35), bodyMat);
        leg.position.set(x, 0.1, -0.4);
        g.add(leg);
    }
    // Folded rear legs (tucked under)
    for (const x of [-0.3, 0.3]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.3), bodyMat);
        leg.position.set(x, 0.09, 0.35);
        g.add(leg);
    }

    // Neck (angled upward toward -Z / viewer)
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.35), bodyMat);
    neck.position.set(0, 0.7, -0.65);
    neck.rotation.x = 0.3;
    g.add(neck);

    // Head — facing viewer (-Z)
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.4), bodyMat);
    head.position.set(0, 0.95, -0.85);
    g.add(head);

    // Muzzle
    const nose = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.22, 0.15),
        new THREE.MeshPhongMaterial({ color: 0xdeb887 }),
    );
    nose.position.set(0, 0.85, -1.08);
    g.add(nose);

    // Eyes (facing -Z)
    for (const x of [-0.13, 0.13]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), blkMat);
        eye.position.set(x, 1.0, -1.06);
        g.add(eye);
    }

    // Ears
    for (const x of [-0.28, 0.28]) {
        const ear = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.15), bodyMat);
        ear.position.set(x, 1.02, -0.8);
        ear.rotation.z = x > 0 ? -0.4 : 0.4;
        g.add(ear);
    }

    // Horns
    for (const x of [-0.18, 0.18]) {
        const horn = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.04, 0.22, 5),
            new THREE.MeshPhongMaterial({ color: 0xbdbdbd }),
        );
        horn.position.set(x, 1.2, -0.82);
        horn.rotation.z = x > 0 ? -0.3 : 0.3;
        g.add(horn);
    }

    // Brown spots
    const spot1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.4), brownMat);
    spot1.position.set(0.35, 0.5, 0.1);
    g.add(spot1);
    const spot2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.35), brownMat);
    spot2.position.set(-0.3, 0.45, -0.2);
    g.add(spot2);

    // Tail (lying on the ground behind)
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.5), brownMat);
    tail.position.set(0.15, 0.15, 0.9);
    g.add(tail);

    // --- Calves sitting nearby (1-2, part of the cow group) ---
    const numCalves = 1 + Math.floor(Math.random() * 2);
    for (let c = 0; c < numCalves; c++) {
        const calf = _buildCalf();
        calf.position.set(
            0.65 + c * 0.35,
            0,
            -0.15 + c * 0.65,
        );
        calf.rotation.y = (Math.random() - 0.5) * 0.5;
        g.add(calf);
    }

    return g;
}

/** Internal helper — builds a single sitting calf mesh */
function _buildCalf() {
    const g        = new THREE.Group();
    const bodyMat  = new THREE.MeshPhongMaterial({ color: 0xf0dfc0 });
    const brownMat = new THREE.MeshPhongMaterial({ color: 0xb08968 });
    const blkMat   = new THREE.MeshPhongMaterial({ color: 0x111111 });

    // Tiny sitting body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.8), bodyMat);
    body.position.set(0, 0.22, 0);
    body.castShadow = true;
    g.add(body);

    // Folded legs
    for (const [x, z] of [[-0.18, -0.25], [0.18, -0.25], [-0.18, 0.2], [0.18, 0.2]]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.18), bodyMat);
        leg.position.set(x, 0.06, z);
        g.add(leg);
    }

    // Head — facing viewer (-Z)
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.25), bodyMat);
    head.position.set(0, 0.5, -0.5);
    g.add(head);

    // Big calf eyes
    for (const x of [-0.08, 0.08]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), blkMat);
        eye.position.set(x, 0.54, -0.64);
        g.add(eye);
    }

    // Ears
    for (const x of [-0.18, 0.18]) {
        const ear = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.08), bodyMat);
        ear.position.set(x, 0.58, -0.45);
        ear.rotation.z = x > 0 ? -0.5 : 0.5;
        g.add(ear);
    }

    // Spot
    const spot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.15, 0.22), brownMat);
    spot.position.set(0.18, 0.3, 0.1);
    g.add(spot);

    // Little tail
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.25), brownMat);
    tail.position.set(0, 0.12, 0.5);
    g.add(tail);

    return g;
}

export function createPothole() {
    const g = new THREE.Group();

    // light brown/tan earth crater (exposed ground - much lighter)
    const crater = new THREE.Mesh(
        new THREE.CircleGeometry(0.7, 12),
        new THREE.MeshLambertMaterial({ color: 0xa1887f }),
    );
    crater.rotation.x = -Math.PI / 2;
    crater.position.y = 0.015;
    g.add(crater);

    // medium brown inner hole
    const innerHole = new THREE.Mesh(
        new THREE.CircleGeometry(0.4, 10),
        new THREE.MeshLambertMaterial({ color: 0x795548 }),
    );
    innerHole.rotation.x = -Math.PI / 2;
    innerHole.position.y = 0.018;
    g.add(innerHole);

    // cracked asphalt edge
    const edge = new THREE.Mesh(
        new THREE.RingGeometry(0.6, 0.9, 12),
        new THREE.MeshLambertMaterial({ color: 0x2a2a2a }),
    );
    edge.rotation.x = -Math.PI / 2;
    edge.position.y = 0.012;
    g.add(edge);

    // dirt/gravel rubble bits (light brown/tan)
    for (let i = 0; i < 5; i++) {
        const bit = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.04, 0.08),
            new THREE.MeshLambertMaterial({ color: 0x8d6e63 }),
        );
        const angle = Math.random() * Math.PI * 2;
        const dist  = 0.3 + Math.random() * 0.3;
        bit.position.set(Math.cos(angle) * dist, 0.02, Math.sin(angle) * dist);
        bit.rotation.y = Math.random() * Math.PI;
        g.add(bit);
    }

    // broken asphalt chunks (dark grey)
    for (let i = 0; i < 3; i++) {
        const chunk = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.03, 0.1),
            new THREE.MeshLambertMaterial({ color: 0x1a1a1a }),
        );
        const angle = Math.random() * Math.PI * 2;
        const dist  = 0.5 + Math.random() * 0.25;
        chunk.position.set(Math.cos(angle) * dist, 0.015, Math.sin(angle) * dist);
        chunk.rotation.y = Math.random() * Math.PI;
        g.add(chunk);
    }

    return g;
}

export function createRoughPatch() {
    const g = new THREE.Group();

    // rough patch base (light brown/tan weathered road) - much longer stretches
    const patchWidth = 1.8 + Math.random() * 0.8;
    const patchLength = 8 + Math.random() * 12; // 8-20 meters long
    
    const base = new THREE.Mesh(
        new THREE.PlaneGeometry(patchWidth, patchLength),
        new THREE.MeshLambertMaterial({ color: 0x9e9e9e }),
    );
    base.rotation.x = -Math.PI / 2;
    base.position.y = 0.01;
    g.add(base);

    // rough texture with random bumps (light brown tones)
    const bumpCount = 8 + Math.floor(Math.random() * 8);
    for (let i = 0; i < bumpCount; i++) {
        const bump = new THREE.Mesh(
            new THREE.BoxGeometry(
                0.15 + Math.random() * 0.25,
                0.02 + Math.random() * 0.03,
                0.15 + Math.random() * 0.25,
            ),
            new THREE.MeshLambertMaterial({ 
                color: Math.random() < 0.5 ? 0xa1887f : 0xbcaaa4,
            }),
        );
        bump.position.set(
            (Math.random() - 0.5) * patchWidth * 0.8,
            0.015 + Math.random() * 0.01,
            (Math.random() - 0.5) * patchLength * 0.8,
        );
        bump.rotation.y = Math.random() * Math.PI;
        g.add(bump);
    }

    // cracks (thin dark lines)
    for (let i = 0; i < 3; i++) {
        const crack = new THREE.Mesh(
            new THREE.PlaneGeometry(0.04, 0.8 + Math.random() * 1.5),
            new THREE.MeshLambertMaterial({ color: 0x4a4a4a }),
        );
        crack.rotation.x = -Math.PI / 2;
        crack.rotation.z = Math.random() * Math.PI;
        crack.position.set(
            (Math.random() - 0.5) * patchWidth * 0.6,
            0.012,
            (Math.random() - 0.5) * patchLength * 0.6,
        );
        g.add(crack);
    }

    return g;
}

export function createPolice() {
    const g        = new THREE.Group();
    const khaki    = new THREE.MeshPhongMaterial({ color: 0xc3a86b });
    const skin     = new THREE.MeshPhongMaterial({ color: 0xd2a06c });
    const redMat   = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    const whiteMat = new THREE.MeshPhongMaterial({ color: 0xffffff });

    // legs
    for (const x of [-0.1, 0.1]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.8, 0.18), khaki);
        leg.position.set(x, 0.4, 0);
        g.add(leg);
    }

    // torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.7, 0.25), khaki);
    torso.position.set(0, 1.15, 0);
    torso.castShadow = true;
    g.add(torso);

    // belt
    const belt = new THREE.Mesh(
        new THREE.BoxGeometry(0.47, 0.08, 0.27),
        new THREE.MeshPhongMaterial({ color: 0x5d4037 }),
    );
    belt.position.set(0, 0.85, 0);
    g.add(belt);

    // head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), skin);
    head.position.set(0, 1.7, 0);
    g.add(head);

    // hat
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.12, 8), khaki);
    hat.position.set(0, 1.92, 0);
    g.add(hat);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.03, 8), khaki);
    brim.position.set(0, 1.87, 0);
    g.add(brim);

    // outstretched arm
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.12), khaki);
    arm.position.set(0.5, 1.3, 0);
    g.add(arm);

    // stop sign
    const sign = new THREE.Mesh(new THREE.CircleGeometry(0.14, 8), redMat);
    sign.position.set(0.82, 1.3, 0.01);
    g.add(sign);
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.06, 6), whiteMat);
    dot.position.set(0.82, 1.3, 0.02);
    g.add(dot);

    // traffic cone
    const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.15, 0.5, 6),
        new THREE.MeshPhongMaterial({ color: 0xff6d00 }),
    );
    cone.position.set(-0.5, 0.25, 0.3);
    g.add(cone);
    const coneStripe = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.08, 6), whiteMat);
    coneStripe.position.set(-0.5, 0.3, 0.3);
    g.add(coneStripe);

    return g;
}
