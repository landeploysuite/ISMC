/**
 * ISMC — satellites.js
 * Enhanced orbital satellites, relay mesh nodes — detailed sci-fi models
 */

import * as THREE from 'three';

// ─── Enhanced Satellite Model ────────────────────────────────

function createSatelliteModel(color = 0x38b6ff, scale = 1) {
    const group = new THREE.Group();

    // === Main Bus (elongated octahedron body) ===
    const bodyGeo = new THREE.OctahedronGeometry(0.55 * scale, 0);
    bodyGeo.scale(1, 1.3, 0.8);
    const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x8899aa,
        roughness: 0.25,
        metalness: 0.85,
        emissive: color,
        emissiveIntensity: 0.08,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // === Thermal blanket wrap (inner detail) ===
    const wrapGeo = new THREE.BoxGeometry(0.6 * scale, 0.75 * scale, 0.5 * scale);
    const wrapMat = new THREE.MeshStandardMaterial({
        color: 0xccaa44,
        roughness: 0.6,
        metalness: 0.4,
        emissive: 0x443300,
        emissiveIntensity: 0.05,
    });
    const wrap = new THREE.Mesh(wrapGeo, wrapMat);
    group.add(wrap);

    // === Solar Panel Arrays (articulated) ===
    const createSolarPanel = (side) => {
        const panelGroup = new THREE.Group();

        // Arm/hinge connector
        const armGeo = new THREE.CylinderGeometry(0.03 * scale, 0.03 * scale, 0.5 * scale, 8);
        const armMat = new THREE.MeshStandardMaterial({ color: 0x667788, metalness: 0.8, roughness: 0.3 });
        const arm = new THREE.Mesh(armGeo, armMat);
        arm.rotation.z = Math.PI / 2;
        arm.position.x = side * 0.5 * scale;
        panelGroup.add(arm);

        // Main panel (multi-segment)
        for (let seg = 0; seg < 3; seg++) {
            const segGeo = new THREE.BoxGeometry(0.65 * scale, 0.04 * scale, 0.55 * scale);
            const segMat = new THREE.MeshStandardMaterial({
                color: 0x0a1e4a,
                roughness: 0.3,
                metalness: 0.65,
                emissive: 0x0a1e4a,
                emissiveIntensity: 0.12,
            });
            const segment = new THREE.Mesh(segGeo, segMat);
            segment.position.x = side * (0.95 + seg * 0.7) * scale;
            panelGroup.add(segment);

            // Panel grid lines
            const gridGeo = new THREE.EdgesGeometry(segGeo);
            const gridMat = new THREE.LineBasicMaterial({ color: 0x1a3a6e, transparent: true, opacity: 0.6 });
            const grid = new THREE.LineSegments(gridGeo, gridMat);
            grid.position.copy(segment.position);
            panelGroup.add(grid);

            // Cross-bars for solar cell detail
            for (let cbar = 0; cbar < 3; cbar++) {
                const cbarGeo = new THREE.BoxGeometry(0.65 * scale, 0.055 * scale, 0.008 * scale);
                const cbarMat = new THREE.MeshStandardMaterial({ color: 0x223355, metalness: 0.7, roughness: 0.4 });
                const crossbar = new THREE.Mesh(cbarGeo, cbarMat);
                crossbar.position.set(segment.position.x, segment.position.y + 0.005 * scale, (cbar - 1) * 0.18 * scale);
                panelGroup.add(crossbar);
            }
        }

        return panelGroup;
    };

    group.add(createSolarPanel(1));   // Right
    group.add(createSolarPanel(-1));  // Left

    // === High Gain Antenna Dish ===
    const dishGeo = new THREE.SphereGeometry(0.35 * scale, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.5);
    const dishMat = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        roughness: 0.35,
        metalness: 0.75,
        side: THREE.DoubleSide,
    });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.y = 0.6 * scale;
    dish.rotation.x = Math.PI;
    group.add(dish);

    // Dish feed horn
    const hornGeo = new THREE.CylinderGeometry(0.02 * scale, 0.05 * scale, 0.3 * scale, 8);
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xaabbcc, metalness: 0.8, roughness: 0.3 });
    const horn = new THREE.Mesh(hornGeo, hornMat);
    horn.position.y = 0.45 * scale;
    group.add(horn);

    // Dish support struts (3 legs)
    for (let i = 0; i < 3; i++) {
        const strutGeo = new THREE.CylinderGeometry(0.012 * scale, 0.012 * scale, 0.5 * scale, 4);
        const strut = new THREE.Mesh(strutGeo, hornMat);
        const angle = (i / 3) * Math.PI * 2;
        strut.position.set(
            Math.cos(angle) * 0.18 * scale,
            0.45 * scale,
            Math.sin(angle) * 0.18 * scale
        );
        strut.rotation.x = Math.cos(angle) * 0.3;
        strut.rotation.z = -Math.sin(angle) * 0.3;
        group.add(strut);
    }

    // === Low Gain Antenna (whip) ===
    const whipGeo = new THREE.CylinderGeometry(0.01 * scale, 0.015 * scale, 0.8 * scale, 6);
    const whipMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.7, roughness: 0.4 });
    const whip = new THREE.Mesh(whipGeo, whipMat);
    whip.position.set(0.2 * scale, 0.7 * scale, 0.15 * scale);
    whip.rotation.z = 0.15;
    group.add(whip);

    // Whip tip ball
    const tipGeo = new THREE.SphereGeometry(0.03 * scale, 8, 8);
    const tipMat = new THREE.MeshBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0.9 });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.position.set(0.2 * scale, 1.12 * scale, 0.15 * scale);
    group.add(tip);

    // === Thruster nozzles (bottom) ===
    for (let i = 0; i < 4; i++) {
        const nozGeo = new THREE.ConeGeometry(0.06 * scale, 0.12 * scale, 8);
        const nozMat = new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 0.6,
            metalness: 0.8,
        });
        const nozzle = new THREE.Mesh(nozGeo, nozMat);
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
        nozzle.position.set(
            Math.cos(angle) * 0.25 * scale,
            -0.65 * scale,
            Math.sin(angle) * 0.25 * scale
        );
        group.add(nozzle);
    }

    // === Status indicator light ===
    const lightGeo = new THREE.SphereGeometry(0.06 * scale, 8, 8);
    const lightMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.9,
    });
    const lightMesh = new THREE.Mesh(lightGeo, lightMat);
    lightMesh.position.y = -0.7 * scale;
    group.add(lightMesh);

    // === Point light for local illumination ===
    const pointLight = new THREE.PointLight(color, 0.5, 5);
    pointLight.position.set(0, 0, 0);
    group.add(pointLight);

    group.userData.statusLight = lightMat;
    group.userData.bodyMat = bodyMat;

    return group;
}

