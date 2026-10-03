/**
 * ISMC v2.0 — ui.js
 * Enhanced HUD updates, waveform/topology visualizations, signal bars, mission timer
 */

// ─── Mission Timer ───────────────────────────────────────────

let missionStartTime = Date.now();

export function updateMissionTimer() {
    const elapsed = Date.now() - missionStartTime;
    const s = Math.floor(elapsed / 1000) % 60;
    const m = Math.floor(elapsed / 60000) % 60;
    const h = Math.floor(elapsed / 3600000);
    const el = document.getElementById('mission-time');
    if (el) el.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ─── Transmission Log ────────────────────────────────────────

export function addLog(message, type = '') {
    const container = document.getElementById('log-container');
    if (!container) return;

    const now = new Date();
    const timeStr = [
        now.getHours().toString().padStart(2, '0'),
        now.getMinutes().toString().padStart(2, '0'),
        now.getSeconds().toString().padStart(2, '0'),
    ].join(':');

    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `
        <span class="log-time">${timeStr}</span>
        <span class="log-msg ${type}">${message}</span>
    `;

    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;

    while (container.children.length > 50) {
        container.removeChild(container.firstChild);
    }
}

// ─── HUD Updates ─────────────────────────────────────────────

export function updateHUD(data) {
    const statusEl = document.getElementById('status-value');
    const hopEl = document.getElementById('hop-value');
    const signalEl = document.getElementById('signal-value');
    const latencyEl = document.getElementById('latency-value');
    const distanceEl = document.getElementById('distance-value');
    const progressEl = document.getElementById('progress-fill');
    const progressGlow = document.getElementById('progress-glow');

    if (statusEl && data.status !== undefined) {
        statusEl.textContent = data.status;
        statusEl.style.color = data.statusColor || '';
    }
    if (hopEl && data.hop !== undefined) hopEl.textContent = data.hop;
    if (signalEl && data.signal !== undefined) signalEl.textContent = data.signal;
    if (latencyEl && data.latency !== undefined) latencyEl.textContent = data.latency;
    if (distanceEl && data.distance !== undefined) distanceEl.textContent = data.distance;
    if (progressEl && data.progress !== undefined) {
        const pct = `${data.progress * 100}%`;
        progressEl.style.width = pct;
        if (progressGlow) progressGlow.style.width = pct;
    }
}

// ─── Signal Bars ─────────────────────────────────────────────

export function updateSignalBars(strength) {
    // strength: 0-100
    const bars = 5;
    for (let i = 1; i <= bars; i++) {
        const bar = document.getElementById(`signal-bar-${i}`);
        if (!bar) continue;

        bar.classList.remove('active', 'warning', 'danger');

        const threshold = (i / bars) * 100;
        if (strength >= threshold) {
            if (strength > 60) bar.classList.add('active');
            else if (strength > 30) bar.classList.add('warning');
            else bar.classList.add('danger');
        }
    }
}

// ─── Bit Rate Display ────────────────────────────────────────

export function updateBitrate(transmitting) {
    const el = document.getElementById('data-bitrate');
    if (!el) return;
    if (transmitting) {
        const rate = 16 + Math.random() * 48;
        el.textContent = `${rate.toFixed(1)} kbps`;
    } else {
        el.textContent = '— kbps';
    }
}

// ─── Waveform Canvas ─────────────────────────────────────────

let waveformCtx = null;
let waveformTime = 0;

export function initWaveform() {
    const canvas = document.getElementById('waveform-canvas');
    if (!canvas) return;
    waveformCtx = canvas.getContext('2d');
}

export function updateWaveform(active) {
    if (!waveformCtx) return;
    const ctx = waveformCtx;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(56, 182, 255, 0.06)';
    ctx.lineWidth = 0.5;
    for (let y = 0; y < h; y += 10) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }
    for (let x = 0; x < w; x += 15) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
    }

    // Center line
    ctx.strokeStyle = 'rgba(56, 182, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    if (active) {
        waveformTime += 0.15;

        // Main signal wave
        ctx.strokeStyle = '#38b6ff';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#38b6ff';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
            const y = h / 2 + Math.sin(x * 0.08 + waveformTime) * 15
                + Math.sin(x * 0.03 + waveformTime * 0.7) * 8
                + (Math.random() - 0.5) * 3;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Carrier wave (fainter)
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
            const y = h / 2 + Math.sin(x * 0.15 + waveformTime * 1.5) * 8;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    } else {
        // Flat line with noise
        ctx.strokeStyle = 'rgba(56, 182, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
            const y = h / 2 + (Math.random() - 0.5) * 2;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
}

