/**
 * ISMC v2.0 — main.js
 * Maximum enhanced: asteroid belt, nebula, lens flare sun, cinematic camera, full orchestration
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { createBloomComposer, DataBeam, DataPacket, NodePulse } from './effects.js';
import { createEarth, createMars, updateCelestials } from './celestial.js';
import { createEarthSatellite, createMarsSatellite, createRelayNodes, createMeshLines, updateSatellites, getPathPositions } from './satellites.js';
import { createRover, updateRover } from './rover.js';
import { DataTransmission } from './dataTransmission.js';
import {
    addLog, updateHUD, buildProgressNodes, updateProgressNodes,
    showTransmissionProgress, hideTransmissionProgress,
    updateFPS, setupSpeedSlider, setupCameraButtons, setupToggles,
    updateLoadingProgress, hideLoadingScreen,
    showTooltip, hideTooltip,
    updateMissionTimer, updateSignalBars, updateBitrate,
    initWaveform, updateWaveform,
    initTopology, updateTopology,
    updateCoords, updateObjectCount
} from './ui.js';

// ═══════════════════════════════════════════════════════════════
// GLOBALS
// ═══════════════════════════════════════════════════════════════

let renderer, scene, camera, controls, composer;
let clock;

let earth, mars;
let earthSat, marsSat;
let relayNodes;
let rover;
let meshLines;
let starField;
let gridHelper;
let asteroidBelt;

let dataBeam, dataPacket, nodePulse;
let transmission;

let labelSprites = [];
let raycaster, mouse;

const cameraTargets = {
    overview: { pos: new THREE.Vector3(0, 45, 90), target: new THREE.Vector3(0, 0, 0) },
    earth: { pos: new THREE.Vector3(-52, 12, 22), target: new THREE.Vector3(-60, 0, 0) },
    mars: { pos: new THREE.Vector3(52, 10, 18), target: new THREE.Vector3(60, 0, 0) },
    top: { pos: new THREE.Vector3(0, 120, 0.1), target: new THREE.Vector3(0, 0, 0) },
    cinematic: null,
    follow: null,
};

let currentView = 'overview';
let showLabels = true;
let showOrbits = true;
let showGrid = true;

let cinematicTime = 0;
let objCountTimer = 0;

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

async function init() {
    updateLoadingProgress(5, 'Initializing WebGL renderer...');

    // ─── Renderer ────────────────────────────
    const canvas = document.getElementById('simulation-canvas');
    renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // ─── Scene ───────────────────────────────
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020410);
    scene.fog = new THREE.FogExp2(0x020410, 0.002);

    updateLoadingProgress(10, 'Configuring camera...');

    // ─── Camera ──────────────────────────────
    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1500);
    camera.position.set(0, 45, 90);

    // ─── Controls ────────────────────────────
    controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 8;
    controls.maxDistance = 350;
    controls.maxPolarAngle = Math.PI * 0.88;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0.3;

    // ─── Clock ───────────────────────────────
    clock = new THREE.Clock();

    // ─── Raycaster ───────────────────────────
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    updateLoadingProgress(18, 'Setting up lighting system...');

    // ─── Lighting ────────────────────────────
    // Ambient — space is dark but not pitch black
    const ambientLight = new THREE.AmbientLight(0x222244, 0.4);
    scene.add(ambientLight);

    // Hemisphere light (sky vs ground)
    const hemiLight = new THREE.HemisphereLight(0x334466, 0x111122, 0.3);
    scene.add(hemiLight);

    // Sun directional light (main)
    const sunLight = new THREE.DirectionalLight(0xfff5e0, 2.2);
    sunLight.position.set(100, 30, 60);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0x334466, 0.35);
    fillLight.position.set(-40, -15, -50);
    scene.add(fillLight);

    // Rim light (backlight for dramatic silhouettes)
    const rimLight = new THREE.DirectionalLight(0x6688aa, 0.5);
    rimLight.position.set(-80, 20, -40);
    scene.add(rimLight);

    updateLoadingProgress(25, 'Creating the Sun...');

    // ─── Sun (enhanced) ──────────────────────
    createSun();

    updateLoadingProgress(35, 'Generating starfield & nebula...');

    // ─── Starfield ───────────────────────────
    createStarField();

    updateLoadingProgress(40, 'Building asteroid belt...');

    // ─── Asteroid Belt ───────────────────────
    createAsteroidBelt();

    // ─── Grid Helper ─────────────────────────
    gridHelper = new THREE.GridHelper(250, 50, 0x0a1530, 0x060d20);
    gridHelper.position.y = -18;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.25;
    scene.add(gridHelper);

    updateLoadingProgress(50, 'Creating Earth...');

    // ─── Celestial Bodies ────────────────────
    earth = createEarth(scene);

    updateLoadingProgress(60, 'Creating Mars...');
    mars = createMars(scene);

    updateLoadingProgress(68, 'Deploying orbital satellites...');

    // ─── Satellites ──────────────────────────
    earthSat = createEarthSatellite(scene, earth.group);
    marsSat = createMarsSatellite(scene, mars.group);

    updateLoadingProgress(73, 'Positioning relay mesh nodes...');

    // ─── Relay Nodes ─────────────────────────
    relayNodes = createRelayNodes(scene, earth.group.position, mars.group.position, 5);

    updateLoadingProgress(78, 'Deploying Mars rover...');

    // ─── Rover ───────────────────────────────
    rover = createRover(scene, mars.group, mars.radius);

    updateLoadingProgress(82, 'Establishing mesh network links...');

    // ─── Mesh connection lines ───────────────
    const initPathPositions = getPathPositions(earthSat, relayNodes, marsSat);
    const earthSurface = earth.group.position.clone();
    earthSurface.y += earth.radius + 0.5;
    const roverPos = new THREE.Vector3();
    rover.model.getWorldPosition(roverPos);
    const fullPath = [earthSurface, ...initPathPositions, roverPos];
    meshLines = createMeshLines(scene, fullPath);

    updateLoadingProgress(87, 'Initializing post-processing...');

    // ─── Effects ─────────────────────────────
    const bloom = createBloomComposer(renderer, scene, camera);
    composer = bloom.composer;

    dataBeam = new DataBeam(scene);
    dataPacket = new DataPacket(scene);
    nodePulse = new NodePulse(scene);

    updateLoadingProgress(92, 'Creating labels...');

    // ─── Labels ──────────────────────────────
    createLabels();

    updateLoadingProgress(95, 'Initializing telemetry systems...');

    // ─── UI Canvases ─────────────────────────
    initWaveform();
    initTopology();

    // ─── Data Transmission ───────────────────
    transmission = new DataTransmission({
        earth,
        mars,
        earthSat,
        marsSat,
        relayNodes,
        rover,
        dataPacket,
        dataBeam,
        nodePulse,
        onHopStart: (hopIndex, fromLabel, toLabel, totalHops) => {
            updateHUD({
                status: 'TRANSMITTING',
                statusColor: '#ff8c38',
                hop: `${fromLabel} → ${toLabel}`,
                distance: `${(55 + hopIndex * 12).toFixed(0)} Mkm`,
            });
            showTransmissionProgress();
            updateProgressNodes(hopIndex + 1, 0);
        },
        onHopComplete: (hopIndex, toLabel, totalHops) => {
            updateProgressNodes(hopIndex + 1, 1);
        },
        onTransmissionComplete: () => {
            updateHUD({
                status: 'DELIVERED ✓',
                statusColor: '#2ecc71',
                hop: 'COMPLETE',
                signal: '99%',
                latency: '22.4 min',
                distance: '225 Mkm',
            });
            updateSignalBars(99);
            updateProgressNodes(transmission.totalHops + 1, 1);

            const btn = document.getElementById('btn-send-data');
            if (btn) {
                btn.classList.remove('transmitting');
                btn.innerHTML = '<span class="btn-icon">◉</span><span>TRANSMIT DATA</span>';
            }

            setTimeout(() => {
                hideTransmissionProgress();
                updateHUD({ status: 'IDLE', statusColor: '#7dd3fc', hop: '—', signal: '—', latency: '—', distance: '—' });
                updateSignalBars(0);
            }, 6000);
        },
        onLog: addLog,
    });

    updateLoadingProgress(100, 'Simulation ready!');

    // ─── UI Setup ────────────────────────────
    setupUIControls();

    // ─── Event Listeners ─────────────────────
    window.addEventListener('resize', onResize);
    canvas.addEventListener('mousemove', onMouseMove);

    // Hide loading screen
    setTimeout(hideLoadingScreen, 800);

    // Initial log
    addLog('All systems nominal', 'success');
    addLog('Earth ground station online', 'info');
    addLog('Mars rover comm link standby', 'info');

    // ─── Start Animation ─────────────────────
    animate();
}

// ═══════════════════════════════════════════════════════════════
// SUN
// ═══════════════════════════════════════════════════════════════

function createSun() {
    const sunGroup = new THREE.Group();
    sunGroup.position.set(150, 40, 80);

    // Core
    const sunGeo = new THREE.SphereGeometry(3, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffdd });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunGroup.add(sunMesh);

    // Inner glow
    const glow1 = new THREE.Mesh(
        new THREE.SphereGeometry(5, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0xffeeaa, transparent: true, opacity: 0.15, side: THREE.BackSide })
    );
    sunGroup.add(glow1);

    // Mid glow
    const glow2 = new THREE.Mesh(
        new THREE.SphereGeometry(8, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0xffdd88, transparent: true, opacity: 0.06, side: THREE.BackSide })
    );
    sunGroup.add(glow2);

    // Outer glow
    const glow3 = new THREE.Mesh(
        new THREE.SphereGeometry(14, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffcc66, transparent: true, opacity: 0.025, side: THREE.BackSide })
    );
    sunGroup.add(glow3);

    // Corona rays (billboard sprites)
    for (let i = 0; i < 6; i++) {
        const rayCanvas = document.createElement('canvas');
        rayCanvas.width = 128;
        rayCanvas.height = 128;
        const rctx = rayCanvas.getContext('2d');
        const grad = rctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, 'rgba(255, 240, 200, 0.3)');
        grad.addColorStop(0.5, 'rgba(255, 220, 150, 0.05)');
        grad.addColorStop(1, 'rgba(255, 200, 100, 0)');
        rctx.fillStyle = grad;
        rctx.fillRect(0, 0, 128, 128);

        const rayTex = new THREE.CanvasTexture(rayCanvas);
        const rayMat = new THREE.SpriteMaterial({
            map: rayTex,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        const ray = new THREE.Sprite(rayMat);
        ray.scale.set(25 + Math.random() * 15, 25 + Math.random() * 15, 1);
        ray.position.set(
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4
        );
        sunGroup.add(ray);
    }

    // Sun point light
    const sunPointLight = new THREE.PointLight(0xfff5e0, 1.5, 400);
    sunGroup.add(sunPointLight);

    scene.add(sunGroup);
}

// ═══════════════════════════════════════════════════════════════
// STARFIELD (Enhanced)
// ═══════════════════════════════════════════════════════════════

function createStarField() {
    // === Main stars ===
    const count = 8000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const r = 250 + Math.random() * 500;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        positions[i3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = r * Math.cos(phi);

        const temp = Math.random();
        if (temp < 0.25) {
            colors[i3] = 0.7 + Math.random() * 0.3;
            colors[i3 + 1] = 0.8 + Math.random() * 0.2;
            colors[i3 + 2] = 1.0;
        } else if (temp < 0.5) {
            colors[i3] = 0.95; colors[i3 + 1] = 0.95; colors[i3 + 2] = 1.0;
        } else if (temp < 0.75) {
            colors[i3] = 1.0; colors[i3 + 1] = 0.9; colors[i3 + 2] = 0.7;
        } else {
            colors[i3] = 1.0; colors[i3 + 1] = 0.6; colors[i3 + 2] = 0.4;
        }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
        size: 0.7,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true,
    });

    starField = new THREE.Points(geo, mat);
    scene.add(starField);

    // === Milky Way band ===
    const bandCount = 3000;
    const bandPos = new Float32Array(bandCount * 3);
    const bandCol = new Float32Array(bandCount * 3);

    for (let i = 0; i < bandCount; i++) {
        const i3 = i * 3;
        const angle = Math.random() * Math.PI * 2;
        const r = 300 + Math.random() * 350;
        const spread = (Math.random() - 0.5) * 60;

        bandPos[i3] = Math.cos(angle) * r;
        bandPos[i3 + 1] = spread + Math.sin(angle * 3) * 15;
        bandPos[i3 + 2] = Math.sin(angle) * r;

        const brightness = 0.3 + Math.random() * 0.5;
        bandCol[i3] = brightness * 0.8;
        bandCol[i3 + 1] = brightness * 0.7;
        bandCol[i3 + 2] = brightness;
    }

    const bandGeo = new THREE.BufferGeometry();
    bandGeo.setAttribute('position', new THREE.BufferAttribute(bandPos, 3));
    bandGeo.setAttribute('color', new THREE.BufferAttribute(bandCol, 3));
    const bandMat = new THREE.PointsMaterial({
        size: 0.4,
        vertexColors: true,
        transparent: true,
        opacity: 0.35,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    scene.add(new THREE.Points(bandGeo, bandMat));

    // === Nebula clouds ===
    const nebulaColors = [
        { color: 0x1a0533, opacity: 0.06 },
        { color: 0x0a1530, opacity: 0.05 },
        { color: 0x200a35, opacity: 0.04 },
        { color: 0x0c1628, opacity: 0.05 },
        { color: 0x150825, opacity: 0.035 },
        { color: 0x0a0f2e, opacity: 0.04 },
    ];

    for (const neb of nebulaColors) {
        const nebGeo = new THREE.SphereGeometry(35 + Math.random() * 60, 16, 16);
        const nebMat = new THREE.MeshBasicMaterial({
            color: neb.color,
            transparent: true,
            opacity: neb.opacity,
            side: THREE.BackSide,
            depthWrite: false,
        });
        const nebMesh = new THREE.Mesh(nebGeo, nebMat);
        nebMesh.position.set(
            (Math.random() - 0.5) * 300,
            (Math.random() - 0.5) * 150,
            (Math.random() - 0.5) * 300
        );
        scene.add(nebMesh);
    }
}

// ═══════════════════════════════════════════════════════════════
// ASTEROID BELT
// ═══════════════════════════════════════════════════════════════

function createAsteroidBelt() {
    const asteroidCount = 400;
    const dummy = new THREE.Object3D();

    // Create variety of asteroid shapes
    const geos = [
        new THREE.IcosahedronGeometry(0.3, 0),
        new THREE.DodecahedronGeometry(0.25, 0),
        new THREE.OctahedronGeometry(0.35, 0),
        new THREE.TetrahedronGeometry(0.28, 0),
    ];

    const mat = new THREE.MeshStandardMaterial({
        color: 0x666655,
        roughness: 0.92,
        metalness: 0.1,
        flatShading: true,
    });

    // Use instanced mesh for performance
    const instancedMesh = new THREE.InstancedMesh(geos[0], mat, asteroidCount);

    for (let i = 0; i < asteroidCount; i++) {
        // Belt between Earth and Mars, slight arc
        const t = Math.random();
        const beltRadius = 25 + t * 70;
        const angle = Math.random() * Math.PI * 2;
        const ySpread = (Math.random() - 0.5) * 6;

        dummy.position.set(
            Math.cos(angle) * beltRadius * 0.3 + (Math.random() - 0.5) * 15,
            ySpread - 10,
            Math.sin(angle) * beltRadius * 0.3 + (Math.random() - 0.5) * 15
        );

        // Random rotation
        dummy.rotation.set(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
        );

        // Random scale
        const s = 0.3 + Math.random() * 1.2;
        dummy.scale.setScalar(s);

        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    instancedMesh.position.y = -5;
    scene.add(instancedMesh);
    asteroidBelt = instancedMesh;
}

// ═══════════════════════════════════════════════════════════════
// TEXT LABELS (Sprite-based, enhanced)
// ═══════════════════════════════════════════════════════════════

function createTextSprite(text, color = '#7dd3fc', fontSize = 48, bgOpacity = 0.15) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Background pill
    if (bgOpacity > 0) {
        ctx.fillStyle = `rgba(6, 12, 32, ${bgOpacity})`;
        const tw = ctx.measureText(text).width || 200;
        const pad = 30;
        ctx.beginPath();
        ctx.roundRect((256 - tw / 2 - pad), 30, tw + pad * 2, 68, 10);
        ctx.fill();

        ctx.strokeStyle = `${color}33`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect((256 - tw / 2 - pad), 30, tw + pad * 2, 68, 10);
        ctx.stroke();
    }

    ctx.font = `bold ${fontSize}px Orbitron, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 16;
    ctx.fillStyle = color;
    ctx.fillText(text, 256, 64);

    // Crisp text
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 256, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.9,
        depthTest: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(8, 2, 1);
    return sprite;
}

function createLabels() {
    // Earth label
    const earthLabel = createTextSprite('EARTH', '#4499ff', 44);
    earthLabel.position.set(0, -8, 0);
    earth.group.add(earthLabel);
    labelSprites.push(earthLabel);

    // Mars label
    const marsLabel = createTextSprite('MARS', '#ff8844', 44);
    marsLabel.position.set(0, -6, 0);
    mars.group.add(marsLabel);
    labelSprites.push(marsLabel);

    // Relay node labels
    for (const node of relayNodes) {
        const label = createTextSprite(node.model.userData.label, '#a855f7', 32, 0.2);
        label.position.set(0, 2.2, 0);
        label.scale.set(5, 1.3, 1);
        node.model.add(label);
        labelSprites.push(label);
    }

    // Satellite labels
    const esSatLabel = createTextSprite('EARTH ORBITAL', '#38b6ff', 28, 0.2);
    esSatLabel.position.set(0, 1.8, 0);
    esSatLabel.scale.set(5, 1.3, 1);
    earthSat.model.add(esSatLabel);
    labelSprites.push(esSatLabel);

    const msSatLabel = createTextSprite('MARS ORBITAL', '#ff8c38', 28, 0.2);
    msSatLabel.position.set(0, 1.8, 0);
    msSatLabel.scale.set(5, 1.3, 1);
    marsSat.model.add(msSatLabel);
    labelSprites.push(msSatLabel);
}

// ═══════════════════════════════════════════════════════════════
// UI CONTROLS
// ═══════════════════════════════════════════════════════════════

function setupUIControls() {
    // Send Data button
    const sendBtn = document.getElementById('btn-send-data');
    if (sendBtn) {
        sendBtn.addEventListener('click', () => {
            if (transmission.active) return;

            sendBtn.classList.add('transmitting');
            sendBtn.innerHTML = '<span class="btn-icon">◎</span><span>TRANSMITTING...</span>';

            transmission.buildPath();
            buildProgressNodes(transmission.pathLabels);
            showTransmissionProgress();

            transmission.start();
        });
    }

    // Speed slider
    setupSpeedSlider((speed) => {
        transmission.setSpeed(speed);
    });

    // Camera presets
    setupCameraButtons((view) => {
        currentView = view;
        if (view === 'cinematic') {
            controls.autoRotate = false;
            cinematicTime = clock.getElapsedTime();
        } else {
            controls.autoRotate = false;
            animateCamera(view);
        }
    });

    // Display toggles
    setupToggles((toggle, enabled) => {
        switch (toggle) {
            case 'labels':
                showLabels = enabled;
                labelSprites.forEach(s => s.visible = enabled);
                break;
            case 'orbits':
                showOrbits = enabled;
                if (earthSat.orbitRing) earthSat.orbitRing.visible = enabled;
                if (marsSat.orbitRing) marsSat.orbitRing.visible = enabled;
                meshLines.forEach(ml => ml.line.visible = enabled);
                break;
            case 'grid':
                showGrid = enabled;
                gridHelper.visible = enabled;
                break;
            case 'scanlines':
                const overlay = document.getElementById('scanline-overlay');
                if (overlay) overlay.classList.toggle('hidden', !enabled);
                break;
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// CAMERA ANIMATION
// ═══════════════════════════════════════════════════════════════

let cameraAnimating = false;
let cameraAnimStart, cameraAnimDuration = 1.8;
let cameraFromPos, cameraFromTarget, cameraToPos, cameraToTarget;

function animateCamera(view) {
    if (view === 'follow' && !transmission.active) {
        addLog('No active transmission to follow', 'warn');
        return;
    }

    const target = cameraTargets[view];
    if (!target && view !== 'follow') return;

    cameraFromPos = camera.position.clone();
    cameraFromTarget = controls.target.clone();

    if (view === 'follow') return;

    cameraToPos = target.pos.clone();
    cameraToTarget = target.target.clone();
    cameraAnimStart = clock.getElapsedTime();
    cameraAnimating = true;
}

function updateCameraAnimation() {
    if (!cameraAnimating) return;

    const elapsed = clock.getElapsedTime() - cameraAnimStart;
    let t = Math.min(elapsed / cameraAnimDuration, 1);
    t = 1 - Math.pow(1 - t, 4); // Ease out quart

    camera.position.lerpVectors(cameraFromPos, cameraToPos, t);
    controls.target.lerpVectors(cameraFromTarget, cameraToTarget, t);

    if (t >= 1) cameraAnimating = false;
}

function updateFollowCamera() {
    if (currentView !== 'follow' || !transmission.active) return;

    const packetPos = dataPacket.group.position;
    const offset = new THREE.Vector3(6, 6, 12);
    const targetPos = packetPos.clone().add(offset);

    camera.position.lerp(targetPos, 0.025);
    controls.target.lerp(packetPos, 0.025);
}

function updateCinematicCamera(time) {
    if (currentView !== 'cinematic') return;

    const elapsed = time - cinematicTime;
    const radius = 100 + Math.sin(elapsed * 0.1) * 30;
    const height = 30 + Math.sin(elapsed * 0.15) * 20;
    const angle = elapsed * 0.12;

    camera.position.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
    );
    controls.target.set(0, 0, 0);
}

// ═══════════════════════════════════════════════════════════════
// RAYCASTING / HOVER
// ═══════════════════════════════════════════════════════════════

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function updateRaycast() {
    raycaster.setFromCamera(mouse, camera);

    const interactables = [];
    if (earth?.mesh) interactables.push(earth.mesh);
    if (mars?.mesh) interactables.push(mars.mesh);

    const intersects = raycaster.intersectObjects(interactables, false);

    if (intersects.length > 0) {
        const obj = intersects[0].object;
        const ud = obj.userData;
        if (ud?.label) {
            const screenPos = intersects[0].point.clone().project(camera);
            const x = (screenPos.x + 1) / 2 * window.innerWidth;
            const y = (-screenPos.y + 1) / 2 * window.innerHeight;
            showTooltip(x, y, ud.label, ud.description || '');
        }
    } else {
        hideTooltip();
    }
}

// ═══════════════════════════════════════════════════════════════
// RESIZE
// ═══════════════════════════════════════════════════════════════

function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
}

// ═══════════════════════════════════════════════════════════════
// ANIMATION LOOP
// ═══════════════════════════════════════════════════════════════

function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.getElapsedTime();

    // ─── Controls ────────────────────────────
    controls.update();

    // ─── Celestials ──────────────────────────
    updateCelestials(earth, mars, delta);

    // ─── Satellites & Nodes ──────────────────
    updateSatellites(earthSat, marsSat, relayNodes, delta);

    // ─── Rover ───────────────────────────────
    updateRover(rover, delta);

    // ─── Transmission ────────────────────────
    if (transmission) {
        transmission.update(delta);

        const isActive = transmission.active;

        if (isActive) {
            const signal = parseFloat(transmission.getSignalStrength()) || 0;
            updateHUD({
                signal: transmission.getSignalStrength(),
                latency: transmission.getLatency(),
                progress: transmission.getProgress(),
                distance: `${(55 + transmission.getProgress() * 170).toFixed(0)} Mkm`,
            });
            updateSignalBars(signal);
            updateProgressNodes(transmission.currentHop + 1, transmission.hopProgress);
        }

        // Update telemetry displays
        updateWaveform(isActive);
        updateTopology(
            isActive ? transmission.currentHop + 1 : 0,
            transmission.totalHops || 7,
            isActive
        );
        updateBitrate(isActive);
    }

    // ─── Effects ─────────────────────────────
    dataBeam.update(delta);
    dataPacket.update(delta);
    nodePulse.update(delta);

    // ─── Camera ──────────────────────────────
    updateCameraAnimation();
    updateFollowCamera();
    updateCinematicCamera(elapsed);

    // ─── Raycast ─────────────────────────────
    updateRaycast();

    // ─── Starfield rotation ──────────────────
    if (starField) starField.rotation.y += delta * 0.002;

    // ─── UI Updates ──────────────────────────
    updateFPS();
    updateMissionTimer();
    updateCoords(camera);

    // Object count (throttled)
    objCountTimer += delta;
    if (objCountTimer > 2) {
        updateObjectCount(scene);
        objCountTimer = 0;
    }

    // ─── Render ──────────────────────────────
    composer.render();
}

// ═══════════════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════════════

init().catch(err => {
    console.error('ISMC initialization failed:', err);
    const status = document.getElementById('loader-status');
    if (status) status.textContent = `Error: ${err.message}`;
});
