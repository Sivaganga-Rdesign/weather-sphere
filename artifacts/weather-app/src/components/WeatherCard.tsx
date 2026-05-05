import { motion } from "framer-motion";
import { Droplets, Wind, Thermometer, Sunrise, Sunset } from "lucide-react";
import { WeatherData, WeatherCondition } from "../services/weatherService";

interface Props {
  weather: WeatherData;
  condition: WeatherCondition;
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="flex flex-col gap-2 p-4 rounded-2xl bg-white/8 border border-white/10 backdrop-blur-sm transition-colors hover:bg-white/12"
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

const CONDITION_ACCENT: Record<WeatherCondition, { from: string; to: string; badge: string }> = {
  clear:       { from: "#f97316", to: "#fbbf24", badge: "rgba(251,191,36,0.2)" },
  clouds:      { from: "#64748b", to: "#94a3b8", badge: "rgba(148,163,184,0.2)" },
  rain:        { from: "#3b82f6", to: "#60a5fa", badge: "rgba(96,165,250,0.2)" },
  snow:        { from: "#93c5fd", to: "#e0f2fe", badge: "rgba(224,242,254,0.2)" },
  thunderstorm:{ from: "#a78bfa", to: "#818cf8", badge: "rgba(167,139,250,0.2)" },
  mist:        { from: "#94a3b8", to: "#cbd5e1", badge: "rgba(203,213,225,0.2)" },
  default:     { from: "#60a5fa", to: "#818cf8", badge: "rgba(96,165,250,0.2)" },
};

const CONDITION_LABEL: Record<WeatherCondition, string> = {
  clear: "☀️ Clear",
  clouds: "☁️ Cloudy",
  rain: "🌧 Rain",
  snow: "❄️ Snow",
  thunderstorm: "⚡ Storm",
  mist: "🌫 Mist",
  default: "🌤 Fair",
};

export default function WeatherCard({ weather, condition }: Props) {
  const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;
  const acc = CONDITION_ACCENT[condition] ?? CONDITION_ACCENT.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full rounded-3xl bg-white/10 backdrop-blur-xl border border-white/15 p-6 md:p-8 shadow-2xl overflow-hidden relative"
    >
      {/* Gradient accent strip */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-3xl"
        style={{ background: `linear-gradient(to right, ${acc.from}, ${acc.to})` }}
      />

      {/* Header row */}
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
            transition={{ delay: 0.2 }}
            className="text-white/45 text-sm mt-1"
          >
            {weather.country} · {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
          </motion.p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <motion.img
            src={iconUrl}
            alt={weather.description}
            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 md:w-20 md:h-20 drop-shadow-lg"
          />
          <span
            className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
            style={{ background: acc.badge, color: acc.to }}
          >
            {CONDITION_LABEL[condition]}
          </span>
        </div>
      </div>

      {/* Temperature */}
      <div className="mb-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 120 }}
          className="flex items-end gap-2"
        >
          <span
            className="text-8xl md:text-9xl font-thin tracking-tighter"
            style={{ background: `linear-gradient(135deg, ${acc.from}, ${acc.to})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
          >
            {weather.temp}°
          </span>
          <span className="text-2xl text-white/40 mb-4">C</span>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-white/55 capitalize text-base"
        >
          {weather.description}
        </motion.p>
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-3 gap-3"
      >
        <StatCard icon={<Thermometer className="w-4 h-4" />} label="Feels Like" value={`${weather.feelsLike}°C`} accent={acc.from} />
        <StatCard icon={<Droplets className="w-4 h-4" />} label="Humidity" value={`${weather.humidity}%`} accent="#60a5fa" />
        <StatCard icon={<Wind className="w-4 h-4" />} label="Wind" value={`${weather.windSpeed} km/h`} accent="#a78bfa" />
      </motion.div>

      {/* Sunrise / Sunset */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
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
