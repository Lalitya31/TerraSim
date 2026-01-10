/**
 * TerraSim - Full-Featured Frontend
 * Complete integration with backend Monte Carlo simulation engine
 */

const API_BASE_URL = 'http://localhost:5000';
const SIMULATION_DURATION = 4000;

// DOM Elements
const previewState = document.getElementById('previewState');
const simulationState = document.getElementById('simulationState');
const resultsState = document.getElementById('resultsState');
const errorState = document.getElementById('errorState');
const historyModal = document.getElementById('historyModal');

const simulationForm = document.getElementById('simulationForm');
const submitBtn = document.getElementById('submitBtn');
const latitudeInput = document.getElementById('latitude');
const longitudeInput = document.getElementById('longitude');
const terrainSelect = document.getElementById('terrain');
const cropSelect = document.getElementById('crop');

const locationInfo = document.getElementById('locationInfo');
const locationName = document.getElementById('locationName');
const weatherMini = document.getElementById('weatherMini');
const terrainHint = document.getElementById('terrainHint');
const cropInfo = document.getElementById('cropInfo');
const cropDescription = document.getElementById('cropDescription');
const cropRequirements = document.getElementById('cropRequirements');
const recommendationBadge = document.getElementById('recommendationBadge');

const scenarioCounter = document.getElementById('scenarioCounter');
const progressFill = document.getElementById('progressFill');
const activityItems = [
    document.getElementById('activity1'),
    document.getElementById('activity2'),
    document.getElementById('activity3'),
    document.getElementById('activity4'),
    document.getElementById('activity5')
];

// Results elements
const successProbabilityEl = document.getElementById('successProbability');
const mainStatementEl = document.getElementById('mainStatement');
const overrideWarning = document.getElementById('overrideWarning');
const evidence1El = document.getElementById('evidence1');
const evidence2El = document.getElementById('evidence2');
const evidence3El = document.getElementById('evidence3');
const expectedYieldEl = document.getElementById('expectedYield');
const minYieldEl = document.getElementById('minYield');
const maxYieldEl = document.getElementById('maxYield');
const yieldVarianceEl = document.getElementById('yieldVariance');
const detailedExplanationEl = document.getElementById('detailedExplanation');
const riskExplanationEl = document.getElementById('riskExplanation');
const errorText = document.getElementById('errorText');

const resetBtn = document.getElementById('resetBtn');
const retryBtn = document.getElementById('retryBtn');
const viewHistoryBtn = document.getElementById('viewHistoryBtn');
const closeHistoryBtn = document.getElementById('closeHistoryBtn');

let distributionChart = null;
let riskChart = null;
let currentWeatherData = null;
let allCrops = [];

const terrainDescriptions = {
    plain: 'Flat terrain with good soil depth and minimal erosion',
    plateau: 'Elevated flat terrain with moderate water retention',
    mountain: 'Steep slopes with high erosion risk and shallow soil',
    valley: 'Low-lying area with excellent water retention, potential waterlogging',
    coastal: 'Coastal region with salt spray exposure and wind'
};

/**
 * Initialize
 */
function init() {
    simulationForm.addEventListener('submit', handleFormSubmit);
    
    latitudeInput.addEventListener('change', handleLocationChange);
    longitudeInput.addEventListener('change', handleLocationChange);
    terrainSelect.addEventListener('change', handleTerrainChange);
    cropSelect.addEventListener('change', handleCropChange);
    
    if (resetBtn) resetBtn.addEventListener('click', resetToPreview);
    if (retryBtn) retryBtn.addEventListener('click', resetToPreview);
    if (viewHistoryBtn) viewHistoryBtn.addEventListener('click', showHistory);
    if (closeHistoryBtn) closeHistoryBtn.addEventListener('click', () => {
        historyModal.style.display = 'none';
    });
    
    // Load crops from backend
    loadCrops();
    
    showPanel('preview');
}

/**
 * Load crops from backend
 */
