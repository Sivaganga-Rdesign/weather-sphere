import { useEffect, useRef } from "react";
import { WeatherCondition } from "../services/weatherService";

interface Props { condition: WeatherCondition; isDay: boolean; temp: number; }
interface Particle { x: number; y: number; vx: number; vy: number; size: number; life: number; maxLife: number; }
interface Cloud { x: number; y: number; scale: number; speed: number; opacity: number; tint: string; }
interface Pulse { x: number; y: number; r: number; maxR: number; born: number; }

function rand(min: number, max: number) { return min + Math.random() * (max - min); }

/* ── Temperature zone ─────────────────────────────────────────────────────── */
type TempZone = "inferno" | "scorching" | "hot" | "mild" | "cool" | "cold" | "freezing";
function getTempZone(t: number): TempZone {
  if (t >= 42) return "inferno";
  if (t >= 35) return "scorching";
  if (t >= 28) return "hot";
  if (t >= 15) return "mild";
  if (t >= 5)  return "cool";
  if (t >= 0)  return "cold";
  return "freezing";
}

/* ── Sky gradients: condition × temperature zone ──────────────────────────── */
function getDaySky(condition: WeatherCondition, z: TempZone): [number, string][] {
  if (condition === "thunderstorm") return [[0,"#0a0f1e"],[0.4,"#111827"],[1,"#0a0f1e"]];

  if (condition === "rain") {
    if (z === "inferno" || z === "scorching" || z === "hot")
      return [[0,"#3d2010"],[0.4,"#52301a"],[0.8,"#654028"],[1,"#7a5035"]];
    if (z === "cool") return [[0,"#1c2e38"],[0.4,"#26404e"],[0.8,"#334d5a"],[1,"#405c68"]];
    if (z === "cold" || z === "freezing") return [[0,"#0f1e2e"],[0.4,"#182838"],[0.8,"#203040"],[1,"#2a3c4e"]];
    return [[0,"#2a3d4a"],[0.4,"#374d5c"],[0.8,"#445c6a"],[1,"#506878"]]; // mild
  }

  if (condition === "snow")
    return z === "freezing"
      ? [[0,"#c0d8ee"],[0.35,"#d8eaf8"],[0.7,"#edf5fc"],[1,"#f8fdff"]]
      : [[0,"#b8d8f0"],[0.35,"#d0e8f8"],[0.7,"#e8f4fc"],[1,"#f5faff"]];

  if (condition === "mist") {
    if (z === "inferno" || z === "scorching") return [[0,"#7a5c40"],[0.4,"#9a7055"],[0.8,"#b88a68"],[1,"#cca07a"]];
    if (z === "cold" || z === "freezing")     return [[0,"#6080a0"],[0.4,"#80a0b8"],[0.8,"#a0c0d0"],[1,"#c0d8e8"]];
    return [[0,"#608090"],[0.4,"#809aaa"],[0.8,"#a0b8c8"],[1,"#c0d4e0"]];
  }

  if (condition === "clouds") {
    if (z === "inferno")   return [[0,"#5a3010"],[0.4,"#7a4820"],[0.7,"#946030"],[1,"#a87040"]];
    if (z === "scorching") return [[0,"#4a3820"],[0.4,"#6a5230"],[0.7,"#886845"],[1,"#9a7c55"]];
    if (z === "hot")       return [[0,"#4a5565"],[0.4,"#5a6878"],[0.7,"#788090"],[1,"#909aa8"]];
    if (z === "cool")      return [[0,"#384a56"],[0.4,"#4e6270"],[0.75,"#627888"],[1,"#788ea0"]];
    if (z === "cold")      return [[0,"#2a3c48"],[0.4,"#3e5260"],[0.75,"#526878"],[1,"#687e90"]];
    if (z === "freezing")  return [[0,"#4a6478"],[0.4,"#668090"],[0.75,"#90a8b8"],[1,"#b8ccd8"]];
    return [[0,"#445e6a"],[0.4,"#5e7888"],[0.75,"#7898a8"],[1,"#98b0be"]]; // mild
  }

  // clear / default — the most expressive
  switch (z) {
    case "inferno":   return [[0,"#5c0a00"],[0.2,"#9a1a00"],[0.45,"#d03800"],[0.7,"#e86010"],[0.88,"#f09030"],[1,"#f8c040"]];
    case "scorching": return [[0,"#0d3b7a"],[0.3,"#1565c0"],[0.58,"#c85010"],[0.78,"#e88030"],[1,"#f8c060"]];
    case "hot":       return [[0,"#0270b8"],[0.3,"#20a8f0"],[0.65,"#70c8f0"],[0.85,"#f8e080"],[1,"#fdf0a0"]];
    case "mild":      return [[0,"#20a8e8"],[0.3,"#42bef8"],[0.65,"#78d0f8"],[1,"#a8e0f8"]];
    case "cool":      return [[0,"#0e4b9e"],[0.3,"#1460c8"],[0.65,"#3a88e0"],[1,"#78b8f0"]];
    case "cold":      return [[0,"#0a3280"],[0.3,"#1050b0"],[0.65,"#3878c0"],[0.9,"#7aacda"],[1,"#a0c4e8"]];
    case "freezing":  return [[0,"#8ab8d0"],[0.3,"#aecce0"],[0.65,"#cce0ee"],[1,"#e8f4fa"]];
  }
}

