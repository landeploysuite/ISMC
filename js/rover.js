/**
 * ISMC — rover.js
 * Enhanced Mars rover — detailed model with robotic arm, suspension, instruments
 */

import * as THREE from 'three';

// ─── Helper: Rounded Box ─────────────────────────────────────
function createRoundedBox(w, h, d, r, color, mat) {
    // Approximate rounded box with standard box
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    return mesh;
}

export function createRover(scene, marsGroup, marsRadius) {
    const group = new THREE.Group();
    group.name = 'rover';
    group.userData = {
        type: 'rover',
        label: 'MARS ROVER',
        description: 'Surface receiver\nFinal destination for data'
    };

    const s = 0.6; // overall scale factor

    // ═══ CHASSIS / BODY ═══
    // Main body (warm deck)
    const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xd0d0d0,
        roughness: 0.55,
        metalness: 0.45,
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.6 * s, 0.35 * s, 1.0 * s), bodyMat);
    body.position.y = 0.45 * s;
    group.add(body);

    // Front slope
    const frontGeo = new THREE.BoxGeometry(0.3 * s, 0.2 * s, 0.9 * s);
    const front = new THREE.Mesh(frontGeo, bodyMat);
    front.position.set(0.85 * s, 0.35 * s, 0);
    front.rotation.z = -0.3;
    group.add(front);

    // Rear slope
    const rear = new THREE.Mesh(frontGeo.clone(), bodyMat);
    rear.position.set(-0.85 * s, 0.35 * s, 0);
    rear.rotation.z = 0.3;
    group.add(rear);

    // ═══ TOP DECK / SOLAR PANEL ═══
    const deckMat = new THREE.MeshStandardMaterial({
        color: 0x0a1e4a,
        roughness: 0.35,
        metalness: 0.55,
        emissive: 0x0a1530,
        emissiveIntensity: 0.1,
    });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(1.3 * s, 0.06 * s, 0.85 * s), deckMat);
    deck.position.y = 0.66 * s;
    group.add(deck);

    // Solar cell grid lines on deck
    const deckEdge = new THREE.LineSegments(
        new THREE.EdgesGeometry(deck.geometry),
        new THREE.LineBasicMaterial({ color: 0x223366, transparent: true, opacity: 0.5 })
    );
    deckEdge.position.copy(deck.position);
    group.add(deckEdge);

    // Solar cell subdivisions
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 6; col++) {
            const cellGeo = new THREE.PlaneGeometry(0.18 * s, 0.18 * s);
            const cellMat = new THREE.MeshStandardMaterial({
                color: 0x112244,
                roughness: 0.4,
                metalness: 0.5,
                side: THREE.DoubleSide,
            });
            const cell = new THREE.Mesh(cellGeo, cellMat);
            cell.position.set(
                (-0.5 + col * 0.2) * s,
                0.695 * s,
                (-0.3 + row * 0.2) * s
            );
            cell.rotation.x = -Math.PI / 2;
            group.add(cell);
        }
    }

    // ═══ CAMERA MAST (RSM) ═══
    const mastMat = new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.45,
        metalness: 0.65,
    });

    // Mast base
    const mastBase = new THREE.Mesh(new THREE.CylinderGeometry(0.06 * s, 0.08 * s, 0.12 * s, 8), mastMat);
    mastBase.position.set(0.35 * s, 0.72 * s, 0);
    group.add(mastBase);

    // Mast pole
    const mastPole = new THREE.Mesh(new THREE.CylinderGeometry(0.035 * s, 0.035 * s, 0.7 * s, 8), mastMat);
    mastPole.position.set(0.35 * s, 1.13 * s, 0);
    group.add(mastPole);

    // Camera head housing
    const camHousingMat = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.3,
        metalness: 0.7,
    });
    const camHousing = new THREE.Mesh(new THREE.BoxGeometry(0.2 * s, 0.12 * s, 0.15 * s), camHousingMat);
    camHousing.position.set(0.35 * s, 1.54 * s, 0);
    group.add(camHousing);

    // Camera lenses (two eyes — stereoscopic)
    const lensMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
    for (const zoff of [-0.04, 0.04]) {
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.025 * s, 0.03 * s, 0.06 * s, 12), lensMat);
        lens.position.set(0.46 * s, 1.54 * s, zoff * s);
        lens.rotation.z = Math.PI / 2;
        group.add(lens);

        // Lens glass
        const glass = new THREE.Mesh(
            new THREE.CircleGeometry(0.025 * s, 12),
            new THREE.MeshBasicMaterial({ color: 0x334455, transparent: true, opacity: 0.7 })
        );
        glass.position.set(0.49 * s, 1.54 * s, zoff * s);
        glass.rotation.y = Math.PI / 2;
        group.add(glass);
    }

    // ═══ HIGH GAIN ANTENNA DISH ═══
    const dishGeo = new THREE.SphereGeometry(0.32 * s, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.5);
    const dishMat = new THREE.MeshStandardMaterial({
        color: 0xeeeeee,
        roughness: 0.3,
        metalness: 0.7,
        side: THREE.DoubleSide,
    });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.set(-0.45 * s, 1.0 * s, 0);
    dish.rotation.z = 0.4;
    dish.rotation.x = -0.2;
    group.add(dish);

    // Dish support post
    const dishPost = new THREE.Mesh(new THREE.CylinderGeometry(0.025 * s, 0.025 * s, 0.35 * s, 6), mastMat);
    dishPost.position.set(-0.45 * s, 0.8 * s, 0);
    group.add(dishPost);

    // Dish feed
    const feedGeo = new THREE.CylinderGeometry(0.015 * s, 0.025 * s, 0.15 * s, 6);
    const feed = new THREE.Mesh(feedGeo, mastMat);
    feed.position.set(-0.35 * s, 1.08 * s, 0);
    feed.rotation.z = 0.4;
    group.add(feed);

    // ═══ ROBOTIC ARM ═══
    const armMat = new THREE.MeshStandardMaterial({
        color: 0x999999,
        roughness: 0.45,
        metalness: 0.6,
    });

    // Shoulder joint
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.05 * s, 8, 8), armMat);
    shoulder.position.set(0.7 * s, 0.55 * s, 0.45 * s);
    group.add(shoulder);

    // Upper arm
    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.025 * s, 0.025 * s, 0.5 * s, 6), armMat);
    upperArm.position.set(0.95 * s, 0.55 * s, 0.45 * s);
    upperArm.rotation.z = Math.PI / 2;
    group.add(upperArm);

    // Elbow joint
    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.04 * s, 8, 8), armMat);
    elbow.position.set(1.2 * s, 0.55 * s, 0.45 * s);
    group.add(elbow);

    // Forearm (angled down)
    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.02 * s, 0.02 * s, 0.4 * s, 6), armMat);
    forearm.position.set(1.3 * s, 0.35 * s, 0.45 * s);
    forearm.rotation.z = 0.5;
    group.add(forearm);

    // Tool head (drill/scoop)
    const toolGeo = new THREE.CylinderGeometry(0.04 * s, 0.02 * s, 0.1 * s, 8);
    const toolMat = new THREE.MeshStandardMaterial({
        color: 0x666666,
        roughness: 0.4,
        metalness: 0.8,
    });
    const tool = new THREE.Mesh(toolGeo, toolMat);
    tool.position.set(1.4 * s, 0.18 * s, 0.45 * s);
    group.add(tool);

    // ═══ ROCKER-BOGIE SUSPENSION ═══
    const suspMat = new THREE.MeshStandardMaterial({
        color: 0x777777,
        roughness: 0.5,
        metalness: 0.6,
    });

    // Rocker bars (each side)
    for (const side of [-1, 1]) {
        // Main rocker
        const rocker = new THREE.Mesh(new THREE.BoxGeometry(1.4 * s, 0.04 * s, 0.04 * s), suspMat);
        rocker.position.set(0, 0.25 * s, side * 0.52 * s);
        group.add(rocker);

        // Bogie connector
        const bogie = new THREE.Mesh(new THREE.BoxGeometry(0.6 * s, 0.035 * s, 0.035 * s), suspMat);
        bogie.position.set(0.35 * s, 0.22 * s, side * 0.52 * s);
        bogie.rotation.z = 0.1;
        group.add(bogie);

        // Differential bar
        const diff = new THREE.Mesh(new THREE.CylinderGeometry(0.015 * s, 0.015 * s, 0.15 * s, 6), suspMat);
        diff.position.set(-0.1 * s, 0.35 * s, side * 0.52 * s);
        group.add(diff);
    }

    // ═══ WHEELS (6 wheels with tread pattern) ═══
    const wheelMat = new THREE.MeshStandardMaterial({
        color: 0x3a3a3a,
        roughness: 0.8,
        metalness: 0.4,
    });

    const wheelPositions = [
        [-0.6, 0.15, 0.55],
        [0.1, 0.15, 0.55],
        [0.6, 0.13, 0.55],
        [-0.6, 0.15, -0.55],
        [0.1, 0.15, -0.55],
        [0.6, 0.13, -0.55],
    ];

    const wheels = [];
    for (const [wx, wy, wz] of wheelPositions) {
        const wheelGroup = new THREE.Group();

        // Wheel rim
        const rimGeo = new THREE.CylinderGeometry(0.16 * s, 0.16 * s, 0.08 * s, 24);
        const rim = new THREE.Mesh(rimGeo, wheelMat);
        rim.rotation.x = Math.PI / 2;
        wheelGroup.add(rim);

        // Tread pattern (chevron grooves as rings)
        for (let t = 0; t < 8; t++) {
            const treadAngle = (t / 8) * Math.PI * 2;
            const treadGeo = new THREE.BoxGeometry(0.02 * s, 0.09 * s, 0.04 * s);
            const tread = new THREE.Mesh(treadGeo, new THREE.MeshStandardMaterial({
                color: 0x2a2a2a,
                roughness: 0.9,
                metalness: 0.3,
            }));
            tread.position.set(
                Math.cos(treadAngle) * 0.155 * s,
                Math.sin(treadAngle) * 0.155 * s,
                0
            );
            tread.rotation.z = treadAngle;
            wheelGroup.add(tread);
        }

        // Hub cap
        const hubGeo = new THREE.CircleGeometry(0.08 * s, 12);
        const hubMat = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,
            roughness: 0.4,
            metalness: 0.7,
            side: THREE.DoubleSide,
        });
        const hubL = new THREE.Mesh(hubGeo, hubMat);
        hubL.position.z = 0.042 * s;
        wheelGroup.add(hubL);
        const hubR = new THREE.Mesh(hubGeo.clone(), hubMat);
        hubR.position.z = -0.042 * s;
        hubR.rotation.y = Math.PI;
        wheelGroup.add(hubR);

        // Hub spoke cross
        for (let sp = 0; sp < 3; sp++) {
            const spokeGeo = new THREE.BoxGeometry(0.14 * s, 0.012 * s, 0.005 * s);
            const spoke = new THREE.Mesh(spokeGeo, hubMat);
            spoke.rotation.z = (sp / 3) * Math.PI;
            spoke.position.z = 0.044 * s;
            wheelGroup.add(spoke);
        }

        wheelGroup.position.set(wx * s, wy * s, wz * s);
        group.add(wheelGroup);
        wheels.push(wheelGroup);
    }

    // ═══ INSTRUMENT PACKAGES ═══
    // ChemCam-like laser on top
    const laserMat = new THREE.MeshStandardMaterial({
        color: 0x555555,
        roughness: 0.3,
        metalness: 0.8,
    });
    const laser = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * s, 0.04 * s, 0.12 * s, 8), laserMat);
    laser.position.set(0.35 * s, 1.62 * s, 0.08 * s);
    group.add(laser);

    // Weather station / REMS
    const wxStation = new THREE.Mesh(new THREE.BoxGeometry(0.05 * s, 0.15 * s, 0.03 * s), mastMat);
    wxStation.position.set(0.35 * s, 1.35 * s, 0.1 * s);
    group.add(wxStation);

    // Low gain antenna (UHF)
    const uhfGeo = new THREE.CylinderGeometry(0.01 * s, 0.01 * s, 0.25 * s, 6);
    const uhf = new THREE.Mesh(uhfGeo, mastMat);
    uhf.position.set(-0.2 * s, 0.82 * s, -0.3 * s);
    group.add(uhf);
    const uhfTip = new THREE.Mesh(new THREE.SphereGeometry(0.025 * s, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff3333 }));
    uhfTip.position.set(-0.2 * s, 0.96 * s, -0.3 * s);
    group.add(uhfTip);

    // ═══ STATUS INDICATORS ═══
    // Main LED
    const ledGeo = new THREE.SphereGeometry(0.04 * s, 8, 8);
    const ledMat = new THREE.MeshBasicMaterial({
        color: 0x2ecc71,
        transparent: true,
        opacity: 0.9,
    });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0.82 * s, 0.55 * s, 0);
    group.add(led);

    // Communication status light
    const commLed = new THREE.Mesh(
        new THREE.SphereGeometry(0.03 * s, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0x38b6ff, transparent: true, opacity: 0.7 })
    );
    commLed.position.set(-0.45 * s, 1.2 * s, 0.15 * s);
    group.add(commLed);

    group.userData.ledMat = ledMat;
    group.userData.dishMesh = dish;
    group.userData.wheels = wheels;

    // ═══ POSITION ON MARS SURFACE ═══
    group.position.set(0, marsRadius + 0.08, 0);
    group.scale.setScalar(0.6);

    marsGroup.add(group);

    return {
        model: group,
        ledMat,
        wheels,
    };
}

export function updateRover(rover, delta) {
    if (!rover) return;

    const time = performance.now() * 0.001;

    // LED blink
    const blink = (Math.sin(time * 2) + 1) / 2;
    rover.ledMat.opacity = 0.4 + blink * 0.6;

    // Slow wheel rotation (idle spin)
    if (rover.wheels) {
        for (const wheel of rover.wheels) {
            wheel.children[0].rotation.y += delta * 0.1;
        }
    }
}
