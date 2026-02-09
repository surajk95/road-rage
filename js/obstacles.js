// ============================================================================
//  Obstacle management — spawning, AI behaviour, collision, cleanup
// ============================================================================
import * as THREE from "three";
import { scene } from "./scene.js";
import {
    HITBOXES, LANE_LEFT, LANE_RIGHT,
    SPAWN_AHEAD, DESPAWN_BEHIND, laneX,
} from "./config.js";
import {
    createAutoRickshaw, createTruck, createCar,
    createBus, createCow, createDog, createPothole, createPolice, createRoughPatch,
} from "./vehicles.js";

// ----- Live obstacle list (exported for menu animation in main.js) -----
export const obstacles = [];

let nextSpawnZ = 60;

// =========================================================================
//  Boom effects (NPC crashes)
// =========================================================================
const booms = [];

function createBoom(x, y, z) {
    const g = new THREE.Group();
    const colors = [0xff6600, 0xff3300, 0xffcc00, 0xff9900, 0xff0000];
    for (let i = 0; i < 10; i++) {
        const mat = new THREE.MeshBasicMaterial({
            color: colors[Math.floor(Math.random() * colors.length)],
            transparent: true,
            opacity: 1.0,
        });
        const size = 0.15 + Math.random() * 0.35;
        const piece = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), mat);
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * 0.5;
        piece.position.set(Math.cos(angle) * r, Math.random() * 0.5, Math.sin(angle) * r);
        piece.userData.vx = (Math.random() - 0.5) * 6;
        piece.userData.vy = 2 + Math.random() * 5;
        piece.userData.vz = (Math.random() - 0.5) * 6;
        g.add(piece);
    }
    g.position.set(x, y, z);
    scene.add(g);
    booms.push({ mesh: g, life: 0.8 });
}

function updateBooms(delta) {
    for (let i = booms.length - 1; i >= 0; i--) {
        const b = booms[i];
        b.life -= delta * 2.5;
        for (const child of b.mesh.children) {
            child.position.x += child.userData.vx * delta;
            child.position.y += child.userData.vy * delta;
            child.position.z += child.userData.vz * delta;
            child.userData.vy -= 12 * delta;
            if (child.material) child.material.opacity = Math.max(0, b.life);
        }
        if (b.life <= 0) {
            scene.remove(b.mesh);
            b.mesh.traverse((c) => {
                if (c.geometry) c.geometry.dispose();
                if (c.material) c.material.dispose();
            });
            booms.splice(i, 1);
        }
    }
}

// =========================================================================
//  Public helpers
// =========================================================================
export function resetSpawning(z = 60) {
    nextSpawnZ = z;
}

export function clearObstacles() {
    for (const o of obstacles) scene.remove(o.mesh);
    obstacles.length = 0;
    for (const b of booms) {
        scene.remove(b.mesh);
        b.mesh.traverse((c) => {
            if (c.geometry) c.geometry.dispose();
            if (c.material) c.material.dispose();
        });
    }
    booms.length = 0;
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
        case "roughpatch":
            mesh = createRoughPatch();
            hitbox = HITBOXES.roughpatch;
            break;
        case "cow":
            mesh = createCow();
            hitbox = HITBOXES.cow;
            break;
        case "dog":
            mesh = createDog();
            hitbox = HITBOXES.dog;
            // Dogs face random direction (some cross, some stand)
            mesh.rotation.y = Math.random() * Math.PI * 2;
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
            speed = 14 + Math.random() * 14;   // fast & aggressive
            canChangeLane = true;                // always changes lanes
            break;
        case "wrongway":
            mesh = Math.random() < 0.5 ? createCar() : createTruck();
            hitbox = Math.random() < 0.5 ? HITBOXES.car : HITBOXES.truck;
            mesh.rotation.y = Math.PI;
            speed = -(25 + Math.random() * 15);
            break;
    }

    // Dogs always cross the road (100% crossing)
    const isDogCrossing = type === "dog";
    
    // For dogs, ALWAYS spawn them at the road edge (outside the lane)
    let spawnX;
    let dogStartSide; // which side of road dog starts from
    if (type === "dog") {
        // Randomly pick which side to start from
        dogStartSide = Math.random() < 0.5 ? 'left' : 'right';
        spawnX = dogStartSide === 'left' ? -3.0 : 3.0; // well outside the road
    } else {
        spawnX = laneX(lane); // normal lane position
        dogStartSide = null;
    }
    
    mesh.position.set(spawnX, 0, z);
    scene.add(mesh);
    
    obstacles.push({
        type, mesh, hitbox, speed,
        lane, 
        targetLane: lane, // not used for crossing dogs
        canChangeLane: false, // dogs don't use normal lane change logic
        laneChangeTimer:
            type === "auto"
                ? 0.5 + Math.random() * 1.5
                : 2 + Math.random() * 4,
        speedChangeTimer: 3 + Math.random() * 5,
        erratic: type === "auto" || Math.random() < 0.3,
        spawnGrace: 0.3, // shorter grace for dogs
        isCrossing: isDogCrossing,
        hasCrossed: false, // track if dog has completed crossing
        dogStartSide: dogStartSide, // track which side dog started from
    });
}

