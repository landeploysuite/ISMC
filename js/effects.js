/**
 * ISMC — effects.js
 * Enhanced visual effects: beams, particle trails, node activation pulses, bloom
 */

import * as THREE from 'three';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';

// ─── Bloom Setup ─────────────────────────────────────────────
export function createBloomComposer(renderer, scene, camera) {
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.0,   // strength (increased)
        0.5,   // radius
        0.6    // threshold (lowered for more glow)
    );
    composer.addPass(bloomPass);

    return { composer, bloomPass };
}

// ─── Animated Beam Between Two Points ────────────────────────
export class DataBeam {
    constructor(scene) {
        this.scene = scene;
        this.beams = [];
    }

    createBeam(from, to, color = 0x38b6ff) {
        const beamGroup = new THREE.Group();

        // === Main beam (tube geometry for thickness) ===
        const direction = new THREE.Vector3().subVectors(to, from);
        const length = direction.length();
        const midPoint = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);

        // Core line
        const corePoints = [];
        const segments = 80;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            corePoints.push(new THREE.Vector3().lerpVectors(from, to, t));
        }
        const coreGeo = new THREE.BufferGeometry().setFromPoints(corePoints);
        const coreMat = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.0,
            linewidth: 1,
        });
        const coreLine = new THREE.Line(coreGeo, coreMat);
        beamGroup.add(coreLine);

        // Glow line (wider effect simulated with second line)
        const glowMat = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.0,
            linewidth: 1,
        });
        const glowLine = new THREE.Line(coreGeo.clone(), glowMat);
        beamGroup.add(glowLine);

        // === Animated particles along beam path ===
        const particleCount = 30;
        const particleGeo = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleSizes = new Float32Array(particleCount);
        const particleAlphas = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            particleSizes[i] = 0.3 + Math.random() * 0.5;
            particleAlphas[i] = Math.random();
        }
        particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

        const particleMat = new THREE.PointsMaterial({
            color: color,
            size: 0.4,
            transparent: true,
            opacity: 0,
            sizeAttenuation: true,
        });
        const particles = new THREE.Points(particleGeo, particleMat);
        beamGroup.add(particles);

        this.scene.add(beamGroup);

        const beam = {
            group: beamGroup,
            coreLine, glowLine, coreMat, glowMat,
            particles, particleMat, particleGeo,
            particlePositions, particleSizes, particleAlphas,
            particleCount,
            from: from.clone(), to: to.clone(),
            progress: 0,
            active: false,
            duration: 1.0,
            length,
        };

        this.beams.push(beam);
        return beam;
    }

    activateBeam(beam, duration = 1.0) {
        beam.active = true;
        beam.progress = 0;
        beam.duration = duration;
        beam.coreMat.opacity = 0.9;
        beam.glowMat.opacity = 0.35;
        beam.particleMat.opacity = 0.7;
    }

    update(delta) {
        const time = performance.now() * 0.001;

        for (const beam of this.beams) {
            if (!beam.active) continue;

            beam.progress += delta / beam.duration;

            // Animate particles flowing along beam
            const positions = beam.particlePositions;
            for (let i = 0; i < beam.particleCount; i++) {
                const i3 = i * 3;
                const t = ((time * 2 + i * 0.15) % 1);
                const pos = new THREE.Vector3().lerpVectors(beam.from, beam.to, t);

                // Add slight perpendicular jitter
                pos.x += (Math.random() - 0.5) * 0.15;
                pos.y += (Math.random() - 0.5) * 0.15;
                pos.z += (Math.random() - 0.5) * 0.15;

                positions[i3] = pos.x;
                positions[i3 + 1] = pos.y;
                positions[i3 + 2] = pos.z;
            }
            beam.particleGeo.attributes.position.needsUpdate = true;

            if (beam.progress >= 1.0) {
                beam.progress = 1.0;
                beam.coreMat.opacity *= 0.92;
                beam.glowMat.opacity *= 0.92;
                beam.particleMat.opacity *= 0.92;

                if (beam.coreMat.opacity < 0.01) {
                    beam.active = false;
                    beam.coreMat.opacity = 0;
                    beam.glowMat.opacity = 0;
                    beam.particleMat.opacity = 0;
                }
            }
        }
    }

    removeAll() {
        for (const beam of this.beams) {
            this.scene.remove(beam.group);
            beam.coreLine.geometry.dispose();
            beam.coreMat.dispose();
            beam.glowLine.geometry.dispose();
            beam.glowMat.dispose();
            beam.particleGeo.dispose();
            beam.particleMat.dispose();
        }
        this.beams = [];
    }
}

