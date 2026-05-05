import { motion } from "framer-motion";
import { ForecastDay } from "../services/weatherService";
import { Droplets, Wind } from "lucide-react";

interface Props {
  forecast: ForecastDay[];
}

function getDayName(unix: number, i: number) {
  if (i === 0) return "Today";
  return new Date(unix * 1000).toLocaleDateString([], { weekday: "short" });
}

export default function Forecast({ forecast }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full rounded-3xl bg-white/10 backdrop-blur-xl border border-white/15 p-6 shadow-2xl"
    >
      <h2 className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-4">
        5-Day Forecast
      </h2>
      <div className="space-y-2">
        {forecast.map((day, i) => (
          <motion.div
            key={day.date}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * i + 0.3 }}
            whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            className="flex items-center gap-4 p-3 rounded-2xl transition-colors cursor-default"
          >
            {/* Day */}
            <span className="w-12 text-sm font-semibold text-white/70">
              {getDayName(day.date, i)}
            </span>

            {/* Icon */}
            <img
              src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
              alt={day.description}
              className="w-10 h-10 drop-shadow"
            />

            {/* Condition */}
            <span className="flex-1 text-sm text-white/50 capitalize hidden sm:block">
              {day.description}
            </span>

            {/* Stats */}
            <div className="flex items-center gap-3 text-xs text-white/40">
              <span className="flex items-center gap-1">
                <Droplets className="w-3 h-3" />
                {day.humidity}%
              </span>
              <span className="flex items-center gap-1">
                <Wind className="w-3 h-3" />
                {day.windSpeed}
              </span>
            </div>

            {/* Temps */}
            <div className="flex items-center gap-2 text-sm font-semibold ml-2">
              <span className="text-white">{day.tempMax}°</span>
              <span className="text-white/35">{day.tempMin}°</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
