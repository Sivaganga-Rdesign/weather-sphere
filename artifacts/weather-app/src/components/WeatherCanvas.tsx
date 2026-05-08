import { useEffect, useRef } from "react";
import { WeatherCondition } from "../services/weatherService";

interface Props { condition: WeatherCondition; isDay: boolean; }
interface Particle { x: number; y: number; vx: number; vy: number; size: number; life: number; maxLife: number; }
interface Cloud { x: number; y: number; scale: number; speed: number; opacity: number; tint: string; }

function rand(min: number, max: number) { return min + Math.random() * (max - min); }

/* ── Draw helpers ──────────────────────────────────────────────────────── */
function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, opacity: number, tint: string) {
  ctx.save(); ctx.globalAlpha = opacity; ctx.fillStyle = tint;
  const blobs: [number, number, number][] = [
    [0, 0, 38 * scale], [52 * scale, -12 * scale, 30 * scale],
    [-52 * scale, -8 * scale, 28 * scale], [92 * scale, 6 * scale, 22 * scale],
    [-82 * scale, 6 * scale, 20 * scale], [26 * scale, -28 * scale, 22 * scale],
  ];
  blobs.forEach(([bx, by, r]) => { ctx.beginPath(); ctx.arc(x + bx, y + by, r, 0, Math.PI * 2); ctx.fill(); });
  ctx.restore();
}

function drawSun(ctx: CanvasRenderingContext2D, sx: number, sy: number, t: number, size = 55) {
  const pulse = 1 + Math.sin(t * 1.1) * 0.03;
  const r = size * pulse;

  // Outer soft glow
  const g1 = ctx.createRadialGradient(sx, sy, r * 0.3, sx, sy, r * 5);
  g1.addColorStop(0, "rgba(255,220,50,0.30)"); g1.addColorStop(0.4, "rgba(255,180,0,0.10)"); g1.addColorStop(1, "rgba(255,180,0,0)");
  ctx.fillStyle = g1; ctx.beginPath(); ctx.arc(sx, sy, r * 5, 0, Math.PI * 2); ctx.fill();

  // Rays
  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2 + t * 0.22;
    const len = r * (1.9 + 0.4 * Math.sin(t * 1.6 + i));
    ctx.beginPath();
    ctx.strokeStyle = `rgba(255,215,0,${0.35 + 0.25 * Math.sin(t + i)})`;
    ctx.lineWidth = 2.5; ctx.lineCap = "round";
    ctx.moveTo(sx + Math.cos(angle) * (r + 5), sy + Math.sin(angle) * (r + 5));
    ctx.lineTo(sx + Math.cos(angle) * len, sy + Math.sin(angle) * len);
    ctx.stroke();
  }

  // Disc
  const disc = ctx.createRadialGradient(sx - r * 0.2, sy - r * 0.2, 0, sx, sy, r);
  disc.addColorStop(0, "#fffde7"); disc.addColorStop(0.4, "#ffe066"); disc.addColorStop(1, "#fbbf24");
  ctx.fillStyle = disc; ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
}

function drawMoon(ctx: CanvasRenderingContext2D, sx: number, sy: number, t: number) {
  const r = 42 + Math.sin(t * 0.4) * 2;
  const glow = ctx.createRadialGradient(sx, sy, r * 0.4, sx, sy, r * 4);
  glow.addColorStop(0, "rgba(219,234,254,0.22)"); glow.addColorStop(0.5, "rgba(147,197,253,0.08)"); glow.addColorStop(1, "rgba(147,197,253,0)");
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(sx, sy, r * 4, 0, Math.PI * 2); ctx.fill();

  const disc = ctx.createRadialGradient(sx - r * 0.12, sy - r * 0.12, 0, sx, sy, r);
  disc.addColorStop(0, "#f0f9ff"); disc.addColorStop(0.6, "#bae6fd"); disc.addColorStop(1, "#7dd3fc");
  ctx.fillStyle = disc; ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();

  // Crescent shadow
  ctx.fillStyle = "rgba(2,6,23,0.60)";
  ctx.beginPath(); ctx.arc(sx + r * 0.28, sy - r * 0.04, r * 0.84, 0, Math.PI * 2); ctx.fill();

  // Craters
  ([[-14, 9, 6], [11, -13, 4], [-21, -4, 3.5]] as [number,number,number][]).forEach(([cx, cy, cr]) => {
    ctx.fillStyle = "rgba(125,211,252,0.22)";
    ctx.beginPath(); ctx.arc(sx + cx, sy + cy, cr, 0, Math.PI * 2); ctx.fill();
  });
}

