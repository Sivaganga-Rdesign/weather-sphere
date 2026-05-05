import { motion } from "framer-motion";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, BarChart, Bar, Legend,
} from "recharts";
import { HourlyPoint, ForecastDay } from "../services/weatherService";
import { Thermometer, BarChart2 } from "lucide-react";
import { useState } from "react";

interface Props {
  hourly: HourlyPoint[];
  forecast: ForecastDay[];
}

function formatHour(unix: number) {
  return new Date(unix * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function formatDay(unix: number, i: number) {
  if (i === 0) return "Today";
  return new Date(unix * 1000).toLocaleDateString([], { weekday: "short" });
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-black/60 backdrop-blur-md border border-white/10 px-3 py-2 text-xs text-white">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{p.value}{p.unit ?? ""}</span>
        </p>
      ))}
    </div>
  );
};

export default function HourlyChart({ hourly, forecast }: Props) {
  const [tab, setTab] = useState<"hourly" | "forecast">("hourly");

  const hourlyData = hourly.map(h => ({
    time: formatHour(h.time),
    Temp: h.temp,
    "Feels Like": h.feelsLike,
    Humidity: h.humidity,
    Rain: h.pop,
  }));

  const forecastData = forecast.map((d, i) => ({
    day: formatDay(d.date, i),
    High: d.tempMax,
    Low: d.tempMin,
    Humidity: d.humidity,
    Rain: d.pop,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="w-full rounded-3xl bg-white/10 backdrop-blur-xl border border-white/15 p-5 shadow-2xl"
    >
      {/* Tab bar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1 p-1 rounded-xl bg-white/8 border border-white/10">
          {(["hourly", "forecast"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                tab === t
                  ? "bg-white/20 text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {t === "hourly" ? "24h Temperature" : "5-Day Forecast"}
            </button>
          ))}
        </div>
        {tab === "hourly"
          ? <Thermometer className="w-4 h-4 text-white/30" />
          : <BarChart2 className="w-4 h-4 text-white/30" />
        }
      </div>

      {tab === "hourly" && (
        <div>
          <p className="text-white/40 text-xs mb-3">Temperature & Humidity next 24h</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={hourlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="feelsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="time" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} axisLine={false} tickLine={false} unit="°" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Temp" stroke="#f97316" strokeWidth={2} fill="url(#tempGrad)" dot={false} unit="°C" />
              <Area type="monotone" dataKey="Feels Like" stroke="#60a5fa" strokeWidth={1.5} strokeDasharray="4 2" fill="url(#feelsGrad)" dot={false} unit="°C" />
            </AreaChart>
          </ResponsiveContainer>

          <p className="text-white/40 text-xs mb-3 mt-4">Rain probability %</p>
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={hourlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#93c5fd" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Rain" stroke="#93c5fd" strokeWidth={1.5} fill="url(#rainGrad)" dot={false} unit="%" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === "forecast" && (
        <div>
          <p className="text-white/40 text-xs mb-3">High / Low temperatures</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={forecastData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} axisLine={false} tickLine={false} unit="°" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", paddingTop: "8px" }} />
              <Bar dataKey="High" fill="#f97316" radius={[4, 4, 0, 0]} unit="°C" />
              <Bar dataKey="Low" fill="#60a5fa" radius={[4, 4, 0, 0]} unit="°C" />
            </BarChart>
          </ResponsiveContainer>

          <p className="text-white/40 text-xs mb-3 mt-4">Rain probability % per day</p>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={forecastData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Rain" fill="#93c5fd" radius={[4, 4, 0, 0]} unit="%" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
