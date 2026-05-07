import { useEffect, useRef } from "react";
import { WeatherCondition } from "../services/weatherService";

interface Props {
  condition: WeatherCondition;
  isDay: boolean;
}

interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number; life: number; maxLife: number;
}

function rand(min: number, max: number) { return min + Math.random() * (max - min); }

/* ─── Cloud blob helper ─────────────────────────────────────────────────── */
function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, opacity: number, tint = "#e2e8f0") {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = tint;
  const blobs: [number, number, number][] = [
    [0, 0, 40 * scale], [50 * scale, -14 * scale, 32 * scale],
    [-50 * scale, -10 * scale, 30 * scale], [90 * scale, 4 * scale, 24 * scale],
    [-80 * scale, 4 * scale, 22 * scale], [28 * scale, -30 * scale, 24 * scale],
  ];
  blobs.forEach(([bx, by, r]) => {
    ctx.beginPath();
    ctx.arc(x + bx, y + by, r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

/* ─── Sun ───────────────────────────────────────────────────────────────── */
function drawSun(ctx: CanvasRenderingContext2D, sx: number, sy: number, t: number, size = 60) {
  const pulse = 1 + Math.sin(t * 1.2) * 0.035;
  const sunR = size * pulse;

  const glow = ctx.createRadialGradient(sx, sy, sunR * 0.3, sx, sy, sunR * 4);
  glow.addColorStop(0, "rgba(253,224,71,0.4)");
  glow.addColorStop(0.4, "rgba(251,146,60,0.15)");
  glow.addColorStop(1, "rgba(251,146,60,0)");
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(sx, sy, sunR * 4, 0, Math.PI * 2); ctx.fill();

  const rayCount = 12;
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2 + t * 0.25;
    const len = sunR * (1.7 + 0.35 * Math.sin(t * 1.8 + i));
    ctx.beginPath();
    ctx.strokeStyle = `rgba(253,224,71,${0.45 + 0.3 * Math.sin(t + i)})`;
    ctx.lineWidth = 2.5; ctx.lineCap = "round";
    ctx.moveTo(sx + Math.cos(angle) * (sunR + 6), sy + Math.sin(angle) * (sunR + 6));
    ctx.lineTo(sx + Math.cos(angle) * len, sy + Math.sin(angle) * len);
    ctx.stroke();
  }

  const disc = ctx.createRadialGradient(sx - sunR * 0.2, sy - sunR * 0.2, 0, sx, sy, sunR);
  disc.addColorStop(0, "#fef9c3");
  disc.addColorStop(0.5, "#fde047");
  disc.addColorStop(1, "#f97316");
  ctx.fillStyle = disc;
  ctx.beginPath(); ctx.arc(sx, sy, sunR, 0, Math.PI * 2); ctx.fill();
}

/* ─── Moon ──────────────────────────────────────────────────────────────── */
function drawMoon(ctx: CanvasRenderingContext2D, sx: number, sy: number, t: number) {
  const r = 44 + Math.sin(t * 0.5) * 2;

  const glow = ctx.createRadialGradient(sx, sy, r * 0.5, sx, sy, r * 3.5);
  glow.addColorStop(0, "rgba(226,232,240,0.2)");
  glow.addColorStop(0.5, "rgba(148,163,184,0.07)");
  glow.addColorStop(1, "rgba(148,163,184,0)");
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(sx, sy, r * 3.5, 0, Math.PI * 2); ctx.fill();

  const disc = ctx.createRadialGradient(sx - r * 0.15, sy - r * 0.15, 0, sx, sy, r);
  disc.addColorStop(0, "#f1f5f9");
  disc.addColorStop(0.6, "#cbd5e1");
  disc.addColorStop(1, "#94a3b8");
  ctx.fillStyle = disc;
  ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();

  // Crescent shadow
  ctx.fillStyle = "rgba(15,23,42,0.55)";
  ctx.beginPath(); ctx.arc(sx + r * 0.3, sy - r * 0.05, r * 0.85, 0, Math.PI * 2); ctx.fill();

  // Craters
  const craters: [number, number, number][] = [[-12, 8, 6], [10, -14, 4], [-20, -5, 3.5]];
  craters.forEach(([cx, cy, cr]) => {
    ctx.fillStyle = "rgba(148,163,184,0.25)";
    ctx.beginPath(); ctx.arc(sx + cx, sy + cy, cr, 0, Math.PI * 2); ctx.fill();
  });
}

/* ─── Stars ─────────────────────────────────────────────────────────────── */
function drawStars(ctx: CanvasRenderingContext2D, stars: Particle[], t: number) {
  stars.forEach(s => {
    s.life += 0.008;
    if (s.life > s.maxLife) s.life = 0;
    const a = Math.sin((s.life / s.maxLife) * Math.PI) * 0.9;
    ctx.globalAlpha = a;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;
}

/* ─── Lightning ──────────────────────────────────────────────────────────── */
function drawLightning(ctx: CanvasRenderingContext2D, x: number, y: number, H: number) {
  ctx.save();
  ctx.strokeStyle = "#fef08a"; ctx.lineWidth = 2.5;
  ctx.shadowColor = "#fde047"; ctx.shadowBlur = 25;
  ctx.globalAlpha = 0.9;
  ctx.beginPath(); ctx.moveTo(x, y);
  let cx = x, cy = y;
  while (cy < H * 0.72) {
    cx += rand(-30, 30); cy += rand(25, 40);
    ctx.lineTo(cx, cy);
  }
  ctx.stroke();
  ctx.restore();
}

export default function WeatherCanvas({ condition, isDay }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    particles: Particle[];
    stars: Particle[];
    clouds: { x: number; y: number; scale: number; speed: number; opacity: number; tint: string }[];
    lightning: { x: number; y: number; timer: number } | null;
    nextLightning: number;
    raf: number;
  }>({ particles: [], stars: [], clouds: [], lightning: null, nextLightning: 0, raf: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const s = stateRef.current;
    s.particles = []; s.stars = []; s.lightning = null;
    s.nextLightning = rand(80, 250);

    const W = () => canvas.width, H = () => canvas.height;

    // Init stars (for night or starfield default)
    const starCount = !isDay || condition === "default" ? 200 : (condition === "clouds" ? 60 : 40);
    s.stars = Array.from({ length: starCount }, () => ({
      x: rand(0, W()), y: rand(0, H() * 0.65),
      vx: 0, vy: 0, size: rand(0.5, 2),
      life: rand(0, 200), maxLife: rand(150, 300),
    }));

    // Init clouds
    const cloudTint = isDay ? "#e2e8f0" : "#475569";
    const cloudOpacity = isDay ? 0.28 : 0.18;
    s.clouds = Array.from({ length: 6 }, (_, i) => ({
      x: (i / 6) * W() + rand(0, 150),
      y: rand(50, H() * (isDay ? 0.3 : 0.2)),
      scale: rand(0.5, 1.1),
      speed: rand(0.12, 0.28),
      opacity: cloudOpacity + rand(0, 0.12),
      tint: cloudTint,
    }));

    // Init particles
    const rainCount = condition === "thunderstorm" ? 320 : 220;
    const snowCount = 120;
    const heatCount = 70;
    if (condition === "rain" || condition === "thunderstorm") {
      for (let i = 0; i < rainCount; i++) {
        const p: Particle = { x: rand(0, W()), y: rand(0, H()), vx: rand(-2, -0.5), vy: rand(13, 20), size: rand(0.5, 1.2), life: 0, maxLife: 999 };
        s.particles.push(p);
      }
    } else if (condition === "snow") {
      for (let i = 0; i < snowCount; i++) {
        const p: Particle = { x: rand(0, W()), y: rand(0, H()), vx: rand(-0.4, 0.4), vy: rand(0.8, 2.2), size: rand(2, 5), life: 0, maxLife: 999 };
        s.particles.push(p);
      }
    } else if (condition === "clear" && isDay) {
      for (let i = 0; i < heatCount; i++) {
        const p: Particle = { x: rand(0, W()), y: rand(H() * 0.4, H()), vx: rand(-0.3, 0.3), vy: rand(-0.6, -1.5), size: rand(1.5, 4), life: rand(0, 120), maxLife: rand(100, 180) };
        s.particles.push(p);
      }
    }

    let t = 0;
    let frame = 0;

    const render = () => {
      const w = W(), h = H();
      ctx.clearRect(0, 0, w, h);
      t += 0.016; frame++;

      // ── CLEAR DAY ─────────────────────────────────────────────────────
      if (condition === "clear" && isDay) {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, "#0c0a00");
        sky.addColorStop(0.3, "#7c2d12");
        sky.addColorStop(0.65, "#ea580c");
        sky.addColorStop(1, "#fbbf24");
        ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);

        drawSun(ctx, w * 0.74, h * 0.17, t, 58);

        // Heat shimmer particles rising
        if (frame % 3 === 0 && s.particles.length < 90) {
          s.particles.push({ x: rand(0, w), y: h + 5, vx: rand(-0.3, 0.3), vy: rand(-0.7, -1.5), size: rand(2, 4), life: 0, maxLife: rand(100, 180) });
        }
        s.particles = s.particles.filter(p => {
          p.life++; p.x += p.vx + Math.sin(t * 2 + p.y * 0.02) * 0.2; p.y += p.vy;
          const a = Math.sin((p.life / p.maxLife) * Math.PI) * 0.45;
          ctx.globalAlpha = a; ctx.fillStyle = "#fbbf24";
          ctx.shadowColor = "#f97316"; ctx.shadowBlur = 10;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1; ctx.shadowBlur = 0;
          return p.y > -10 && p.life < p.maxLife;
        });
      }

      // ── CLEAR NIGHT ───────────────────────────────────────────────────
      else if (condition === "clear" && !isDay) {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, "#020617");
        sky.addColorStop(0.5, "#0f172a");
        sky.addColorStop(1, "#0c1a3a");
        ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);

        drawStars(ctx, s.stars, t);
        drawMoon(ctx, w * 0.76, h * 0.15, t);

        // Shooting star occasionally
        if (frame % 400 < 30) {
          const progress = (frame % 400) / 30;
          const sx2 = w * 0.6 + progress * 200, sy2 = h * 0.1 + progress * 60;
          ctx.save();
          const sg = ctx.createLinearGradient(sx2 - 80, sy2 - 30, sx2, sy2);
          sg.addColorStop(0, "rgba(255,255,255,0)");
          sg.addColorStop(1, `rgba(255,255,255,${0.7 * (1 - progress)})`);
          ctx.strokeStyle = sg; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(sx2 - 80, sy2 - 30); ctx.lineTo(sx2, sy2); ctx.stroke();
          ctx.restore();
        }
      }

      // ── CLOUDS DAY ────────────────────────────────────────────────────
      else if (condition === "clouds" && isDay) {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, "#1e293b"); sky.addColorStop(0.5, "#2d4a6b"); sky.addColorStop(1, "#1e293b");
        ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);

        // Sun peeking through
        const sunX = w * 0.6, sunY = h * 0.18;
        const peekGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 180);
        peekGlow.addColorStop(0, "rgba(253,224,71,0.18)");
        peekGlow.addColorStop(0.5, "rgba(251,191,36,0.06)");
        peekGlow.addColorStop(1, "rgba(251,191,36,0)");
        ctx.fillStyle = peekGlow;
        ctx.beginPath(); ctx.arc(sunX, sunY, 180, 0, Math.PI * 2); ctx.fill();

        s.clouds.forEach(c => {
          c.x += c.speed; if (c.x > w + 220) c.x = -220;
          drawCloud(ctx, c.x, c.y, c.scale, c.opacity + 0.05, "#cbd5e1");
        });
        drawStars(ctx, s.stars, t);
      }

      // ── CLOUDS NIGHT ──────────────────────────────────────────────────
      else if (condition === "clouds" && !isDay) {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, "#020617"); sky.addColorStop(0.6, "#0f172a"); sky.addColorStop(1, "#020617");
        ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);

        drawStars(ctx, s.stars, t);
        // Moon peek
        const moonGlow = ctx.createRadialGradient(w * 0.7, h * 0.12, 0, w * 0.7, h * 0.12, 120);
        moonGlow.addColorStop(0, "rgba(226,232,240,0.12)");
        moonGlow.addColorStop(1, "rgba(226,232,240,0)");
        ctx.fillStyle = moonGlow;
        ctx.beginPath(); ctx.arc(w * 0.7, h * 0.12, 120, 0, Math.PI * 2); ctx.fill();

        s.clouds.forEach(c => {
          c.x += c.speed * 0.7; if (c.x > w + 220) c.x = -220;
          drawCloud(ctx, c.x, c.y, c.scale * 1.1, c.opacity, "#334155");
        });
      }

      // ── RAIN DAY ──────────────────────────────────────────────────────
      else if (condition === "rain" && isDay) {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, "#0a0f1e"); sky.addColorStop(0.5, "#0c1a3a"); sky.addColorStop(1, "#0a0f1e");
        ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);

        s.clouds.forEach(c => {
          c.x += c.speed * 0.5; if (c.x > w + 220) c.x = -220;
          drawCloud(ctx, c.x, c.y * 0.6, c.scale * 1.3, c.opacity * 1.5, "#64748b");
        });

        if (frame % 2 === 0 && s.particles.length < 280)
          s.particles.push({ x: rand(-w * 0.1, w), y: -15, vx: rand(-2, -0.5), vy: rand(13, 19), size: rand(0.5, 1.1), life: 0, maxLife: 999 });

        s.particles = s.particles.filter(p => {
          p.y += p.vy; p.x += p.vx;
          ctx.strokeStyle = `rgba(147,197,253,${rand(0.3, 0.5)})`;
          ctx.lineWidth = p.size * 0.7; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.vx * 2.5, p.y + p.vy * 2.5); ctx.stroke();
          return p.y < h + 20;
        });
      }

      // ── RAIN NIGHT ────────────────────────────────────────────────────
      else if (condition === "rain" && !isDay) {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, "#020617"); sky.addColorStop(0.5, "#06101e"); sky.addColorStop(1, "#020617");
        ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);

        s.clouds.forEach(c => {
          c.x += c.speed * 0.4; if (c.x > w + 220) c.x = -220;
          drawCloud(ctx, c.x, c.y * 0.55, c.scale * 1.4, c.opacity * 1.3, "#1e293b");
        });

        if (frame % 2 === 0 && s.particles.length < 260)
          s.particles.push({ x: rand(-w * 0.1, w), y: -15, vx: rand(-1.8, -0.5), vy: rand(12, 18), size: rand(0.4, 1), life: 0, maxLife: 999 });

        s.particles = s.particles.filter(p => {
          p.y += p.vy; p.x += p.vx;
          ctx.strokeStyle = `rgba(96,165,250,${rand(0.25, 0.45)})`;
          ctx.lineWidth = p.size * 0.6; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.vx * 2, p.y + p.vy * 2); ctx.stroke();
          return p.y < h + 20;
        });
      }

      // ── THUNDERSTORM ──────────────────────────────────────────────────
      else if (condition === "thunderstorm") {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, isDay ? "#0c0014" : "#050008");
        sky.addColorStop(0.5, isDay ? "#1a0a2e" : "#1a0028");
        sky.addColorStop(1, isDay ? "#0c0014" : "#050008");
        ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);

        if (!isDay) drawStars(ctx, s.stars.slice(0, 30), t);

        s.clouds.forEach(c => {
          c.x += c.speed * 0.9; if (c.x > w + 220) c.x = -220;
          drawCloud(ctx, c.x, c.y * 0.45, c.scale * 1.6, c.opacity * 1.8, "#312e81");
        });

        if (frame % 1 === 0 && s.particles.length < 360)
          s.particles.push({ x: rand(-w * 0.1, w), y: -15, vx: rand(-3, -1), vy: rand(16, 24), size: rand(0.4, 1), life: 0, maxLife: 999 });

        s.particles = s.particles.filter(p => {
          p.y += p.vy; p.x += p.vx;
          ctx.strokeStyle = `rgba(167,139,250,${rand(0.3, 0.5)})`;
          ctx.lineWidth = p.size * 0.5; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 4, p.y + p.vy * 2); ctx.stroke();
          return p.y < h + 20;
        });

        s.nextLightning--;
        if (s.nextLightning <= 0) {
          s.lightning = { x: w * rand(0.15, 0.85), y: h * 0.04, timer: 10 };
          s.nextLightning = rand(80, 280);
          ctx.fillStyle = "rgba(200,180,255,0.07)";
          ctx.fillRect(0, 0, w, h);
        }
        if (s.lightning) {
          drawLightning(ctx, s.lightning.x, s.lightning.y, h);
          s.lightning.timer--;
          if (s.lightning.timer <= 0) s.lightning = null;
        }
      }

      // ── SNOW ──────────────────────────────────────────────────────────
      else if (condition === "snow") {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        if (isDay) {
          sky.addColorStop(0, "#1e293b"); sky.addColorStop(0.5, "#3b5ea6"); sky.addColorStop(1, "#bfdbfe22");
        } else {
          sky.addColorStop(0, "#020617"); sky.addColorStop(0.5, "#0f172a"); sky.addColorStop(1, "#172554");
        }
        ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);

        if (!isDay) drawStars(ctx, s.stars, t);
        else {
          // Dim sun for snowy day
          drawSun(ctx, w * 0.7, h * 0.15, t, 35);
        }

        if (frame % 4 === 0 && s.particles.length < 160)
          s.particles.push({ x: rand(0, w), y: -8, vx: rand(-0.4, 0.4), vy: rand(0.8, 2), size: rand(2, 5), life: 0, maxLife: 999 });

        s.particles = s.particles.filter(p => {
          p.x += p.vx + Math.sin(t * 0.9 + p.y * 0.03) * 0.5; p.y += p.vy;
          ctx.globalAlpha = 0.8; ctx.fillStyle = isDay ? "#e0f2fe" : "#bfdbfe";
          ctx.shadowColor = "#93c5fd"; ctx.shadowBlur = 5;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1; ctx.shadowBlur = 0;
          return p.y < h + 20;
        });
      }

      // ── MIST ──────────────────────────────────────────────────────────
      else if (condition === "mist") {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        if (isDay) {
          sky.addColorStop(0, "#1e293b"); sky.addColorStop(1, "#64748b");
        } else {
          sky.addColorStop(0, "#0f172a"); sky.addColorStop(1, "#1e293b");
        }
        ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
        if (!isDay) drawStars(ctx, s.stars.slice(0, 60), t);

        for (let i = 0; i < 6; i++) {
          const yPos = h * (0.15 + i * 0.16);
          const shift = Math.sin(t * 0.18 + i * 1.2) * 90;
          const fog = ctx.createLinearGradient(0, yPos - 50, 0, yPos + 50);
          fog.addColorStop(0, "rgba(148,163,184,0)");
          fog.addColorStop(0.5, `rgba(148,163,184,${isDay ? 0.08 + i * 0.015 : 0.04 + i * 0.01})`);
          fog.addColorStop(1, "rgba(148,163,184,0)");
          ctx.fillStyle = fog;
          ctx.fillRect(shift, yPos - 50, w, 100);
        }
      }

      // ── DEFAULT ───────────────────────────────────────────────────────
      else {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        if (isDay) {
          sky.addColorStop(0, "#0c1a3a"); sky.addColorStop(0.5, "#1e3a5f"); sky.addColorStop(1, "#0c1a3a");
        } else {
          sky.addColorStop(0, "#020617"); sky.addColorStop(1, "#0f172a");
        }
        ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
        drawStars(ctx, s.stars, t);
        if (!isDay) drawMoon(ctx, w * 0.75, h * 0.14, t);
        else {
          drawSun(ctx, w * 0.75, h * 0.14, t, 45);
        }
      }

      s.raf = requestAnimationFrame(render);
    };

    s.raf = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(s.raf); window.removeEventListener("resize", resize); };
  }, [condition, isDay]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, zIndex: -1, width: "100%", height: "100%" }}
    />
  );
}
