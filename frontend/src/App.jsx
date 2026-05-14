import { useState, useEffect } from "react"
import axios from "axios"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts"
import {
  Droplets, Thermometer, Wind, CloudRain,
  Power, PowerOff, Activity
} from "lucide-react"

const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

function GaugeMeter({ value, max = 100, color, label, unit = "%" }) {
  const pct  = Math.min(100, Math.max(0, (value / max) * 100))
  const r    = 52, cx = 60, cy = 65
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ * 0.75
  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="110" viewBox="0 0 120 110">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb"
          strokeWidth="10"
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
          strokeDashoffset={circ * 0.125}
          strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color}
          strokeWidth="10"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ * 0.125}
          strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray 0.6s ease" }} />
        <text x={cx} y={cy + 2} textAnchor="middle"
          fontSize="18" fontWeight="bold" fill="#1f2937">
          {Math.round(value)}{unit}
        </text>
        <text x={cx} y={cy + 18} textAnchor="middle"
          fontSize="10" fill="#6b7280">{label}</text>
      </svg>
    </div>
  )
}

function StatCard({ icon: Icon, iconColor, label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={iconColor} size={20} />
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <div className="text-3xl font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-400 mt-1">{sub}</div>
    </div>
  )
}

export default function App() {
  const [latest,      setLatest]      = useState(null)
  const [history,     setHistory]     = useState([])
  const [weather,     setWeather]     = useState(null)
  const [pumpLogs,    setPumpLogs]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchData = async () => {
    try {
      const [l, h, w, p] = await Promise.all([
        axios.get(`${API}/latest`),
        axios.get(`${API}/history?limit=40`),
        axios.get(`${API}/weather`),
        axios.get(`${API}/pump-logs`),
      ])
      setLatest(l.data)
      setHistory([...h.data].reverse())
      setWeather(w.data)
      setPumpLogs(p.data)
      setLastUpdated(new Date().toLocaleTimeString())
      setLoading(false)
    } catch (e) {
      console.error("Fetch error:", e)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const handlePump = async (action) => {
    await axios.post(`${API}/pump/${action}`)
    fetchData()
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50
                    flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce">🌱</div>
        <div className="text-gray-500 font-medium">Loading SmartIrrigate...</div>
        <div className="text-gray-400 text-sm mt-1">Connecting to sensors</div>
      </div>
    </div>
  )

  const moisture     = latest?.["Soil Moisture"]        || 0
  const temperature  = latest?.["Temperature"]           || 0
  const soilHumidity = latest?.[" Soil Humidity"]        || 0
  const airHumidity  = latest?.["Air humidity (%)"]      || 0
  const airTemp      = latest?.["Air temperature (C)"]   || 0
  const windSpeed    = latest?.["Wind speed (Km/h)"]     || 0
  const ph           = latest?.["ph"]                    || 0
  const rainfall     = latest?.["rainfall"]              || 0
  const pumpOn       = latest?.pump_on                   || false
  const prediction   = latest?.prediction                || "WAIT"
  const confidence   = latest?.confidence                || 0
  const rainProb     = latest?.rain_probability          || 0

  const moistureColor = moisture < 20 ? "#ef4444"
                      : moisture < 40 ? "#f59e0b"
                      : "#22c55e"

  const predColor = prediction === "WATER"
    ? "text-blue-600" : "text-green-600"

  return (
    <div className="min-h-screen bg-gradient-to-br
                    from-green-50 via-blue-50 to-teal-50 p-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600
                        rounded-2xl p-6 mb-6 text-white shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold">SmartIrrigate</h1>
              <p className="text-green-100 text-sm mt-1">
                AI-powered soil monitoring · Random Forest · FastAPI · React
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full
                  ${pumpOn
                    ? "bg-blue-300 animate-pulse"
                    : "bg-green-300"}`} />
                <span className="text-sm font-medium">
                  {pumpOn ? "Pump Active" : "System Online"}
                </span>
              </div>
              {lastUpdated && (
                <span className="text-xs text-green-200">
                  Updated {lastUpdated}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Top stat row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

          {/* Moisture gauge */}
          <div className="bg-white rounded-2xl p-4 shadow-sm
                          border border-gray-100 flex flex-col items-center">
            <GaugeMeter value={moisture} color={moistureColor} label="Moisture" />
            <div className="text-xs text-gray-500 mt-1 font-medium">
              Soil Moisture
            </div>
            <div className={`text-xs font-bold mt-1
              ${moisture < 20 ? "text-red-500"
              : moisture < 40 ? "text-yellow-500"
              : "text-green-500"}`}>
              {moisture < 20 ? "Critical"
               : moisture < 40 ? "Low" : "Good"}
            </div>
          </div>

          <StatCard
            icon={Thermometer} iconColor="text-orange-500"
            label="Temperature"
            value={`${temperature.toFixed(1)}°C`}
            sub={`Air: ${airTemp.toFixed(1)}°C`} />

          <StatCard
            icon={Wind} iconColor="text-blue-500"
            label="Air Humidity"
            value={`${airHumidity.toFixed(1)}%`}
            sub={`Wind: ${windSpeed.toFixed(1)} km/h`} />

          {/* ML Decision */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="text-purple-500" size={20} />
              <span className="text-sm font-medium text-gray-600">
                ML Decision
              </span>
            </div>
            <div className={`text-2xl font-bold ${predColor}`}>
              {prediction}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Confidence: {(confidence * 100).toFixed(0)}%
            </div>
            <div className="mt-2 bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full"
                style={{
                  width: `${confidence * 100}%`,
                  transition: "width 0.5s ease"
                }} />
            </div>
          </div>
        </div>

        {/* Pump + Weather */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

          {/* Pump Control */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-700 mb-4">Pump Control</h2>
            <div className={`rounded-xl p-4 mb-4 text-center
              ${pumpOn
                ? "bg-blue-50 border border-blue-200"
                : "bg-gray-50 border border-gray-200"}`}>
              <div className="text-4xl mb-2">
                {pumpOn ? "💧" : "⏸️"}
              </div>
              <div className={`font-bold text-lg
                ${pumpOn ? "text-blue-600" : "text-gray-500"}`}>
                Pump is {pumpOn ? "ON — Watering" : "OFF"}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Soil moisture: {moisture.toFixed(1)}%
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => handlePump("on")}
                className="flex-1 flex items-center justify-center gap-2
                           bg-blue-500 hover:bg-blue-600 text-white
                           py-3 rounded-xl font-medium transition">
                <Power size={16} /> Turn ON
              </button>
              <button onClick={() => handlePump("off")}
                className="flex-1 flex items-center justify-center gap-2
                           bg-gray-200 hover:bg-gray-300 text-gray-700
                           py-3 rounded-xl font-medium transition">
                <PowerOff size={16} /> Turn OFF
              </button>
            </div>

            {moisture < 20 && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200
                              rounded-xl text-red-600 text-sm font-medium">
                Critical — Soil moisture very low. Immediate watering needed.
              </div>
            )}
            {rainProb >= 70 && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200
                              rounded-xl text-blue-600 text-sm font-medium">
                Rain expected ({rainProb}%) — auto watering paused.
              </div>
            )}
          </div>

          {/* Weather */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-700 mb-4">
              Weather — {weather?.city}
            </h2>
            <div className="flex items-center gap-4 mb-4">
              {weather?.icon && (
                <img
                  src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                  alt="weather" className="w-16 h-16" />
              )}
              <div>
                <div className="text-3xl font-bold text-gray-800">
                  {weather?.temperature?.toFixed(1)}°C
                </div>
                <div className="text-gray-500 capitalize">
                  {weather?.description}
                </div>
                <div className="text-sm text-gray-400">
                  Humidity: {weather?.humidity}%
                </div>
              </div>
            </div>

            <div className={`rounded-xl p-3 flex items-center gap-3
              ${rainProb > 70
                ? "bg-blue-50 border border-blue-200"
                : "bg-green-50 border border-green-200"}`}>
              <CloudRain
                className={rainProb > 70 ? "text-blue-500" : "text-green-500"}
                size={20} />
              <div>
                <div className={`font-semibold text-sm
                  ${rainProb > 70 ? "text-blue-700" : "text-green-700"}`}>
                  {rainProb > 70
                    ? `Rain likely (${rainProb}%) — watering skipped`
                    : `Rain probability: ${rainProb}%`}
                </div>
                <div className="text-xs text-gray-400">Next 6 hours</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: "pH",      value: ph.toFixed(2) },
                { label: "Rainfall",value: `${rainfall.toFixed(0)}mm` },
                { label: "N/P/K",  value: `${latest?.N?.toFixed(0)}/${latest?.P?.toFixed(0)}/${latest?.K?.toFixed(0)}` },
              ].map(({ label, value }) => (
                <div key={label}
                  className="bg-gray-50 rounded-xl p-2 text-center">
                  <div className="text-xs text-gray-400">{label}</div>
                  <div className="font-bold text-gray-700 text-sm">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Moisture Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm
                        border border-gray-100 mb-6">
          <h2 className="font-semibold text-gray-700 mb-4">
            Moisture History
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="moistGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
              <XAxis dataKey="timestamp"
                tickFormatter={v => new Date(v).toLocaleTimeString([],
                  { hour: "2-digit", minute: "2-digit" })}
                tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                labelFormatter={v => new Date(v).toLocaleTimeString()}
                formatter={v => [`${v.toFixed(1)}%`, "Moisture"]} />
              <Area type="monotone" dataKey="moisture"
                stroke="#22c55e" strokeWidth={2}
                fill="url(#moistGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Temperature Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm
                        border border-gray-100 mb-6">
          <h2 className="font-semibold text-gray-700 mb-4">
            Temperature History
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fff7ed" />
              <XAxis dataKey="timestamp"
                tickFormatter={v => new Date(v).toLocaleTimeString([],
                  { hour: "2-digit", minute: "2-digit" })}
                tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                labelFormatter={v => new Date(v).toLocaleTimeString()}
                formatter={v => [`${v.toFixed(1)}°C`, "Temperature"]} />
              <Line type="monotone" dataKey="temperature"
                stroke="#f97316" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pump Logs */}
        <div className="bg-white rounded-2xl p-5 shadow-sm
                        border border-gray-100 mb-6">
          <h2 className="font-semibold text-gray-700 mb-4">
            Pump Activity Log
          </h2>
          {pumpLogs.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No pump activity yet
            </div>
          ) : (
            <div className="space-y-2">
              {pumpLogs.map((log, i) => (
                <div key={i}
                  className={`flex items-center justify-between p-3
                    rounded-xl text-sm
                    ${log.action === "ON"
                      ? "bg-blue-50 border border-blue-100"
                      : "bg-gray-50 border border-gray-100"}`}>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold
                      ${log.action === "ON"
                        ? "text-blue-600" : "text-gray-400"}`}>
                      {log.action === "ON" ? "ON" : "OFF"}
                    </span>
                    <span className="text-gray-600">{log.reason}</span>
                  </div>
                  <div className="text-gray-400 text-xs text-right">
                    <div>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                    <div>{log.moisture?.toFixed(1)}% moisture</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-gray-400 text-xs pb-6">
          SmartIrrigate · Random Forest ML · FastAPI · React ·
          OpenWeatherMap · Built by Rupayan
        </div>

      </div>
    </div>
  )
}