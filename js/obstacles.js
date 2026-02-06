// ============================================================================
//  Obstacle management — spawning, AI behaviour, collision, cleanup
// ============================================================================
import { scene } from "./scene.js";
import {
    HITBOXES, LANE_LEFT, LANE_RIGHT,
    SPAWN_AHEAD, DESPAWN_BEHIND, laneX,
} from "./config.js";
import {
    createAutoRickshaw, createTruck, createCar,
    createBus, createCow, createPothole, createPolice,
} from "./vehicles.js";

// ----- Live obstacle list (exported for menu animation in main.js) -----
export const obstacles = [];

let nextSpawnZ = 60;

// =========================================================================
//  Public helpers
// =========================================================================
export function resetSpawning(z = 60) {
    nextSpawnZ = z;
}

export function clearObstacles() {
    for (const o of obstacles) scene.remove(o.mesh);
    obstacles.length = 0;
}

/** Honk effect — nearby same-direction vehicles may swerve. */
export function honkNearby(playerZ) {
    for (const o of obstacles) {
        if (o.speed > 0 && o.canChangeLane) {
            const dist = o.mesh.position.z - playerZ;
            if (dist > 0 && dist < 25 && Math.random() < 0.35) {
                o.targetLane = o.targetLane === 0 ? 1 : 0;
                o.laneChangeTimer = 2;
            }
        }
    }
}

// =========================================================================
//  Spawn a single obstacle
// =========================================================================
function spawnObstacle(type, lane, z) {
    let mesh, hitbox;
    let speed = 0;
    let canChangeLane = false;

    switch (type) {
        case "pothole":
            mesh = createPothole();
            hitbox = HITBOXES.pothole;
            break;
        case "cow":
            mesh = createCow();
            hitbox = HITBOXES.cow;
            if (Math.random() < 0.5)
                mesh.rotation.y = (Math.PI / 2) * (Math.random() < 0.5 ? 1 : -1);
            break;
        case "police":
            mesh = createPolice();
            hitbox = HITBOXES.police;
            mesh.rotation.y = Math.PI;
            break;
        case "truck":
            mesh = createTruck();
            hitbox = HITBOXES.truck;
            speed = 8 + Math.random() * 10;
            canChangeLane = Math.random() < 0.3;
            break;
        case "car":
            mesh = createCar();
            hitbox = HITBOXES.car;
            speed = 10 + Math.random() * 12;
            canChangeLane = Math.random() < 0.4;
            break;
        case "bus":
            mesh = createBus();
            hitbox = HITBOXES.bus;
            speed = 7 + Math.random() * 8;
            canChangeLane = Math.random() < 0.15;
            break;
        case "auto":
            mesh = createAutoRickshaw(0x4caf50);
            hitbox = HITBOXES.auto;
            speed = 9 + Math.random() * 8;
            canChangeLane = Math.random() < 0.5;
            break;
        case "wrongway":
            mesh = Math.random() < 0.5 ? createCar() : createTruck();
            hitbox = Math.random() < 0.5 ? HITBOXES.car : HITBOXES.truck;
            mesh.rotation.y = Math.PI;
            speed = -(25 + Math.random() * 15);
            break;
    }

    mesh.position.set(laneX(lane), 0, z);
    scene.add(mesh);

    obstacles.push({
        type, mesh, hitbox, speed,
        lane, targetLane: lane,
        canChangeLane,
        laneChangeTimer:  2 + Math.random() * 4,
        speedChangeTimer: 3 + Math.random() * 5,
        erratic: Math.random() < 0.3,
    });
}

// =========================================================================
//  Spawn new obstacles ahead of the player
// =========================================================================
function getSpawnGap(distance) {
    const diff = 1 + distance / 800;
    return Math.max(10, 30 / diff) + Math.random() * Math.max(5, 15 / diff);
}

