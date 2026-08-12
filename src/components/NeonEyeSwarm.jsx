import React, { useRef, useEffect, useCallback } from "react";

// ───────────────────────────────────────────────
// Neon Eye Swarm — portiert aus NeonEyeSwarm.tsx
// Klick = Schockwelle + Sound + Augen-Explosion
// Dann magnetischer Rückzug
// ───────────────────────────────────────────────

const NEON_COLORS = [
  "#22d3ee",
  "#a855f7",
  "#f472b6",
  "#4ade80",
  "#fbbf24",
  "#f87171",
  "#60a5fa",
  "#c084fc",
  "#2dd4bf",
  "#fb923c",
  "#e879f9",
  "#38bdf8",
  "#a3e635",
  "#f43f5e",
  "#818cf8",
];

// ── TUNABLES — charge / explosion power ──
const EYE_COUNT = 80;
const CHARGE_SPEED = 0.018; // Lade-Geschwindigkeit pro Frame (↑ = schneller geladen)
const CHARGE_MAX = 2.5; // Maximaler Ladelevel (↑ = stärkere End-Explosion)
const NUKE_THRESHOLD = 2.4; // Ab welchem Level der Nuke-Effekt einsetzt
const EXPLOSION_FORCE = 70; // Basal-Kraft der normalen Explosion
const INVERSE_BOOST = 27; // 1/r Verstärkung für Nähe (↑ = stärkerer Nah-Effekt)
const INVERSE_FLOOR = 12; // Schutz gegen /0 am Epicenter
const NUKE_FORCE = 450; // Extra-Kraft beim Nuke (nahe Augen fliegen über Bildschirm)
const NUKE_RANGE = 250; // Reichweite des Nuke-Effekts in Pixel
const STOMP_BASE_RADIUS = 250; // Grundradius der Stomp-Welle
const STOMP_EYE_FORCE = 18; // Klick-Explosion Kraft (single-click fallback)
const STOMP_EYE_RANGE = 400; // Reichweite der Klick-Explosion
const CLICK_THRESHOLD = 0.1; // Unter diesem Level = normaler Klick, nicht Hold
const audioCtxRef = { current: null };
let noiseBufferCache = null;

function getAudioCtx() {
  if (!audioCtxRef.current) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    audioCtxRef.current = new AudioCtx();
  }
  return audioCtxRef.current;
}

function getNoiseBuffer(ctx) {
  if (noiseBufferCache) return noiseBufferCache;
  const bufferSize = ctx.sampleRate * 0.1;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
  }
  noiseBufferCache = buffer;
  return buffer;
}

function playStompSound(charge = 1) {
  const ctx = getAudioCtx();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const t = ctx.currentTime;
  const intensity = 0.5 * charge;

  // Deeper, louder thump when charged
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(60 / charge, t);
  osc.frequency.exponentialRampToValueAtTime(15, t + 0.3 * charge);
  gain.gain.setValueAtTime(intensity, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4 * charge);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.45 * charge);

  // Noise burst
  const buffer = getNoiseBuffer(ctx);
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.15 * charge, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2 * charge);
  noise.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(t);

  // Sub-bass rumble (charged)
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();
  subOsc.type = "triangle";
  subOsc.frequency.setValueAtTime(30, t);
  subOsc.frequency.exponentialRampToValueAtTime(8, t + 0.5 * charge);
  subGain.gain.setValueAtTime(0.3 * charge, t);
  subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5 * charge);
  subOsc.connect(subGain);
  subGain.connect(ctx.destination);
  subOsc.start(t);
  subOsc.stop(t + 0.55 * charge);
}