/* ── Draw helpers ─────────────────────────────────────────────────────────── */
function fillSky(ctx: CanvasRenderingContext2D, w: number, h: number, stops: [number, string][]) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  stops.forEach(([p, c]) => g.addColorStop(p, c));
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, opacity: number, tint: string) {
  ctx.save(); ctx.globalAlpha = opacity; ctx.fillStyle = tint;
  ([
    [0, 0, 38], [52, -12, 30], [-52, -8, 28], [92, 6, 22], [-82, 6, 20], [26, -28, 22],
  ] as [number,number,number][]).forEach(([bx, by, r]) => {
    ctx.beginPath(); ctx.arc(x + bx * scale, y + by * scale, r * scale, 0, Math.PI * 2); ctx.fill();
  });
  ctx.restore();
}

function drawSun(ctx: CanvasRenderingContext2D, sx: number, sy: number, t: number, size = 55) {
  const r = size * (1 + Math.sin(t * 1.1) * 0.03);
  const g1 = ctx.createRadialGradient(sx, sy, r * 0.3, sx, sy, r * 5.5);
  g1.addColorStop(0, "rgba(255,220,50,0.35)"); g1.addColorStop(0.4, "rgba(255,180,0,0.12)"); g1.addColorStop(1, "rgba(255,180,0,0)");
  ctx.fillStyle = g1; ctx.beginPath(); ctx.arc(sx, sy, r * 5.5, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2 + t * 0.22;
    const len = r * (1.9 + 0.4 * Math.sin(t * 1.6 + i));
    ctx.beginPath(); ctx.strokeStyle = `rgba(255,215,0,${0.38 + 0.28 * Math.sin(t + i)})`;
    ctx.lineWidth = 2.5; ctx.lineCap = "round";
    ctx.moveTo(sx + Math.cos(angle) * (r + 5), sy + Math.sin(angle) * (r + 5));
    ctx.lineTo(sx + Math.cos(angle) * len, sy + Math.sin(angle) * len); ctx.stroke();
  }
  const disc = ctx.createRadialGradient(sx - r * 0.2, sy - r * 0.2, 0, sx, sy, r);
  disc.addColorStop(0, "#fffde7"); disc.addColorStop(0.4, "#ffe066"); disc.addColorStop(1, "#fbbf24");
  ctx.fillStyle = disc; ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
}

