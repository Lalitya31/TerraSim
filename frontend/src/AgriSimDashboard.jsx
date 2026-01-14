import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useConnection } from './context/ConnectionContext';
import Header from './components/Header';
import LeftSidebar from './components/LeftSidebar';
import RightResults from './components/RightResults';

const AgriSimDashboard = () => {
  const [location, setLocation] = useState({ lat: null, lon: null });
  const { crops, fetchWeather: ctxFetchWeather, simulate: ctxSimulate, getCrop } = useConnection();
  const [selectedCrop, setSelectedCrop] = useState('');
  const [cropDescription, setCropDescription] = useState('');
  const [cropRequirements, setCropRequirements] = useState([]);
  const [terrainType, setTerrainType] = useState('plain');
  const [weatherData, setWeatherData] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [simulationHistory, setSimulationHistory] = useState([]);
  const [previousSimulation, setPreviousSimulation] = useState(null);
  
  // UI animation state for simulation
  const [progress, setProgress] = useState(0);
  const [scenarioCount, setScenarioCount] = useState(0);
  const activityMessages = [
    'Generating temperature scenarios...',
    'Sampling rainfall patterns...',
    'Simulating pest and disease events...',
    'Calculating terrain penalties...',
    'Computing failure modes...'
  ];
  const [activeActivity, setActiveActivity] = useState(0);
  const progressRef = useRef(null);
  const counterRef = useRef(null);
  const activityRef = useRef(null);

  // Set a sensible default crop when the connection provides crops
  useEffect(() => {
    if (!selectedCrop && Array.isArray(crops) && crops.length) {
      const first = crops[0].name || crops[0];
      setSelectedCrop(first);
    }
  }, [crops, selectedCrop]);

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

  // Clean up timers on unmount to avoid leaks
  useEffect(() => {
    return () => {
      clearInterval(counterRef.current);
      clearInterval(progressRef.current);
      clearInterval(activityRef.current);
    };
  }, []);

  // Fetch weather data
  const fetchWeather = async () => {
    if (!location.lat || !location.lon) {
      setError('Please enter valid latitude and longitude');
      return;
    }
    try {
      setError(null);
      const data = await ctxFetchWeather(location.lat, location.lon);
      setWeatherData(data);
    } catch (err) {
      setError('Failed to fetch weather data: ' + (err.message || err));
    }
  };

  // Crop detail fetcher
  const handleCropChange = async (cropName) => {
    setSelectedCrop(cropName);
    if (!cropName) {
      setCropDescription('');
      setCropRequirements([]);
      return;
    }

    try {
      const data = await getCrop(cropName);
      setCropDescription(data.description || '');
      setCropRequirements([
        `Temp: ${data.temp_min}°C - ${data.temp_max}°C`,
        `Rainfall: ${data.rainfall_min} - ${data.rainfall_max} mm/yr`,
        `Growing season: ${data.growing_season_days} days`,
        `Ideal yield: ${Math.round(data.ideal_yield || 0)} kg/ha`
      ]);
    } catch (err) {
      setCropDescription('');
      setCropRequirements([]);
    }
  };

  // Start simulation UI animation
  const startSimulationUI = () => {
    setProgress(0);
    setScenarioCount(0);
    setActiveActivity(0);

    clearInterval(counterRef.current);
    clearInterval(progressRef.current);
    clearInterval(activityRef.current);

    counterRef.current = setInterval(() => {
      setScenarioCount((prev) => Math.min(prev + Math.floor(Math.random() * 200) + 50, 10000));
    }, 40);

    progressRef.current = setInterval(() => {
      setProgress((prev) => Math.min(prev + Math.random() * 2 + 0.5, 100));
    }, 60);

    activityRef.current = setInterval(() => {
      setActiveActivity((prev) => {
        const next = prev + 1;
        if (next >= activityMessages.length) {
          clearInterval(activityRef.current);
          return prev;
        }
        return next;
      });
    }, 800);
  };

  // Stop simulation UI animation
  const stopSimulationUI = () => {
    clearInterval(counterRef.current);
    clearInterval(progressRef.current);
    clearInterval(activityRef.current);
    setProgress(100);
    setScenarioCount(10000);
    setActiveActivity(activityMessages.length - 1);
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

    // Start animated UI
    startSimulationUI();

    try {
      const data = await ctxSimulate({
        crop: selectedCrop,
        location: location,
        terrain: terrainType,
        weather: weatherData
      });

      // Stop animation and show results
      stopSimulationUI();

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
        ...prev
      ].slice(0, 10));

    } catch (err) {
      stopSimulationUI();
      setError('Simulation failed: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  // Yield chart data
  const yieldChartData = simulationResult?.yield_range
    ? [
        { name: 'Worst', value: simulationResult.yield_range.min },
        { name: 'Average', value: simulationResult.yield_range.avg },
        { name: 'Best', value: simulationResult.yield_range.max }
      ]
    : [];

  // Risk contribution breakdown
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

  const getRiskColor = (risk) => {
    const colors = {
      'Low': 'bg-green-100 text-green-800 border-green-300',
      'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'High': 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[risk] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <Header />

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-full md:w-96 overflow-y-auto border-r border-gray-200">
          <LeftSidebar
            location={location}
            setLocation={setLocation}
            fetchWeather={fetchWeather}
            selectedCrop={selectedCrop}
            handleCropChange={handleCropChange}
            crops={crops}
            terrainType={terrainType}
            setTerrainType={setTerrainType}
            cropDescription={cropDescription}
            cropRequirements={cropRequirements}
          />
        </div>

        {/* Right Results Area */}
        <div className="flex-1">
          <RightResults
            simulationResult={simulationResult}
            loading={loading}
            runSimulation={runSimulation}
            selectedCrop={selectedCrop}
            weatherData={weatherData}
            terrainType={terrainType}
            error={error}
            yieldChartData={yieldChartData}
            riskBreakdownData={riskBreakdownData}
            calculateACI={calculateACI}
            getRiskColor={getRiskColor}
            progress={progress}
            scenarioCount={scenarioCount}
            activityMessages={activityMessages}
            activeActivity={activeActivity}
            simulationHistory={simulationHistory}
            setSimulationHistory={setSimulationHistory}
            previousSimulation={previousSimulation}
          />
        </div>
      </div>

      {/* Loading animation overlay */}
      {loading && (
        <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg p-4 border border-gray-200 z-50">
          <div className="flex items-center gap-3">
            <Loader2 className="animate-spin text-blue-600" size={20} />
            <div className="text-sm">
              <p className="font-semibold text-gray-800">{scenarioCount.toLocaleString()} scenarios</p>
              <p className="text-gray-600">{Math.round(progress)}% complete</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgriSimDashboard;