// ─── Topology Canvas ─────────────────────────────────────────

let topologyCtx = null;

export function initTopology() {
    const canvas = document.getElementById('topology-canvas');
    if (!canvas) return;
    topologyCtx = canvas.getContext('2d');
}

export function updateTopology(currentHop, totalHops, active) {
    if (!topologyCtx) return;
    const ctx = topologyCtx;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, w, h);

    const nodeCount = totalHops + 1 || 8;
    const padding = 25;
    const usableW = w - padding * 2;
    const arcH = 30;

    // Draw connections
    for (let i = 0; i < nodeCount - 1; i++) {
        const x1 = padding + (i / (nodeCount - 1)) * usableW;
        const x2 = padding + ((i + 1) / (nodeCount - 1)) * usableW;
        const t1 = (i / (nodeCount - 1));
        const t2 = ((i + 1) / (nodeCount - 1));
        const y1 = h / 2 + 10 - Math.sin(t1 * Math.PI) * arcH;
        const y2 = h / 2 + 10 - Math.sin(t2 * Math.PI) * arcH;

        const isActive = active && i < currentHop;
        ctx.strokeStyle = isActive ? '#38b6ff' : 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = isActive ? 1.5 : 0.8;

        if (isActive) {
            ctx.shadowColor = '#38b6ff';
            ctx.shadowBlur = 4;
        }

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    // Draw nodes
    for (let i = 0; i < nodeCount; i++) {
        const x = padding + (i / (nodeCount - 1)) * usableW;
        const t = i / (nodeCount - 1);
        const y = h / 2 + 10 - Math.sin(t * Math.PI) * arcH;

        const isCompleted = active && i < currentHop;
        const isCurrent = active && i === currentHop;

        ctx.beginPath();
        ctx.arc(x, y, isCurrent ? 5 : 3.5, 0, Math.PI * 2);

        if (isCurrent) {
            ctx.fillStyle = '#38b6ff';
            ctx.shadowColor = '#38b6ff';
            ctx.shadowBlur = 8;
        } else if (isCompleted) {
            ctx.fillStyle = '#2ecc71';
            ctx.shadowColor = '#2ecc71';
            ctx.shadowBlur = 4;
        } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.shadowBlur = 0;
        }

        ctx.fill();
        ctx.shadowBlur = 0;

        // Labels for first and last
        if (i === 0 || i === nodeCount - 1) {
            ctx.font = '8px JetBrains Mono, monospace';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.textAlign = 'center';
            ctx.fillText(i === 0 ? 'EARTH' : 'MARS', x, y + 14);
        }
    }
}

// ─── Progress Nodes Bar ──────────────────────────────────────

export function buildProgressNodes(labels) {
    const container = document.getElementById('progress-nodes');
    if (!container) return;

    container.innerHTML = '';

    labels.forEach((label, i) => {
        const nodeEl = document.createElement('div');
        nodeEl.className = 'progress-node';
        nodeEl.innerHTML = `
            <div class="progress-node-dot" data-index="${i}"></div>
            <span class="progress-node-label">${label}</span>
        `;
        container.appendChild(nodeEl);

        if (i < labels.length - 1) {
            const lineEl = document.createElement('div');
            lineEl.className = 'progress-line';
            lineEl.dataset.index = i;
            container.appendChild(lineEl);
        }
    });
}

