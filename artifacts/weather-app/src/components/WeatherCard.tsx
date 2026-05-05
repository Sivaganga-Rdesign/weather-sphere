import { motion } from "framer-motion";
import { Droplets, Wind, Thermometer, Eye, Sunrise, Sunset } from "lucide-react";
import { WeatherData } from "../services/weatherService";

interface Props {
  weather: WeatherData;
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.12)" }}
      className="flex flex-col gap-2 p-4 rounded-2xl bg-white/8 border border-white/10 backdrop-blur-sm transition-colors"
    >
      <div className="flex items-center gap-2 text-white/50">
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

export default function WeatherCard({ weather }: Props) {
  const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full rounded-3xl bg-white/10 backdrop-blur-xl border border-white/15 p-6 md:p-8 shadow-2xl"
    >
      {/* Location */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-white"
          >
            {weather.city}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/50 text-sm mt-1"
          >
            {weather.country} · {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
          </motion.p>
        </div>
        <motion.img
          src={iconUrl}
          alt={weather.description}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-16 h-16 md:w-20 md:h-20 drop-shadow-lg"
        />
      </div>

      {/* Main temp */}
      <div className="mb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 120 }}
          className="flex items-end gap-3"
        >
          <span className="text-7xl md:text-8xl font-thin text-white tracking-tighter">
            {weather.temp}°
          </span>
          <span className="text-2xl text-white/60 mb-4">C</span>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-white/60 capitalize text-lg"
        >
          {weather.description}
        </motion.p>
      </div>

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <StatCard
          icon={<Thermometer className="w-4 h-4" />}
          label="Feels Like"
          value={`${weather.feelsLike}°C`}
        />
        <StatCard
          icon={<Droplets className="w-4 h-4" />}
          label="Humidity"
          value={`${weather.humidity}%`}
        />
        <StatCard
          icon={<Wind className="w-4 h-4" />}
          label="Wind"
          value={`${weather.windSpeed} km/h`}
        />
        <StatCard
          icon={<Eye className="w-4 h-4" />}
          label="Condition"
          value={weather.condition}
        />
      </motion.div>

      {/* Sunrise/Sunset */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex gap-4 mt-3"
      >
        <div className="flex-1 flex items-center gap-2 p-3 rounded-2xl bg-white/8 border border-white/10">
          <Sunrise className="w-4 h-4 text-amber-300" />
          <div>
            <p className="text-white/40 text-xs">Sunrise</p>
            <p className="text-white text-sm font-medium">{formatTime(weather.sunrise)}</p>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-2 p-3 rounded-2xl bg-white/8 border border-white/10">
          <Sunset className="w-4 h-4 text-orange-300" />
          <div>
            <p className="text-white/40 text-xs">Sunset</p>
            <p className="text-white text-sm font-medium">{formatTime(weather.sunset)}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