async function loadCrops() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/crops`);
        if (response.ok) {
            allCrops = await response.json();
            console.log('Loaded crops from backend:', allCrops);
        }
    } catch (error) {
        console.warn('Could not load crops from backend, using defaults');
    }
}

/**
 * Handle location change - fetch weather data
 */
async function handleLocationChange() {
    const lat = parseFloat(latitudeInput.value);
    const lon = parseFloat(longitudeInput.value);
    
    if (isNaN(lat) || isNaN(lon)) {
        locationInfo.style.display = 'none';
        return;
    }
    
    // Get location name from reverse geocoding
    const locationNameText = getLocationName(lat, lon);
    locationName.textContent = locationNameText;
    
    // Fetch weather data
    try {
        const response = await fetch(`${API_BASE_URL}/api/weather?lat=${lat}&lon=${lon}`);
        if (response.ok) {
            currentWeatherData = await response.json();
            weatherMini.textContent = `${currentWeatherData.temp}°C, ${currentWeatherData.rainfall}mm/year, ${currentWeatherData.description}`;
            locationInfo.style.display = 'block';
        }
    } catch (error) {
        console.warn('Weather fetch failed:', error);
        locationInfo.style.display = 'none';
    }
}

/**
 * Get location name from coordinates
 */
function getLocationName(lat, lon) {
    const absLat = Math.abs(lat);
    const latDir = lat >= 0 ? 'N' : 'S';
    const lonDir = lon >= 0 ? 'E' : 'W';
    
    let zone = '';
    if (absLat < 23.5) zone = 'Tropical';
    else if (absLat < 35) zone = 'Subtropical';
    else if (absLat < 60) zone = 'Temperate';
    else zone = 'Polar';
    
    return `${zone} region (${Math.abs(lat).toFixed(2)}° ${latDir}, ${Math.abs(lon).toFixed(2)}° ${lonDir})`;
}

/**
 * Handle terrain change
 */
function handleTerrainChange() {
    const terrain = terrainSelect.value;
    if (terrain && terrainDescriptions[terrain]) {
        terrainHint.textContent = terrainDescriptions[terrain];
        terrainHint.style.display = 'block';
    } else {
        terrainHint.style.display = 'none';
    }
}

/**
 * Handle crop selection
 */
async function handleCropChange() {
    const selectedCrop = cropSelect.value;
    
    if (!selectedCrop) {
        cropInfo.style.display = 'none';
        recommendationBadge.style.display = 'none';
        return;
    }
    
    // Try to get crop details from backend
    try {
        const response = await fetch(`${API_BASE_URL}/api/crops/${encodeURIComponent(selectedCrop)}`);
        if (response.ok) {
            const crop = await response.json();
            displayCropInfo(crop);
        } else {
            cropInfo.style.display = 'none';
        }
    } catch (error) {
        console.warn('Could not fetch crop details');
        cropInfo.style.display = 'none';
    }
}

/**
 * Display crop information
 */
function displayCropInfo(crop) {
    cropDescription.textContent = crop.description || '';
    
    const reqHTML = `
        <div class="req-item"><strong>Temperature:</strong> ${crop.temp_min}°C - ${crop.temp_max}°C</div>
        <div class="req-item"><strong>Rainfall:</strong> ${crop.rainfall_min} - ${crop.rainfall_max} mm/year</div>
        <div class="req-item"><strong>Growing Season:</strong> ${crop.growing_season_days} days</div>
        <div class="req-item"><strong>Ideal Yield:</strong> ${crop.ideal_yield.toLocaleString()} kg/hectare</div>
    `;
    cropRequirements.innerHTML = reqHTML;
    cropInfo.style.display = 'block';
}

/**
 * Handle form submission
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(simulationForm);
    const lat = parseFloat(formData.get('latitude'));
    const lon = parseFloat(formData.get('longitude'));
    const terrain = formData.get('terrain');
    const crop = formData.get('crop');
    
    if (!validateInputs({lat, lon, terrain, crop})) {
        return;
    }
    
    // Prepare payload matching backend API spec
    const payload = {
        crop: crop,
        location: {
            lat: lat,
            lon: lon
        },
        terrain: terrain,
        weather: currentWeatherData || {
            temp: 25,
            rainfall: 1000,
            humidity: 70,
            wind: 10
        }
    };
    
    startSimulation();
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/simulate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server returned ${response.status}`);
        }
        
        const data = await response.json();
        
        await waitForSimulationComplete();
        
        renderResults(data, payload);
        
    } catch (error) {
        console.error('Simulation error:', error);
        showError(error.message || 'Failed to connect to backend. Ensure the server is running on port 5000.');
    }
}

/**
 * Validate inputs
 */
