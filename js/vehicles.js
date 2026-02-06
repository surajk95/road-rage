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

    // body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 1.6), bodyMat);
    body.position.set(0, 0.9, 0);
    body.castShadow = true;
    g.add(body);

    // brown spots
    const spot1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.4), brownMat);
    spot1.position.set(0.35, 1.05, 0.2);
    g.add(spot1);
    const spot2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.35), brownMat);
    spot2.position.set(-0.3, 1.0, -0.3);
    g.add(spot2);

    // head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), bodyMat);
    head.position.set(0, 1.1, 1.0);
    g.add(head);

    // horns
    for (const x of [-0.2, 0.2]) {
        const horn = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.04, 0.2, 5),
            new THREE.MeshPhongMaterial({ color: 0xbdbdbd }),
        );
        horn.position.set(x, 1.45, 1.0);
        horn.rotation.z = x > 0 ? -0.3 : 0.3;
        g.add(horn);
    }

    // eyes
    for (const x of [-0.12, 0.12]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), blkMat);
        eye.position.set(x, 1.2, 1.26);
        g.add(eye);
    }

    // legs
    for (const [x, z] of [[-0.25, 0.5], [0.25, 0.5], [-0.25, -0.5], [0.25, -0.5]]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.15), bodyMat);
        leg.position.set(x, 0.25, z);
        g.add(leg);
    }

    // tail
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.5), brownMat);
    tail.position.set(0, 0.95, -1.05);
    g.add(tail);

    return g;
}

export function createPothole() {
    const g = new THREE.Group();

    // dark crater
    const crater = new THREE.Mesh(
        new THREE.CircleGeometry(0.7, 12),
        new THREE.MeshLambertMaterial({ color: 0x0a0a0a }),
    );
    crater.rotation.x = -Math.PI / 2;
    crater.position.y = 0.015;
    g.add(crater);

    // cracked edge
    const edge = new THREE.Mesh(
        new THREE.RingGeometry(0.6, 0.9, 12),
        new THREE.MeshLambertMaterial({ color: 0x1a1a1a }),
    );
    edge.rotation.x = -Math.PI / 2;
    edge.position.y = 0.012;
    g.add(edge);

    // rubble bits
    for (let i = 0; i < 5; i++) {
        const bit = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.04, 0.08),
            new THREE.MeshLambertMaterial({ color: 0x333333 }),
        );
        const angle = Math.random() * Math.PI * 2;
        const dist  = 0.3 + Math.random() * 0.3;
        bit.position.set(Math.cos(angle) * dist, 0.02, Math.sin(angle) * dist);
        bit.rotation.y = Math.random() * Math.PI;
        g.add(bit);
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