// ─── Enhanced Relay Node Model ───────────────────────────────

function createRelayNodeModel(index, color = 0xa855f7) {
    const group = new THREE.Group();

    // === Central Hub (dodecahedron core) ===
    const coreGeo = new THREE.DodecahedronGeometry(0.4, 0);
    const coreMat = new THREE.MeshStandardMaterial({
        color: 0x556677,
        roughness: 0.25,
        metalness: 0.8,
        emissive: color,
        emissiveIntensity: 0.1,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Core wireframe overlay
    const coreWire = new THREE.LineSegments(
        new THREE.EdgesGeometry(coreGeo),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.4 })
    );
    group.add(coreWire);

    // === Inner rotating ring ===
    const innerRingGeo = new THREE.TorusGeometry(0.55, 0.025, 8, 48);
    const innerRingMat = new THREE.MeshStandardMaterial({
        color: 0x8899aa,
        roughness: 0.3,
        metalness: 0.8,
        emissive: color,
        emissiveIntensity: 0.08,
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = Math.PI / 2;
    innerRing.name = 'inner-ring';
    group.add(innerRing);

    // === Outer rotating ring (perpendicular) ===
    const outerRingGeo = new THREE.TorusGeometry(0.75, 0.018, 8, 64);
    const outerRingMat = new THREE.MeshStandardMaterial({
        color: 0x667788,
        roughness: 0.35,
        metalness: 0.75,
        emissive: color,
        emissiveIntensity: 0.05,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.rotation.y = Math.PI / 3;
    outerRing.name = 'outer-ring';
    group.add(outerRing);

    // === Antenna array (6 directional antennas) ===
    const directions = [
        [1, 0, 0], [-1, 0, 0],
        [0, 1, 0], [0, -1, 0],
        [0, 0, 1], [0, 0, -1],
    ];

    for (const [dx, dy, dz] of directions) {
        // Antenna arm
        const armLen = 1.0;
        const armGeo = new THREE.CylinderGeometry(0.02, 0.015, armLen, 6);
        const armMat = new THREE.MeshStandardMaterial({
            color: 0x778899,
            roughness: 0.4,
            metalness: 0.7,
        });
        const arm = new THREE.Mesh(armGeo, armMat);

        // Position and orient
        arm.position.set(dx * armLen / 2, dy * armLen / 2, dz * armLen / 2);
        if (dx !== 0) arm.rotation.z = Math.PI / 2;
        if (dz !== 0) arm.rotation.x = Math.PI / 2;
        group.add(arm);

        // Antenna tip (small dish)
        const tipGeo = new THREE.SphereGeometry(0.07, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
        const tipMat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.75,
            side: THREE.DoubleSide,
        });
        const tip = new THREE.Mesh(tipGeo, tipMat);
        tip.position.set(dx * armLen, dy * armLen, dz * armLen);
        tip.lookAt(0, 0, 0);
        group.add(tip);

        // Tip glow
        const glowGeo = new THREE.SphereGeometry(0.1, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.15,
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.set(dx * armLen, dy * armLen, dz * armLen);
        group.add(glow);
    }

    // === Energy field / holographic halo ===
    const haloGeo = new THREE.RingGeometry(1.0, 1.05, 64);
    const haloMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide,
        depthWrite: false,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    group.add(halo);

    // Second halo at angle
    const halo2 = new THREE.Mesh(haloGeo.clone(), haloMat.clone());
    halo2.rotation.x = Math.PI / 2;
    halo2.material.opacity = 0.06;
    group.add(halo2);

    // === Relay node index marker (holographic number) ===
    const markerCanvas = document.createElement('canvas');
    markerCanvas.width = 128;
    markerCanvas.height = 128;
    const mctx = markerCanvas.getContext('2d');
    mctx.font = 'bold 72px Orbitron, monospace';
    mctx.textAlign = 'center';
    mctx.textBaseline = 'middle';
    mctx.shadowColor = '#a855f7';
    mctx.shadowBlur = 15;
    mctx.fillStyle = '#a855f7';
    mctx.fillText(`${index + 1}`, 64, 64);
    const markerTex = new THREE.CanvasTexture(markerCanvas);
    const markerMat = new THREE.SpriteMaterial({
        map: markerTex,
        transparent: true,
        opacity: 0.6,
        depthTest: false,
    });
    const marker = new THREE.Sprite(markerMat);
    marker.scale.set(0.6, 0.6, 1);
    marker.position.y = -1.5;
    group.add(marker);

    // === Point light ===
    const nodeLight = new THREE.PointLight(color, 0.4, 8);
    group.add(nodeLight);

    group.userData.haloMat = haloMat;
    group.userData.coreMat = coreMat;
    group.userData.innerRing = innerRing;
    group.userData.outerRing = outerRing;

    return group;
}

// ─── Orbit Ring Helper ───────────────────────────────────────

function createOrbitRing(radius, parent, color = 0x38b6ff) {
    const points = [];
    const segments = 256;
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(
            Math.cos(angle) * radius,
            0,
            Math.sin(angle) * radius
        ));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.12,
    });
    const ring = new THREE.Line(geo, mat);
    ring.name = 'orbit-ring';
    parent.add(ring);
    return ring;
}

// ─── Create Earth Orbital Satellite ──────────────────────────

export function createEarthSatellite(scene, earthGroup) {
    const sat = createSatelliteModel(0x38b6ff, 0.8);
    sat.name = 'earth-satellite';
    sat.userData.type = 'satellite';
    sat.userData.label = 'EARTH ORBITAL';
    sat.userData.description = 'Low-orbit relay satellite\nReceives data from ground station';

    const orbitRadius = 8;
    const orbitSpeed = 0.4;

    const orbitRing = createOrbitRing(orbitRadius, earthGroup);
    earthGroup.add(sat);
    sat.position.set(orbitRadius, 0, 0);

    return {
        model: sat,
        orbitRadius,
        orbitSpeed,
        orbitRing,
        angle: 0,
        parent: earthGroup,
    };
}

// ─── Create Mars Orbital Satellite ───────────────────────────

export function createMarsSatellite(scene, marsGroup) {
    const sat = createSatelliteModel(0xff8c38, 0.7);
    sat.name = 'mars-satellite';
    sat.userData.type = 'satellite';
    sat.userData.label = 'MARS ORBITAL';
    sat.userData.description = 'Mars orbit relay satellite\nFinal relay before rover';

    const orbitRadius = 6;
    const orbitSpeed = 0.35;

    const orbitRing = createOrbitRing(orbitRadius, marsGroup, 0xff8c38);
    marsGroup.add(sat);
    sat.position.set(orbitRadius, 0, 0);

    return {
        model: sat,
        orbitRadius,
        orbitSpeed,
        orbitRing,
        angle: Math.PI,
        parent: marsGroup,
    };
}

// ─── Create Relay Nodes ──────────────────────────────────────

export function createRelayNodes(scene, earthPos, marsPos, count = 5) {
    const nodes = [];
    const midPoint = new THREE.Vector3().addVectors(earthPos, marsPos).multiplyScalar(0.5);
    midPoint.y = 12;

    for (let i = 0; i < count; i++) {
        const t = (i + 1) / (count + 1);

        const a = earthPos.clone();
        const b = midPoint.clone();
        const c = marsPos.clone();

        const pos = new THREE.Vector3();
        pos.x = (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * b.x + t * t * c.x;
        pos.y = (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * b.y + t * t * c.y;
        pos.z = (1 - t) * (1 - t) * a.z + 2 * (1 - t) * t * b.z + t * t * c.z;

        pos.z += Math.sin(t * Math.PI * 2 + i) * 4;

        const node = createRelayNodeModel(i, 0xa855f7);
        node.name = `relay-node-${i + 1}`;
        node.userData.type = 'relay';
        node.userData.label = `RELAY NODE ${i + 1}`;
        node.userData.description = `Mesh relay node ${i + 1}/${count}\nForwards data to nearest node`;
        node.position.copy(pos);

        scene.add(node);

        nodes.push({
            model: node,
            basePosition: pos.clone(),
            driftOffset: Math.random() * Math.PI * 2,
            index: i,
        });
    }

    return nodes;
}

// ─── Create Connection Lines ─────────────────────────────────

export function createMeshLines(scene, pathPositions) {
    const lines = [];
    for (let i = 0; i < pathPositions.length - 1; i++) {
        const points = [pathPositions[i], pathPositions[i + 1]];
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineDashedMaterial({
            color: 0x38b6ff,
            transparent: true,
            opacity: 0.08,
            dashSize: 0.5,
            gapSize: 0.3,
        });
        const line = new THREE.Line(geo, mat);
        line.computeLineDistances();
        line.name = `mesh-line-${i}`;
        scene.add(line);
        lines.push({ line, material: mat, geometry: geo });
    }
    return lines;
}

// ─── Update Satellites ───────────────────────────────────────

export function updateSatellites(earthSat, marsSat, relayNodes, delta) {
    // Orbit Earth satellite
    if (earthSat) {
        earthSat.angle += delta * earthSat.orbitSpeed;
        earthSat.model.position.x = Math.cos(earthSat.angle) * earthSat.orbitRadius;
        earthSat.model.position.z = Math.sin(earthSat.angle) * earthSat.orbitRadius;
        earthSat.model.position.y = Math.sin(earthSat.angle * 0.7) * 1.5;
        earthSat.model.rotation.y += delta * 0.5;
    }

    // Orbit Mars satellite
    if (marsSat) {
        marsSat.angle += delta * marsSat.orbitSpeed;
        marsSat.model.position.x = Math.cos(marsSat.angle) * marsSat.orbitRadius;
        marsSat.model.position.z = Math.sin(marsSat.angle) * marsSat.orbitRadius;
        marsSat.model.position.y = Math.sin(marsSat.angle * 0.5) * 1;
        marsSat.model.rotation.y += delta * 0.4;
    }

    // Animate relay nodes
    if (relayNodes) {
        const time = performance.now() * 0.001;
        for (const node of relayNodes) {
            // Gentle drift
            node.model.position.y = node.basePosition.y + Math.sin(time * 0.3 + node.driftOffset) * 0.8;
            node.model.position.z = node.basePosition.z + Math.cos(time * 0.2 + node.driftOffset) * 0.5;

            // Spin inner/outer rings
            const innerRing = node.model.userData.innerRing;
            const outerRing = node.model.userData.outerRing;
            if (innerRing) {
                innerRing.rotation.z += delta * 0.8;
                innerRing.rotation.x = Math.PI / 2 + Math.sin(time * 0.4 + node.driftOffset) * 0.2;
            }
            if (outerRing) {
                outerRing.rotation.x += delta * 0.5;
                outerRing.rotation.z += delta * 0.3;
            }

            // Slow body rotation
            node.model.rotation.y += delta * 0.15;
        }
    }
}

// ─── Get World Positions for Path ────────────────────────────

export function getPathPositions(earthSat, relayNodes, marsSat) {
    const positions = [];

    if (earthSat) {
        const wp = new THREE.Vector3();
        earthSat.model.getWorldPosition(wp);
        positions.push(wp);
    }

    if (relayNodes) {
        for (const node of relayNodes) {
            positions.push(node.model.position.clone());
        }
    }

    if (marsSat) {
        const wp = new THREE.Vector3();
        marsSat.model.getWorldPosition(wp);
        positions.push(wp);
    }

    return positions;
}