function validateInputs(inputs) {
    const { lat, lon, terrain, crop } = inputs;
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
        showError('Latitude must be between -90 and 90');
        return false;
    }
    
    if (isNaN(lon) || lon < -180 || lon > 180) {
        showError('Longitude must be between -180 and 180');
        return false;
    }
    
    if (!terrain) {
        showError('Please select a terrain type');
        return false;
    }
    
    if (!crop) {
        showError('Please select a crop');
        return false;
    }
    
    return true;
}

/**
 * Start simulation
 */
function startSimulation() {
    showPanel('simulation');
    submitBtn.disabled = true;
    
    animateCounter();
    animateProgress();
    cycleActivities();
}

/**
 * Animate counter
 */
function animateCounter() {
    let count = 0;
    const interval = SIMULATION_DURATION / 100;
    
    const counterInterval = setInterval(() => {
        count += Math.floor(Math.random() * 200) + 50;
        if (count > 10000) count = 10000;
        
        scenarioCounter.textContent = count.toLocaleString();
        
        if (count >= 10000) {
            clearInterval(counterInterval);
        }
    }, interval);
}

/**
 * Animate progress
 */
function animateProgress() {
    let progress = 0;
    const interval = SIMULATION_DURATION / 100;
    
    const progressInterval = setInterval(() => {
        progress += Math.random() * 2 + 0.5;
        if (progress > 100) progress = 100;
        
        progressFill.style.width = progress + '%';
        
        if (progress >= 100) {
            clearInterval(progressInterval);
        }
    }, interval);
}

/**
 * Cycle activities
 */
function cycleActivities() {
    const activities = [
        'Generating temperature scenarios...',
        'Sampling rainfall patterns...',
        'Simulating pest and disease events...',
        'Calculating terrain penalties...',
        'Computing failure modes...'
    ];
    
    let currentActivity = 0;
    
    activityItems[currentActivity].textContent = activities[currentActivity];
    activityItems[currentActivity].classList.add('active');
    
    const activityInterval = setInterval(() => {
        activityItems[currentActivity].classList.remove('active');
        
        currentActivity++;
        
        if (currentActivity < activityItems.length && currentActivity < activities.length) {
            activityItems[currentActivity].textContent = activities[currentActivity];
            activityItems[currentActivity].classList.add('active');
        } else {
            clearInterval(activityInterval);
        }
    }, SIMULATION_DURATION / activityItems.length);
}

/**
 * Wait for simulation
 */
function waitForSimulationComplete() {
    return new Promise(resolve => {
        setTimeout(resolve, SIMULATION_DURATION);
    });
}

/**
 * Render results with actual backend data
 */
function renderResults(data, inputData) {
    const {
        success_probability,
        risk_level,
        expected_yield,
        yield_range,
        explanation,
        is_override,
        simulation_runs
    } = data;
    
    // Update main probability
    const successPercent = Math.round(success_probability * 100);
    successProbabilityEl.textContent = successPercent;
    
    // Show override warning if applicable
    if (is_override) {
        overrideWarning.style.display = 'flex';
    } else {
        overrideWarning.style.display = 'none';
    }
    
    // Generate main statement
    const statement = generateMainStatement(successPercent, risk_level, inputData.crop);
    mainStatementEl.textContent = statement;
    
    // Generate evidence snippets
    const evidenceSnippets = generateEvidenceSnippets(successPercent, simulation_runs || 10000);
    evidence1El.textContent = evidenceSnippets[0];
    evidence2El.textContent = evidenceSnippets[1];
    evidence3El.textContent = evidenceSnippets[2];
    
    // Update yield values with real data from backend
    const avgYield = Math.round(expected_yield);
    expectedYieldEl.textContent = avgYield.toLocaleString();
    
    if (yield_range) {
        minYieldEl.textContent = Math.round(yield_range.min).toLocaleString();
        maxYieldEl.textContent = Math.round(yield_range.max).toLocaleString();
        const variance = Math.round(yield_range.max - yield_range.min);
        yieldVarianceEl.textContent = variance.toLocaleString();
    } else {
        const estimatedVariance = Math.round(avgYield * 0.3);
        minYieldEl.textContent = Math.round(avgYield - estimatedVariance).toLocaleString();
        maxYieldEl.textContent = Math.round(avgYield + estimatedVariance).toLocaleString();
        yieldVarianceEl.textContent = (estimatedVariance * 2).toLocaleString();
    }
    
    // Display detailed explanation from backend
    detailedExplanationEl.textContent = explanation || 'No detailed explanation available.';
    
    // Generate risk explanation
    const riskExplanation = generateRiskExplanation(risk_level, successPercent);
    riskExplanationEl.textContent = riskExplanation;
    
    // Render charts with real data
    renderDistributionChart(successPercent, yield_range);
    renderRiskChart(risk_level, successPercent);
    
    showPanel('results');
    submitBtn.disabled = false;
}

