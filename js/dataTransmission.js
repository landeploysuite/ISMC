/**
 * ISMC — dataTransmission.js
 * Core simulation: data packet hop-by-hop from Earth → Relay Mesh → Mars Rover
 */

import * as THREE from 'three';

export class DataTransmission {
    /**
     * @param {object} config
     * @param {object} config.earth - Earth celestial object
     * @param {object} config.mars - Mars celestial object
     * @param {object} config.earthSat - Earth orbital satellite
     * @param {object} config.marsSat - Mars orbital satellite
     * @param {object[]} config.relayNodes - Array of relay node objects
     * @param {object} config.rover - Rover object
     * @param {object} config.dataPacket - DataPacket effect instance
     * @param {object} config.dataBeam - DataBeam effect instance
     * @param {object} config.nodePulse - NodePulse effect instance
     * @param {function} config.onHopStart - Callback when a hop begins
     * @param {function} config.onHopComplete - Callback when a hop completes
     * @param {function} config.onTransmissionComplete - Callback when full transmission completes
     * @param {function} config.onLog - Callback for log messages
     */
    constructor(config) {
        this.config = config;
        this.active = false;
        this.currentHop = 0;
        this.hopProgress = 0;
        this.hopDuration = 2.0; // seconds per hop (base)
        this.speedMultiplier = 1.0;
        this.path = [];
        this.pathLabels = [];
        this.totalHops = 0;
        this.beams = [];
    }

    /**
     * Build the transmission path from Earth surface → Earth Sat → Relays → Mars Sat → Rover
     */
    buildPath() {
        const path = [];
        const labels = [];

        // 1. Earth surface (ground station)
        const earthWorldPos = new THREE.Vector3();
        this.config.earth.group.getWorldPosition(earthWorldPos);
        // Offset to surface
        const groundStation = earthWorldPos.clone();
        groundStation.y += this.config.earth.radius + 0.5;
        path.push(groundStation);
        labels.push('GROUND STATION');

        // 2. Earth orbital satellite
        const earthSatPos = new THREE.Vector3();
        this.config.earthSat.model.getWorldPosition(earthSatPos);
        path.push(earthSatPos);
        labels.push('EARTH ORBITAL');

        // 3. Relay nodes
        for (const node of this.config.relayNodes) {
            path.push(node.model.position.clone());
            labels.push(node.model.userData.label);
        }

        // 4. Mars orbital satellite
        const marsSatPos = new THREE.Vector3();
        this.config.marsSat.model.getWorldPosition(marsSatPos);
        path.push(marsSatPos);
        labels.push('MARS ORBITAL');

        // 5. Rover on Mars surface
        const roverWorldPos = new THREE.Vector3();
        this.config.rover.model.getWorldPosition(roverWorldPos);
        path.push(roverWorldPos);
        labels.push('MARS ROVER');

        this.path = path;
        this.pathLabels = labels;
        this.totalHops = path.length - 1;
    }

    /**
     * Start the data transmission
     */
    start() {
        if (this.active) return;

        this.buildPath();
        this.active = true;
        this.currentHop = 0;
        this.hopProgress = 0;

        // Clear old beams
        this.config.dataBeam.removeAll();
        this.beams = [];

        // Show data packet at start
        this.config.dataPacket.show(this.path[0]);

        // Log
        this.config.onLog?.('Transmission initiated', 'info');
        this.config.onLog?.(`Path: ${this.totalHops} hops`, 'info');

        // Start first hop
        this.startHop();
    }

    startHop() {
        const from = this.path[this.currentHop];
        const to = this.path[this.currentHop + 1];

        // Calculate distance-based duration
        const dist = from.distanceTo(to);
        this.hopDuration = Math.max(0.8, dist * 0.04) / this.speedMultiplier;

        // Create beam
        const beam = this.config.dataBeam.createBeam(from, to, 0x38b6ff);
        this.config.dataBeam.activateBeam(beam, this.hopDuration);
        this.beams.push(beam);

        // Trigger pulse at source
        this.config.nodePulse.trigger(from, 0x38b6ff);

        // Callback
        const fromLabel = this.pathLabels[this.currentHop];
        const toLabel = this.pathLabels[this.currentHop + 1];
        this.config.onHopStart?.(this.currentHop, fromLabel, toLabel, this.totalHops);
        this.config.onLog?.(`${fromLabel} → ${toLabel}`, 'info');
    }

    /**
     * Update transmission (call each frame)
     */
    update(delta) {
        if (!this.active) return;

        const adjustedDelta = delta * this.speedMultiplier;
        this.hopProgress += adjustedDelta / this.hopDuration;

        if (this.hopProgress >= 1.0) {
            this.hopProgress = 1.0;

            // Trigger pulse at destination
            const destPos = this.path[this.currentHop + 1];
            this.config.nodePulse.trigger(destPos, 0x2ecc71);

            // Callback
            const toLabel = this.pathLabels[this.currentHop + 1];
            this.config.onHopComplete?.(this.currentHop, toLabel, this.totalHops);
            this.config.onLog?.(`✓ Received at ${toLabel}`, 'success');

            // Move to next hop
            this.currentHop++;
            this.hopProgress = 0;

            if (this.currentHop >= this.totalHops) {
                // Transmission complete!
                this.complete();
                return;
            }

            // Start next hop
            this.startHop();
        }

        // Interpolate packet position
        if (this.currentHop < this.totalHops) {
            const from = this.path[this.currentHop];
            const to = this.path[this.currentHop + 1];
            const pos = new THREE.Vector3().lerpVectors(from, to, this.hopProgress);
            this.config.dataPacket.moveTo(pos);
        }
    }

    complete() {
        this.active = false;
        this.config.dataPacket.hide();
        this.config.onTransmissionComplete?.();
        this.config.onLog?.('★ Transmission complete! Data received by rover.', 'success');

        // Flash rover LED
        if (this.config.rover.ledMat) {
            this.config.rover.ledMat.color.setHex(0x38b6ff);
            setTimeout(() => {
                this.config.rover.ledMat.color.setHex(0x2ecc71);
            }, 2000);
        }
    }

    setSpeed(multiplier) {
        this.speedMultiplier = multiplier;
    }

    /**
     * Get current progress as 0-1 fraction
     */
    getProgress() {
        if (!this.active && this.currentHop >= this.totalHops) return 1;
        if (!this.active) return 0;
        return (this.currentHop + this.hopProgress) / this.totalHops;
    }

    /**
     * Get simulated latency string
     */
    getLatency() {
        if (!this.active) return '—';
        // Simulated: ~3-22 minutes for Earth-Mars
        const baseLatency = 3 + (this.getProgress() * 19);
        return `${baseLatency.toFixed(1)} min`;
    }

    /**
     * Get signal strength string
     */
    getSignalStrength() {
        if (!this.active) return '—';
        // Signal degrades over distance, strengthens at each relay
        const hopFraction = this.hopProgress;
        const strength = Math.round(95 - hopFraction * 30 + Math.random() * 5);
        return `${Math.min(99, Math.max(40, strength))}%`;
    }
}
