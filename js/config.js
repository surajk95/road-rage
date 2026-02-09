// ============================================================================
//  Configuration — constants, messages, hitboxes
// ============================================================================

// ----- Lane geometry -----
export const LANE_LEFT  = -1.3;
export const LANE_RIGHT =  1.3;

// ----- Road dimensions -----
export const ROAD_WIDTH  = 6.5;
export const ROAD_LENGTH = 500;
export const FOG_NEAR    = 30;
export const FOG_FAR     = 140;

// ----- Player physics -----
export const MIN_SPEED        = 12;
export const MAX_SPEED        = 65;
export const START_SPEED      = 22;
export const ACCEL            = 12;
export const BRAKE_DECEL      = 25;
export const NATURAL_DECEL    = 2;
export const LANE_SWITCH_SPEED = 10;

// ----- Per-vehicle physics -----
export const VEHICLE_PHYSICS = {
    auto: {
        accel: 20,            // high acceleration
        maxSpeed: 30,         // lower top speed (~61 km/h)
        laneSwitchSpeed: 5,   // heavy but responsive lane change
        brakeDecel: 22,
        naturalDecel: 2.5,
    },
    scooty: {
        accel: 9,             // less acceleration
        maxSpeed: 68,         // a bit higher top speed
        laneSwitchSpeed: 22,  // lightning-fast lane switches
        brakeDecel: 30,
        naturalDecel: 1.5,
    },
};

// ----- Spawning -----
export const SPAWN_AHEAD    = 200;
export const DESPAWN_BEHIND = 40;

// ----- Hitboxes (width × length in game-units) -----
export const HITBOXES = {
    auto:       { width: 1.3, length: 2.0 },
    scooty:     { width: 0.5, length: 1.4 },
    truck:      { width: 2.0, length: 5.5 },
    car:        { width: 1.6, length: 3.2 },
    bus:        { width: 2.1, length: 5.5 },
    cow:        { width: 1.8, length: 2.0 },
    dog:        { width: 0.5, length: 0.8 },
    pothole:    { width: 1.2, length: 1.2 },
    police:     { width: 1.2, length: 0.8 },
    wrongway:   { width: 1.6, length: 3.2 },
    roughpatch: { width: 2.5, length: 15.0 },
};

// ----- Game-over messages by obstacle type -----
export const POTHOLE_MSGS = [
    "That pothole has been there since 2019!",
    "PWD: Pothole Wala Department strikes again!",
    "Scientists discover new crater... on Indian roads!",
    "Your suspension: 'I resign.'",
    "That's not a pothole, that's a swimming pool!",
    "Nagar Nigam will fix it after monsoon... of 2035",
    "Achievement Unlocked: Found the Bermuda Triangle of roads",
    "Your tyre is now a modern art installation",
    "Fun fact: This pothole has its own Google Maps pin",
    "That pothole has survived 3 elections and 5 budgets",
];

export const POLICE_MSGS = [
    "No PUC certificate! ₹10,000 challan!",
    "License expired 3 years ago, sir!",
    "Vehicle registered in different state — SEIZED!",
    "Where is your helmet? ₹1,000 fine!",
    "Triple riding detected! ₹2,000 fine!",
    "No third-party insurance! ₹2,000 fine!",
    "Overspeeding! Speed limit is 30 km/h here!",
    "Sir, your vehicle fitness certificate expired!",
    "Number plate not as per HSRP norms!",
    "Challan: ₹5,000. Bribe offer: Declined.",
    "Your RC book? What RC book?",
    "Sir, this is a no-entry zone after 9 PM!",
    "Pollution Under Control? More like Pollution Under Carpet!",
    "No reflective tape on vehicle — ₹500 fine!",
    "Sir, you have 47 pending e-challans!",
];

export const TRAFFIC_MSGS = [
    "That truck didn't see you... or care!",
    "Horn OK Please, but you didn't please!",
    "The bus stops for no one. Especially not you.",
    "Another day, another insurance claim!",
    "You zigged when you should have zagged!",
    "Jugaad driving didn't work this time!",
    "The auto-wallah sends his regards.",
    "Signal? What signal? — The other driver, probably",
    "Defensive driving? Never heard of her!",
    "That was a blind overtake. Emphasis on blind.",
    "India drives on the left. Mostly. Sometimes. Never.",
];

export const COW_MSGS = [
    "The cow is sacred. You are not.",
    "Cow 1, You 0",
    "Gau mata ki jai! Game over.",
    "Should've gone around like everyone else!",
    "Even Google Maps can't route around Indian cows",
    "The cow has right of way. Always. Forever.",
    "That cow pays no road tax and still owns the road",
    "Moo means 'get out of MY lane'",
];

export const DOG_MSGS = [
    "That's one way to stop a street dog!",
    "The dog had zero road sense. You had zero brakes.",
    "Street dogs: 0 traffic rules, 100% confidence",
    "Should've honked! Dogs actually move for horns!",
    "That dog crossed the road to see what's on the other side...",
    "Man's best friend. Road's worst enemy.",
    "The dog was just looking for food scraps. Found you instead.",
    "Every street dog thinks it owns the road. This one learned otherwise.",
];

export const WRONGWAY_MSGS = [
    "Head-on collision! Should've honked louder!",
    "They were on the wrong side. Or were you?",
    "Indian roads: Where 'one-way' is just a suggestion!",
    "Wrong side? Both sides are wrong in India!",
    "That was a very confident wrong-side driver!",
];

// ----- Speech Bubble Dialogues (when passing obstacles) -----
export const SPEECH_BUBBLES = {
    cow: ["MOOO!", "Moo moo!", "MOOOOO!", "Moo?"],
    dog: ["WOOF!", "Bark bark!", "WOOF WOOF!", "Arf arf!", "Bhow bhow!"],
    police: ["Mind it!", "Challan!", "Stop!", "License dikhaao!", "Helmet kahaan hai?", "Slow down!"],
    auto: ["PEEP PEEP!", "Beep!", "PEE PEE PEE!", "Move it!", "Side bc!", "^&#@"],
    car: ["HONK!", "Beep beep!", "Move!", "Oi!", "Watch it!"],
    truck: ["HORN OK PLEASE!", "Beep beep!", "Out of my way!", "HONK!", "Side do bhai!"],
    bus: ["PEEEEP!", "Move aside!", "Beep beep!", "Bus coming!", "Side please!"],
    wrongway: ["Wrong side!", "Arre!", "Watch it!", "Oye!", "Bachke!"],
};

// ----- Helpers -----
export function laneX(lane) {
    return lane === 0 ? LANE_LEFT : LANE_RIGHT;
}

export function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function formatDistance(d) {
    const m = Math.floor(d);
    return m >= 1000 ? (m / 1000).toFixed(1) + " km" : m + " m";
}