function drawStars(ctx: CanvasRenderingContext2D, stars: Particle[], _t: number) {
  stars.forEach(s => {
    s.life += 0.009; if (s.life > s.maxLife) s.life = 0;
    const a = Math.sin((s.life / s.maxLife) * Math.PI) * 0.95;
    ctx.globalAlpha = a; ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawLightning(ctx: CanvasRenderingContext2D, x: number, y: number, H: number) {
  ctx.save(); ctx.strokeStyle = "#fef9c3"; ctx.lineWidth = 2.8;
  ctx.shadowColor = "#fde047"; ctx.shadowBlur = 30; ctx.globalAlpha = 0.9;
  ctx.beginPath(); ctx.moveTo(x, y);
  let cx = x, cy = y;
  while (cy < H * 0.75) { cx += rand(-28, 28); cy += rand(22, 38); ctx.lineTo(cx, cy); }
  ctx.stroke(); ctx.restore();
}

/* ── Sky helpers ───────────────────────────────────────────────────────── */
function fillSky(ctx: CanvasRenderingContext2D, w: number, h: number, stops: [number, string][]) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  stops.forEach(([pos, color]) => g.addColorStop(pos, color));
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}

// Bright day skies — light, airy, true-to-life colours
const SKY_CLEAR_DAY    = [[0, "#29b6f6"], [0.3, "#4fc3f7"], [0.65, "#81d4fa"], [1, "#b3e5fc"]] as [number,string][];
const SKY_CLOUDS_DAY   = [[0, "#546e7a"], [0.4, "#78909c"], [0.75, "#90a4ae"], [1, "#b0bec5"]] as [number,string][];
const SKY_RAIN_DAY     = [[0, "#37474f"], [0.4, "#455a64"], [0.75, "#546e7a"], [1, "#607d8b"]] as [number,string][];
const SKY_SNOW_DAY     = [[0, "#b3e5fc"], [0.35, "#e1f5fe"], [0.7, "#f0f9ff"], [1, "#fafeff"]] as [number,string][];
const SKY_STORM_DAY    = [[0, "#0f172a"], [0.4, "#1e293b"], [0.8, "#1e2d3d"], [1, "#0f172a"]] as [number,string][];
const SKY_MIST_DAY     = [[0, "#78909c"], [0.4, "#90a4ae"], [0.8, "#cfd8dc"], [1, "#eceff1"]] as [number,string][];
const SKY_DEFAULT_DAY  = [[0, "#29b6f6"], [0.35, "#4fc3f7"], [0.7, "#81d4fa"], [1, "#b3e5fc"]] as [number,string][];

// Dark night skies
const SKY_CLEAR_NIGHT  = [[0, "#020617"], [0.45, "#0f172a"], [0.8, "#0c1a3a"], [1, "#020617"]] as [number,string][];
const SKY_CLOUDS_NIGHT = [[0, "#030712"], [0.4, "#0f1520"], [0.8, "#111827"], [1, "#030712"]] as [number,string][];
const SKY_RAIN_NIGHT   = [[0, "#020408"], [0.4, "#050d18"], [1, "#020408"]] as [number,string][];
const SKY_SNOW_NIGHT   = [[0, "#0f172a"], [0.5, "#172554"], [1, "#1e3a5f"]] as [number,string][];
const SKY_STORM_NIGHT  = [[0, "#050008"], [0.4, "#0f0020"], [0.8, "#1a0030"], [1, "#050008"]] as [number,string][];
const SKY_MIST_NIGHT   = [[0, "#111827"], [0.5, "#1f2937"], [1, "#111827"]] as [number,string][];
const SKY_DEFAULT_NIGHT= [[0, "#020617"], [0.5, "#0f172a"], [1, "#020617"]] as [number,string][];

export default function WeatherCanvas({ condition, isDay }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    particles: Particle[]; stars: Particle[]; clouds: Cloud[];
    lightning: { x: number; y: number; timer: number } | null;
    nextLightning: number; raf: number;
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
    s.particles = []; s.lightning = null; s.nextLightning = rand(90, 260);

    const W = () => canvas.width, H = () => canvas.height;

    // Stars — only needed at night or dim day conditions
    const needsStars = !isDay || condition === "mist";
    s.stars = Array.from({ length: needsStars ? 220 : 0 }, () => ({
      x: rand(0, W()), y: rand(0, H() * 0.65),
      vx: 0, vy: 0, size: rand(0.5, 1.8), life: rand(0, 200), maxLife: rand(140, 300),
    }));

    // Clouds
    const cloudTint = isDay
      ? (condition === "snow" ? "#e0f2fe" : condition === "mist" ? "#f1f5f9" : "#cbd5e1")
      : "#1e293b";
    const cloudOpacity = isDay ? 0.55 : 0.22;
    s.clouds = Array.from({ length: 7 }, (_, i) => ({
      x: (i / 7) * W() + rand(-60, 120),
      y: rand(40, H() * (isDay ? 0.28 : 0.22)),
      scale: rand(0.5, 1.15), speed: rand(0.1, 0.3),
      opacity: cloudOpacity + rand(0, 0.15), tint: cloudTint,
    }));

    // Pre-spawn particles
    if (condition === "rain" || condition === "thunderstorm") {
      const count = condition === "thunderstorm" ? 300 : 220;
      for (let i = 0; i < count; i++)
        s.particles.push({ x: rand(0, W()), y: rand(0, H()), vx: rand(-2.5, -0.6), vy: rand(14, 22), size: rand(0.5, 1.2), life: 0, maxLife: 999 });
    } else if (condition === "snow") {
      for (let i = 0; i < 140; i++)
        s.particles.push({ x: rand(0, W()), y: rand(0, H()), vx: rand(-0.5, 0.5), vy: rand(0.7, 2.2), size: rand(2, 5), life: 0, maxLife: 999 });
    }

    let t = 0; let frame = 0;

    const render = () => {
      const w = W(), h = H();
      ctx.clearRect(0, 0, w, h);
      t += 0.016; frame++;

      /* ──────────────── CLEAR ────────────────────────────────────────── */
      if (condition === "clear") {
        if (isDay) {
          fillSky(ctx, w, h, SKY_CLEAR_DAY);
          drawSun(ctx, w * 0.75, h * 0.16, t, 58);

          // Two lazy wispy clouds
          s.clouds.slice(0, 2).forEach(c => {
            c.x += c.speed * 0.4; if (c.x > w + 200) c.x = -200;
            drawCloud(ctx, c.x, c.y, c.scale * 0.7, 0.18, "#e0f2fe");
          });
        } else {
          fillSky(ctx, w, h, SKY_CLEAR_NIGHT);
          drawStars(ctx, s.stars, t);
          drawMoon(ctx, w * 0.76, h * 0.14, t);

          // Shooting star every ~7s
          if (frame % 420 < 28) {
            const prog = (frame % 420) / 28;
            const sx = w * 0.55 + prog * 210, sy = h * 0.08 + prog * 65;
            ctx.save();
            const sg = ctx.createLinearGradient(sx - 90, sy - 35, sx, sy);
            sg.addColorStop(0, "rgba(255,255,255,0)"); sg.addColorStop(1, `rgba(255,255,255,${0.75 * (1 - prog)})`);
            ctx.strokeStyle = sg; ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.moveTo(sx - 90, sy - 35); ctx.lineTo(sx, sy); ctx.stroke(); ctx.restore();
          }
        }
      }

      /* ──────────────── CLOUDS ───────────────────────────────────────── */
      else if (condition === "clouds") {
        if (isDay) {
          fillSky(ctx, w, h, SKY_CLOUDS_DAY);
          // Sun peeking through (partially visible)
          const sg = ctx.createRadialGradient(w * 0.62, h * 0.17, 0, w * 0.62, h * 0.17, 160);
          sg.addColorStop(0, "rgba(255,215,0,0.22)"); sg.addColorStop(0.5, "rgba(255,200,0,0.08)"); sg.addColorStop(1, "rgba(255,200,0,0)");
          ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(w * 0.62, h * 0.17, 160, 0, Math.PI * 2); ctx.fill();
        } else {
          fillSky(ctx, w, h, SKY_CLOUDS_NIGHT);
          drawStars(ctx, s.stars.slice(0, 80), t);
          // Moon glow behind clouds
          const mg = ctx.createRadialGradient(w * 0.68, h * 0.12, 0, w * 0.68, h * 0.12, 110);
          mg.addColorStop(0, "rgba(186,230,253,0.16)"); mg.addColorStop(1, "rgba(186,230,253,0)");
          ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(w * 0.68, h * 0.12, 110, 0, Math.PI * 2); ctx.fill();
        }
        s.clouds.forEach(c => {
          c.x += c.speed * (isDay ? 0.7 : 0.5); if (c.x > w + 220) c.x = -220;
          drawCloud(ctx, c.x, c.y, c.scale, isDay ? c.opacity : c.opacity * 0.6, isDay ? "#e2e8f0" : "#1e293b");
        });
      }

      /* ──────────────── RAIN ─────────────────────────────────────────── */
      else if (condition === "rain") {
        fillSky(ctx, w, h, isDay ? SKY_RAIN_DAY : SKY_RAIN_NIGHT);
        s.clouds.forEach(c => {
          c.x += c.speed * 0.5; if (c.x > w + 220) c.x = -220;
          drawCloud(ctx, c.x, c.y * 0.6, c.scale * 1.3, isDay ? 0.65 : 0.30, isDay ? "#64748b" : "#0f172a");
        });

        if (frame % 2 === 0 && s.particles.length < 260)
          s.particles.push({ x: rand(-w * 0.1, w), y: -12, vx: rand(-2.2, -0.5), vy: rand(13, 20), size: rand(0.5, 1.2), life: 0, maxLife: 999 });

        s.particles = s.particles.filter(p => {
          p.y += p.vy; p.x += p.vx;
          ctx.strokeStyle = isDay ? `rgba(147,197,253,${rand(0.4, 0.6)})` : `rgba(96,165,250,${rand(0.25, 0.45)})`;
          ctx.lineWidth = p.size * 0.65; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.vx * 2.5, p.y + p.vy * 2.5); ctx.stroke();
          return p.y < h + 20;
        });
      }

      /* ──────────────── THUNDERSTORM ─────────────────────────────────── */
      else if (condition === "thunderstorm") {
        fillSky(ctx, w, h, isDay ? SKY_STORM_DAY : SKY_STORM_NIGHT);
        s.clouds.forEach(c => {
          c.x += c.speed * 0.9; if (c.x > w + 220) c.x = -220;
          drawCloud(ctx, c.x, c.y * 0.42, c.scale * 1.7, isDay ? 0.70 : 0.55, "#312e81");
        });

        if (s.particles.length < 350)
          s.particles.push({ x: rand(-w * 0.1, w), y: -12, vx: rand(-3, -1.2), vy: rand(17, 25), size: rand(0.4, 1), life: 0, maxLife: 999 });

        s.particles = s.particles.filter(p => {
          p.y += p.vy; p.x += p.vx;
          ctx.strokeStyle = `rgba(165,180,252,${rand(0.3, 0.5)})`;
          ctx.lineWidth = p.size * 0.5; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 5, p.y + p.vy * 2); ctx.stroke();
          return p.y < h + 20;
        });

        s.nextLightning--;
        if (s.nextLightning <= 0) {
          s.lightning = { x: w * rand(0.15, 0.85), y: h * 0.03, timer: 12 };
          s.nextLightning = rand(70, 280);
          ctx.fillStyle = "rgba(200,180,255,0.08)"; ctx.fillRect(0, 0, w, h);
        }
        if (s.lightning) {
          drawLightning(ctx, s.lightning.x, s.lightning.y, h);
          s.lightning.timer--;
          if (s.lightning.timer <= 0) s.lightning = null;
        }
      }

      /* ──────────────── SNOW ─────────────────────────────────────────── */
      else if (condition === "snow") {
        fillSky(ctx, w, h, isDay ? SKY_SNOW_DAY : SKY_SNOW_NIGHT);
        if (isDay) {
          // Pale sun behind clouds
          drawSun(ctx, w * 0.7, h * 0.14, t, 30);
          ctx.fillStyle = "rgba(240,249,255,0.35)"; ctx.fillRect(0, 0, w, h);
        } else {
          drawStars(ctx, s.stars, t);
        }

        s.clouds.forEach(c => {
          c.x += c.speed * 0.35; if (c.x > w + 220) c.x = -220;
          drawCloud(ctx, c.x, c.y * 0.5, c.scale * 1.2, isDay ? 0.55 : 0.25, isDay ? "#e0f2fe" : "#1e3a5f");
        });

        if (frame % 3 === 0 && s.particles.length < 160)
          s.particles.push({ x: rand(0, w), y: -8, vx: rand(-0.5, 0.5), vy: rand(0.8, 2.2), size: rand(2, 5), life: 0, maxLife: 999 });

        s.particles = s.particles.filter(p => {
          p.x += p.vx + Math.sin(t * 0.8 + p.y * 0.025) * 0.55; p.y += p.vy;
          ctx.globalAlpha = isDay ? 0.75 : 0.85;
          ctx.fillStyle = isDay ? "#bae6fd" : "#e0f2fe";
          ctx.shadowColor = "#7dd3fc"; ctx.shadowBlur = 6;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1; ctx.shadowBlur = 0;
          return p.y < h + 20;
        });
      }

      /* ──────────────── MIST ─────────────────────────────────────────── */
      else if (condition === "mist") {
        fillSky(ctx, w, h, isDay ? SKY_MIST_DAY : SKY_MIST_NIGHT);
        if (!isDay) drawStars(ctx, s.stars.slice(0, 50), t);

        for (let i = 0; i < 7; i++) {
          const yPos = h * (0.1 + i * 0.145);
          const shift = Math.sin(t * 0.15 + i * 1.1) * 100;
          const fog = ctx.createLinearGradient(0, yPos - 55, 0, yPos + 55);
          const op = isDay ? 0.10 + i * 0.018 : 0.05 + i * 0.010;
          fog.addColorStop(0, "rgba(203,213,225,0)"); fog.addColorStop(0.5, `rgba(203,213,225,${op})`); fog.addColorStop(1, "rgba(203,213,225,0)");
          ctx.fillStyle = fog; ctx.fillRect(shift, yPos - 55, w, 110);
        }
      }

      /* ──────────────── DEFAULT ──────────────────────────────────────── */
      else {
        if (isDay) {
          fillSky(ctx, w, h, SKY_DEFAULT_DAY);
          drawSun(ctx, w * 0.76, h * 0.15, t, 50);
          s.clouds.slice(0, 3).forEach(c => {
            c.x += c.speed * 0.45; if (c.x > w + 200) c.x = -200;
            drawCloud(ctx, c.x, c.y, c.scale * 0.8, 0.30, "#e0f2fe");
          });
        } else {
          fillSky(ctx, w, h, SKY_DEFAULT_NIGHT);
          drawStars(ctx, s.stars, t);
          drawMoon(ctx, w * 0.76, h * 0.14, t);
        }
      }

      s.raf = requestAnimationFrame(render);
    };

    s.raf = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(s.raf); window.removeEventListener("resize", resize); };
  }, [condition, isDay]);

  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: -1, width: "100%", height: "100%" }} />;
}