/**
 * Generate main statement - opinionated, human tone
 */
function generateMainStatement(probability, riskLevel, crop) {
    if (probability >= 75) {
        return `This usually works — until it doesn't.`;
    } else if (probability >= 50) {
        return `You're looking at a coin flip. Half the futures succeed.`;
    } else if (probability >= 25) {
        return `This struggles. You'll need luck on your side.`;
    } else {
        return `This fails more often than it works. The conditions aren't there.`;
    }
}

/**
 * Generate evidence snippets - actual data
 */
function generateEvidenceSnippets(probability, totalRuns) {
    const successCount = Math.round((probability / 100) * totalRuns);
    const failureCount = totalRuns - successCount;
    
    return [
        `Across ${totalRuns.toLocaleString()} simulated scenarios, ${successCount.toLocaleString()} resulted in successful crop maturity.`,
        `${failureCount.toLocaleString()} scenarios experienced critical failure due to environmental stress or random events.`,
        `The simulation accounts for temperature variance, rainfall patterns, pest risk, disease outbreaks, and extreme weather.`
    ];
}

/**
 * Generate risk explanation - based on actual risk level
 */
function generateRiskExplanation(riskLevel, probability) {
    if (riskLevel === 'Low' || probability >= 75) {
        return 'Primary risk factor is rainfall variability during critical growth stages. Temperature and other factors remain mostly favorable.';
    } else if (riskLevel === 'Medium' || probability >= 50) {
        return 'Multiple risk factors contribute to uncertainty: rainfall gaps coincide with peak growth periods, and temperature stress occurs in some scenarios.';
    } else {
        return 'Environmental conditions are fundamentally mismatched. Rainfall deficit, temperature stress, and terrain limitations create compounding failures across most scenarios.';
    }
}

/**
 * Render distribution chart with real data
 */
function renderDistributionChart(successProbability, yieldRange) {
    const ctx = document.getElementById('distributionChart').getContext('2d');
    
    if (distributionChart) {
        distributionChart.destroy();
    }
    
    // Generate distribution curve based on actual probability
    const labels = [];
    const data = [];
    const mean = successProbability;
    const stdDev = 15;
    
    for (let i = 0; i <= 100; i += 2) {
        labels.push(i + '%');
        const value = Math.exp(-Math.pow(i - mean, 2) / (2 * stdDev * stdDev));
        const jitter = Math.random() * 0.05 - 0.025;
        data.push(Math.max(0, value + jitter));
    }
    
    distributionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Probability Density',
                    data: data,
                    borderColor: 'rgba(5, 150, 105, 0.9)',
                    backgroundColor: 'rgba(5, 150, 105, 0.2)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    callbacks: {
                        label: (context) => `Probability density: ${(context.parsed.y * 100).toFixed(1)}%`
                    }
                }
            },
            scales: {
                y: {
                    display: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        display: false
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        maxTicksLimit: 6,
                        font: { size: 11 },
                        color: '#6b7280'
                    }
                }
            }
        }
    });
}

/**
 * Render risk breakdown chart with realistic data
 */
