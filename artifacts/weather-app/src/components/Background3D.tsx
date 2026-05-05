import { useRef, useMemo, Suspense, useState, useEffect } from "react";
import { WeatherCondition } from "../services/weatherService";

interface Props {
  condition: WeatherCondition;
}

const GRADIENTS: Record<WeatherCondition, string> = {
  clear: "radial-gradient(ellipse at 60% 20%, #f97316 0%, #ea580c 15%, #1a1a4e 55%, #0d0d2b 100%)",
  clouds: "linear-gradient(160deg, #1e293b 0%, #334155 40%, #1e293b 70%, #0f172a 100%)",
  rain: "linear-gradient(160deg, #0f172a 0%, #1e3a5f 40%, #0c2340 70%, #0a1628 100%)",
  snow: "linear-gradient(160deg, #1e293b 0%, #3b5ea6 40%, #93c5fd22 70%, #1e293b 100%)",
  thunderstorm: "linear-gradient(160deg, #0f0f1a 0%, #1a0a2e 40%, #312e81 70%, #0f0f1a 100%)",
  mist: "linear-gradient(160deg, #1e293b 0%, #475569 50%, #334155 100%)",
  default: "linear-gradient(160deg, #0f172a 0%, #1e3758 50%, #0f172a 100%)",
};

const PARTICLE_COLORS: Record<WeatherCondition, string> = {
  clear: "#fbbf24",
  clouds: "#94a3b8",
  rain: "#93c5fd",
  snow: "#e0f2fe",
  thunderstorm: "#a78bfa",
  mist: "#cbd5e1",
  default: "#60a5fa",
};

function AnimatedParticles({ condition }: { condition: WeatherCondition }) {
  const color = PARTICLE_COLORS[condition] || PARTICLE_COLORS.default;
  const isRain = condition === "rain" || condition === "thunderstorm";
  const isSnow = condition === "snow";
  const count = isRain ? 40 : 30;

  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: isRain ? 1 + Math.random() * 1 : 2 + Math.random() * 3,
        duration: isRain ? 0.6 + Math.random() * 0.6 : isSnow ? 4 + Math.random() * 6 : 8 + Math.random() * 12,
        delay: Math.random() * 4,
        opacity: 0.3 + Math.random() * 0.5,
      })),
    [condition]
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: isRain ? `${p.size}px` : `${p.size}px`,
            height: isRain ? `${p.size * 8}px` : `${p.size}px`,
            borderRadius: isRain ? "2px" : "50%",
            backgroundColor: color,
            opacity: p.opacity,
            animation: isRain
              ? `rain ${p.duration}s linear ${p.delay}s infinite`
              : isSnow
              ? `snow ${p.duration}s ease-in-out ${p.delay}s infinite`
              : `float ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function SunGlow() {
  return (
    <div
      style={{
        position: "absolute",
        top: "8%",
        right: "15%",
        width: "200px",
        height: "200px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(251,191,36,0.25) 0%, rgba(249,115,22,0.1) 50%, transparent 70%)",
        animation: "pulse-glow 4s ease-in-out infinite",
        pointerEvents: "none",
      }}
    />
  );
}

function CloudShapes() {
  const clouds = [
    { top: "12%", left: "5%", scale: 1, opacity: 0.12, duration: 60 },
    { top: "22%", left: "55%", scale: 0.7, opacity: 0.09, duration: 80 },
    { top: "8%", left: "75%", scale: 0.9, opacity: 0.1, duration: 70 },
    { top: "35%", left: "20%", scale: 0.6, opacity: 0.07, duration: 90 },
  ];
  return (
    <>
      {clouds.map((c, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: c.top,
            left: c.left,
            transform: `scale(${c.scale})`,
            opacity: c.opacity,
            animation: `drift ${c.duration}s linear infinite`,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "180px",
              height: "60px",
            }}
          >
            <div style={{ position: "absolute", bottom: 0, left: "20px", width: "120px", height: "40px", background: "white", borderRadius: "20px" }} />
            <div style={{ position: "absolute", bottom: "20px", left: "35px", width: "70px", height: "60px", background: "white", borderRadius: "50%" }} />
            <div style={{ position: "absolute", bottom: "15px", left: "75px", width: "55px", height: "50px", background: "white", borderRadius: "50%" }} />
          </div>
        </div>
      ))}
    </>
  );
}

export default function Background3D({ condition }: Props) {
  const gradient = GRADIENTS[condition] || GRADIENTS.default;

  return (
    <>
      <style>{`
        @keyframes rain {
          0% { transform: translateY(-20px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes snow {
          0% { transform: translateY(-10px) translateX(0px); opacity: 0; }
          10% { opacity: 1; }
          50% { transform: translateY(50vh) translateX(20px); }
          90% { opacity: 1; }
          100% { transform: translateY(100vh) translateX(-10px); opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.4; }
          50% { transform: translateY(-18px) scale(1.1); opacity: 0.8; }
        }
        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes drift {
          0% { transform: translateX(-80px); }
          100% { transform: translateX(110vw); }
        }
        @keyframes gradient-shift {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
      `}</style>

      {/* Base gradient */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: gradient,
          transition: "background 2s ease",
        }}
      />

      {/* Animated overlay layer */}
      <div
        className="fixed inset-0 -z-10"
        style={{ animation: "gradient-shift 8s ease-in-out infinite" }}
      >
        {/* Weather-specific FX */}
        {condition === "clear" && <SunGlow />}
        {(condition === "clouds" || condition === "mist") && <CloudShapes />}
        {condition === "rain" && (
          <>
            <CloudShapes />
            <AnimatedParticles condition={condition} />
          </>
        )}
        {condition === "thunderstorm" && (
          <>
            <CloudShapes />
            <AnimatedParticles condition={condition} />
          </>
        )}
        {condition === "snow" && <AnimatedParticles condition={condition} />}
        {condition === "clear" && <AnimatedParticles condition={condition} />}
        {condition === "default" && <AnimatedParticles condition={condition} />}
      </div>

      {/* Subtle noise/grain overlay */}
      <div
        className="fixed inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />
    </>
  );
}