// ─── Enhanced Data Packet (Glowing Sphere with energy field) ─
export class DataPacket {
    constructor(scene) {
        this.scene = scene;

        this.group = new THREE.Group();

        // === Core sphere (bright center) ===
        const coreGeo = new THREE.IcosahedronGeometry(0.3, 2);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0x38b6ff,
            transparent: true,
            opacity: 0,
        });
        this.core = new THREE.Mesh(coreGeo, coreMat);
        this.group.add(this.core);

        // === Inner glow sphere ===
        const innerGlowGeo = new THREE.SphereGeometry(0.5, 24, 24);
        const innerGlowMat = new THREE.MeshBasicMaterial({
            color: 0x38b6ff,
            transparent: true,
            opacity: 0,
            side: THREE.BackSide,
        });
        this.innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
        this.group.add(this.innerGlow);

        // === Outer glow sphere ===
        const outerGlowGeo = new THREE.SphereGeometry(0.8, 16, 16);
        const outerGlowMat = new THREE.MeshBasicMaterial({
            color: 0x2288cc,
            transparent: true,
            opacity: 0,
            side: THREE.BackSide,
            depthWrite: false,
        });
        this.outerGlow = new THREE.Mesh(outerGlowGeo, outerGlowMat);
        this.group.add(this.outerGlow);

        // === Wireframe energy field ===
        const wireGeo = new THREE.IcosahedronGeometry(0.55, 1);
        const wireMat = new THREE.MeshBasicMaterial({
            color: 0x7dd3fc,
            wireframe: true,
            transparent: true,
            opacity: 0,
        });
        this.wireField = new THREE.Mesh(wireGeo, wireMat);
        this.group.add(this.wireField);

        // === Rotating ring 1 ===
        const ring1Geo = new THREE.TorusGeometry(0.55, 0.025, 8, 48);
        const ring1Mat = new THREE.MeshBasicMaterial({
            color: 0x7dd3fc,
            transparent: true,
            opacity: 0,
        });
        this.ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
        this.group.add(this.ring1);

        // === Rotating ring 2 (perpendicular) ===
        const ring2Geo = new THREE.TorusGeometry(0.65, 0.018, 8, 48);
        const ring2Mat = new THREE.MeshBasicMaterial({
            color: 0xa855f7,
            transparent: true,
            opacity: 0,
        });
        this.ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
        this.ring2.rotation.x = Math.PI / 2;
        this.group.add(this.ring2);

        // === Rotating ring 3 (diagonal) ===
        const ring3Geo = new THREE.TorusGeometry(0.45, 0.015, 8, 32);
        const ring3Mat = new THREE.MeshBasicMaterial({
            color: 0x38b6ff,
            transparent: true,
            opacity: 0,
        });
        this.ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
        this.ring3.rotation.x = Math.PI / 3;
        this.ring3.rotation.y = Math.PI / 4;
        this.group.add(this.ring3);

        // === Point light ===
        this.pointLight = new THREE.PointLight(0x38b6ff, 0, 15);
        this.group.add(this.pointLight);

        this.group.visible = false;
        scene.add(this.group);

        // === Particle trail ===
        this.trailParticles = [];
        this.trailGroup = new THREE.Group();
        scene.add(this.trailGroup);

        this.active = false;
        this.time = 0;
    }

    show(position) {
        this.group.visible = true;
        this.group.position.copy(position);
        this.core.material.opacity = 1;
        this.innerGlow.material.opacity = 0.35;
        this.outerGlow.material.opacity = 0.12;
        this.wireField.material.opacity = 0.3;
        this.ring1.material.opacity = 0.5;
        this.ring2.material.opacity = 0.35;
        this.ring3.material.opacity = 0.4;
        this.pointLight.intensity = 2;
        this.active = true;
        this.time = 0;
    }

    hide() {
        this.group.visible = false;
        this.active = false;
        this.core.material.opacity = 0;
        this.innerGlow.material.opacity = 0;
        this.outerGlow.material.opacity = 0;
        this.wireField.material.opacity = 0;
        this.ring1.material.opacity = 0;
        this.ring2.material.opacity = 0;
        this.ring3.material.opacity = 0;
        this.pointLight.intensity = 0;

        for (const p of this.trailParticles) {
            this.trailGroup.remove(p.mesh);
            p.mesh.geometry.dispose();
            p.mesh.material.dispose();
        }
        this.trailParticles = [];
    }

    moveTo(position) {
        if (!this.active) return;

        // Spawn trail particles
        for (let i = 0; i < 2; i++) {
            const trailGeo = new THREE.SphereGeometry(0.06 + Math.random() * 0.08, 6, 6);
            const trailMat = new THREE.MeshBasicMaterial({
                color: Math.random() > 0.5 ? 0x38b6ff : 0xa855f7,
                transparent: true,
                opacity: 0.5 + Math.random() * 0.3,
            });
            const trailMesh = new THREE.Mesh(trailGeo, trailMat);
            trailMesh.position.copy(this.group.position);
            // Slight random offset for trail width
            trailMesh.position.x += (Math.random() - 0.5) * 0.3;
            trailMesh.position.y += (Math.random() - 0.5) * 0.3;
            trailMesh.position.z += (Math.random() - 0.5) * 0.3;
            this.trailGroup.add(trailMesh);
            this.trailParticles.push({ mesh: trailMesh, life: 1.0 });
        }

        // Limit trail length
        while (this.trailParticles.length > 60) {
            const old = this.trailParticles.shift();
            this.trailGroup.remove(old.mesh);
            old.mesh.geometry.dispose();
            old.mesh.material.dispose();
        }

        this.group.position.copy(position);
    }

    update(delta) {
        if (!this.active) return;

        this.time += delta;

        // Spin rings at different speeds
        this.ring1.rotation.y += delta * 3;
        this.ring1.rotation.x = Math.sin(this.time * 2) * 0.3;

        this.ring2.rotation.z += delta * 2;
        this.ring2.rotation.y += delta * 1.5;

        this.ring3.rotation.x += delta * 2.5;
        this.ring3.rotation.z += delta * 1.8;

        // Spin wireframe energy field
        this.wireField.rotation.x += delta * 0.8;
        this.wireField.rotation.y += delta * 1.2;

        // Pulsate core
        const corePulse = 1 + Math.sin(this.time * 8) * 0.08;
        this.core.scale.setScalar(corePulse);

        // Pulsate glow
        this.innerGlow.material.opacity = 0.25 + Math.sin(this.time * 5) * 0.1;
        this.innerGlow.scale.setScalar(1 + Math.sin(this.time * 4) * 0.1);

        this.outerGlow.material.opacity = 0.08 + Math.sin(this.time * 3) * 0.04;
        this.outerGlow.scale.setScalar(1 + Math.sin(this.time * 2.5) * 0.15);

        // Pulsate light
        this.pointLight.intensity = 1.5 + Math.sin(this.time * 6) * 0.5;

        // Fade trail particles
        for (let i = this.trailParticles.length - 1; i >= 0; i--) {
            const p = this.trailParticles[i];
            p.life -= delta * 1.2;
            p.mesh.material.opacity = Math.max(0, p.life * 0.5);
            p.mesh.scale.setScalar(Math.max(0.05, p.life * 0.8));

            if (p.life <= 0) {
                this.trailGroup.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                this.trailParticles.splice(i, 1);
            }
        }
    }
}