export function updateProgressNodes(currentHop, hopProgress) {
    const dots = document.querySelectorAll('.progress-node-dot');
    const lines = document.querySelectorAll('.progress-line');
    const labelEls = document.querySelectorAll('.progress-node-label');

    dots.forEach((dot, i) => {
        dot.classList.remove('active', 'completed');
        if (i < currentHop) dot.classList.add('completed');
        if (i === currentHop) dot.classList.add('active');
        if (i === currentHop + 1 && hopProgress > 0.8) dot.classList.add('active');
    });

    lines.forEach((line, i) => {
        line.classList.remove('active');
        if (i < currentHop) line.classList.add('active');
    });

    labelEls.forEach((label, i) => {
        label.classList.remove('active');
        if (i === currentHop || i === currentHop + 1) label.classList.add('active');
    });
}

// ─── Show/Hide Transmission Progress ─────────────────────────

export function showTransmissionProgress() {
    const el = document.getElementById('transmission-progress');
    if (el) el.classList.remove('hidden');
}

export function hideTransmissionProgress() {
    const el = document.getElementById('transmission-progress');
    if (el) el.classList.add('hidden');
}

// ─── Coordinate Display ──────────────────────────────────────

export function updateCoords(camera) {
    const el = document.getElementById('coord-display');
    if (!el || !camera) return;
    el.textContent = `X: ${camera.position.x.toFixed(1)} | Y: ${camera.position.y.toFixed(1)} | Z: ${camera.position.z.toFixed(1)}`;
}

// ─── Object Count ────────────────────────────────────────────

export function updateObjectCount(scene) {
    const el = document.getElementById('obj-count');
    if (!el || !scene) return;
    let count = 0;
    scene.traverse(() => count++);
    el.textContent = `OBJ: ${count}`;
}

// ─── FPS Counter ─────────────────────────────────────────────

let fpsFrames = 0;
let fpsLastTime = performance.now();

export function updateFPS() {
    fpsFrames++;
    const now = performance.now();
    if (now - fpsLastTime >= 1000) {
        const fps = Math.round(fpsFrames * 1000 / (now - fpsLastTime));
        const el = document.getElementById('fps-counter');
        if (el) {
            el.textContent = `${fps} FPS`;
            el.style.color = fps >= 50 ? '#2ecc71' : fps >= 30 ? '#ff8c38' : '#ff4757';
        }
        fpsFrames = 0;
        fpsLastTime = now;
    }
}

// ─── Speed Slider ────────────────────────────────────────────

export function setupSpeedSlider(onChange) {
    const slider = document.getElementById('speed-slider');
    const valueEl = document.getElementById('speed-value');
    if (!slider) return;

    slider.addEventListener('input', () => {
        const val = parseFloat(slider.value);
        if (valueEl) valueEl.textContent = `${val.toFixed(val < 1 ? 2 : 1)}x`;
        onChange?.(val);
    });
}

// ─── Camera Buttons ──────────────────────────────────────────

export function setupCameraButtons(onViewChange) {
    const buttons = document.querySelectorAll('.btn-cam');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            onViewChange?.(btn.dataset.view);
        });
    });
}

// ─── Toggle Controls ─────────────────────────────────────────

export function setupToggles(onToggle) {
    ['toggle-labels', 'toggle-orbits', 'toggle-grid', 'toggle-scanlines'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('change', () => {
            onToggle?.(id.replace('toggle-', ''), el.checked);
        });
    });
}

// ─── Loading Screen ──────────────────────────────────────────

export function updateLoadingProgress(percent, statusText) {
    const fill = document.getElementById('loader-bar-fill');
    const status = document.getElementById('loader-status');
    if (fill) fill.style.width = `${percent}%`;
    if (status) status.textContent = statusText;
}

export function hideLoadingScreen() {
    const screen = document.getElementById('loading-screen');
    if (screen) {
        screen.classList.add('fade-out');
        setTimeout(() => { screen.style.display = 'none'; }, 1000);
    }
}

// ─── Tooltip ─────────────────────────────────────────────────

export function showTooltip(x, y, title, body) {
    const el = document.getElementById('info-tooltip');
    if (!el) return;
    el.classList.remove('hidden');
    document.getElementById('tooltip-title').textContent = title;
    document.getElementById('tooltip-body').textContent = body;
    el.style.left = `${x + 16}px`;
    el.style.top = `${y - 10}px`;
}

export function hideTooltip() {
    const el = document.getElementById('info-tooltip');
    if (el) el.classList.add('hidden');
}