function drawMoon(ctx: CanvasRenderingContext2D, sx: number, sy: number, t: number) {
  const r = 42 + Math.sin(t * 0.4) * 2;
  const glow = ctx.createRadialGradient(sx, sy, r * 0.4, sx, sy, r * 4);
  glow.addColorStop(0, "rgba(219,234,254,0.22)"); glow.addColorStop(1, "rgba(147,197,253,0)");
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(sx, sy, r * 4, 0, Math.PI * 2); ctx.fill();
  const disc = ctx.createRadialGradient(sx - r * 0.12, sy - r * 0.12, 0, sx, sy, r);
  disc.addColorStop(0, "#f0f9ff"); disc.addColorStop(0.6, "#bae6fd"); disc.addColorStop(1, "#7dd3fc");
  ctx.fillStyle = disc; ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(2,6,23,0.60)";
  ctx.beginPath(); ctx.arc(sx + r * 0.28, sy - r * 0.04, r * 0.84, 0, Math.PI * 2); ctx.fill();
  ([[-14,9,6],[11,-13,4],[-21,-4,3.5]] as [number,number,number][]).forEach(([cx,cy,cr]) => {
    ctx.fillStyle = "rgba(125,211,252,0.22)";
    ctx.beginPath(); ctx.arc(sx+cx, sy+cy, cr, 0, Math.PI*2); ctx.fill();
  });
}