// ─── Enhanced Node Activation Pulse ──────────────────────────
export class NodePulse {
    constructor(scene) {
        this.scene = scene;
        this.pulses = [];
    }

    trigger(position, color = 0x38b6ff) {
        // Multiple expanding rings
        for (let layer = 0; layer < 3; layer++) {
            const geo = new THREE.TorusGeometry(0.3, 0.04 - layer * 0.01, 8, 48);
            const mat = new THREE.MeshBasicMaterial({
                color,
                transparent: true,
                opacity: 0.7 - layer * 0.2,
                side: THREE.DoubleSide,
                depthWrite: false,
            });
            const ring = new THREE.Mesh(geo, mat);
            ring.position.copy(position);

            // Random rotation for visual variety
            ring.rotation.x = Math.random() * Math.PI;
            ring.rotation.y = Math.random() * Math.PI;

            this.scene.add(ring);
            this.pulses.push({
                ring,
                life: 1.0,
                maxScale: 5 + layer * 2,
                delay: layer * 0.1,
                started: false,
            });
        }

        // Flash sphere
        const flashGeo = new THREE.SphereGeometry(0.5, 16, 16);
        const flashMat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.6,
            depthWrite: false,
        });
        const flash = new THREE.Mesh(flashGeo, flashMat);
        flash.position.copy(position);
        this.scene.add(flash);
        this.pulses.push({
            ring: flash,
            life: 1.0,
            maxScale: 3,
            delay: 0,
            started: true,
            isFlash: true,
        });
    }

    update(delta) {
        for (let i = this.pulses.length - 1; i >= 0; i--) {
            const p = this.pulses[i];

            if (p.delay > 0) {
                p.delay -= delta;
                continue;
            }
            p.started = true;

            p.life -= delta * (p.isFlash ? 2.5 : 1.0);

            const t = 1 - p.life;
            const scale = t * p.maxScale + 1;
            p.ring.scale.setScalar(scale);
            p.ring.material.opacity = Math.max(0, p.life * (p.isFlash ? 0.6 : 0.5));

            if (p.life <= 0) {
                this.scene.remove(p.ring);
                p.ring.geometry.dispose();
                p.ring.material.dispose();
                this.pulses.splice(i, 1);
            }
        }
    }
}
