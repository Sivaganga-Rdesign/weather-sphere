import { motion } from "framer-motion";
import { Gauge, Eye, Cloud, Navigation, Droplets, Thermometer, Wind, Activity } from "lucide-react";
import { WeatherData, WeatherCondition, AirQuality } from "../services/weatherService";

interface Props {
  weather: WeatherData;
  condition: WeatherCondition;
  airQuality: AirQuality | null;
}

function getWindDirection(deg: number) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

function getDewPoint(temp: number, humidity: number) {
  const a = 17.27, b = 237.7;
  const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100);
  return Math.round((b * alpha) / (a - alpha));
}

function getConditionLabel(condition: WeatherCondition, temp: number, isDay: boolean): string {
  if (!isDay) {
    if (condition === "clear") return "🌙 Clear Night";
    if (condition === "clouds") return "☁️ Cloudy Night";
    if (condition === "rain") return "🌧 Rainy Night";
    if (condition === "snow") return "❄️ Snowy Night";
  }
  if (condition === "clear" && temp >= 35) return "🔥 Extreme Heat";
  if (condition === "clear" && temp >= 28) return "☀️ Very Hot";
  if (condition === "clear" && temp >= 20) return "🌤 Warm & Sunny";
  if (condition === "clear") return "🧊 Clear & Cool";
  if (condition === "thunderstorm") return "⚡ Thunderstorm";
  if (condition === "rain") return "🌧 Rainy";
  if (condition === "snow") return "❄️ Snowing";
  if (condition === "clouds") return "☁️ Overcast";
  if (condition === "mist") return "🌫 Misty";
  return "🌍 Partly Cloudy";
}

const AQI_COLORS: Record<number, { bg: string; text: string; bar: string }> = {
  1: { bg: "rgba(34,197,94,0.15)",  text: "#4ade80", bar: "#22c55e" },
  2: { bg: "rgba(234,179,8,0.15)",  text: "#facc15", bar: "#eab308" },
  3: { bg: "rgba(249,115,22,0.15)", text: "#fb923c", bar: "#f97316" },
  4: { bg: "rgba(239,68,68,0.15)",  text: "#f87171", bar: "#ef4444" },
  5: { bg: "rgba(168,85,247,0.15)", text: "#c084fc", bar: "#a855f7" },
};

function AQICard({ aqi }: { aqi: AirQuality }) {
  const colors = AQI_COLORS[aqi.aqi] ?? AQI_COLORS[3];
  return (
    <div className="p-4 rounded-2xl bg-white/8 border border-white/10 col-span-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2" style={{ color: "rgba(255,255,255,0.4)" }}>
          <Activity className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wider">Air Quality Index</span>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: colors.bg, color: colors.text }}>
          AQI {aqi.aqi} · {aqi.label}
        </span>
      </div>
      {/* AQI bar */}
      <div className="w-full h-2 rounded-full bg-white/10 mb-3 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(aqi.aqi / 5) * 100}%` }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: colors.bar }}
        />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[
          { k: "PM2.5", v: aqi.pm2_5, unit: "μg/m³" },
          { k: "PM10",  v: aqi.pm10,  unit: "μg/m³" },
          { k: "O₃",   v: aqi.o3,    unit: "μg/m³" },
          { k: "NO₂",  v: aqi.no2,   unit: "μg/m³" },
        ].map(({ k, v, unit }) => (
          <div key={k} className="text-center">
            <p className="text-white/35 text-xs">{k}</p>
            <p className="text-white text-xs font-semibold">{v}</p>
            <p className="text-white/20 text-[10px]">{unit}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="flex flex-col gap-1.5 p-4 rounded-2xl bg-white/8 border border-white/10 backdrop-blur-sm hover:bg-white/12 transition-colors"
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
  const color = value < 30 ? "#f97316" : value < 60 ? "#60a5fa" : "#a78bfa";
  return (
    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ background: `linear-gradient(to right, ${color}, ${color}aa)` }}
      />
    </div>
  );
}

export default function WeatherDetails({ weather, condition, airQuality }: Props) {
  const dewPoint = getDewPoint(weather.temp, weather.humidity);
  const condLabel = getConditionLabel(condition, weather.temp, weather.isDay);
  const windDir = getWindDirection(weather.windDeg);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="w-full rounded-3xl bg-white/10 backdrop-blur-xl border border-white/15 p-5 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white/60 text-xs font-semibold uppercase tracking-widest">Atmosphere</h2>
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

      {/* AQI card */}
      {airQuality && (
        <div className="mb-3">
          <AQICard aqi={airQuality} />
        </div>
      )}

      {/* Detail grid */}
      <div className="grid grid-cols-2 gap-3">
        <DetailCard
          icon={<Gauge className="w-4 h-4" />}
          label="Pressure"
          value={`${weather.pressure} hPa`}
          sub={weather.pressure > 1020 ? "High — stable" : weather.pressure < 1000 ? "Low — unstable" : "Normal"}
        />
        <DetailCard
          icon={<Eye className="w-4 h-4" />}
          label="Visibility"
          value={`${weather.visibility} km`}
          sub={weather.visibility >= 10 ? "Excellent" : weather.visibility >= 5 ? "Good" : weather.visibility >= 2 ? "Moderate" : "Poor"}
        />
        <DetailCard
          icon={<Navigation className="w-4 h-4" />}
          label="Wind Dir."
          value={windDir}
          sub={`${weather.windDeg}° · Gust ${Math.round(weather.windGust)} km/h`}
        />
        <DetailCard
          icon={<Cloud className="w-4 h-4" />}
          label="Cloud Cover"
          value={`${weather.clouds}%`}
          sub={weather.clouds < 20 ? "Clear sky" : weather.clouds < 50 ? "Partly cloudy" : weather.clouds < 80 ? "Mostly cloudy" : "Overcast"}
        />
        <DetailCard
          icon={<Thermometer className="w-4 h-4" />}
          label="Dew Point"
          value={`${dewPoint}°C`}
          sub={dewPoint > 24 ? "Very muggy" : dewPoint > 18 ? "Muggy" : dewPoint > 13 ? "Comfortable" : dewPoint > 5 ? "Dry" : "Very dry"}
        />
        <DetailCard
          icon={<Wind className="w-4 h-4" />}
          label="Wind Speed"
          value={`${Math.round(weather.windSpeed)} km/h`}
          sub={weather.windSpeed < 20 ? "Light breeze" : weather.windSpeed < 40 ? "Moderate wind" : weather.windSpeed < 60 ? "Fresh wind" : "Strong wind"}
        />
      </div>
    </motion.div>
  );
}
