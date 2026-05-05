import { motion } from "framer-motion";
import { Gauge, Eye, Cloud, Navigation, Droplets, Thermometer } from "lucide-react";
import { WeatherData, WeatherCondition } from "../services/weatherService";

interface Props {
  weather: WeatherData;
  condition: WeatherCondition;
}

function getWindDirection(deg: number) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

function getHeatIndex(temp: number, humidity: number): string {
  if (temp >= 27 && humidity >= 40) {
    const hi = -8.78469475556 + 1.61139411 * temp + 2.33854883889 * humidity
      - 0.14611605 * temp * humidity - 0.012308094 * temp ** 2
      - 0.0164248277778 * humidity ** 2 + 0.002211732 * temp ** 2 * humidity
      + 0.00072546 * temp * humidity ** 2 - 0.000003582 * temp ** 2 * humidity ** 2;
    return `${Math.round(hi)}°C`;
  }
  return `${temp}°C`;
}

function getDewPoint(temp: number, humidity: number) {
  const a = 17.27, b = 237.7;
  const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100);
  return Math.round((b * alpha) / (a - alpha));
}

function getConditionLabel(condition: WeatherCondition, temp: number): string {
  if (condition === "clear" && temp >= 35) return "🔥 Extreme Heat";
  if (condition === "clear" && temp >= 28) return "☀️ Very Hot";
  if (condition === "clear" && temp >= 20) return "🌤 Warm & Sunny";
  if (condition === "clear") return "❄️ Clear & Cool";
  if (condition === "thunderstorm") return "⚡ Thunderstorm";
  if (condition === "rain") return "🌧 Rainy";
  if (condition === "snow") return "❄️ Snowing";
  if (condition === "clouds") return "☁️ Overcast";
  if (condition === "mist") return "🌫 Misty";
  return "🌍 Partly Cloudy";
}

function DetailCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.1)" }}
      className="flex flex-col gap-1.5 p-4 rounded-2xl bg-white/8 border border-white/10 backdrop-blur-sm transition-colors"
    >
      <div className="flex items-center gap-2 text-white/40">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-white font-semibold text-base">{value}</span>
      {sub && <span className="text-white/35 text-xs">{sub}</span>}
    </motion.div>
  );
}

function HumidityBar({ value }: { value: number }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ background: `linear-gradient(to right, #60a5fa, ${value > 70 ? "#a78bfa" : "#38bdf8"})` }}
      />
    </div>
  );
}

export default function WeatherDetails({ weather, condition }: Props) {
  const dewPoint = getDewPoint(weather.temp, weather.humidity);
  const heatIndex = getHeatIndex(weather.temp, weather.humidity);
  const condLabel = getConditionLabel(condition, weather.temp);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="w-full rounded-3xl bg-white/10 backdrop-blur-xl border border-white/15 p-5 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white/60 text-xs font-semibold uppercase tracking-widest">Conditions</h2>
        <span className="text-sm text-white/70 font-medium">{condLabel}</span>
      </div>

      {/* Humidity bar */}
      <div className="mb-4 p-4 rounded-2xl bg-white/8 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-white/40">
            <Droplets className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Humidity</span>
          </div>
          <span className="text-white font-semibold">{weather.humidity}%</span>
        </div>
        <HumidityBar value={weather.humidity} />
        <p className="text-white/30 text-xs mt-1.5">
          {weather.humidity < 30 ? "Very dry" : weather.humidity < 50 ? "Comfortable" : weather.humidity < 70 ? "Humid" : "Very humid"} · Dew point {dewPoint}°C
        </p>
      </div>

      {/* Detail grid */}
      <div className="grid grid-cols-2 gap-3">
        <DetailCard
          icon={<Gauge className="w-4 h-4" />}
          label="Pressure"
          value={`${weather.pressure} hPa`}
          sub={weather.pressure > 1013 ? "High pressure" : weather.pressure < 1000 ? "Low pressure" : "Normal"}
        />
        <DetailCard
          icon={<Eye className="w-4 h-4" />}
          label="Visibility"
          value={`${weather.visibility} km`}
          sub={weather.visibility >= 10 ? "Excellent" : weather.visibility >= 5 ? "Good" : "Poor"}
        />
        <DetailCard
          icon={<Navigation className="w-4 h-4" />}
          label="Wind Dir."
          value={getWindDirection(weather.windDeg)}
          sub={`${weather.windDeg}°`}
        />
        <DetailCard
          icon={<Cloud className="w-4 h-4" />}
          label="Cloud Cover"
          value={`${weather.clouds}%`}
          sub={weather.clouds < 20 ? "Clear" : weather.clouds < 50 ? "Partly cloudy" : "Overcast"}
        />
        <DetailCard
          icon={<Thermometer className="w-4 h-4" />}
          label="Heat Index"
          value={heatIndex}
          sub="Apparent temperature"
        />
        <DetailCard
          icon={<Droplets className="w-4 h-4" />}
          label="Dew Point"
          value={`${dewPoint}°C`}
          sub={dewPoint > 20 ? "Muggy" : dewPoint > 13 ? "Comfortable" : "Dry"}
        />
      </div>
    </motion.div>
  );
}