export function manageSpawning(playerZ, distance) {
    while (nextSpawnZ < playerZ + SPAWN_AHEAD) {
        const rand = Math.random();
        const lane = Math.random() < 0.5 ? 0 : 1;
        const diff = Math.min(distance / 1000, 1);

        if (rand < 0.22) {
            spawnObstacle("pothole", lane, nextSpawnZ);
        } else if (rand < 0.35) {
            spawnObstacle("truck", lane, nextSpawnZ);
        } else if (rand < 0.48) {
            spawnObstacle("car", lane, nextSpawnZ);
        } else if (rand < 0.56) {
            spawnObstacle("bus", lane, nextSpawnZ);
        } else if (rand < 0.64) {
            spawnObstacle("auto", lane, nextSpawnZ);
        } else if (rand < 0.74) {
            spawnObstacle("cow", lane, nextSpawnZ);
        } else if (rand < 0.74 + 0.12 * diff && distance > 150) {
            spawnObstacle("police", lane, nextSpawnZ);
        } else if (rand < 0.74 + 0.12 * diff + 0.06 * diff && distance > 400) {
            spawnObstacle("wrongway", lane, nextSpawnZ);
        }
        // else: empty gap (breathing room)

        nextSpawnZ += getSpawnGap(distance);
    }
}

// =========================================================================
//  Update obstacle AI + despawn
// =========================================================================
export function updateObstacles(delta, playerZ) {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];

        // Movement
        if (o.speed !== 0) o.mesh.position.z += o.speed * delta;

        // Lane-change AI
        if (o.canChangeLane) {
            o.laneChangeTimer -= delta;
            if (o.laneChangeTimer <= 0) {
                if (o.erratic || Math.random() < 0.4)
                    o.targetLane = o.targetLane === 0 ? 1 : 0;
                o.laneChangeTimer = (o.erratic ? 1.5 : 3) + Math.random() * 3;
            }
        }

        // Speed variation
        if (o.speed > 0) {
            o.speedChangeTimer -= delta;
            if (o.speedChangeTimer <= 0) {
                const nudge = o.erratic
                    ? (Math.random() - 0.6) * 10
                    : (Math.random() - 0.5) * 5;
                o.speed = Math.max(o.erratic ? 3 : 5, o.speed + nudge);
                o.speedChangeTimer = 2 + Math.random() * 4;
            }
        }

        // Smooth lane transition
        const targetX = laneX(o.targetLane);
        o.mesh.position.x += (targetX - o.mesh.position.x) * 3 * delta;
        o.lane = Math.abs(o.mesh.position.x - LANE_LEFT) <
                 Math.abs(o.mesh.position.x - LANE_RIGHT) ? 0 : 1;

        // Tilt while changing lanes
        const xDiff = targetX - o.mesh.position.x;
        if (Math.abs(xDiff) > 0.1 && o.speed > 0) {
            o.mesh.rotation.z = -xDiff * 0.05;
        } else {
            o.mesh.rotation.z *= 0.9;
        }

        // Despawn if far behind
        if (o.mesh.position.z < playerZ - DESPAWN_BEHIND ||
            (o.speed < 0 && o.mesh.position.z < playerZ - 50)) {
            scene.remove(o.mesh);
            obstacles.splice(i, 1);
        }
    }
}

// =========================================================================
//  Collision detection
// =========================================================================
export function checkCollisions(playerMesh, vehicleType) {
    if (!playerMesh) return null;

    const px  = playerMesh.position.x;
    const pz  = playerMesh.position.z;
    const phb = HITBOXES[vehicleType];
    const FAIRNESS = 0.85; // shrink hitboxes slightly

    for (const o of obstacles) {
        const ox  = o.mesh.position.x;
        const oz  = o.mesh.position.z;
        const ohb = o.hitbox;

        if (Math.abs(px - ox) < (phb.width  + ohb.width)  * 0.5 * FAIRNESS &&
            Math.abs(pz - oz) < (phb.length + ohb.length) * 0.5 * FAIRNESS) {
            return o;
        }
    }
    return null;
}

// =========================================================================
//  Menu-screen decoration traffic
// =========================================================================
export function createMenuTraffic() {
    const types = ["truck", "car", "bus", "auto", "cow"];
    for (let i = 0; i < 8; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const lane = Math.random() < 0.5 ? 0 : 1;
        spawnObstacle(type, lane, 10 + i * 20 + Math.random() * 10);
    }
    for (let i = 0; i < 3; i++) {
        spawnObstacle("pothole", Math.random() < 0.5 ? 0 : 1, 15 + i * 30);
    }
}