function drawStars(ctx: CanvasRenderingContext2D, stars: Particle[]) {
  stars.forEach(s => {
    s.life += 0.009; if (s.life > s.maxLife) s.life = 0;
    const a = Math.sin((s.life / s.maxLife) * Math.PI) * 0.95;
    ctx.globalAlpha = a; ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawLightning(ctx: CanvasRenderingContext2D, x: number, y: number, H: number) {
  ctx.save(); ctx.strokeStyle = "#fef9c3"; ctx.lineWidth = 2.8;
  ctx.shadowColor = "#fde047"; ctx.shadowBlur = 35; ctx.globalAlpha = 0.95;
  ctx.beginPath(); ctx.moveTo(x, y);
  let cx = x, cy = y;
  while (cy < H * 0.78) { cx += rand(-30, 30); cy += rand(20, 36); ctx.lineTo(cx, cy); }
  ctx.stroke(); ctx.restore();
}

/* ── Radar pulse ring ─────────────────────────────────────────────────────── */
function drawPulses(ctx: CanvasRenderingContext2D, pulses: Pulse[], frame: number) {
  pulses.forEach(p => {
    const progress = (p.r / p.maxR);
    const alpha = (1 - progress) * 0.55;
    if (alpha <= 0) return;

    // Outer ring
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(167,139,250,${alpha})`;
    ctx.lineWidth = 3 * (1 - progress * 0.8);
    ctx.shadowColor = "#7c3aed"; ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Inner fill fade
    const fillAlpha = (1 - progress) * 0.08;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(124,58,237,${fillAlpha})`;
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

/* ── Night sky palettes ───────────────────────────────────────────────────── */
const NIGHT_SKY: Record<string, [number,string][]> = {
  clear:        [[0,"#020617"],[0.45,"#0f172a"],[0.8,"#0c1a3a"],[1,"#020617"]],
  clouds:       [[0,"#030712"],[0.4,"#0f1520"],[0.8,"#111827"],[1,"#030712"]],
  rain:         [[0,"#020408"],[0.4,"#050d18"],[1,"#020408"]],
  snow:         [[0,"#0f172a"],[0.5,"#172554"],[1,"#1e3a5f"]],
  thunderstorm: [[0,"#050008"],[0.4,"#0f0020"],[0.8,"#1a0030"],[1,"#050008"]],
  mist:         [[0,"#111827"],[0.5,"#1f2937"],[1,"#111827"]],
  default:      [[0,"#020617"],[0.5,"#0f172a"],[1,"#020617"]],
};

/* ── Main component ───────────────────────────────────────────────────────── */
export default function WeatherCanvas({ condition, isDay, temp }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    particles: Particle[]; stars: Particle[]; clouds: Cloud[];
    pulses: Pulse[];
    lightning: { x: number; y: number; timer: number } | null;
    nextLightning: number; raf: number;
  }>({ particles: [], stars: [], clouds: [], pulses: [], lightning: null, nextLightning: 0, raf: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);

    const s = stateRef.current;
    s.particles = []; s.pulses = []; s.lightning = null; s.nextLightning = rand(80, 220);

    const W = () => canvas.width, H = () => canvas.height;
    const zone = getTempZone(temp);

    s.stars = Array.from({ length: !isDay ? 220 : 0 }, () => ({
      x: rand(0, W()), y: rand(0, H() * 0.65),
      vx: 0, vy: 0, size: rand(0.5, 1.8), life: rand(0, 200), maxLife: rand(140, 300),
    }));

    const cloudTint = !isDay ? "#1e293b"
      : zone === "freezing" || zone === "cold" ? "#cce0f0"
      : zone === "inferno" || zone === "scorching" ? "#c8906c"
      : "#c8dce8";

    s.clouds = Array.from({ length: 7 }, (_, i) => ({
      x: (i / 7) * W() + rand(-60, 120),
      y: rand(35, H() * (isDay ? 0.28 : 0.22)),
      scale: rand(0.5, 1.2), speed: rand(0.1, 0.32),
      opacity: (isDay ? 0.58 : 0.22) + rand(0, 0.14), tint: cloudTint,
    }));

    if (condition === "rain" || condition === "thunderstorm") {
      const count = condition === "thunderstorm" ? 300 : 220;
      for (let i = 0; i < count; i++)
        s.particles.push({ x: rand(0, W()), y: rand(0, H()), vx: rand(-2.5, -0.6), vy: rand(14, 22), size: rand(0.5, 1.2), life: 0, maxLife: 999 });
    } else if (condition === "snow") {
      for (let i = 0; i < 140; i++)
        s.particles.push({ x: rand(0, W()), y: rand(0, H()), vx: rand(-0.5, 0.5), vy: rand(0.7, 2.2), size: rand(2, 5), life: 0, maxLife: 999 });
    }

    let t = 0, frame = 0;

    const render = () => {
      const w = W(), h = H();
      ctx.clearRect(0, 0, w, h);
      t += 0.016; frame++;

      /* ── SKY ─────────────────────────────────────────────────────────── */
      fillSky(ctx, w, h, isDay ? getDaySky(condition, zone) : (NIGHT_SKY[condition] ?? NIGHT_SKY.default));

      /* ── CLEAR / DEFAULT ─────────────────────────────────────────────── */
      if (condition === "clear" || condition === "default") {
        if (isDay) {
          // Inferno: pulsing fiery bottom layer
          if (zone === "inferno") {
            const fire = ctx.createLinearGradient(0, h * 0.42, 0, h);
            const flicker = 0.28 + Math.sin(t * 4) * 0.06;
            fire.addColorStop(0, "rgba(200,30,0,0)");
            fire.addColorStop(0.4, `rgba(220,60,0,${flicker})`);
            fire.addColorStop(0.75, `rgba(240,90,0,${flicker + 0.10})`);
            fire.addColorStop(1, `rgba(255,120,0,${flicker + 0.20})`);
            ctx.fillStyle = fire; ctx.fillRect(0, h * 0.42, w, h);

            // Wavering heat shimmer bands
            for (let i = 0; i < 5; i++) {
              const yp = h * (0.55 + i * 0.09);
              const band = ctx.createLinearGradient(0, yp - 18, 0, yp + 18);
              band.addColorStop(0, "rgba(255,80,0,0)");
              band.addColorStop(0.5, `rgba(255,80,0,${0.06 + Math.sin(t * 3 + i) * 0.03})`);
              band.addColorStop(1, "rgba(255,80,0,0)");
              ctx.fillStyle = band; ctx.fillRect(Math.sin(t * 0.8 + i) * 60, yp - 18, w, 36);
            }
          }

          // Scorching: amber horizon bloom
          if (zone === "scorching") {
            const bloom = ctx.createLinearGradient(0, h * 0.4, 0, h);
            bloom.addColorStop(0, "rgba(220,100,0,0)");
            bloom.addColorStop(0.5, "rgba(230,120,0,0.15)");
            bloom.addColorStop(1, "rgba(250,150,0,0.28)");
            ctx.fillStyle = bloom; ctx.fillRect(0, h * 0.4, w, h);
          }

          // Hot: subtle golden horizon
          if (zone === "hot") {
            const gold = ctx.createLinearGradient(0, h * 0.6, 0, h);
            gold.addColorStop(0, "rgba(255,220,80,0)");
            gold.addColorStop(1, "rgba(255,210,60,0.18)");
            ctx.fillStyle = gold; ctx.fillRect(0, h * 0.6, w, h);
          }

          // Cold/Freezing: icy upper shimmer
          if (zone === "freezing" || zone === "cold") {
            const frost = ctx.createLinearGradient(0, 0, 0, h * 0.45);
            frost.addColorStop(0, `rgba(200,230,255,${zone === "freezing" ? 0.22 : 0.12})`);
            frost.addColorStop(1, "rgba(200,230,255,0)");
            ctx.fillStyle = frost; ctx.fillRect(0, 0, w, h * 0.45);
          }

          drawSun(ctx, w * 0.75, h * 0.16, t,
            zone === "inferno" ? 74 : zone === "scorching" ? 65 : zone === "freezing" ? 42 : 55);

          // Lazy wispy clouds on mild/cool
          if (zone === "mild" || zone === "cool") {
            s.clouds.slice(0, 2).forEach(c => {
              c.x += c.speed * 0.38; if (c.x > w + 200) c.x = -200;
              drawCloud(ctx, c.x, c.y, c.scale * 0.6, 0.16, "#d8f0fc");
            });
          }

          // Heat shimmer particles for hot+
          if (zone === "inferno" || zone === "scorching" || zone === "hot") {
            if (frame % (zone === "inferno" ? 2 : 3) === 0 && s.particles.length < (zone === "inferno" ? 120 : 80))
              s.particles.push({ x: rand(0, w), y: h + 5, vx: rand(-0.4, 0.4), vy: rand(-0.8, -2.0), size: rand(2, 6), life: 0, maxLife: rand(80, 160) });
            s.particles = s.particles.filter(p => {
              p.life++; p.x += p.vx + Math.sin(t * 2.2 + p.y * 0.025) * 0.3; p.y += p.vy;
              const a = Math.sin((p.life / p.maxLife) * Math.PI) * (zone === "inferno" ? 0.55 : 0.35);
              const col = zone === "inferno" ? "#ff4400" : zone === "scorching" ? "#ff7700" : "#ffcc44";
              ctx.globalAlpha = a; ctx.fillStyle = col;
              ctx.shadowColor = col; ctx.shadowBlur = zone === "inferno" ? 14 : 8;
              ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
              ctx.globalAlpha = 1; ctx.shadowBlur = 0;
              return p.y > -10 && p.life < p.maxLife;
            });
          }

          // Drifting ice crystals for freezing
          if (zone === "freezing") {
            if (frame % 4 === 0 && s.particles.length < 70)
              s.particles.push({ x: rand(0, w), y: rand(0, h * 0.45), vx: rand(-0.25, 0.25), vy: rand(0.3, 0.8), size: rand(1, 2.5), life: 0, maxLife: rand(220, 440) });
            s.particles = s.particles.filter(p => {
              p.life++; p.x += p.vx; p.y += p.vy;
              ctx.globalAlpha = Math.sin((p.life / p.maxLife) * Math.PI) * 0.55;
              ctx.fillStyle = "#d0ecff";
              ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
              ctx.globalAlpha = 1;
              return p.y < h + 10 && p.life < p.maxLife;
            });
          }
        } else {
          drawStars(ctx, s.stars);
          drawMoon(ctx, w * 0.76, h * 0.14, t);
          if (frame % 420 < 28) {
            const prog = (frame % 420) / 28;
            const sx = w * 0.55 + prog * 210, sy = h * 0.08 + prog * 65;
            ctx.save();
            const sg = ctx.createLinearGradient(sx - 90, sy - 35, sx, sy);
            sg.addColorStop(0, "rgba(255,255,255,0)"); sg.addColorStop(1, `rgba(255,255,255,${0.75*(1-prog)})`);
            ctx.strokeStyle = sg; ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.moveTo(sx - 90, sy - 35); ctx.lineTo(sx, sy); ctx.stroke(); ctx.restore();
          }
        }
      }

      /* ── CLOUDS ──────────────────────────────────────────────────────── */
      else if (condition === "clouds") {
        if (isDay) {
          const glowCol = (zone === "inferno" || zone === "scorching")
            ? "rgba(255,130,0,0.20)" : "rgba(255,215,0,0.16)";
          const sg = ctx.createRadialGradient(w * 0.62, h * 0.17, 0, w * 0.62, h * 0.17, 160);
          sg.addColorStop(0, glowCol); sg.addColorStop(0.5, "rgba(255,200,0,0.05)"); sg.addColorStop(1, "rgba(255,200,0,0)");
          ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(w * 0.62, h * 0.17, 160, 0, Math.PI * 2); ctx.fill();
        } else {
          drawStars(ctx, s.stars.slice(0, 80));
          const mg = ctx.createRadialGradient(w * 0.68, h * 0.12, 0, w * 0.68, h * 0.12, 110);
          mg.addColorStop(0, "rgba(186,230,253,0.16)"); mg.addColorStop(1, "rgba(186,230,253,0)");
          ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(w * 0.68, h * 0.12, 110, 0, Math.PI * 2); ctx.fill();
        }
        s.clouds.forEach(c => {
          c.x += c.speed * (isDay ? 0.7 : 0.5); if (c.x > w + 220) c.x = -220;
          drawCloud(ctx, c.x, c.y, c.scale, isDay ? c.opacity : c.opacity * 0.6, isDay ? c.tint : "#1e293b");
        });
      }

      /* ── RAIN ────────────────────────────────────────────────────────── */
      else if (condition === "rain") {
        s.clouds.forEach(c => {
          c.x += c.speed * 0.5; if (c.x > w + 220) c.x = -220;
          const ct = !isDay ? "#0f172a"
            : zone === "inferno" || zone === "scorching" || zone === "hot" ? "#8a5540"
            : zone === "cold" || zone === "freezing" ? "#2a3c50" : "#5a6878";
          drawCloud(ctx, c.x, c.y * 0.6, c.scale * 1.3, isDay ? 0.68 : 0.32, ct);
        });

        if (frame % 2 === 0 && s.particles.length < 260)
          s.particles.push({ x: rand(-w * 0.1, w), y: -12, vx: rand(-2.2, -0.5), vy: rand(13, 20), size: rand(0.5, 1.2), life: 0, maxLife: 999 });

        s.particles = s.particles.filter(p => {
          p.y += p.vy; p.x += p.vx;
          const rainA = rand(0.35, 0.60);
          ctx.strokeStyle = isDay ? `rgba(147,197,253,${rainA})` : `rgba(96,165,250,${rainA * 0.75})`;
          ctx.lineWidth = p.size * 0.65; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.vx * 2.5, p.y + p.vy * 2.5); ctx.stroke();
          return p.y < h + 20;
        });
      }

      /* ── THUNDERSTORM ────────────────────────────────────────────────── */
      else if (condition === "thunderstorm") {
        s.clouds.forEach(c => {
          c.x += c.speed * 0.9; if (c.x > w + 220) c.x = -220;
          drawCloud(ctx, c.x, c.y * 0.42, c.scale * 1.8, isDay ? 0.72 : 0.58, "#312e81");
        });

        if (s.particles.length < 350)
          s.particles.push({ x: rand(-w * 0.1, w), y: -12, vx: rand(-3, -1.2), vy: rand(17, 25), size: rand(0.4, 1), life: 0, maxLife: 999 });
        s.particles = s.particles.filter(p => {
          p.y += p.vy; p.x += p.vx;
          ctx.strokeStyle = `rgba(165,180,252,${rand(0.3, 0.5)})`; ctx.lineWidth = p.size * 0.5; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 5, p.y + p.vy * 2); ctx.stroke();
          return p.y < h + 20;
        });

        // ── RADAR PULSE RINGS ──────────────────────────────────────────
        // Spawn a new pulse every ~2.5 s, or whenever lightning fires
        if (frame % 150 === 0) {
          s.pulses.push({ x: w * rand(0.3, 0.7), y: h * rand(0.05, 0.2), r: 0, maxR: w * rand(0.45, 0.75), born: frame });
        }

        // Grow all pulses
        s.pulses = s.pulses.filter(p => {
          p.r += (p.maxR / 140); // ~2.3 s lifetime at 60fps
          return p.r < p.maxR;
        });
        drawPulses(ctx, s.pulses, frame);

        // Lightning bolt
        s.nextLightning--;
        if (s.nextLightning <= 0) {
          const lx = w * rand(0.15, 0.85);
          const ly = h * 0.03;
          s.lightning = { x: lx, y: ly, timer: 14 };
          s.nextLightning = rand(60, 240);
          // Lightning also spawns a pulse at its base
          s.pulses.push({ x: lx, y: h * 0.35, r: 0, maxR: w * rand(0.3, 0.55), born: frame });
          // Whole-screen flash
          ctx.fillStyle = "rgba(200,180,255,0.12)"; ctx.fillRect(0, 0, w, h);
        }
        if (s.lightning) {
          drawLightning(ctx, s.lightning.x, s.lightning.y, h);
          s.lightning.timer--;
          if (s.lightning.timer <= 0) s.lightning = null;
        }
      }

      /* ── SNOW ────────────────────────────────────────────────────────── */
      else if (condition === "snow") {
        if (isDay) {
          drawSun(ctx, w * 0.7, h * 0.14, t, 28);
          ctx.fillStyle = "rgba(220,240,255,0.28)"; ctx.fillRect(0, 0, w, h);
        } else {
          drawStars(ctx, s.stars);
        }

        s.clouds.forEach(c => {
          c.x += c.speed * 0.35; if (c.x > w + 220) c.x = -220;
          drawCloud(ctx, c.x, c.y * 0.5, c.scale * 1.2, isDay ? 0.55 : 0.25, isDay ? "#cce0f0" : "#1e3a5f");
        });

        if (frame % 3 === 0 && s.particles.length < 170)
          s.particles.push({ x: rand(0, w), y: -8, vx: rand(-0.5, 0.5), vy: rand(0.8, 2.2), size: rand(2, 5), life: 0, maxLife: 999 });

        s.particles = s.particles.filter(p => {
          p.x += p.vx + Math.sin(t * 0.8 + p.y * 0.025) * 0.55; p.y += p.vy;
          ctx.globalAlpha = isDay ? 0.80 : 0.90;
          ctx.fillStyle = isDay ? "#c0e0f8" : "#e0f2fe";
          ctx.shadowColor = "#7dd3fc"; ctx.shadowBlur = 6;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1; ctx.shadowBlur = 0;
          return p.y < h + 20;
        });
      }

      /* ── MIST ────────────────────────────────────────────────────────── */
      else if (condition === "mist") {
        if (!isDay) drawStars(ctx, s.stars.slice(0, 50));
        for (let i = 0; i < 8; i++) {
          const yPos = h * (0.08 + i * 0.13);
          const shift = Math.sin(t * 0.14 + i * 1.05) * 110;
          const op = isDay ? 0.09 + i * 0.016 : 0.05 + i * 0.009;
          const fogCol = (zone === "inferno" || zone === "scorching") ? "190,140,90" : "190,210,225";
          const fog = ctx.createLinearGradient(0, yPos - 55, 0, yPos + 55);
          fog.addColorStop(0, `rgba(${fogCol},0)`); fog.addColorStop(0.5, `rgba(${fogCol},${op})`); fog.addColorStop(1, `rgba(${fogCol},0)`);
          ctx.fillStyle = fog; ctx.fillRect(shift, yPos - 55, w, 110);
        }
      }

      s.raf = requestAnimationFrame(render);
    };

    s.raf = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(s.raf); window.removeEventListener("resize", resize); };
  }, [condition, isDay, temp]);

  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: -1, width: "100%", height: "100%" }} />;
}
