/**
 * ISMC — celestial.js
 * Enhanced Earth and Mars with multi-layer atmospheres, cloud layers, city lights, and detailed textures
 */

import * as THREE from 'three';

// ─── Procedural Earth Texture (High Detail) ──────────────────

function createEarthTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Deep ocean gradient
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, 1024);
    oceanGrad.addColorStop(0, '#0a2a4a');
    oceanGrad.addColorStop(0.15, '#0d3866');
    oceanGrad.addColorStop(0.35, '#145080');
    oceanGrad.addColorStop(0.5, '#176090');
    oceanGrad.addColorStop(0.65, '#145080');
    oceanGrad.addColorStop(0.85, '#0d3866');
    oceanGrad.addColorStop(1, '#0a2a4a');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 2048, 1024);

    // Ocean depth variation
    for (let i = 0; i < 80; i++) {
        ctx.fillStyle = `rgba(${10 + Math.random() * 20}, ${40 + Math.random() * 30}, ${80 + Math.random() * 40}, 0.15)`;
        ctx.beginPath();
        ctx.ellipse(
            Math.random() * 2048, Math.random() * 1024,
            40 + Math.random() * 120, 20 + Math.random() * 60,
            Math.random() * Math.PI, 0, Math.PI * 2
        );
        ctx.fill();
    }

    // Continental shapes — more realistic blobs
    const continents = [
        // North America
        { cx: 420, cy: 300, points: [[380,220],[460,200],[520,240],[540,300],[510,380],[460,420],[400,400],[360,350],[350,280]] },
        // South America
        { cx: 520, cy: 560, points: [[500,450],[540,460],[560,520],[550,600],[530,680],[500,720],[480,700],[470,620],[480,520]] },
        // Europe
        { cx: 1050, cy: 270, points: [[1000,240],[1060,220],[1100,250],[1120,280],[1100,310],[1060,320],[1020,300],[1000,270]] },
        // Africa
        { cx: 1080, cy: 480, points: [[1040,360],[1100,350],[1140,400],[1160,480],[1140,580],[1100,640],[1060,620],[1040,540],[1030,440]] },
        // Asia
        { cx: 1300, cy: 300, points: [[1140,240],[1250,200],[1400,220],[1500,280],[1520,340],[1480,380],[1380,400],[1280,380],[1200,350],[1160,300]] },
        // India
        { cx: 1260, cy: 440, points: [[1230,380],[1280,390],[1300,440],[1280,510],[1250,520],[1230,480]] },
        // Australia
        { cx: 1520, cy: 620, points: [[1460,580],[1540,560],[1600,590],[1610,640],[1580,680],[1500,680],[1460,640]] },
        // Antarctica
        { cx: 1024, cy: 960, points: [[600,940],[800,920],[1100,910],[1400,920],[1500,950],[1300,980],[900,980],[700,960]] },
    ];

    for (const cont of continents) {
        // Base land color
        ctx.fillStyle = '#2a6b3a';
        ctx.beginPath();
        ctx.moveTo(cont.points[0][0], cont.points[0][1]);
        for (let i = 1; i < cont.points.length; i++) {
            const prev = cont.points[i - 1];
            const curr = cont.points[i];
            const cpx = (prev[0] + curr[0]) / 2 + (Math.random() - 0.5) * 30;
            const cpy = (prev[1] + curr[1]) / 2 + (Math.random() - 0.5) * 30;
            ctx.quadraticCurveTo(cpx, cpy, curr[0], curr[1]);
        }
        ctx.closePath();
        ctx.fill();

        // Terrain variation layers
        for (let layer = 0; layer < 12; layer++) {
            const colors = ['#1d5a2d', '#3a7d4a', '#4a8b5a', '#5a9b6a', '#8B7355', '#6b5533', '#7a6b45', '#2d5b3f', '#356b45'];
            ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
            ctx.globalAlpha = 0.2 + Math.random() * 0.3;
            ctx.beginPath();
            ctx.ellipse(
                cont.cx + (Math.random() - 0.5) * 120,
                cont.cy + (Math.random() - 0.5) * 100,
                15 + Math.random() * 50,
                10 + Math.random() * 35,
                Math.random() * Math.PI, 0, Math.PI * 2
            );
            ctx.fill();
        }

        // Mountain ranges (lighter spots)
        for (let m = 0; m < 4; m++) {
            ctx.fillStyle = '#8a7a60';
            ctx.globalAlpha = 0.15;
            ctx.beginPath();
            ctx.ellipse(
                cont.cx + (Math.random() - 0.5) * 80,
                cont.cy + (Math.random() - 0.5) * 60,
                5 + Math.random() * 25,
                3 + Math.random() * 10,
                Math.random() * Math.PI, 0, Math.PI * 2
            );
            ctx.fill();
        }

        // Deserts (sandy patches)
        if (Math.random() > 0.4) {
            ctx.fillStyle = '#c4a55a';
            ctx.globalAlpha = 0.2;
            ctx.beginPath();
            ctx.ellipse(
                cont.cx + (Math.random() - 0.5) * 60,
                cont.cy + (Math.random() - 0.5) * 40,
                10 + Math.random() * 30,
                8 + Math.random() * 20,
                Math.random() * Math.PI, 0, Math.PI * 2
            );
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1.0;

    // Ice caps with gradient
    const iceGradN = ctx.createLinearGradient(0, 0, 0, 60);
    iceGradN.addColorStop(0, 'rgba(220, 235, 250, 0.9)');
    iceGradN.addColorStop(1, 'rgba(220, 235, 250, 0)');
    ctx.fillStyle = iceGradN;
    ctx.fillRect(0, 0, 2048, 60);

    const iceGradS = ctx.createLinearGradient(0, 964, 0, 1024);
    iceGradS.addColorStop(0, 'rgba(220, 235, 250, 0)');
    iceGradS.addColorStop(1, 'rgba(220, 235, 250, 0.9)');
    ctx.fillStyle = iceGradS;
    ctx.fillRect(0, 964, 2048, 60);

    return new THREE.CanvasTexture(canvas);
}

// ─── Earth Cloud Layer Texture ───────────────────────────────

function createCloudTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Transparent background
    ctx.clearRect(0, 0, 2048, 1024);

    // Cloud bands and swirls
    for (let i = 0; i < 120; i++) {
        const x = Math.random() * 2048;
        const y = Math.random() * 1024;
        const w = 30 + Math.random() * 200;
        const h = 8 + Math.random() * 40;

        ctx.fillStyle = `rgba(255, 255, 255, ${0.03 + Math.random() * 0.12})`;
        ctx.beginPath();
        ctx.ellipse(x, y, w, h, Math.random() * Math.PI * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Cluster clouds
        for (let j = 0; j < 3; j++) {
            ctx.fillStyle = `rgba(255, 255, 255, ${0.02 + Math.random() * 0.06})`;
            ctx.beginPath();
            ctx.ellipse(
                x + (Math.random() - 0.5) * w * 0.8,
                y + (Math.random() - 0.5) * h * 2,
                w * (0.3 + Math.random() * 0.5),
                h * (0.5 + Math.random() * 0.8),
                Math.random() * Math.PI, 0, Math.PI * 2
            );
            ctx.fill();
        }
    }

    // Hurricane spiral (tropical cyclone)
    ctx.save();
    ctx.translate(800, 500);
    for (let a = 0; a < 6; a++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.04})`;
        ctx.beginPath();
        ctx.arc(0, 0, 30 + a * 8, a * 0.5, a * 0.5 + 2, false);
        ctx.lineTo(0, 0);
        ctx.fill();
    }
    ctx.restore();

    return new THREE.CanvasTexture(canvas);
}

// ─── Earth Night Lights Texture ──────────────────────────────

function createNightLightsTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 2048, 1024);

    // City clusters
    const cityRegions = [
        { x: 1050, y: 270, r: 40, density: 60 },  // Europe
        { x: 1300, y: 300, r: 50, density: 70 },   // East Asia
        { x: 1260, y: 380, r: 25, density: 40 },   // India
        { x: 420, y: 300, r: 35, density: 50 },     // North America East
        { x: 350, y: 320, r: 20, density: 30 },     // NA West
        { x: 520, y: 500, r: 15, density: 20 },     // Brazil
        { x: 1080, y: 420, r: 15, density: 15 },    // Middle East
        { x: 1520, y: 620, r: 15, density: 15 },    // Australia
    ];

    for (const region of cityRegions) {
        for (let i = 0; i < region.density; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * region.r;
            const cx = region.x + Math.cos(angle) * dist;
            const cy = region.y + Math.sin(angle) * dist;

            // City glow
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 3 + Math.random() * 5);
            grad.addColorStop(0, `rgba(255, 200, 80, ${0.4 + Math.random() * 0.4})`);
            grad.addColorStop(1, 'rgba(255, 200, 80, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(cx - 8, cy - 8, 16, 16);

            // Individual lights
            for (let j = 0; j < 5; j++) {
                ctx.fillStyle = `rgba(255, ${180 + Math.random() * 75}, ${40 + Math.random() * 60}, ${0.3 + Math.random() * 0.5})`;
                ctx.fillRect(
                    cx + (Math.random() - 0.5) * 10,
                    cy + (Math.random() - 0.5) * 10,
                    1, 1
                );
            }
        }
    }

    return new THREE.CanvasTexture(canvas);
}

// ─── Procedural Mars Texture (High Detail) ───────────────────

function createMarsTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Mars base gradient
    const marsGrad = ctx.createLinearGradient(0, 0, 0, 1024);
    marsGrad.addColorStop(0, '#8b4020');
    marsGrad.addColorStop(0.15, '#b0582a');
    marsGrad.addColorStop(0.3, '#c4703a');
    marsGrad.addColorStop(0.5, '#d48050');
    marsGrad.addColorStop(0.7, '#c06a35');
    marsGrad.addColorStop(0.85, '#a0522d');
    marsGrad.addColorStop(1, '#7a3518');
    ctx.fillStyle = marsGrad;
    ctx.fillRect(0, 0, 2048, 1024);

    // Large dark regions (maria)
    const darkRegions = [
        { x: 800, y: 400, w: 300, h: 150 },    // Syrtis Major
        { x: 1200, y: 350, w: 200, h: 100 },
        { x: 400, y: 500, w: 250, h: 120 },     // Acidalia
        { x: 1500, y: 300, w: 180, h: 90 },
    ];

    for (const region of darkRegions) {
        ctx.fillStyle = 'rgba(80, 35, 15, 0.35)';
        ctx.beginPath();
        ctx.ellipse(region.x, region.y, region.w / 2, region.h / 2, Math.random() * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Sub-detail
        for (let i = 0; i < 8; i++) {
            ctx.fillStyle = `rgba(${60 + Math.random() * 40}, ${25 + Math.random() * 20}, ${10 + Math.random() * 15}, 0.2)`;
            ctx.beginPath();
            ctx.ellipse(
                region.x + (Math.random() - 0.5) * region.w * 0.7,
                region.y + (Math.random() - 0.5) * region.h * 0.7,
                region.w * 0.1 + Math.random() * region.w * 0.15,
                region.h * 0.1 + Math.random() * region.h * 0.15,
                Math.random() * Math.PI, 0, Math.PI * 2
            );
            ctx.fill();
        }
    }

    // Valles Marineris (deep canyon system)
    ctx.strokeStyle = 'rgba(60, 25, 10, 0.5)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(600, 460);
    ctx.bezierCurveTo(750, 450, 900, 470, 1100, 455);
    ctx.bezierCurveTo(1150, 452, 1200, 460, 1250, 458);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(50, 20, 8, 0.3)';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(600, 460);
    ctx.bezierCurveTo(750, 448, 900, 472, 1100, 455);
    ctx.stroke();

    // Olympus Mons (large shield volcano)
    const omx = 500, omy = 350;
    for (let r = 80; r > 0; r -= 4) {
        const intensity = 0.08 + (80 - r) / 80 * 0.15;
        ctx.fillStyle = `rgba(${180 + (80-r)}, ${100 + (80-r)*0.5}, ${50 + (80-r)*0.3}, ${intensity})`;
        ctx.beginPath();
        ctx.arc(omx, omy, r, 0, Math.PI * 2);
        ctx.fill();
    }
    // Caldera
    ctx.fillStyle = 'rgba(60, 25, 10, 0.4)';
    ctx.beginPath();
    ctx.arc(omx, omy, 12, 0, Math.PI * 2);
    ctx.fill();

    // Impact craters
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * 2048;
        const y = Math.random() * 1024;
        const r = 2 + Math.random() * 20;

        // Crater rim (lighter)
        ctx.strokeStyle = `rgba(${200 + Math.random() * 40}, ${140 + Math.random() * 40}, ${80 + Math.random() * 40}, ${0.1 + Math.random() * 0.15})`;
        ctx.lineWidth = 1 + Math.random() * 2;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();

        // Crater shadow (darker inside)
        ctx.fillStyle = `rgba(${60 + Math.random() * 30}, ${30 + Math.random() * 20}, ${15 + Math.random() * 15}, ${0.08 + Math.random() * 0.12})`;
        ctx.beginPath();
        ctx.arc(x + 1, y + 1, r * 0.7, 0, Math.PI * 2);
        ctx.fill();
    }

    // Dust storm regions (lighter hazy patches)
    for (let i = 0; i < 15; i++) {
        ctx.fillStyle = `rgba(210, 160, 100, ${0.05 + Math.random() * 0.08})`;
        ctx.beginPath();
        ctx.ellipse(
            Math.random() * 2048, Math.random() * 1024,
            40 + Math.random() * 100, 20 + Math.random() * 50,
            Math.random() * Math.PI, 0, Math.PI * 2
        );
        ctx.fill();
    }

    // Polar ice caps with gradient
    const iceN = ctx.createLinearGradient(0, 0, 0, 70);
    iceN.addColorStop(0, 'rgba(230, 220, 210, 0.85)');
    iceN.addColorStop(0.5, 'rgba(220, 210, 200, 0.4)');
    iceN.addColorStop(1, 'rgba(210, 190, 170, 0)');
    ctx.fillStyle = iceN;
    ctx.fillRect(0, 0, 2048, 70);

    const iceS = ctx.createLinearGradient(0, 954, 0, 1024);
    iceS.addColorStop(0, 'rgba(210, 190, 170, 0)');
    iceS.addColorStop(0.5, 'rgba(220, 210, 200, 0.4)');
    iceS.addColorStop(1, 'rgba(230, 220, 210, 0.85)');
    ctx.fillStyle = iceS;
    ctx.fillRect(0, 954, 2048, 70);

    // Surface noise for texture
    ctx.globalAlpha = 0.04;
    for (let i = 0; i < 6000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
        ctx.fillRect(Math.random() * 2048, Math.random() * 1024, 1, 1);
    }
    ctx.globalAlpha = 1.0;

    return new THREE.CanvasTexture(canvas);
}

// ─── Mars Bump/Normal Map ────────────────────────────────────

function createMarsBumpMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 1024, 512);

    // Elevation variations
    for (let i = 0; i < 200; i++) {
        const val = 100 + Math.random() * 60;
        ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
        ctx.beginPath();
        ctx.ellipse(
            Math.random() * 1024, Math.random() * 512,
            5 + Math.random() * 30, 5 + Math.random() * 20,
            Math.random() * Math.PI, 0, Math.PI * 2
        );
        ctx.fill();
    }

    // Craters as depressions
    for (let i = 0; i < 60; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 512;
        const r = 3 + Math.random() * 15;
        ctx.fillStyle = `rgb(60, 60, 60)`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgb(160, 160, 160)`;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }

    return new THREE.CanvasTexture(canvas);
}