// =========================================================================
//  Spawn new obstacles ahead of the player
// =========================================================================
function getSpawnGap(distance) {
    const diff = 1 + distance / 400;
    return Math.max(4, 14 / diff) + Math.random() * Math.max(2, 6 / diff);
}

export function manageSpawning(playerZ, distance) {
    // Ensure minimum 1-2 cow groups on road at all times (less frequent)
    const cowCount = obstacles.filter((o) => o.type === "cow").length;
    if (cowCount < 1) {
        const lane = Math.random() < 0.5 ? 0 : 1;
        const z = playerZ + 60 + Math.random() * 120;
        spawnObstacle("cow", lane, z);
    }

    // Spawn dogs very close to player so they appear suddenly
    if (Math.random() < 0.003) { // 0.3% chance per frame to spawn a crossing dog
        const lane = Math.random() < 0.5 ? 0 : 1;
        const z = playerZ + 10 + Math.random() * 15; // spawn very close (10-25 units ahead)
        spawnObstacle("dog", lane, z);
    }

    while (nextSpawnZ < playerZ + SPAWN_AHEAD) {
        const rand = Math.random();
        const lane = Math.random() < 0.5 ? 0 : 1;
        const diff = Math.min(distance / 1000, 1);

        let obstacleType = null;
        let isGameOver = false; // tracks if obstacle causes game over

        if (rand < 0.04) {
            obstacleType = "pothole";
            isGameOver = true;
        } else if (rand < 0.40) {
            // Way more frequent rough patches (36% spawn rate)
            obstacleType = "roughpatch";
            isGameOver = false;
        } else if (rand < 0.48) {
            obstacleType = "auto";
            isGameOver = true;
        } else if (rand < 0.58) {
            obstacleType = "car";
            isGameOver = true;
        } else if (rand < 0.68) {
            obstacleType = "truck";
            isGameOver = true;
        } else if (rand < 0.74) {
            obstacleType = "bus";
            isGameOver = true;
        } else if (rand < 0.81) {
            obstacleType = "cow";
            isGameOver = true;
        } else if (rand < 0.81 + 0.08 * diff && distance > 150) {
            obstacleType = "police";
            isGameOver = true;
        } else if (rand < 0.84 + 0.08 * diff + 0.06 * diff && distance > 400) {
            obstacleType = "wrongway";
            isGameOver = true;
        } else {
            // Fill the rest with extra traffic (auto-heavy)
            const extras = ["auto", "auto", "car", "truck", "auto"];
            obstacleType = extras[Math.floor(Math.random() * extras.length)];
            isGameOver = true;
        }

        spawnObstacle(obstacleType, lane, nextSpawnZ);

        // Frequently spawn in both lanes for heavier traffic
        // But NEVER block both lanes with game-over obstacles at the same Z position
        if (Math.random() < 0.35 && rand >= 0.04) {
            const otherLane = lane === 0 ? 1 : 0;
            
            // If the first obstacle is game-over, second one MUST be passable (rough patch)
            if (isGameOver) {
                // Always spawn rough patch in other lane to ensure player has escape route
                spawnObstacle("roughpatch", otherLane, nextSpawnZ + (Math.random() - 0.5) * 3);
            } else {
                // First obstacle is safe (rough patch), so we can spawn anything in other lane
                if (Math.random() < 0.5) {
                    spawnObstacle("roughpatch", otherLane, nextSpawnZ + (Math.random() - 0.5) * 3);
                } else {
                    const types = ["auto", "car", "truck", "auto", "auto", "bus"];
                    spawnObstacle(
                        types[Math.floor(Math.random() * types.length)],
                        otherLane,
                        nextSpawnZ + (Math.random() - 0.5) * 3,
                    );
                }
            }
        }

        nextSpawnZ += getSpawnGap(distance);
    }
}

