import React from 'react';

const LeftSidebar = ({ 
  location, 
  setLocation, 
  fetchWeather, 
  selectedCrop, 
  handleCropChange, 
  crops, 
  terrainType, 
  setTerrainType,
  cropDescription,
  cropRequirements
}) => {
  return (
    <aside className="bg-gradient-to-b from-[#f5f3f0] to-[#ede9e3] px-8 py-10 overflow-y-auto">
      {/* Before you plant section */}
      <section className="mb-10">
        <h2 className="text-2xl font-serif text-gray-900 mb-4">Before you plant</h2>
        <div className="text-gray-700 leading-relaxed text-sm">
          <p className="mb-3">
            We run 10,000 randomized climate scenarios for your chosen location and crop. 
            You get a probability distribution, not a single prediction. The model accounts for rainfall 
            variance, temperature extremes, pest events, and terrain penalties.
          </p>
          <p className="italic text-gray-600">
            This is not a recommendation engine. It shows you what <span className="font-semibold">could</span> happen, 
            based on environmental mismatch and stochastic sampling.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-gray-300 my-8"></div>

      {/* Where are you planting section */}
      <section className="mb-10">
        <h2 className="text-2xl font-serif text-gray-900 mb-6">Where are you planting?</h2>
        
        <div className="space-y-5">
          {/* Latitude */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Latitude
            </label>
            <input
              type="number"
              step="0.0001"
              placeholder="e.g., 40.7128"
              value={location.lat || ''}
              onChange={(e) => setLocation({...location, lat: parseFloat(e.target.value) || ''})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
            />
          </div>

          {/* Longitude */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Longitude
            </label>
            <input
              type="number"
              step="0.0001"
              placeholder="e.g., -74.0060"
              value={location.lon || ''}
              onChange={(e) => setLocation({...location, lon: parseFloat(e.target.value) || ''})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
            />
          </div>

          {/* Fetch Weather Button */}
          <button
            onClick={fetchWeather}
            className="w-full mt-2 px-4 py-2.5 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors font-medium text-sm"
          >
            Fetch Weather Data
          </button>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-gray-300 my-8"></div>

      {/* The land itself matters section */}
      <section className="mb-10">
        <h2 className="text-2xl font-serif text-gray-900 mb-6">The land itself matters</h2>

        <div className="space-y-5">
          {/* Crop Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Crop
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => handleCropChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
            >
              <option value="">Choose a crop...</option>
              {Array.isArray(crops) && crops.map((crop) => (
                <option key={crop.id} value={crop.name}>
                  {crop.name} ({crop.category})
                </option>
              ))}
            </select>
          </div>

          {/* Terrain Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Terrain Type
            </label>
            <select
              value={terrainType}
              onChange={(e) => setTerrainType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
            >
              <option value="plain">Plain</option>
              <option value="plateau">Plateau</option>
              <option value="mountain">Mountain</option>
              <option value="valley">Valley</option>
              <option value="coastal">Coastal</option>
            </select>
          </div>

          {/* Crop Description */}
          {cropDescription && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700 mb-3 font-medium">Crop Details</p>
              <p className="text-sm text-gray-700 mb-2">{cropDescription}</p>
              {cropRequirements.length > 0 && (
                <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-3 rounded">
                  {cropRequirements.map((r, i) => (
                    <div key={i}>• {r}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </aside>
  );
};

export default LeftSidebar;