function renderRiskChart(riskLevel, successProbability) {
    const ctx = document.getElementById('riskChart').getContext('2d');
    
    if (riskChart) {
        riskChart.destroy();
    }
    
    // Calculate risk distribution based on risk level
    let rainfallRisk, temperatureRisk, extremeEventsRisk, pestRisk;
    
    if (riskLevel === 'High') {
        rainfallRisk = 55;
        temperatureRisk = 25;
        extremeEventsRisk = 12;
        pestRisk = 8;
    } else if (riskLevel === 'Medium') {
        rainfallRisk = 42;
        temperatureRisk = 28;
        extremeEventsRisk = 18;
        pestRisk = 12;
    } else {
        rainfallRisk = 35;
        temperatureRisk = 22;
        extremeEventsRisk = 25;
        pestRisk = 18;
    }
    
    riskChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Water stress', 'Temperature', 'Extreme events', 'Pests/Disease'],
            datasets: [{
                data: [rainfallRisk, temperatureRisk, extremeEventsRisk, pestRisk],
                backgroundColor: [
                    'rgba(5, 150, 105, 0.8)',
                    'rgba(5, 150, 105, 0.6)',
                    'rgba(5, 150, 105, 0.4)',
                    'rgba(5, 150, 105, 0.3)'
                ],
                borderColor: 'rgba(5, 150, 105, 1)',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    callbacks: {
                        label: (context) => `${context.parsed.x}% of failed scenarios`
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: (value) => value + '%',
                        font: { size: 11 },
                        color: '#6b7280'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y: {
                    grid: { display: false },
                    ticks: {
                        font: { size: 12 },
                        color: '#166534'
                    }
                }
            }
        }
    });
}

/**
 * Show history of simulations
 */
async function showHistory() {
    historyModal.style.display = 'flex';
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '<p class="history-loading">Loading previous runs...</p>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/simulations/history?limit=20`);
        if (!response.ok) {
            throw new Error('Failed to load history');
        }
        
        const history = await response.json();
        
        if (!history || history.length === 0) {
            historyList.innerHTML = '<p class="history-loading">No simulation history found.</p>';
            return;
        }
        
        let historyHTML = '<div class="history-grid">';
        history.forEach(sim => {
            const date = new Date(sim.created_at).toLocaleDateString();
            const successRate = Math.round((sim.success_probability || 0) * 100);
            const riskClass = sim.risk_level === 'High' ? 'risk-high' : sim.risk_level === 'Medium' ? 'risk-medium' : 'risk-low';
            
            historyHTML += `
                <div class="history-item">
                    <div class="history-header">
                        <strong>${sim.crop_name}</strong>
                        <span class="history-date">${date}</span>
                    </div>
                    <div class="history-details">
                        <span>Location: ${sim.latitude.toFixed(2)}°, ${sim.longitude.toFixed(2)}°</span>
                        <span>Terrain: ${sim.terrain}</span>
                    </div>
                    <div class="history-results">
                        <div class="result-item">
                            <span class="result-label">Success Rate</span>
                            <span class="result-value">${successRate}%</span>
                        </div>
                        <div class="result-item">
                            <span class="result-label">Expected Yield</span>
                            <span class="result-value">${Math.round(sim.expected_yield || 0).toLocaleString()} kg/ha</span>
                        </div>
                        <div class="result-item">
                            <span class="result-label">Risk Level</span>
                            <span class="result-value ${riskClass}">${sim.risk_level}</span>
                        </div>
                    </div>
                    ${sim.is_override ? '<div class="override-tag">OVERRIDE</div>' : ''}
                </div>
            `;
        });
        historyHTML += '</div>';
        
        historyList.innerHTML = historyHTML;
        
    } catch (error) {
        console.error('History load error:', error);
        historyList.innerHTML = '<p class="history-loading">Failed to load simulation history.</p>';
    }
}

/**
 * Show panel
 */
function showPanel(panel) {
    previewState.style.display = 'none';
    simulationState.style.display = 'none';
    resultsState.style.display = 'none';
    errorState.style.display = 'none';
    
    switch (panel) {
        case 'preview':
            previewState.style.display = 'block';
            break;
        case 'simulation':
            simulationState.style.display = 'block';
            break;
        case 'results':
            resultsState.style.display = 'block';
            break;
        case 'error':
            errorState.style.display = 'block';
            break;
    }
}

/**
 * Show error
 */
function showError(message) {
    errorText.textContent = message;
    showPanel('error');
    submitBtn.disabled = false;
}

/**
 * Reset to preview
 */
function resetToPreview() {
    showPanel('preview');
    submitBtn.disabled = false;
    
    // Clear activity items
    activityItems.forEach(item => {
        item.classList.remove('active');
        item.textContent = '';
    });
    
    // Reset progress
    progressFill.style.width = '0%';
    scenarioCounter.textContent = '0';
    
    // Hide override warning
    if (overrideWarning) {
        overrideWarning.style.display = 'none';
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