// =========================================================================
//  NPC-to-NPC collision detection
// =========================================================================
function checkNPCCollisions(playerZ) {
    const toRemove = new Set();

    for (let i = 0; i < obstacles.length; i++) {
        const a = obstacles[i];
        // Skip if already marked for removal
        if (toRemove.has(a)) continue;
        // Skip if still in spawn grace period
        if (a.spawnGrace > 0) continue;
        // Skip if too far from player (optimization)
        if (Math.abs(a.mesh.position.z - playerZ) > 100) continue;
        // At least one object must be moving for a collision
        if (a.speed === 0) continue;

        for (let j = i + 1; j < obstacles.length; j++) {
            const b = obstacles[j];
            // Skip if already marked for removal
            if (toRemove.has(b)) continue;
            // Skip if still in spawn grace period
            if (b.spawnGrace > 0) continue;
            // Skip rough patches - NPCs can drive over them just like the player
            if (b.type === "roughpatch") continue;

            const dx = Math.abs(a.mesh.position.x - b.mesh.position.x);
            const dz = Math.abs(a.mesh.position.z - b.mesh.position.z);
            const overlapX = (a.hitbox.width + b.hitbox.width) * 0.35;
            const overlapZ = (a.hitbox.length + b.hitbox.length) * 0.35;

            if (dx < overlapX && dz < overlapZ) {
                toRemove.add(a);
                toRemove.add(b);
                createBoom(
                    (a.mesh.position.x + b.mesh.position.x) / 2,
                    0.5,
                    (a.mesh.position.z + b.mesh.position.z) / 2,
                );
            }
        }
    }

    if (toRemove.size > 0) {
        for (let i = obstacles.length - 1; i >= 0; i--) {
            if (toRemove.has(obstacles[i])) {
                scene.remove(obstacles[i].mesh);
                obstacles.splice(i, 1);
            }
        }
    }
}

// =========================================================================
//  Update obstacle AI + despawn
// =========================================================================
export function updateObstacles(delta, playerZ) {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];

        // Spawn grace countdown
        if (o.spawnGrace > 0) o.spawnGrace -= delta;

        // Movement
        if (o.speed !== 0) o.mesh.position.z += o.speed * delta;

        // Lane-change AI
        const isDog = o.type === "dog";
        
        // Dogs cross immediately without timer
        if (isDog && o.isCrossing && !o.hasCrossed) {
            // Dog is actively crossing - no timer needed
            // (targetLane already set at spawn)
        } else if (o.canChangeLane && !isDog) {
            // Regular vehicle lane changing
            o.laneChangeTimer -= delta;
            if (o.laneChangeTimer <= 0) {
                const isAuto = o.type === "auto";
                if (isAuto || o.erratic || Math.random() < 0.4)
                    o.targetLane = o.targetLane === 0 ? 1 : 0;
                
                o.laneChangeTimer = isAuto
                    ? 0.5 + Math.random() * 1.5
                    : (o.erratic ? 1.5 : 3) + Math.random() * 3;
            }
        }

        // Speed variation
        if (o.speed > 0) {
            o.speedChangeTimer -= delta;
            if (o.speedChangeTimer <= 0) {
                const isAuto = o.type === "auto";
                const nudge =
                    o.erratic || isAuto
                        ? (Math.random() - 0.5) * 12
                        : (Math.random() - 0.5) * 5;
                o.speed = Math.max(o.erratic ? 3 : 5, o.speed + nudge);
                o.speedChangeTimer = isAuto
                    ? 1 + Math.random() * 2
                    : 2 + Math.random() * 4;
            }
        }

        // Smooth lane transition
        let targetX;
        
        // Dogs crossing - target WELL BEYOND the opposite road edge
        if (isDog && o.isCrossing && !o.hasCrossed) {
            // Cross to well past the opposite side of the road
            targetX = o.dogStartSide === 'left' ? 3.5 : -3.5; // target beyond the road
        } else {
            targetX = laneX(o.targetLane);
        }
        
        // Dogs move across lanes at moderate speed
        const laneSpeed = isDog && o.isCrossing && !o.hasCrossed ? 4 : 3;
        o.mesh.position.x += (targetX - o.mesh.position.x) * laneSpeed * delta;
        
        // Dogs run forward while crossing the road
        if (isDog && o.isCrossing && !o.hasCrossed) {
            const distanceToTarget = Math.abs(targetX - o.mesh.position.x);
            
            // Keep running until completely off the road
            if (distanceToTarget > 0.1) {
                const runSpeed = 7; // dog running speed forward (slower)
                o.mesh.position.z += runSpeed * delta;
                
                // Point dog in direction of movement (diagonal across road)
                const crossDirection = targetX > o.mesh.position.x ? 1 : -1;
                o.mesh.rotation.y = crossDirection > 0 ? -Math.PI / 4 : Math.PI / 4;
                
                // Simple running animation - bob up and down
                const bobSpeed = 16;
                o.mesh.position.y = Math.abs(Math.sin((o.mesh.position.z + o.mesh.position.x) * bobSpeed)) * 0.08;
            } else {
                // Dog completely off the road - mark for removal
                o.hasCrossed = true;
                o.mesh.position.y = 0;
            }
        } else if (isDog && !o.isCrossing) {
            // Standing dog - shouldn't happen anymore
            o.mesh.position.y = 0;
        }
        
        o.lane =
            Math.abs(o.mesh.position.x - LANE_LEFT) <
            Math.abs(o.mesh.position.x - LANE_RIGHT)
                ? 0
                : 1;

        // Tilt while changing lanes (vehicles only)
        const xDiff = targetX - o.mesh.position.x;
        if (Math.abs(xDiff) > 0.1 && o.speed > 0 && !isDog) {
            o.mesh.rotation.z = -xDiff * 0.05;
        } else if (!isDog) {
            o.mesh.rotation.z *= 0.9;
        }

        // Despawn if far behind OR if dog has crossed and reached the edge
        if (
            o.mesh.position.z < playerZ - DESPAWN_BEHIND ||
            (o.speed < 0 && o.mesh.position.z < playerZ - 50) ||
            (isDog && o.hasCrossed) // Remove dog after it crosses
        ) {
            scene.remove(o.mesh);
            obstacles.splice(i, 1);
        }
    }

    // NPC-to-NPC crash detection
    checkNPCCollisions(playerZ);

    // Animate boom effects
    updateBooms(delta);
}