export default function NeonEyeSwarm({ open, onClose }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const eyesRef = useRef([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const mouseDirtyRef = useRef(false);
  const timeRef = useRef(0);
  const animRef = useRef(0);
  const stompRef = useRef({
    x: 0,
    y: 0,
    radius: 0,
    maxRadius: 300,
    alpha: 0,
    active: false,
  });

  const initEyes = useCallback((w, h) => {
    eyesRef.current = Array.from({ length: EYE_COUNT }, (_, i) => {
      const color = NEON_COLORS[i % NEON_COLORS.length];
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 9 + 7,
        color,
        glowPhase: Math.random() * Math.PI * 2,
        blinkTimer: Math.random() * 200 + 80,
        isBlinking: false,
        blinkDuration: 0,
        pupilOffsetX: 0,
        pupilOffsetY: 0,
        eyeWhite: "#fff",
      };
    });
  }, []);

  const drawEye = useCallback((ctx, eye, time) => {
    const { x, y, radius, color, glowPhase } = eye;
    const glowIntensity = Math.sin(time * 0.03 + glowPhase) * 0.2 + 0.8;

    ctx.save();

    ctx.shadowColor = color;
    ctx.shadowBlur = 22 * glowIntensity;
    ctx.globalAlpha = 0.1 * glowIntensity;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius + 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 12 * glowIntensity;
    ctx.globalAlpha = 0.25 * glowIntensity;
    ctx.beginPath();
    ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 5 * glowIntensity;

    ctx.fillStyle = eye.eyeWhite;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.5 * glowIntensity;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();

    if (eye.isBlinking) {
      const progress = Math.sin((eye.blinkDuration / 14) * Math.PI);
      const lidHeight = radius * 2 * progress;
      ctx.fillStyle = eye.eyeWhite;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.ellipse(x, y, radius + 1, lidHeight / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(x - radius, y);
      ctx.quadraticCurveTo(x, y + lidHeight * 0.25, x + radius, y);
      ctx.stroke();
    } else {
      const pr = radius * 0.4;
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.arc(x + eye.pupilOffsetX, y + eye.pupilOffsetY, pr, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.beginPath();
      ctx.arc(
        x + eye.pupilOffsetX - pr * 0.35,
        y + eye.pupilOffsetY - pr * 0.35,
        pr * 0.3,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.beginPath();
      ctx.arc(
        x + eye.pupilOffsetX + pr * 0.2,
        y + eye.pupilOffsetY + pr * 0.2,
        pr * 0.15,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    ctx.restore();
  }, []);

  const visibleRef = useRef(false);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (open) {
      visibleRef.current = true;
      document.addEventListener("keydown", onKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      visibleRef.current = false;
    }

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!visibleRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0,
      H = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      W = canvas.width = rect.width * window.devicePixelRatio;
      H = canvas.height = rect.height * window.devicePixelRatio;
      ctx.setTransform(
        window.devicePixelRatio,
        0,
        0,
        window.devicePixelRatio,
        0,
        0,
      );
      W = rect.width;
      H = rect.height;
      initEyes(W, H);
    };

    resize();
    window.addEventListener("resize", resize);

    // Pause animation when tab is hidden
    let visible = true;
    const onVisibility = () => {
      visible = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Throttled mouse move via rAF
    const handleMouseMove = (e) => {
      if (mouseDirtyRef.current) return;
      mouseDirtyRef.current = true;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    // ── CHARGE-STOMP: halten → stärker ──
    let chargeLevel = 0;
    let chargeActive = false;
    const chargeAuraRef = { cx: 0, cy: 0, radius: 0, alpha: 0 };

    const startCharge = (e) => {
      const rect = canvas.getBoundingClientRect();
      chargeActive = true;
      chargeLevel = 0;
      chargeAuraRef.cx = e.clientX - rect.left;
      chargeAuraRef.cy = e.clientY - rect.top;
      chargeAuraRef.radius = 0;
      chargeAuraRef.alpha = 0.4;

      const chargeLoop = () => {
        if (!chargeActive) return;
        chargeLevel += CHARGE_SPEED;
        if (chargeLevel > CHARGE_MAX) chargeLevel = CHARGE_MAX;
        chargeAuraRef.radius = 30 * chargeLevel;
        chargeAuraRef.alpha = 0.5 - chargeLevel * 0.15;

        // Augen sanft einziehen
        const eyes = eyesRef.current;
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        for (let i = 0; i < eyes.length; i++) {
          const eye = eyes[i];
          const sdx = eye.x - cx;
          const sdy = eye.y - cy;
          const sDist = Math.sqrt(sdx * sdx + sdy * sdy);
          if (sDist > 0) {
            eye.vx -= (sdx / sDist) * 0.04 * chargeLevel;
            eye.vy -= (sdy / sDist) * 0.04 * chargeLevel;
          }
        }

        requestAnimationFrame(chargeLoop);
      };
      requestAnimationFrame(chargeLoop);
    };

    const releaseCharge = (e) => {
      if (!chargeActive) return;
      chargeActive = false;
      const charge = Math.max(0.3, chargeLevel);
      const isNuke = charge >= NUKE_THRESHOLD;
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      chargeLevel = 0;
      stompRef.current = {
        x: cx,
        y: cy,
        radius: 0,
        maxRadius: STOMP_BASE_RADIUS * charge,
        alpha: 1,
        active: true,
      };

      // Starker, charge-abhängiger Sound
      playStompSound(charge);

      const eyes = eyesRef.current;
      for (let i = 0; i < eyes.length; i++) {
        const eye = eyes[i];
        const sdx = eye.x - cx;
        const sdy = eye.y - cy;
        const sDist = Math.sqrt(sdx * sdx + sdy * sdy);
        if (sDist > 0) {
          // Explosions-Kraft: direkt am Epicenter MAX, mit Abstand weich abfallend
          // inverse Falloff (1/r) → extreme Nähe = extreme Geschwindigkeit
          const boost = INVERSE_BOOST / (sDist + INVERSE_FLOOR);
          const force = EXPLOSION_FORCE * charge * (boost + 0.15);
          eye.vx += (sdx / sDist) * force;
          eye.vy += (sdy / sDist) * force;
        }
        if (isNuke && sDist < NUKE_RANGE) {
          // NUKE-Extra: nahe Augen fliegen mit extremer Kraft über den ganzen Bildschirm
          const nx = sdx / Math.max(sDist, 1);
          const ny = sdy / Math.max(sDist, 1);
          eye.vx += nx * NUKE_FORCE * charge;
          eye.vy += ny * NUKE_FORCE * charge;
          eye.nukeBoosted = true   // MARKER: keine Reibung beim Takeoff
        }
      }
      chargeAuraRef.alpha = 0;
    };

    const handleClick = (e) => {
      // Falls kein Hold (schneller Klick), normaler Stomp
      if (chargeLevel < CLICK_THRESHOLD) {
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        stompRef.current = {
          x: clickX,
          y: clickY,
          radius: 5,
          maxRadius: STOMP_BASE_RADIUS * 1.4,
          alpha: 1,
          active: true,
        };
        playStompSound();
        const eyes = eyesRef.current;
        for (let i = 0; i < eyes.length; i++) {
          const eye = eyes[i];
          const sdx = eye.x - clickX;
          const sdy = eye.y - clickY;
          const sDist = Math.sqrt(sdx * sdx + sdy * sdy);
          if (sDist > 0) {
            const force =
              Math.max(0, 1 - sDist / STOMP_EYE_RANGE) * STOMP_EYE_FORCE;
            eye.vx += (sdx / sDist) * force;
            eye.vy += (sdy / sDist) * force;
          }
        }
      }
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", startCharge);
    canvas.addEventListener("mouseup", releaseCharge);
    canvas.addEventListener("mouseleave", () => {
      releaseCharge({ clientX: 0, clientY: 0 });
      mouseRef.current = { x: -1000, y: -1000 };
    });
    canvas.addEventListener("click", handleClick);

    const animate = () => {
      // Frame throttle: max 25fps (40ms min)
      const now = performance.now();
      if (now - (animate.lastFrame || 0) < 40) {
        animRef.current = requestAnimationFrame(animate);
        return;
      }
      animate.lastFrame = now;
      mouseDirtyRef.current = false;
      const t = timeRef.current++;
      const mouse = mouseRef.current;
      const eyes = eyesRef.current;
      const stomp = stompRef.current;

      ctx.clearRect(0, 0, W, H);

      // Charge-Aura (sichtbar während mouse-down)
      if (chargeAuraRef.alpha > 0.01) {
        const grad = ctx.createRadialGradient(
          chargeAuraRef.cx || W / 2,
          chargeAuraRef.cy || H / 2,
          0,
          chargeAuraRef.cx || W / 2,
          chargeAuraRef.cy || H / 2,
          chargeAuraRef.radius + 60,
        );
        grad.addColorStop(
          0,
          `rgba(34, 211, 238, ${chargeAuraRef.alpha * 0.5})`,
        );
        grad.addColorStop(
          0.5,
          `rgba(168, 85, 247, ${chargeAuraRef.alpha * 0.3})`,
        );
        grad.addColorStop(1, "rgba(34, 211, 238, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(
          chargeAuraRef.cx || W / 2,
          chargeAuraRef.cy || H / 2,
          chargeAuraRef.radius + 80,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.shadowColor = "#22d3ee";
        ctx.shadowBlur = 30 * chargeAuraRef.alpha;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      if (stomp.active) {
        stomp.radius += 8;
        stomp.alpha = Math.max(0, 1 - stomp.radius / stomp.maxRadius);

        if (stomp.alpha <= 0) {
          stomp.active = false;
        } else {
          ctx.save();
          ctx.strokeStyle = `rgba(34, 211, 238, ${stomp.alpha * 0.6})`;
          ctx.lineWidth = 3;
          ctx.shadowColor = "#22d3ee";
          ctx.shadowBlur = 20 * stomp.alpha;
          ctx.beginPath();
          ctx.arc(stomp.x, stomp.y, stomp.radius, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = `rgba(255, 255, 255, ${stomp.alpha * 0.4})`;
          ctx.lineWidth = 1.5;
          ctx.shadowBlur = 10 * stomp.alpha;
          ctx.beginPath();
          ctx.arc(stomp.x, stomp.y, stomp.radius * 0.85, 0, Math.PI * 2);
          ctx.stroke();

          if (stomp.radius > 40) {
            ctx.strokeStyle = `rgba(168, 85, 247, ${stomp.alpha * 0.3})`;
            ctx.lineWidth = 2;
            ctx.shadowColor = "#a855f7";
            ctx.shadowBlur = 15 * stomp.alpha;
            ctx.beginPath();
            ctx.arc(stomp.x, stomp.y, stomp.radius * 0.6, 0, Math.PI * 2);
            ctx.stroke();
          }

          ctx.fillStyle = `rgba(34, 211, 238, ${stomp.alpha * 0.03})`;
          ctx.beginPath();
          ctx.arc(stomp.x, stomp.y, stomp.radius * 1.1, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }

      // Eyes — update + draw
      for (let ei = 0; ei < eyes.length; ei++) {
        const eye = eyes[ei];

        const mdx = mouse.x - eye.x;
        const mdy = mouse.y - eye.y;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);

        if (mDist > 0) {
          const attractBase = 0.025;
          const attractFalloff = Math.min(mDist / 300, 1);
          const attractStrength = attractBase * (0.3 + 0.7 * attractFalloff);
          eye.vx += (mdx / mDist) * attractStrength;
          eye.vy += (mdy / mDist) * attractStrength;

          const lookStr = Math.min(mDist, 120) / 120;
          const maxOff = eye.radius * 0.32;
          eye.pupilOffsetX = (mdx / mDist) * maxOff * lookStr;
          eye.pupilOffsetY = (mdy / mDist) * maxOff * lookStr;
        } else {
          eye.pupilOffsetX *= 0.92;
          eye.pupilOffsetY *= 0.92;
        }

        if (mDist > 500 || mouse.x < 0) {
          const cdx = W / 2 - eye.x;
          const cdy = H / 2 - eye.y;
          const cDist = Math.sqrt(cdx * cdx + cdy * cdy);
          if (cDist > 0) {
            eye.vx += (cdx / cDist) * 0.008;
            eye.vy += (cdy / cDist) * 0.008;
          }
        }

        // Inter-eye collision: O(N²) — 80 eyes = 6400 checks, trivial per frame
        for (let oi = ei + 1; oi < eyes.length; oi++) {
          const other = eyes[oi];
          const edx = eye.x - other.x;
          const edy = eye.y - other.y;
          const eDist2 = edx * edx + edy * edy;
          const minD = eye.radius + other.radius + 1;
          if (eDist2 < minD * minD && eDist2 > 0) {
            const eDist = Math.sqrt(eDist2);
            const ov = minD - eDist;
            const nx = edx / eDist;
            const ny = edy / eDist;
            // Position correction — half each
            eye.x -= nx * ov * 0.5;
            eye.y -= ny * ov * 0.5;
            other.x += nx * ov * 0.5;
            other.y += ny * ov * 0.5;
            // Velocity separation
            const sep = ov * 0.3;
            eye.vx -= nx * sep;
            eye.vy -= ny * sep;
            other.vx += nx * sep;
            other.vy += ny * sep;
          }
        }

        eye.vx += Math.sin(t * 0.004 + eye.glowPhase) * 0.006;
        eye.vy += Math.cos(t * 0.003 + eye.glowPhase) * 0.006;

        const speed = Math.sqrt(eye.vx * eye.vx + eye.vy * eye.vy);
        const maxSpeed = eye.nukeBoosted ? 36 : 4.5;
        if (speed > maxSpeed) {
          eye.vx = (eye.vx / speed) * maxSpeed;
          eye.vy = (eye.vy / speed) * maxSpeed;
        }
        const inTakeoff = eye.nukeBoosted && speed > 28;
        if (!inTakeoff) {
          eye.nukeBoosted = false;
        }
        eye.vx *= inTakeoff ? 1 : 0.985;
        eye.vy *= inTakeoff ? 1 : 0.985;

        const margin = eye.radius + 5;
        if (eye.x < -margin) {
          eye.x = W + margin;
          eye.vx *= 0.5;
        }
        if (eye.x > W + margin) {
          eye.x = -margin;
          eye.vx *= 0.5;
        }
        if (eye.y < -margin) {
          eye.y = H + margin;
          eye.vy *= 0.5;
        }
        if (eye.y > H + margin) {
          eye.y = -margin;
          eye.vy *= 0.5;
        }

        if (eye.x < margin) eye.vx += 0.02;
        if (eye.x > W - margin) eye.vx -= 0.02;
        if (eye.y < margin) eye.vy += 0.02;
        if (eye.y > H - margin) eye.vy -= 0.02;

        eye.x += eye.vx;
        eye.y += eye.vy;

        eye.blinkTimer--;
        if (eye.blinkTimer <= 0 && !eye.isBlinking) {
          eye.isBlinking = true;
          eye.blinkDuration = 0;
          eye.blinkTimer = Math.random() * 200 + 120;
        }
        if (eye.isBlinking) {
          eye.blinkDuration++;
          if (eye.blinkDuration >= 14) {
            eye.isBlinking = false;
            eye.blinkDuration = 0;
          }
        }

        drawEye(ctx, eye, t);
      }

      // Mouse glow
      if (mouse.x > 0) {
        const g = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          80,
        );
        g.addColorStop(0, "rgba(34,211,238,0.06)");
        g.addColorStop(1, "rgba(34,211,238,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 80, 0, Math.PI * 2);
        ctx.fill();
      }

      // Vignette
      const vig = ctx.createRadialGradient(
        W / 2,
        H / 2,
        W * 0.25,
        W / 2,
        H / 2,
        W * 0.65,
      );
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(0,0,0,0.5)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      animRef.current = requestAnimationFrame(
        visible ? animate : () => requestAnimationFrame(animate),
      );
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      chargeActive = false;
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", startCharge);
      canvas.removeEventListener("mouseup", releaseCharge);
      canvas.removeEventListener("click", handleClick);
    };
  }, [initEyes, drawEye, open]);

  // Video export
  const startRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const stream = canvas.captureStream(60);
    const recorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9",
      videoBitsPerSecond: 12_000_000,
    });
    const chunks = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "neon-eye-swarm.webm";
      a.click();
      URL.revokeObjectURL(url);
    };
    recorder.start();
    setTimeout(() => recorder.stop(), 15000);
  };

  return (
    <section
      id="swarm"
      className="fixed inset-0 z-50 scroll-mt-[49px]"
      hidden={!open}
      aria-hidden={!open}
    >
      <div
        ref={containerRef}
        className="relative w-full h-full select-none overflow-visible"
        style={{ cursor: "crosshair", pointerEvents: open ? "auto" : "none" }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        <div className="absolute top-5 left-6 text-[11px] font-mono tracking-[0.2em] text-steel uppercase pointer-events-none">
          Neon Eye Swarm // Click to STOMP
        </div>
        <div className="absolute top-5 right-6 text-[11px] font-mono tracking-wider text-steel pointer-events-none">
          EYES: 80
        </div>

        <button
          onClick={onClose}
          className="absolute top-5 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-neon/20 border border-neon/50 text-cyan text-xs font-mono tracking-wider hover:bg-neon/30 hover:text-ice transition-all duration-200 active:scale-95"
        >
          ✕ CLOSE
        </button>

        <button
          onClick={startRecording}
          className="absolute bottom-5 right-5 px-4 py-2 rounded-lg bg-ink/60 border border-white/10 text-steel text-xs font-mono tracking-wider hover:bg-white/5 hover:text-ice transition-all duration-200 active:scale-95"
        >
          📹 15s RECORD
        </button>

        <div className="absolute top-4 left-4 w-10 h-10 border-l border-t border-white/5 rounded-tl pointer-events-none" />
        <div className="absolute top-4 right-4 w-10 h-10 border-r border-t border-white/5 rounded-tr pointer-events-none" />
        <div className="absolute bottom-4 left-4 w-10 h-10 border-l border-b border-white/5 rounded-bl pointer-events-none" />
        <div className="absolute bottom-4 right-4 w-10 h-10 border-r border-b border-white/5 rounded-br pointer-events-none" />
      </div>
    </section>
  );
}
