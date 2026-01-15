"""
Mock Backend for TerraSim Frontend Testing
This is a temporary mock backend to test the new frontend design
while keeping the core simulation logic.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import json
import random
from datetime import datetime

load_dotenv()

app = Flask(__name__)
CORS(app)

# Mock data
MOCK_CROPS = [
    {
        "id": 1,
        "name": "Wheat",
        "category": "Cereal",
        "description": "Winter or spring cereal grain",
        "temp_min": 5,
        "temp_max": 30,
        "rainfall_min": 300,
        "rainfall_max": 1000,
        "growing_season_days": 120,
        "ideal_yield": 5000
    },
    {
        "id": 2,
        "name": "Rice",
        "category": "Cereal",
        "description": "Staple grain crop requiring water",
        "temp_min": 15,
        "temp_max": 35,
        "rainfall_min": 1200,
        "rainfall_max": 2000,
        "growing_season_days": 150,
        "ideal_yield": 6000
    },
    {
        "id": 3,
        "name": "Corn",
        "category": "Cereal",
        "description": "Versatile crop for food and feed",
        "temp_min": 10,
        "temp_max": 35,
        "rainfall_min": 400,
        "rainfall_max": 1200,
        "growing_season_days": 110,
        "ideal_yield": 8000
    },
    {
        "id": 4,
        "name": "Soybean",
        "category": "Legume",
        "description": "Protein-rich legume crop",
        "temp_min": 10,
        "temp_max": 30,
        "rainfall_min": 400,
        "rainfall_max": 900,
        "growing_season_days": 120,
        "ideal_yield": 3000
    },
    {
        "id": 5,
        "name": "Potato",
        "category": "Tuber",
        "description": "Starchy tuber crop",
        "temp_min": 5,
        "temp_max": 25,
        "rainfall_min": 400,
        "rainfall_max": 800,
        "growing_season_days": 90,
        "ideal_yield": 20000
    }
]

MOCK_WEATHER = {
    "temp": 22,
    "humidity": 65,
    "rainfall": 650,
    "wind": 12
}

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "Agricultural Simulation Engine (Mock)"})

@app.route('/api/crops', methods=['GET'])
def get_crops():
    """Return all crops"""
    print(f"GET /api/crops called, returning {len(MOCK_CROPS)} crops")
    return jsonify(MOCK_CROPS)

@app.route('/api/crops/<crop_name>', methods=['GET'])
def get_crop(crop_name):
    """Get specific crop details"""
    for crop in MOCK_CROPS:
        if crop['name'].lower() == crop_name.lower():
            return jsonify(crop)
    return jsonify({"error": "Crop not found"}), 404

@app.route('/api/weather', methods=['GET'])
def get_weather():
    """Get weather data (mock)"""
    try:
        lat = float(request.args.get('lat', 0))
        lon = float(request.args.get('lon', 0))
        
        # Return mock weather data with slight variations
        weather = {
            "temp": MOCK_WEATHER["temp"] + random.randint(-5, 5),
            "humidity": MOCK_WEATHER["humidity"] + random.randint(-10, 10),
            "rainfall": MOCK_WEATHER["rainfall"] + random.randint(-100, 100),
            "wind": MOCK_WEATHER["wind"] + random.randint(-3, 3),
            "latitude": lat,
            "longitude": lon
        }
        print(f"GET /api/weather called with lat={lat}, lon={lon}")
        return jsonify(weather)
    except Exception as e:
        print(f"Error in /api/weather: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/simulate', methods=['POST'])
def simulate():
    """Run simulation (simplified mock version)"""
    try:
        data = request.json
        crop_name = data.get('crop', 'Wheat')
        
        # Find crop
        crop = None
        for c in MOCK_CROPS:
            if c['name'].lower() == crop_name.lower():
                crop = c
                break
        
        if not crop:
            return jsonify({"error": "Crop not found"}), 404
        
        # Simulate based on weather match
        weather = data.get('weather', MOCK_WEATHER)
        terrain = data.get('terrain', 'plain')
        
        # Calculate success probability based on weather suitability
        temp_match = 1.0 - abs(weather.get('temp', 22) - (crop['temp_min'] + crop['temp_max']) / 2) / 20
        rainfall_match = 1.0 - abs(weather.get('rainfall', 650) - (crop['rainfall_min'] + crop['rainfall_max']) / 2) / 500
        
        success_rate = max(0.1, min(0.95, (temp_match + rainfall_match) / 2))
        
        # Apply terrain penalty
        terrain_penalties = {
            'plain': 1.0,
            'plateau': 0.95,
            'mountain': 0.85,
            'valley': 0.9,
            'coastal': 0.88
        }
        success_rate *= terrain_penalties.get(terrain, 0.9)
        
        # Determine risk level
        if success_rate > 0.75:
            risk_level = "Low"
        elif success_rate > 0.5:
            risk_level = "Medium"
        else:
            risk_level = "High"
        
        # Generate yield estimates
        expected_yield = crop['ideal_yield'] * success_rate
        min_yield = expected_yield * 0.6
        max_yield = expected_yield * 1.4
        
        print(f"POST /api/simulate called for crop={crop_name}, terrain={terrain}")
        
        return jsonify({
            "success_probability": round(success_rate, 3),
            "expected_yield": round(expected_yield, 2),
            "risk_level": risk_level,
            "explanation": f"Simulation based on {crop_name} grown in {terrain} terrain with current weather conditions. Success probability indicates likelihood of meeting target yield thresholds.",
            "is_override": False,
            "yield_range": {
                "min": round(min_yield, 2),
                "avg": round(expected_yield, 2),
                "max": round(max_yield, 2)
            },
            "simulation_runs": 10000
        })
        
    except Exception as e:
        print(f"Error in /api/simulate: {str(e)}")
        return jsonify({"error": f"Simulation failed: {str(e)}"}), 500

@app.route('/api/simulations/history', methods=['GET'])
def get_simulation_history():
    """Return empty simulation history (mock)"""
    return jsonify([])

if __name__ == '__main__':
    print("🚜 TerraSim Agricultural Simulation Backend (Mock Mode)")
    print("=" * 60)
    print("Starting Flask development server on http://0.0.0.0:5000")
    print("=" * 60)
    app.run(debug=False, host='0.0.0.0', port=5000, use_reloader=False)