// =========================================================================
//  Collision detection (player vs obstacles)
// =========================================================================
export function checkCollisions(playerMesh, vehicleType) {
    if (!playerMesh) return null;

    const px = playerMesh.position.x;
    const pz = playerMesh.position.z;
    const phb = HITBOXES[vehicleType];
    const FAIRNESS = 0.85;

    for (const o of obstacles) {
        // Skip rough patches - they're bumpy but not a collision
        if (o.type === "roughpatch") continue;

        const ox = o.mesh.position.x;
        const oz = o.mesh.position.z;
        const ohb = o.hitbox;

        if (
            Math.abs(px - ox) < (phb.width + ohb.width) * 0.5 * FAIRNESS &&
            Math.abs(pz - oz) < (phb.length + ohb.length) * 0.5 * FAIRNESS
        ) {
            return o;
        }
    }
    return null;
}

// =========================================================================
//  Check if player is on a rough patch (for bumpy effects)
// =========================================================================
export function isOnRoughPatch(playerMesh, vehicleType) {
    if (!playerMesh) return false;

    const px = playerMesh.position.x;
    const pz = playerMesh.position.z;
    const phb = HITBOXES[vehicleType];

    for (const o of obstacles) {
        if (o.type !== "roughpatch") continue;

        const ox = o.mesh.position.x;
        const oz = o.mesh.position.z;
        const ohb = o.hitbox;

        // Use larger detection area for rough patch effect
        if (
            Math.abs(px - ox) < (phb.width + ohb.width) * 0.5 &&
            Math.abs(pz - oz) < (phb.length + ohb.length) * 0.5
        ) {
            return true;
        }
    }
    return false;
}

// =========================================================================
//  Menu-screen decoration traffic
// =========================================================================
export function createMenuTraffic() {
    const types = ["truck", "car", "bus", "auto", "cow", "dog"];
    for (let i = 0; i < 8; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const lane = Math.random() < 0.5 ? 0 : 1;
        spawnObstacle(type, lane, 10 + i * 20 + Math.random() * 10);
    }
    for (let i = 0; i < 2; i++) {
        spawnObstacle("pothole", Math.random() < 0.5 ? 0 : 1, 15 + i * 30);
    }
    for (let i = 0; i < 2; i++) {
        spawnObstacle("roughpatch", Math.random() < 0.5 ? 0 : 1, 25 + i * 35);
    }
    // Add a crossing dog for menu
    spawnObstacle("dog", Math.random() < 0.5 ? 0 : 1, 50);
}