// ─── Multi-Layer Atmosphere ──────────────────────────────────

function createAtmosphereShell(radius, color, opacity, segments = 64) {
    const geo = new THREE.SphereGeometry(radius, segments, segments);
    const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        side: THREE.BackSide,
        depthWrite: false,
    });
    return new THREE.Mesh(geo, mat);
}

// ─── Create Earth ────────────────────────────────────────────

export function createEarth(scene) {
    const group = new THREE.Group();
    group.name = 'earth-group';

    // Planet sphere (high detail)
    const earthGeo = new THREE.SphereGeometry(5, 128, 128);
    const earthTex = createEarthTexture();
    earthTex.anisotropy = 8;
    const earthMat = new THREE.MeshStandardMaterial({
        map: earthTex,
        roughness: 0.65,
        metalness: 0.08,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.name = 'earth';
    earthMesh.userData = { type: 'planet', label: 'EARTH', description: 'Origin planet\nGround station transmitter' };
    group.add(earthMesh);

    // Cloud layer (separate rotating sphere)
    const cloudGeo = new THREE.SphereGeometry(5.08, 96, 96);
    const cloudTex = createCloudTexture();
    const cloudMat = new THREE.MeshBasicMaterial({
        map: cloudTex,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    cloudMesh.name = 'earth-clouds';
    group.add(cloudMesh);

    // Night lights layer (emissive, visible on dark side)
    const nightGeo = new THREE.SphereGeometry(5.02, 96, 96);
    const nightTex = createNightLightsTexture();
    const nightMat = new THREE.MeshBasicMaterial({
        map: nightTex,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    const nightMesh = new THREE.Mesh(nightGeo, nightMat);
    nightMesh.name = 'earth-night';
    group.add(nightMesh);

    // Multi-layer atmosphere
    group.add(createAtmosphereShell(5.12, 0x4499ff, 0.08));
    group.add(createAtmosphereShell(5.20, 0x3388ee, 0.05));
    group.add(createAtmosphereShell(5.35, 0x2266cc, 0.03));
    group.add(createAtmosphereShell(5.55, 0x1155aa, 0.015));

    // Fresnel-like atmosphere ring at equator
    const ringGeo = new THREE.TorusGeometry(5.5, 0.08, 16, 128);
    const ringMat = new THREE.MeshBasicMaterial({
        color: 0x4499ff,
        transparent: true,
        opacity: 0.06,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    // Ground station marker (glowing beacon on surface)
    const beaconGeo = new THREE.ConeGeometry(0.15, 0.6, 8);
    const beaconMat = new THREE.MeshBasicMaterial({
        color: 0x38b6ff,
        transparent: true,
        opacity: 0.9,
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0, 5.3, 0);
    group.add(beacon);

    // Beacon glow
    const beaconGlowGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const beaconGlowMat = new THREE.MeshBasicMaterial({
        color: 0x38b6ff,
        transparent: true,
        opacity: 0.3,
    });
    const beaconGlow = new THREE.Mesh(beaconGlowGeo, beaconGlowMat);
    beaconGlow.position.set(0, 5.5, 0);
    group.add(beaconGlow);

    // Position Earth
    group.position.set(-60, 0, 0);

    scene.add(group);
    return { group, mesh: earthMesh, cloudMesh, nightMesh, radius: 5 };
}

// ─── Create Mars ─────────────────────────────────────────────

export function createMars(scene) {
    const group = new THREE.Group();
    group.name = 'mars-group';

    // Planet sphere (high detail with bump map)
    const marsGeo = new THREE.SphereGeometry(3.5, 128, 128);
    const marsTex = createMarsTexture();
    marsTex.anisotropy = 8;
    const marsBump = createMarsBumpMap();
    const marsMat = new THREE.MeshStandardMaterial({
        map: marsTex,
        bumpMap: marsBump,
        bumpScale: 0.15,
        roughness: 0.92,
        metalness: 0.03,
    });
    const marsMesh = new THREE.Mesh(marsGeo, marsMat);
    marsMesh.name = 'mars';
    marsMesh.userData = { type: 'planet', label: 'MARS', description: 'Destination planet\nRover receiver' };
    group.add(marsMesh);

    // Thin dusty atmosphere — multi-layer
    group.add(createAtmosphereShell(3.56, 0xcc7744, 0.06));
    group.add(createAtmosphereShell(3.65, 0xbb6633, 0.035));
    group.add(createAtmosphereShell(3.78, 0xaa5522, 0.018));

    // Dust haze ring
    const dustGeo = new THREE.TorusGeometry(3.8, 0.06, 12, 96);
    const dustMat = new THREE.MeshBasicMaterial({
        color: 0xcc8855,
        transparent: true,
        opacity: 0.04,
    });
    const dustRing = new THREE.Mesh(dustGeo, dustMat);
    dustRing.rotation.x = Math.PI / 2;
    group.add(dustRing);

    // Phobos (tiny moon)
    const phobosGeo = new THREE.IcosahedronGeometry(0.2, 1);
    const phobosMat = new THREE.MeshStandardMaterial({
        color: 0x887766,
        roughness: 0.95,
        metalness: 0.05,
    });
    const phobos = new THREE.Mesh(phobosGeo, phobosMat);
    phobos.position.set(5.5, 0.5, 0);
    phobos.name = 'phobos';
    group.add(phobos);

    // Deimos (even tinier moon)
    const deimosGeo = new THREE.IcosahedronGeometry(0.12, 0);
    const deimosMat = new THREE.MeshStandardMaterial({
        color: 0x776655,
        roughness: 0.95,
        metalness: 0.05,
    });
    const deimos = new THREE.Mesh(deimosGeo, deimosMat);
    deimos.position.set(7, -0.3, 2);
    deimos.name = 'deimos';
    group.add(deimos);

    // Position Mars
    group.position.set(60, 0, 0);

    scene.add(group);
    return { group, mesh: marsMesh, radius: 3.5, phobos, deimos };
}

// ─── Update Rotation ─────────────────────────────────────────

export function updateCelestials(earth, mars, delta) {
    if (earth) {
        if (earth.mesh) earth.mesh.rotation.y += delta * 0.08;
        // Clouds rotate slightly faster (different wind speed)
        if (earth.cloudMesh) earth.cloudMesh.rotation.y += delta * 0.11;
        // Night lights track with surface
        if (earth.nightMesh) earth.nightMesh.rotation.y = earth.mesh.rotation.y;
    }
    if (mars) {
        if (mars.mesh) mars.mesh.rotation.y += delta * 0.06;
        // Orbit moons
        const time = performance.now() * 0.001;
        if (mars.phobos) {
            mars.phobos.position.x = Math.cos(time * 0.5) * 5.5;
            mars.phobos.position.z = Math.sin(time * 0.5) * 5.5;
            mars.phobos.rotation.y += delta * 0.3;
        }
        if (mars.deimos) {
            mars.deimos.position.x = Math.cos(time * 0.25) * 7;
            mars.deimos.position.z = Math.sin(time * 0.25) * 7;
            mars.deimos.rotation.y += delta * 0.2;
        }
    }
}
