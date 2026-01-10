import { useState, useEffect } from 'react';
import { AlertCircle, Loader2, MapPin, Droplets, Thermometer, Wind, CloudRain } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import {
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';


const AgriSimDashboard = () => {
  const [location, setLocation] = useState({ lat: null, lon: null });
  const [crops, setCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [terrainType, setTerrainType] = useState('plain');
  const [weatherData, setWeatherData] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiEndpoint, setApiEndpoint] = useState('http://127.0.0.1:5000');
  const [simulationHistory, setSimulationHistory] = useState([]);
  const [previousSimulation, setPreviousSimulation] = useState(null);

  



  // Fetch location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (err) => {
          setError('Location access denied. Please enter coordinates manually.');
        }
      );
    }
  }, []);

  // Fetch crops from Supabase
  const fetchCrops = async () => {
    try {
      const response = await fetch(`${apiEndpoint}/api/crops`);
      const data = await response.json();
      setCrops(data);
    } catch (err) {
      setError('Failed to load crop data');
    }
  };

  // Fetch weather data
  const fetchWeather = async () => {
    if (!location.lat || !location.lon) return;
    
    try {
      const response = await fetch(
        `${apiEndpoint}/api/weather?lat=${location.lat}&lon=${location.lon}`
      );
      const data = await response.json();
      setWeatherData(data);
    } catch (err) {
      setError('Failed to fetch weather data');
    }
  };

  // Run simulation
