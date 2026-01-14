from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv()

# CRITICAL: Patch httpx BEFORE importing supabase to avoid proxy parameter error
import httpx
original_client_init = httpx.Client.__init__

def patched_init(self, *args, proxy=None, **kwargs):
    # Ignore proxy parameter to avoid compatibility issues with supabase/gotrue
    original_client_init(self, *args, **kwargs)

httpx.Client.__init__ = patched_init

from engine.simulator import MonteCarloSimulator
from engine.penalties import PenaltyEngine
from engine.scoring import compute_metrics
from engine.explainability import generate_explanation
from utils.validators import validate_input
from utils.weather_service import WeatherService

app = Flask(__name__)
CORS(app)

# Initialize Supabase
supabase = None
SUPABASE_ENABLED = False
try:
    from supabase import create_client
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if supabase_url and supabase_key:
        try:
            supabase = create_client(supabase_url, supabase_key)
            SUPABASE_ENABLED = True
            print("[OK] Supabase connected successfully")
        except Exception as e:
            print(f"[WARN] Supabase connection failed: {str(e)[:100]}")
            print("       Running in mock mode with hardcoded data")
            supabase = None
    else:
        print("[WARN] Supabase credentials not found in environment")
        print("       Running in mock mode with hardcoded data")
except Exception as e:
    print(f"[WARN] Could not import Supabase: {str(e)[:100]}")
    print("       Running in mock mode with hardcoded data")
    supabase = None

weather_service = WeatherService(os.getenv("WEATHER_API_KEY"))

# Mock data for when Supabase is unavailable
MOCK_CROPS = [
    {
        "id": 1,
        "name": "Wheat",
        "temp_min": 0,
        "temp_max": 30,
        "rainfall_min": 400,
        "rainfall_max": 1000,
        "growing_season_days": 120,
        "ideal_yield": 5000,
        "category": "Cereal",
        "description": "Winter or spring cereal grain",
        "season": "Winter",
        "yield_potential": 5.5
    },
    {
        "id": 2,
        "name": "Rice",
        "temp_min": 15,
        "temp_max": 35,
        "rainfall_min": 1200,
        "rainfall_max": 2000,
        "growing_season_days": 150,
        "ideal_yield": 6000,
        "category": "Cereal",
        "description": "Staple grain crop requiring water",
        "season": "Summer",
        "yield_potential": 5.0
    },
    {
        "id": 3,
        "name": "Corn",
        "temp_min": 10,
        "temp_max": 35,
        "rainfall_min": 400,
        "rainfall_max": 1200,
        "growing_season_days": 110,
        "ideal_yield": 8000,
        "category": "Cereal",
        "description": "Versatile crop for food and feed",
        "season": "Summer",
        "yield_potential": 6.5
    },
    {
        "id": 4,
        "name": "Soybean",
        "temp_min": 10,
        "temp_max": 30,
        "rainfall_min": 400,
        "rainfall_max": 900,
        "growing_season_days": 120,
        "ideal_yield": 3000,
        "category": "Legume",
        "description": "Protein-rich legume crop",
        "season": "Summer",
        "yield_potential": 2.5
    },
    {
        "id": 5,
        "name": "Potato",
        "temp_min": 5,
        "temp_max": 25,
        "rainfall_min": 400,
        "rainfall_max": 800,
        "growing_season_days": 90,
        "ideal_yield": 20000,
        "category": "Tuber",
        "description": "Starchy tuber crop",
        "season": "Spring/Fall",
        "yield_potential": 20.0
    }
]

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    status = "healthy" if supabase else "healthy (mock mode)"
    return jsonify({"status": status, "service": "Agricultural Simulation Engine"})

@app.route('/api/crops', methods=['GET'])
def get_crops():
    if supabase:
        try:
            response = supabase.table('crops').select('*').execute()
            return jsonify(response.data)
        except:
            pass
    # Fallback to mock data
    return jsonify(MOCK_CROPS)


@app.route('/api/crops/<crop_name>', methods=['GET'])
def get_crop(crop_name):
    """Fetch specific crop details"""
    try:
        if supabase:
            response = supabase.table('crops').select('*').eq('name', crop_name).execute()
            if response.data:
                return jsonify(response.data[0])
    except:
        pass
    
    # Fallback to mock data
    for crop in MOCK_CROPS:
        if crop['name'].lower() == crop_name.lower():
            return jsonify(crop)
    
    return jsonify({"error": "Crop not found"}), 404

