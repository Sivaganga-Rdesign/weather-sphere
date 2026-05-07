import { motion } from "framer-motion";
import { Droplets, Wind, Thermometer, Sunrise, Sunset, TrendingDown, TrendingUp } from "lucide-react";
import { WeatherData, WeatherCondition } from "../services/weatherService";

interface Props {
  weather: WeatherData;
  condition: WeatherCondition;
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="flex flex-col gap-2 p-4 rounded-2xl bg-white/8 border border-white/10 backdrop-blur-sm hover:bg-white/12 transition-colors"
    >
      <div className="flex items-center gap-2" style={{ color: accent ?? "rgba(255,255,255,0.45)" }}>
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-white text-lg font-semibold">{value}</span>
    </motion.div>
  );
}

function formatTime(unix: number) {
  return new Date(unix * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const CONDITION_ACCENT: Record<WeatherCondition, { color: string; badge: string; strip: string }> = {
  clear:        { color: "#f97316", badge: "rgba(251,191,36,0.18)", strip: "linear-gradient(to right,#f97316,#fbbf24)" },
  clouds:       { color: "#94a3b8", badge: "rgba(148,163,184,0.18)", strip: "linear-gradient(to right,#64748b,#94a3b8)" },
  rain:         { color: "#60a5fa", badge: "rgba(96,165,250,0.18)",  strip: "linear-gradient(to right,#3b82f6,#60a5fa)" },
  snow:         { color: "#bfdbfe", badge: "rgba(224,242,254,0.18)", strip: "linear-gradient(to right,#93c5fd,#e0f2fe)" },
  thunderstorm: { color: "#a78bfa", badge: "rgba(167,139,250,0.18)", strip: "linear-gradient(to right,#7c3aed,#a78bfa)" },
  mist:         { color: "#cbd5e1", badge: "rgba(203,213,225,0.18)", strip: "linear-gradient(to right,#94a3b8,#cbd5e1)" },
  default:      { color: "#60a5fa", badge: "rgba(96,165,250,0.18)",  strip: "linear-gradient(to right,#3b82f6,#818cf8)" },
};

const CONDITION_LABEL: Record<WeatherCondition, { day: string; night: string }> = {
  clear:        { day: "☀️ Clear",      night: "🌙 Clear Night" },
  clouds:       { day: "⛅ Cloudy",     night: "☁️ Cloudy Night" },
  rain:         { day: "🌧 Rainy",      night: "🌧 Rainy Night" },
  snow:         { day: "❄️ Snow",       night: "❄️ Snowy Night" },
  thunderstorm: { day: "⚡ Thunderstorm", night: "⚡ Thunderstorm" },
  mist:         { day: "🌫 Mist",       night: "🌫 Misty Night" },
  default:      { day: "🌤 Fair",       night: "🌙 Fair Night" },
};

function getHeatLabel(temp: number, condition: WeatherCondition, isDay: boolean): string {
  if (!isDay) return "Night";
  if (condition === "clear") {
    if (temp >= 40) return "🔥 Extreme Heat";
    if (temp >= 35) return "🥵 Very Hot";
    if (temp >= 28) return "☀️ Hot";
    if (temp >= 20) return "🌤 Warm";
    if (temp >= 10) return "🧥 Cool";
    return "🥶 Cold";
  }
  if (temp >= 35) return "🥵 Very Hot";
  if (temp >= 20) return "🌡 Warm";
  if (temp < 0)   return "🥶 Freezing";
  return "";
}

export default function WeatherCard({ weather, condition }: Props) {
  const isDay = weather.isDay;
  const acc = CONDITION_ACCENT[condition] ?? CONDITION_ACCENT.default;
  const label = CONDITION_LABEL[condition]?.[isDay ? "day" : "night"] ?? "";
  const heatLabel = getHeatLabel(weather.temp, condition, isDay);
  const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full rounded-3xl bg-white/10 backdrop-blur-xl border border-white/15 p-6 md:p-8 shadow-2xl relative overflow-hidden"
    >
      {/* Accent strip */}
      <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-3xl" style={{ background: acc.strip }} />

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-white tracking-tight"
          >
            {weather.city}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.18 }}
            className="text-white/45 text-sm mt-1"
          >
            {weather.country} · {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
          </motion.p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <motion.img
            src={iconUrl}
            alt={weather.description}
            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 md:w-20 md:h-20 drop-shadow-lg"
          />
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: acc.badge, color: acc.color }}>
            {label}
          </span>
        </div>
      </div>

      {/* Temperature — fixed: use plain white text, NO gradient text hack */}
      <div className="mb-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 100 }}
          className="flex items-end gap-1"
        >
          <span className="font-extralight text-white" style={{ fontSize: "clamp(72px,14vw,110px)", lineHeight: 1, letterSpacing: "-0.04em" }}>
            {Math.round(weather.temp)}°
          </span>
          <span className="text-2xl text-white/40 mb-3">C</span>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }} className="flex items-center gap-3">
          <p className="text-white/55 capitalize text-base">{weather.description}</p>
          {heatLabel && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">{heatLabel}</span>
          )}
        </motion.div>

        {/* Min / Max */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }} className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-sm text-white/50">
            <TrendingUp className="w-3.5 h-3.5 text-orange-400" /> H: {Math.round(weather.tempMax)}°
          </span>
          <span className="flex items-center gap-1 text-sm text-white/50">
            <TrendingDown className="w-3.5 h-3.5 text-blue-400" /> L: {Math.round(weather.tempMin)}°
          </span>
          <span className="text-sm text-white/30">Feels {Math.round(weather.feelsLike)}°</span>
        </motion.div>
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-3 gap-3"
      >
        <StatCard icon={<Thermometer className="w-4 h-4" />} label="Feels Like" value={`${Math.round(weather.feelsLike)}°C`} accent={acc.color} />
        <StatCard icon={<Droplets className="w-4 h-4" />} label="Humidity" value={`${weather.humidity}%`} accent="#60a5fa" />
        <StatCard icon={<Wind className="w-4 h-4" />} label="Wind" value={`${Math.round(weather.windSpeed)} km/h`} accent="#a78bfa" />
      </motion.div>

      {/* Sunrise / Sunset */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.38 }}
        className="flex gap-3 mt-3"
      >
        <div className="flex-1 flex items-center gap-3 p-3.5 rounded-2xl bg-white/8 border border-white/10">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Sunrise className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <p className="text-white/35 text-xs">Sunrise</p>
            <p className="text-white text-sm font-semibold">{formatTime(weather.sunrise)}</p>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-3 p-3.5 rounded-2xl bg-white/8 border border-white/10">
          <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
            <Sunset className="w-4 h-4 text-orange-300" />
          </div>
          <div>
            <p className="text-white/35 text-xs">Sunset</p>
            <p className="text-white text-sm font-semibold">{formatTime(weather.sunset)}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