const runSimulation = async () => {
  if (!selectedCrop || !location.lat || !location.lon) {
    setError('Please select a crop and ensure location is available');
    return;
  }

  setLoading(true);
  setError(null);
  setSimulationResult(null);

  try {
    const response = await fetch(`${apiEndpoint}/api/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        crop: selectedCrop,
        location: location,
        terrain: terrainType,
        weather: weatherData
      })
    });

    const data = await response.json();

    // ✅ THIS LINE PREVENTS WHITE SCREEN
    if (!response.ok) {
      setError(data.error || data.message || 'Simulation failed');
      return;
    }

    setPreviousSimulation(simulationResult);
    setSimulationResult(data);

    setSimulationHistory(prev => [
  {
      crop: selectedCrop,
      terrain: terrainType,
      location: `${location.lat.toFixed(2)}, ${location.lon.toFixed(2)}`,
      success: data.success_probability,
      yield: data.expected_yield,
      risk: data.risk_level,
      timestamp: new Date().toLocaleTimeString()
    },
    ...prev.slice(0, 4)
  ]);


  } catch (err) {
    setError('Simulation failed: ' + err.message);
  } finally {
    setLoading(false);
  }
};


  const getRiskColor = (risk) => {
    const colors = {
      'Low': 'bg-green-100 text-green-800 border-green-300',
      'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'High': 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[risk] || 'bg-gray-100 text-gray-800 border-gray-300';
  };


    // Yield chart data (SAFE scope)
      const yieldChartData = simulationResult?.yield_range
        ? [
            { name: 'Worst', value: simulationResult.yield_range.min },
            { name: 'Average', value: simulationResult.yield_range.avg },
            { name: 'Best', value: simulationResult.yield_range.max }
          ]
        : [];
      // Risk contribution breakdown (derived insight)
        const riskBreakdownData = simulationResult
          ? (() => {
              const yieldRange =
                simulationResult.yield_range.max -
                simulationResult.yield_range.min;

              const riskPenalty =
                simulationResult.risk_level === 'High'
                  ? 30
                  : simulationResult.risk_level === 'Medium'
                  ? 20
                  : 10;

              const weatherStress =
                weatherData?.humidity > 70 || weatherData?.rainfall > 1200
                  ? 30
                  : 15;

              const stabilityFactor =
                Math.max(
                  100 - simulationResult.success_probability * 100,
                  5
                );

              return [
                { name: 'Weather Stress', value: weatherStress },
                { name: 'Yield Variability', value: Math.round(yieldRange / 50) },
                { name: 'Risk Penalty', value: riskPenalty },
                { name: 'System Instability', value: Math.round(stabilityFactor) }
              ];
            })()
          : [];



      // Agricultural Confidence Index (ACI)
    const calculateACI = () => {
      if (!simulationResult) return null;

      const riskPenaltyMap = {
        Low: 0.05,
        Medium: 0.15,
        High: 0.3
      };

      const penalty = riskPenaltyMap[simulationResult.risk_level] ?? 0.2;

      return Math.round(
        simulationResult.success_probability * 100 * (1 - penalty)
      );
    };


  return (
    <div className="relative min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-6 transition-opacity duration-700 opacity-100">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-green-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-white/40 p-6 mb-6
                transform transition-all duration-700 ease-out hover:scale-[1.01]">

          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Agricultural Simulation Planning System
          </h1>
          <p className="text-gray-600">
            Monte Carlo-based crop success probability analysis with risk assessment
          </p>
        </div>

        {/* API Configuration */}
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-white/40 p-6 mb-6
                transform transition-all duration-700 ease-out hover:scale-[1.01]">
          <h2 className="text-xl font-semibold mb-4">API Configuration</h2>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Enter Flask API endpoint (e.g., http://localhost:5000)"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
            <button
              onClick={fetchCrops}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Connect
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Location Card */}
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-white/40 p-6 mb-6
                transform transition-all duration-700 ease-out hover:scale-[1.01]">

            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-blue-600" />
              Location Data
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={location.lat || ''}
                  onChange={(e) => setLocation({...location, lat: parseFloat(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={location.lon || ''}
                  onChange={(e) => setLocation({...location, lon: parseFloat(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <button
                onClick={fetchWeather}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Fetch Weather Data
              </button>
            </div>
          </div>

          {/* Crop Selection Card */}
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-white/40 p-6 mb-6
                transform transition-all duration-700 ease-out hover:scale-[1.01]">

            <h2 className="text-xl font-semibold mb-4">Crop & Terrain</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Crop
                </label>
                <select
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Choose a crop...</option>
                  {Array.isArray(crops) && crops.map((crop) => (
                    <option key={crop.id} value={crop.name}>
                      {crop.name} ({crop.category})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Terrain Type
                </label>
                <select
                  value={terrainType}
                  onChange={(e) => setTerrainType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="plain">Plain</option>
                  <option value="plateau">Plateau</option>
                  <option value="mountain">Mountain</option>
                  <option value="valley">Valley</option>
                  <option value="coastal">Coastal</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Weather Display */}
        {weatherData && (
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-white/40 p-6 mb-6
                transform transition-all duration-700 ease-out hover:scale-[1.01]">

            <h2 className="text-xl font-semibold mb-4">Current Environmental Conditions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
                <Thermometer className="text-orange-600" size={24} />
                <div>
                  <p className="text-sm text-gray-600">Temperature</p>
                  <p className="text-lg font-semibold">{weatherData.temp}°C</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <Droplets className="text-blue-600" size={24} />
                <div>
                  <p className="text-sm text-gray-600">Humidity</p>
                  <p className="text-lg font-semibold">{weatherData.humidity}%</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-cyan-50 rounded-lg">
                <CloudRain className="text-cyan-600" size={24} />
                <div>
                  <p className="text-sm text-gray-600">Rainfall</p>
                  <p className="text-lg font-semibold">{weatherData.rainfall} mm</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Wind className="text-gray-600" size={24} />
                <div>
                  <p className="text-sm text-gray-600">Wind Speed</p>
                  <p className="text-lg font-semibold">{weatherData.wind} km/h</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Run Simulation Button */}
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-white/40 p-6 mb-6">
          <button
            onClick={runSimulation}
            disabled={loading || !selectedCrop}
            className="w-full px-6 py-4 bg-green-600 text-white rounded-lg
           transition-all duration-300 ease-out
           hover:bg-green-700 hover:shadow-xl hover:-translate-y-0.5
           active:scale-95
           disabled:bg-gray-400 disabled:cursor-not-allowed
           flex items-center justify-center gap-2 text-lg font-semibold"

          >
            {loading ? (
              <>
                <Loader2 className="animate-spin text-white drop-shadow-md" size={24} />
                Running 10,000 Monte Carlo Simulations...
              </>
            ) : (
              'Run Crop Simulation'
            )}
          </button>
        </div>

                  {/* Simulation Status Banner */}
          {loading && (
            <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-800">
              ⏳ Running Monte Carlo Simulation…
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
              ❌ Simulation failed. Please check inputs or try again.
            </div>
          )}

          {simulationResult && !loading && !error && (
            <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800">
              ✅ Simulation completed successfully.
            </div>
          )}

        {/* Results Display */}
        {simulationResult?.expected_yield !== undefined && (
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-white/40 p-6 mb-6
                transform transition-all duration-700 ease-out hover:scale-[1.01]">
                  
            {/* Simulation Summary */}
            <div className="mb-6 p-4 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-lg shadow">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm opacity-80">Crop</p>
                  <p className="text-lg font-semibold">{selectedCrop}</p>
                </div>  
                <div>
                  <p className="text-sm opacity-80">Terrain</p>
                  <p className="text-lg font-semibold capitalize">{terrainType}</p>
                </div>
                <div>
                  <p className="text-sm opacity-80">Temperature</p>
                  <p className="text-lg font-semibold">{weatherData?.temp}°C</p>
                </div>
                <div>
                  <p className="text-sm opacity-80">Rainfall</p>
                  <p className="text-lg font-semibold">{weatherData?.rainfall} mm</p>
                </div>
              </div>
            </div>
            
                        {simulationHistory.length > 0 && (
              <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-white/40 p-6 mb-6
                transform transition-all duration-700 ease-out hover:scale-[1.01]">

                <h3 className="text-xl font-semibold mb-4">
                  📊 Recent Simulation History
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 border">Time</th>
                        <th className="p-2 border">Crop</th>
                        <th className="p-2 border">Terrain</th>
                        <th className="p-2 border">Location</th>
                        <th className="p-2 border">Success %</th>
                        <th className="p-2 border">Yield</th>
                        <th className="p-2 border">Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simulationHistory.map((item, index) => (
                        <tr key={index} className="text-center">
                          <td className="p-2 border">{item.timestamp}</td>
                          <td className="p-2 border">{item.crop}</td>
                          <td className="p-2 border capitalize">{item.terrain}</td>
                          <td className="p-2 border">{item.location}</td>
                          <td className="p-2 border">
                            {(item.success * 100).toFixed(1)}%
                          </td>
                          <td className="p-2 border">
                            {item.yield.toFixed(0)}
                          </td>
                          <td className="p-2 border font-semibold">
                            {item.risk}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}


            <h2 className="text-2xl font-bold mb-6">Simulation Results</h2>
            {previousSimulation && (
            <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-slate-100 to-slate-200 border border-gray-300">
              <h3 className="text-xl font-semibold mb-4">
                🔍 Scenario Comparison (Previous vs Current)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                {/* Success Probability */}
                <div className="p-4 rounded-lg bg-white shadow">
                  <p className="text-sm text-gray-600">Success Probability</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {(previousSimulation.success_probability * 100).toFixed(1)}%
                    {" → "}
                    {(simulationResult.success_probability * 100).toFixed(1)}%
                  </p>
                </div>

                {/* Expected Yield */}
                <div className="p-4 rounded-lg bg-white shadow">
                  <p className="text-sm text-gray-600">Expected Yield</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {previousSimulation.expected_yield.toFixed(0)} kg/ha
                    {" → "}
                    {simulationResult.expected_yield.toFixed(0)} kg/ha
                  </p>
                </div>

                {/* Risk Level */}
                <div className="p-4 rounded-lg bg-white shadow">
                  <p className="text-sm text-gray-600">Risk Level</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {previousSimulation.risk_level}
                    {" → "}
                    {simulationResult.risk_level}
                  </p>
                </div>
              </div>
            </div>
          )}

            {/* Agricultural Confidence Index */}
            <div className="mb-6 p-6 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
              <h3 className="text-lg font-semibold mb-2">
                Agricultural Confidence Index (ACI)
              </h3>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <p className="text-5xl font-bold">
                  {calculateACI()}%
                </p>

                <p className="text-sm opacity-90 max-w-xl">
                  A composite confidence score derived from Monte Carlo success probability
                  and environmental risk penalties. Higher values indicate safer and more
                  reliable crop planning decisions.
                </p>
              </div>
            </div>

            {/* Decision Summary */}
            <div className="mb-6 p-6 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 text-white shadow-lg">
              <h3 className="text-xl font-semibold mb-2">Decision Summary</h3>
              <p className="text-lg">
                {simulationResult.success_probability >= 0.8
                  ? "This crop is highly suitable for the selected location with strong yield reliability."
                  : simulationResult.success_probability >= 0.5
                  ? "This crop shows moderate suitability and may require careful management."
                  : "This crop is not recommended due to high environmental risk."}
              </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-200">
                <p className="text-sm text-gray-600 mb-2">Success Probability</p>
                <p className="text-4xl font-bold text-green-700">
                  {(simulationResult.success_probability * 100).toFixed(1)}%
                </p>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200">
                <p className="text-sm text-gray-600 mb-2">Expected Yield</p>
                <p className="text-4xl font-bold text-blue-700">
                  {simulationResult.expected_yield.toFixed(0)}
                </p>
                <p className="text-xs text-gray-600">kg/hectare</p>
              </div>
              
              <div className={`p-6 rounded-lg border-2 ${getRiskColor(simulationResult.risk_level)}`}>
                <p className="text-sm mb-2">Risk Level</p>
                <p className="text-4xl font-bold">
                  {simulationResult.risk_level}
                </p>
              </div>
            </div>
            {/* Risk Interpretation */}
            <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-white/40 p-6 mb-6
                transform transition-all duration-700 ease-out hover:scale-[1.01]">

              <h3 className="text-lg font-semibold mb-2">Risk Interpretation</h3>

              {simulationResult.risk_level === "Low" && (
                <p className="text-gray-700">
                  Low risk indicates stable environmental conditions with predictable outcomes.
                  Yield variation is minimal and planning confidence is high.
                </p>
              )}

              {simulationResult.risk_level === "Medium" && (
                <p className="text-gray-700">
                  Medium risk reflects moderate environmental variability.
                  Strategic irrigation, timing, and pest control can improve outcomes.
                </p>
              )}

              {simulationResult.risk_level === "High" && (
                <p className="text-gray-700">
                  High risk suggests frequent stress events or large variability.
                  This crop may require protection or reconsideration.
                </p>
              )}
            </div>

            {/* Explanation */}
            <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-lg mb-3">Analysis & Limiting Factors</h3>
              <p className="text-gray-700 leading-relaxed">
                {simulationResult.explanation}
              </p>
            </div>

            {/* Override Warning */}
            {simulationResult.is_override && (
              <div className="mt-6 p-6 bg-amber-50 border-2 border-amber-300 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-amber-600 flex-shrink-0 mt-1" size={24} />
                  <div>
                    <h3 className="font-semibold text-amber-900 mb-2">
                      Crop Override Detected
                    </h3>
                    <p className="text-amber-800">
                      This crop is not recommended for the selected location. The simulation 
                      has applied environmental mismatch penalties. Proceed with caution and 
                      consider alternative crops or mitigation strategies.
                    </p>
                  </div>
                </div>
              </div>
            )}

                        {/* Practical Recommendations */}
            <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Practical Recommendations</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Monitor humidity closely during early growth stages</li>
                <li>Ensure adequate drainage to avoid root stress</li>
                <li>Plan irrigation based on seasonal rainfall variability</li>
                <li>Adopt integrated pest and disease management practices</li>
              </ul>
            </div>


            {/* Yield Range */}
            {simulationResult.yield_range && (
              <div className="mt-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-lg mb-3">Yield Range (Variability)</h3>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Worst Case</p>
                    <p className="text-xl font-bold text-red-600">
                      {simulationResult.yield_range.min} kg/ha
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Average</p>
                    <p className="text-xl font-bold text-blue-600">
                      {simulationResult.yield_range.avg} kg/ha
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Best Case</p>
                    <p className="text-xl font-bold text-green-600">
                      {simulationResult.yield_range.max} kg/ha
                    </p>
                  </div>
                </div>
              </div>
            )}
            {/* Yield Distribution Chart */}
            <div className="mt-8 p-6 bg-white rounded-lg border border-gray-200 shadow
                transition-opacity duration-700 opacity-100">


              <h3 className="text-lg font-semibold mb-4">
                Yield Distribution Overview
              </h3>

              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={yieldChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <p className="text-sm text-gray-600 mt-4">
                This visualization summarizes the simulated yield variability across
                worst-case, average, and best-case outcomes from Monte Carlo sampling.
              </p>
            </div>

            {/* Risk Contribution Breakdown */}
<div className="mt-8 p-6 bg-white rounded-lg border border-gray-200 shadow
                transition-opacity duration-700 opacity-100">


            <h3 className="text-lg font-semibold mb-4">
              Risk Contribution Breakdown
            </h3>

            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={riskBreakdownData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={100}
                    label
                  >
                    {riskBreakdownData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={['#22c55e', '#3b82f6', '#facc15', '#ef4444'][index]}
                      />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <p className="text-sm text-gray-600 mt-4">
              This chart explains how different environmental and biological factors
              contributed to the overall simulation risk.
            </p>
          </div>

          </div>
          
        )}
      </div>
    </div>
  );
};

export default AgriSimDashboard;