@app.route('/api/weather', methods=['GET'])
def get_weather():
    """Fetch weather data for given coordinates"""
    try:
        lat = float(request.args.get('lat'))
        lon = float(request.args.get('lon'))
        
        weather_data = weather_service.get_current_weather(lat, lon)
        return jsonify(weather_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/simulate', methods=['POST'])
def simulate():
    """
    Main simulation endpoint
    Expected payload:
    {
        "crop": "rice",
        "location": {"lat": 13.08, "lon": 80.27},
        "terrain": "plain",
        "weather": {...}
    }
    """
    try:
        data = request.json
        print(f"[SIMULATE] Received payload: {data}")
        
        # Validate input
        validation_error = validate_input(data)
        if validation_error:
            print(f"[SIMULATE] Validation error: {validation_error}")
            return jsonify({"error": validation_error}), 400
        
        # Fetch crop profile (from Supabase or mock)
        crop_profile = None
        if supabase:
            try:
                crop_response = supabase.table('crops').select('*').eq('name', data['crop']).execute()
                if crop_response.data:
                    crop_profile = crop_response.data[0]
            except:
                pass
        
        # Fallback to mock data
        if not crop_profile:
            for crop in MOCK_CROPS:
                if crop['name'].lower() == data['crop'].lower():
                    crop_profile = crop
                    break
        
        if not crop_profile:
            return jsonify({"error": "Crop not found"}), 404
        
        # Fetch terrain modifiers (from Supabase or use defaults)
        terrain_modifiers = None
        if supabase:
            try:
                terrain_response = supabase.table('terrain_modifiers').select('*').eq(
                    'terrain_type', data['terrain']
                ).execute()
                if terrain_response.data:
                    row = terrain_response.data[0]
                    # Extract only the modifier fields we need
                    terrain_modifiers = {
                        'water_retention_factor': row.get('water_retention_factor', 1.0),
                        'soil_depth_factor': row.get('soil_depth_factor', 1.0),
                        'erosion_risk': row.get('erosion_risk', 0.0)
                    }
            except:
                pass
        
        # Default terrain modifiers if not found
        if not terrain_modifiers:
            # Create a proper terrain modifiers structure
            terrain_defaults = {
                'plain': {'water_retention_factor': 1.0, 'soil_depth_factor': 1.0, 'erosion_risk': 0.1},
                'plateau': {'water_retention_factor': 0.85, 'soil_depth_factor': 0.9, 'erosion_risk': 0.3},
                'mountain': {'water_retention_factor': 0.6, 'soil_depth_factor': 0.7, 'erosion_risk': 0.7},
                'valley': {'water_retention_factor': 1.1, 'soil_depth_factor': 1.1, 'erosion_risk': 0.2},
                'coastal': {'water_retention_factor': 0.9, 'soil_depth_factor': 0.8, 'erosion_risk': 0.4}
            }
            terrain_modifiers = terrain_defaults.get(data['terrain'], 
                                                   {'water_retention_factor': 1.0, 'soil_depth_factor': 1.0, 'erosion_risk': 0.1})
        
        # Prepare environment data
        environment = {
            "avg_temp": data['weather'].get('temp', 25),
            "avg_rainfall": data['weather'].get('rainfall', 800),
            "humidity": data['weather'].get('humidity', 70),
            "wind_speed": data['weather'].get('wind', 10),
            "elevation": data.get('elevation', 100),
            "terrain": data['terrain'],
            "latitude": data['location']['lat'],
            "longitude": data['location']['lon']
        }
        
        # Log profiles for debugging
        print(f"[SIMULATE] crop_profile (type={type(crop_profile)}): {crop_profile}")
        print(f"[SIMULATE] terrain_modifiers (type={type(terrain_modifiers)}): {terrain_modifiers}")

        # Initialize penalty engine
        penalty_engine = PenaltyEngine(crop_profile, environment, terrain_modifiers)
        
        # Determine if this is an override scenario
        is_override = penalty_engine.check_compatibility()
        
        # Run Monte Carlo simulation
        simulator = MonteCarloSimulator(
            crop_profile=crop_profile,
            environment=environment,
            penalty_engine=penalty_engine,
            runs=10000
        )
        
        results = simulator.run()
        
        # Compute metrics
        success_rate, avg_yield, risk_level, yield_range = compute_metrics(results)
        
        # Generate explanation
        explanation = generate_explanation(results, crop_profile, environment, is_override)
        
        # Save simulation to database (if Supabase available)
        if supabase:
            try:
                simulation_record = {
                    "crop_name": data['crop'],
                    "latitude": data['location']['lat'],
                    "longitude": data['location']['lon'],
                    "terrain": data['terrain'],
                    "success_probability": success_rate,
                    "expected_yield": avg_yield,
                    "risk_level": risk_level,
                    "is_override": is_override
                }
                supabase.table('simulations').insert(simulation_record).execute()
            except:
                pass  # Continue even if database save fails
        
        # Return response
        return jsonify({
            "success_probability": round(success_rate, 3),
            "expected_yield": round(avg_yield, 2),
            "risk_level": risk_level,
            "explanation": explanation,
            "is_override": is_override,
            "yield_range": {
                "min": round(yield_range[0], 2),
                "avg": round(yield_range[1], 2),
                "max": round(yield_range[2], 2)
            },
            "simulation_runs": len(results)
        })
        
    except Exception as e:
        error_msg = str(e)
        print(f"[SIMULATE] Exception: {error_msg}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Simulation failed: {error_msg}"}), 500

@app.route('/api/simulations/history', methods=['GET'])
def get_simulation_history():
    """Fetch simulation history"""
    try:
        if supabase:
            limit = int(request.args.get('limit', 50))
            response = supabase.table('simulations').select('*').order(
                'created_at', desc=True
            ).limit(limit).execute()
            return jsonify(response.data)
    except:
        pass
    
    # Return empty list in mock mode
    return jsonify([])

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5000, use_reloader=False)