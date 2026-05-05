import { useEffect, useRef } from "react";
import { WeatherCondition } from "../services/weatherService";

interface Props {
  condition: WeatherCondition;
}

/* ─── Sunny / Hot ────────────────────────────────────────────────────────── */
function drawSunny(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  // Sky gradient — hot, blazing
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#1a0a00");
  sky.addColorStop(0.35, "#7c2d12");
  sky.addColorStop(0.7, "#ea580c");
  sky.addColorStop(1, "#fbbf24");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Sun
  const sx = W * 0.72, sy = H * 0.18;
  const pulse = 1 + Math.sin(t * 1.2) * 0.04;
  const sunR = 60 * pulse;

  // Outer glow
  const glow = ctx.createRadialGradient(sx, sy, sunR * 0.3, sx, sy, sunR * 3.5);
  glow.addColorStop(0, "rgba(253,224,71,0.35)");
  glow.addColorStop(0.5, "rgba(251,146,60,0.12)");
  glow.addColorStop(1, "rgba(251,146,60,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(sx, sy, sunR * 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Sun rays
  const rayCount = 12;
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2 + t * 0.3;
    const len = sunR * (1.6 + 0.4 * Math.sin(t * 2 + i));
    const x1 = sx + Math.cos(angle) * (sunR + 8);
    const y1 = sy + Math.sin(angle) * (sunR + 8);
    const x2 = sx + Math.cos(angle) * len;
    const y2 = sy + Math.sin(angle) * len;
    ctx.beginPath();
    ctx.strokeStyle = `rgba(253,224,71,${0.5 + 0.3 * Math.sin(t + i)})`;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Sun disc
  const disc = ctx.createRadialGradient(sx - 10, sy - 10, 0, sx, sy, sunR);
  disc.addColorStop(0, "#fef9c3");
  disc.addColorStop(0.5, "#fde047");
  disc.addColorStop(1, "#f97316");
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(sx, sy, sunR, 0, Math.PI * 2);
  ctx.fill();
}

/* ─── Heat shimmer particles ─────────────────────────────────────────────── */
interface Particle { x: number; y: number; vy: number; vx: number; size: number; life: number; maxLife: number; }

function spawnHeat(W: number, H: number): Particle {
  return { x: Math.random() * W, y: H + 10, vy: -(0.4 + Math.random() * 1.2), vx: (Math.random() - 0.5) * 0.4, size: 2 + Math.random() * 4, life: 0, maxLife: 120 + Math.random() * 100 };
}
function spawnRain(W: number): Particle {
  return { x: Math.random() * W * 1.5 - W * 0.25, y: -20, vy: 14 + Math.random() * 8, vx: -2 + Math.random(), size: 1 + Math.random(), life: 0, maxLife: 999 };
}
function spawnSnow(W: number): Particle {
  return { x: Math.random() * W, y: -10, vy: 0.8 + Math.random() * 1.5, vx: (Math.random() - 0.5) * 0.6, size: 2 + Math.random() * 5, life: 0, maxLife: 999 };
}
function spawnStar(W: number, H: number): Particle {
  return { x: Math.random() * W, y: Math.random() * H * 0.6, vy: 0, vx: 0, size: 1 + Math.random() * 2, life: Math.random() * 200, maxLife: 200 + Math.random() * 200 };
}

/* ─── Cloud drawing helper ───────────────────────────────────────────────── */
function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, opacity: number) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = "#e2e8f0";
  const blobs: [number, number, number][] = [
    [0, 0, 38 * scale], [45 * scale, -12 * scale, 30 * scale],
    [-45 * scale, -8 * scale, 28 * scale], [80 * scale, 5 * scale, 24 * scale],
    [-75 * scale, 5 * scale, 22 * scale], [25 * scale, -28 * scale, 22 * scale],
  ];
  blobs.forEach(([bx, by, r]) => {
    ctx.beginPath();
    ctx.arc(x + bx, y + by, r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

/* ─── Lightning helper ───────────────────────────────────────────────────── */
function drawLightning(ctx: CanvasRenderingContext2D, x: number, y: number, H: number) {
  ctx.save();
  ctx.strokeStyle = "#fef08a";
  ctx.lineWidth = 2.5;
  ctx.shadowColor = "#fde047";
  ctx.shadowBlur = 20;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.moveTo(x, y);
  let cx = x, cy = y;
  while (cy < H * 0.7) {
    cx += (Math.random() - 0.5) * 40;
    cy += 30 + Math.random() * 30;
    ctx.lineTo(cx, cy);
  }
  ctx.stroke();
  ctx.restore();
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function WeatherCanvas({ condition }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    particles: Particle[];
    clouds: { x: number; y: number; scale: number; speed: number; opacity: number }[];
    lightning: { x: number; y: number; timer: number } | null;
    nextLightning: number;
    raf: number;
  }>({ particles: [], clouds: [], lightning: null, nextLightning: 0, raf: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const s = stateRef.current;
    s.particles = [];
    s.lightning = null;
    s.nextLightning = 80 + Math.random() * 200;

    // Init clouds
    s.clouds = Array.from({ length: 6 }, (_, i) => ({
      x: (i / 6) * canvas.width + Math.random() * 200,
      y: 60 + Math.random() * canvas.height * 0.25,
      scale: 0.6 + Math.random() * 0.9,
      speed: 0.15 + Math.random() * 0.25,
      opacity: 0.25 + Math.random() * 0.35,
    }));

    // Init particles
    const count = condition === "rain" || condition === "thunderstorm" ? 250
      : condition === "snow" ? 120
      : condition === "clear" ? 80
      : 40;
    for (let i = 0; i < count; i++) {
      if (condition === "rain" || condition === "thunderstorm") {
        const p = spawnRain(canvas.width);
        p.y = Math.random() * canvas.height;
        s.particles.push(p);
      } else if (condition === "snow") {
        const p = spawnSnow(canvas.width);
        p.y = Math.random() * canvas.height;
        s.particles.push(p);
      } else if (condition === "clear") {
        const p = spawnHeat(canvas.width, canvas.height);
        p.y = canvas.height * (0.5 + Math.random() * 0.5);
        s.particles.push(p);
      } else if (condition === "default" || condition === "mist") {
        s.particles.push(spawnStar(canvas.width, canvas.height));
      }
    }

    let frame = 0;
    let t = 0;
    const W = () => canvas.width, H = () => canvas.height;

    const render = () => {
      const w = W(), h = H();
      ctx.clearRect(0, 0, w, h);
      t += 0.016;
      frame++;

      if (condition === "clear") {
        drawSunny(ctx, w, h, t);

        // Heat shimmer rising particles
        if (frame % 3 === 0 && s.particles.length < 100)
          s.particles.push(spawnHeat(w, h));

        s.particles = s.particles.filter(p => {
          p.life++;
          p.x += p.vx + Math.sin(t * 2 + p.y * 0.02) * 0.3;
          p.y += p.vy;
          const alpha = Math.sin((p.life / p.maxLife) * Math.PI) * 0.5;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = "#fbbf24";
          ctx.shadowColor = "#f97316";
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          return p.y > -10 && p.life < p.maxLife;
        });

      } else if (condition === "clouds") {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, "#0f172a");
        sky.addColorStop(0.5, "#1e3a5f");
        sky.addColorStop(1, "#0f172a");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        s.clouds.forEach(c => {
          c.x += c.speed;
          if (c.x > w + 200) c.x = -200;
          drawCloud(ctx, c.x, c.y, c.scale, c.opacity);
        });

        // Stars peeking through
        s.particles.forEach(p => {
          p.life++;
          if (p.life > p.maxLife) { p.life = 0; p.x = Math.random() * w; p.y = Math.random() * h * 0.5; }
          const a = Math.sin((p.life / p.maxLife) * Math.PI) * 0.4;
          ctx.fillStyle = `rgba(255,255,255,${a})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        });

      } else if (condition === "rain") {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, "#0a0f1e");
        sky.addColorStop(0.5, "#0c1a3a");
        sky.addColorStop(1, "#0a0f1e");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        // Dark clouds
        s.clouds.forEach(c => {
          c.x += c.speed * 0.5;
          if (c.x > w + 200) c.x = -200;
          drawCloud(ctx, c.x, c.y * 0.5, c.scale * 1.2, c.opacity * 1.4);
        });

        // Spawn rain
        if (frame % 2 === 0 && s.particles.length < 300)
          s.particles.push(spawnRain(w));

        s.particles = s.particles.filter(p => {
          p.y += p.vy;
          p.x += p.vx;
          ctx.save();
          ctx.strokeStyle = `rgba(147,197,253,${0.4 + p.size * 0.15})`;
          ctx.lineWidth = p.size * 0.6;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 3, p.y + p.vy * 3);
          ctx.stroke();
          ctx.restore();
          return p.y < h + 20;
        });

      } else if (condition === "thunderstorm") {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, "#050008");
        sky.addColorStop(0.5, "#1a0a2e");
        sky.addColorStop(1, "#050008");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        s.clouds.forEach(c => {
          c.x += c.speed * 0.8;
          if (c.x > w + 200) c.x = -200;
          ctx.save();
          ctx.filter = "blur(1px)";
          drawCloud(ctx, c.x, c.y * 0.4, c.scale * 1.5, c.opacity * 1.6);
          ctx.restore();
        });

        // Heavy rain
        if (frame % 1 === 0 && s.particles.length < 350)
          s.particles.push(spawnRain(w));

        s.particles = s.particles.filter(p => {
          p.y += p.vy * 1.4;
          p.x += p.vx * 2;
          ctx.save();
          ctx.strokeStyle = `rgba(167,139,250,${0.35 + p.size * 0.1})`;
          ctx.lineWidth = p.size * 0.5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 4, p.y + p.vy * 2.5);
          ctx.stroke();
          ctx.restore();
          return p.y < h + 20;
        });

        // Lightning
        s.nextLightning--;
        if (s.nextLightning <= 0) {
          s.lightning = { x: w * (0.2 + Math.random() * 0.6), y: h * 0.05, timer: 8 };
          s.nextLightning = 100 + Math.random() * 300;
          // Flash
          ctx.fillStyle = "rgba(200,180,255,0.08)";
          ctx.fillRect(0, 0, w, h);
        }
        if (s.lightning) {
          drawLightning(ctx, s.lightning.x, s.lightning.y, h);
          s.lightning.timer--;
          if (s.lightning.timer <= 0) s.lightning = null;
        }

      } else if (condition === "snow") {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, "#0f172a");
        sky.addColorStop(0.5, "#1e3a5f");
        sky.addColorStop(1, "#172554");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        if (frame % 4 === 0 && s.particles.length < 150)
          s.particles.push(spawnSnow(w));

        s.particles = s.particles.filter(p => {
          p.life++;
          p.x += p.vx + Math.sin(t * 0.8 + p.y * 0.03) * 0.5;
          p.y += p.vy;
          ctx.save();
          ctx.globalAlpha = 0.75;
          ctx.fillStyle = "#e0f2fe";
          ctx.shadowColor = "#bfdbfe";
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          return p.y < h + 20;
        });

      } else if (condition === "mist") {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, "#1e293b");
        sky.addColorStop(1, "#334155");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        // Fog bands
        for (let i = 0; i < 5; i++) {
          const yPos = h * (0.2 + i * 0.18);
          const shift = Math.sin(t * 0.2 + i) * 80;
          const fog = ctx.createLinearGradient(0, yPos - 40, 0, yPos + 40);
          fog.addColorStop(0, "rgba(148,163,184,0)");
          fog.addColorStop(0.5, `rgba(148,163,184,${0.06 + i * 0.02})`);
          fog.addColorStop(1, "rgba(148,163,184,0)");
          ctx.fillStyle = fog;
          ctx.fillRect(shift, yPos - 40, w, 80);
        }

        s.particles.forEach(p => {
          p.life++;
          if (p.life > p.maxLife) { p.life = 0; }
          const a = Math.sin((p.life / p.maxLife) * Math.PI) * 0.3;
          ctx.fillStyle = `rgba(203,213,225,${a})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });

      } else {
        // Default — deep space/night
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, "#020617");
        sky.addColorStop(1, "#0f172a");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        s.particles.forEach(p => {
          p.life++;
          if (p.life > p.maxLife) { p.life = 0; p.maxLife = 200 + Math.random() * 200; }
          const a = Math.sin((p.life / p.maxLife) * Math.PI) * 0.8;
          ctx.fillStyle = `rgba(255,255,255,${a})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      s.raf = requestAnimationFrame(render);
    };

    s.raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(s.raf);
      window.removeEventListener("resize", resize);
    };
  }, [condition]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, zIndex: -1, width: "100%", height: "100%" }}
    />
  );
}
