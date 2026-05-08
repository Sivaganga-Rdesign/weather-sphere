import { motion } from "framer-motion";
import { Sunrise, Sunset, TrendingUp, TrendingDown, Droplets, Wind } from "lucide-react";
import { WeatherData, ForecastDay } from "../services/weatherService";

interface Props {
  weather: WeatherData;
  forecast: ForecastDay[];
}

function formatTime(unix: number) {
  return new Date(unix * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface StatProps { icon: React.ReactNode; label: string; value: string; accent?: string }

function Stat({ icon, label, value, accent }: StatProps) {
  return (
    <div className="flex flex-col items-center gap-1 px-3 min-w-0">
      <div style={{ color: accent ?? "rgba(255,255,255,0.45)" }}>{icon}</div>
      <span className="text-white font-semibold text-sm whitespace-nowrap">{value}</span>
      <span className="text-white/35 text-[10px] uppercase tracking-wide whitespace-nowrap">{label}</span>
    </div>
  );
}

function Divider() {
  return <div className="w-px h-8 bg-white/12 shrink-0 self-center" />;
}

export default function QuickSummaryBar({ weather, forecast }: Props) {
  const today = forecast[0];
  const rainChance = today?.pop ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="w-full rounded-2xl bg-black/25 backdrop-blur-xl border border-white/12 shadow-xl overflow-x-auto"
      style={{ scrollbarWidth: "none" }}
    >
      <div className="flex items-stretch divide-x divide-white/10 min-w-max mx-auto px-2 py-3">
        <Stat
          icon={<Sunrise className="w-3.5 h-3.5" />}
          label="Sunrise"
          value={formatTime(weather.sunrise)}
          accent="#fbbf24"
        />
        <Stat
          icon={<Sunset className="w-3.5 h-3.5" />}
          label="Sunset"
          value={formatTime(weather.sunset)}
          accent="#f97316"
        />
        <Divider />
        <Stat
          icon={<TrendingUp className="w-3.5 h-3.5" />}
          label="Today High"
          value={`${Math.round(today?.tempMax ?? weather.tempMax)}°`}
          accent="#f87171"
        />
        <Stat
          icon={<TrendingDown className="w-3.5 h-3.5" />}
          label="Today Low"
          value={`${Math.round(today?.tempMin ?? weather.tempMin)}°`}
          accent="#60a5fa"
        />
        <Divider />
        <Stat
          icon={<Droplets className="w-3.5 h-3.5" />}
          label="Rain Chance"
          value={`${rainChance}%`}
          accent={rainChance >= 70 ? "#60a5fa" : rainChance >= 40 ? "#93c5fd" : "rgba(255,255,255,0.45)"}
        />
        <Stat
          icon={<Wind className="w-3.5 h-3.5" />}
          label="Wind"
          value={`${Math.round(weather.windSpeed)} km/h`}
          accent="#a78bfa"
        />
      </div>
    </motion.div>
  );
}
