import { motion } from "framer-motion";
import { HourlyPoint } from "../services/weatherService";

interface Props { hourly: HourlyPoint[] }

const COND_EMOJI: Record<string, string> = {
  Clear: "☀️", Clouds: "⛅", Rain: "🌧", Drizzle: "🌦",
  Thunderstorm: "⛈", Snow: "❄️", Mist: "🌫", Fog: "🌫",
  Haze: "🌫", Smoke: "🌫", Dust: "🌫", Sand: "🌫",
  Ash: "🌋", Squall: "💨", Tornado: "🌪",
};

function fmt(unix: number) {
  const d = new Date(unix * 1000);
  const h = d.getHours();
  if (h === 0) return "12\nAM";
  if (h === 12) return "12\nPM";
  return h > 12 ? `${h - 12}\nPM` : `${h}\nAM`;
}

function RainBar({ pop }: { pop: number }) {
  if (pop < 5) return null;
  return (
    <div className="w-full flex flex-col items-center gap-0.5 mt-1">
      <span className="text-[9px] text-blue-200/80">{pop}%</span>
      <div className="w-6 h-1 rounded-full bg-white/15 overflow-hidden">
        <div className="h-full rounded-full bg-blue-300/70" style={{ width: `${pop}%` }} />
      </div>
    </div>
  );
}

export default function HourlyStrip({ hourly }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.08 }}
      className="w-full rounded-2xl bg-black/25 backdrop-blur-xl border border-white/12 shadow-xl py-3 px-2 overflow-x-auto"
      style={{ scrollbarWidth: "none" }}
    >
      <p className="text-white/40 text-[10px] uppercase tracking-widest px-2 mb-2">Hourly · Temp vs Feels Like</p>
      <div className="flex gap-1 min-w-max">
        {hourly.map((h, i) => {
          const diff = h.temp - h.feelsLike;
          const emoji = COND_EMOJI[h.condition] ?? "🌤";
          const timeStr = fmt(h.time);
          const [timePart, ampm] = timeStr.split("\n");
          return (
            <motion.div
              key={h.time}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl min-w-[64px]"
              style={{
                background: i === 0 ? "rgba(255,255,255,0.14)" : "transparent",
                border: i === 0 ? "1px solid rgba(255,255,255,0.18)" : "1px solid transparent",
              }}
            >
              {/* Time */}
              <div className="text-center leading-none">
                <span className="text-white/70 text-xs font-semibold">{timePart}</span>
                <span className="block text-white/40 text-[9px]">{ampm}</span>
              </div>

              {/* Icon */}
              <span className="text-xl leading-none">{emoji}</span>

              {/* Temp */}
              <span className="text-white font-bold text-sm leading-none">{Math.round(h.temp)}°</span>

              {/* Feels like */}
              <div className="flex items-center gap-0.5">
                <span className="text-white/40 text-[9px]">Feels</span>
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: diff > 3 ? "#fca5a5" : diff < -3 ? "#93c5fd" : "rgba(255,255,255,0.65)" }}
                >
                  {Math.round(h.feelsLike)}°
                </span>
              </div>

              {/* Rain bar */}
              <RainBar pop={Math.round(h.pop)} />
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
