import React, { useState, useEffect } from 'react';
import { BarChart as BarChartIcon, PieChart as PieIcon, Activity, Info, CheckCircle, ArrowUp, ArrowDown } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

const CHART_COLORS = ['#10B981', '#FBBF24', '#F43F5E', '#60A5FA', '#8B5CF6'];

const RightResults = ({ 
  simulationResult, 
  loading, 
  runSimulation, 
  selectedCrop,
  weatherData,
  terrainType,
  error,
  yieldChartData,
  riskBreakdownData,
  calculateACI,
  getRiskColor,
  progress,
  scenarioCount,
  activityMessages,
  activeActivity,
  simulationHistory,
  setSimulationHistory,
  previousSimulation
}) => {
  // Local UI state for mitigation preview and history comparison
  const [showMitigationPreview, setShowMitigationPreview] = useState(false);
  const [appliedMitigation, setAppliedMitigation] = useState(null);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState(null);

  const bgImageUrl = `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><defs><filter id="blur"><feGaussianBlur in="SourceGraphic" stdDeviation="8"/></filter></defs><rect fill="%23e8dcc8" width="1200" height="800"/><circle cx="200" cy="300" r="150" fill="%2388c540" opacity="0.4" filter="url(%23blur)"/><circle cx="800" cy="600" r="200" fill="%2388c540" opacity="0.3" filter="url(%23blur)"/><circle cx="1000" cy="200" r="120" fill="%23c8a882" opacity="0.2" filter="url(%23blur)"/></svg>')`;

  // Animated display counters
  const [displaySuccess, setDisplaySuccess] = useState(0);
  const [displayYield, setDisplayYield] = useState(0);
  const [displayACI, setDisplayACI] = useState(null);

  useEffect(() => {
    // Animate display counters whenever a new simulationResult arrives
    if (!simulationResult) { setDisplaySuccess(0); setDisplayYield(0); setDisplayACI(null); return; }

    const targetSuccess = Math.round((simulationResult.success_probability || 0) * 100);
    const targetYield = Math.round(simulationResult.expected_yield || 0);
    // Compute ACI locally to avoid depending on a changing function reference
    const riskPenaltyMap = { Low: 0.05, Medium: 0.15, High: 0.3 };
    const penalty = riskPenaltyMap[simulationResult.risk_level] ?? 0.2;
    const targetACI = Math.round((simulationResult.success_probability || 0) * 100 * (1 - penalty));

    // Start from current displayed values so animation is smooth for repeated runs
    let s = typeof displaySuccess === 'number' ? displaySuccess : 0;
    let y = typeof displayYield === 'number' ? displayYield : 0;
    let a = typeof displayACI === 'number' ? displayACI : 0;

    const sInterval = setInterval(() => {
      const step = Math.max(1, Math.round(Math.abs(targetSuccess - s) / 6));
      if (s < targetSuccess) s = Math.min(targetSuccess, s + step);
      else if (s > targetSuccess) s = Math.max(targetSuccess, s - step);
      setDisplaySuccess(s);
      if (s === targetSuccess) clearInterval(sInterval);
    }, 50);

    const yInterval = setInterval(() => {
      const step = Math.max(1, Math.round(Math.abs(targetYield - y) / 10));
      if (y < targetYield) y = Math.min(targetYield, y + step);
      else if (y > targetYield) y = Math.max(targetYield, y - step);
      setDisplayYield(y);
      if (y === targetYield) clearInterval(yInterval);
    }, 40);

    let aInterval = null;
    if (typeof targetACI === 'number') {
      aInterval = setInterval(() => {
        const step = Math.max(1, Math.round(Math.abs(targetACI - a) / 6));
        if (a < targetACI) a = Math.min(targetACI, a + step);
        else if (a > targetACI) a = Math.max(targetACI, a - step);
        setDisplayACI(a);
        if (a === targetACI) clearInterval(aInterval);
      }, 60);
    }

    return () => { clearInterval(sInterval); clearInterval(yInterval); if (aInterval) clearInterval(aInterval); };
  }, [simulationResult]);

  // Compute improvement vs previous simulation
  const improvement = (() => {
    if (!previousSimulation || !simulationResult) return null;
    const prev = previousSimulation.success || previousSimulation.success_probability || 0;
    const curr = simulationResult.success_probability || 0;
    if (prev === 0) return null;
    const pct = ((curr - prev) / prev) * 100;
    return Math.round(pct);
  })();

  // Feature state: mitigation preview, choice, compare index
  const [mitigationChoice, setMitigationChoice] = useState('');
  const [mitigationPreview, setMitigationPreview] = useState(null);
  const [compareIndex, setCompareIndex] = useState(null);

  const handleMitigationSelect = (choice) => {
    setMitigationChoice(choice);
    setMitigationPreview(null);
  };

  const applyMitigationPreview = () => {
    if (!mitigationChoice || !simulationResult) return;
    // Map choice to improvement values
    const map = {
      'Irrigation': 0.08,
      'CropDiversification': 0.05,
      'SoilAmendment': 0.06,
      'AdaptiveTiming': 0.04
    };
    const imp = map[mitigationChoice] || 0.03;
    const newSuccess = Math.min(1, (simulationResult.success_probability || 0) + imp);
    const newACI = Math.round(newSuccess * 100 * (1 - ({Low:0.05, Medium:0.15, High:0.3}[simulationResult.risk_level] || 0.2)));
    const newYield = Math.round((simulationResult.expected_yield || 0) * (1 + imp * 0.4));
    setMitigationPreview({ name: mitigationChoice, improvement: imp, newSuccess, newACI, newYield });
  };

  const exportHistoryCSV = () => {
    if (!simulationHistory || !simulationHistory.length) return;
    const rows = ['timestamp,crop,terrain,lat,lon,success,expected_yield,risk'];
    simulationHistory.forEach(h => {
      rows.push(`${h.timestamp},${h.crop},${h.terrain},"${h.location}",${(h.success||0).toFixed(3)},${(h.yield||0)},${h.risk}`);
    });
    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'simulation_history.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const toggleCompare = (idx) => {
    setCompareIndex(prev => prev === idx ? null : idx);
  };

  // If compareIndex is set, compute comparison metrics
  const comparison = (() => {
    if (compareIndex === null || !simulationHistory || !simulationHistory[compareIndex] || !simulationResult) return null;
    const other = simulationHistory[compareIndex];
    const deltaSuccess = Math.round(((simulationResult.success_probability||0) - (other.success||0)) * 100);
    const deltaYield = Math.round((simulationResult.expected_yield||0) - (other.yield||0));
    return { other, deltaSuccess, deltaYield };
  })();

  // Limiting factors from risk breakdown (top 3)
  const limitingFactors = (riskBreakdownData || [])
    .slice()
    .sort((a,b) => b.value - a.value)
    .slice(0,3)
    .map(r => r.name);

  // Dynamic mitigation suggestion and estimated impact
  const dynamicMitigation = (() => {
    if (!simulationResult) return null;
    const top = limitingFactors[0];
    const options = {
      'Weather Stress': { name: 'Irrigation', improvement: 0.08 },
      'Yield Variability': { name: 'Cultivar mix', improvement: 0.05 },
      'Risk Penalty': { name: 'Soil Amendments', improvement: 0.06 },
      'System Instability': { name: 'Stabilize inputs', improvement: 0.04 }
    };
    const chosen = options[top] || { name: 'Adaptive management', improvement: 0.03 };
    const newSuccess = Math.min(1, (simulationResult.success_probability || 0) + chosen.improvement);
    const newACI = Math.round((newSuccess * 100) * (1 - ({Low:0.05, Medium:0.15, High:0.3}[simulationResult.risk_level] || 0.2)));
    return { ...chosen, newSuccess, newACI };
  })();

  // Preview values (when testing mitigation scenarios)
  const previewValues = showMitigationPreview && dynamicMitigation ? {
    success_pct: Math.round(dynamicMitigation.newSuccess * 100),
    expected_yield: Math.round(simulationResult?.expected_yield || 0),
    ACI: dynamicMitigation.newACI
  } : null;

  const shownSuccess = previewValues ? previewValues.success_pct : displaySuccess;
  const shownACI = previewValues ? previewValues.ACI : (displayACI !== null ? displayACI : (calculateACI ? calculateACI() : null));
  const shownYield = previewValues ? previewValues.expected_yield : displayYield;

  // Recommendations based on risk level and top factors
  const recommendations = (() => {
    if (!simulationResult) return [];
    const risk = simulationResult.risk_level;
    const recs = [];
    if (risk === 'High') {
      recs.push('Consider switching to a more tolerant crop');
      recs.push('Implement irrigation and erosion control');
      recs.push('Stagger planting time to avoid peak stress periods');
    } else if (risk === 'Medium') {
      recs.push('Monitor soil moisture closely');
      recs.push('Use cover crops or mulches to retain moisture');
    } else {
      recs.push('Continue best practices and monitor for pests');
    }

    // Add tailored recs for top limiting factors
    if (limitingFactors.includes('Weather Stress')) recs.push('Install simple rainwater harvesting');
    if (limitingFactors.includes('Yield Variability')) recs.push('Diversify cultivars to hedge variability');

    return recs;
  })();

  // yield position between min and max
  const yieldProgressPct = (() => {
    if (!simulationResult || !simulationResult.yield_range) return 0;
    const { min, avg, max } = simulationResult.yield_range;
    if (max === min) return 100;
    return Math.round(((avg - min) / (max - min)) * 100);
  })();

  return (
    <div 
      className="flex-1 bg-cover bg-center relative px-8 py-8"
      style={{ backgroundImage: bgImageUrl }}
    >
      <div className="absolute inset-0 bg-black/5"></div>

      <div className="relative z-10 right-scroll">
        {/* Decorative background */}
        <div className="decorative-circle decorative-top"></div>
        <div className="decorative-circle decorative-bottom"></div>

            {loading && (
      <div className="mb-6 blob-card p-4">
        <div className="meta-line mb-2">Simulation progress</div>

        <div className="progress-track">
          <div
            className="progress-bar"
            style={{ width: `${progress || 0}%` }}
          />
        </div>

      {activityMessages?.length > 0 && (
        <ul className="mt-3 text-sm text-gray-600 space-y-1">
          {activityMessages.map((msg, i) => (
            <li
              key={i}
              className={i === activeActivity ? 'font-semibold text-green-700' : ''}
            >
              • {msg}
            </li>
          ))}
        </ul>
      )}
    </div>
  )}

        {/* Header / Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="feature-card card-animate fade-delay-1 text-left">
            <div className="flex items-start gap-4">
              <div className="card-accent"><CheckCircle size={20} /></div>
              <div>
                <div className="meta-line">Success Rate</div>
                <div className="num-large">{shownSuccess}%</div>
                <div className="meta-line mt-1">{scenarioCount.toLocaleString()} simulated scenarios</div>
                {improvement !== null && (
                  <div className={`mt-3 text-sm ${improvement>0? 'improve-up':'improve-down'}`}> 
                    {improvement>0 ? <><ArrowUp size={14}/> +{improvement}% vs previous</> : <><ArrowDown size={14}/> {improvement}% vs previous</>}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="feature-card card-animate fade-delay-2 text-left feature-hero">
            <div className="flex items-start gap-4">
              <div className="card-accent"><BarChartIcon size={18} /></div>
              <div style={{flex:1}}>
                <div className="meta-line">Expected Yield</div>
                <div className="num-large">{shownYield} <span className="stat-sub">kg/ha</span></div>

                <div className="mt-3">
                  <div className="meta-line">Range</div>
                  <div className="text-sm text-gray-700">{Math.round(simulationResult?.yield_range?.min||0)} — {Math.round(simulationResult?.yield_range?.max||0)} kg/ha</div>
                  <div className="progress-mini mt-3"><div className="fill" style={{width:`${yieldProgressPct}%`}}></div></div>
                </div>
              </div>
            </div>
          </div>

          <div className="feature-card card-animate fade-delay-3 text-left">
            <div className="flex items-start gap-4">
              <div className="card-accent"><PieIcon size={18} /></div>
              <div>
                <div className="meta-line">Risk & Confidence</div>
                  <div
                  className="num-large"
                  style={{ color: getRiskColor?.(simulationResult?.risk_level) }}
                >
                  {simulationResult?.risk_level || '—'}
                </div>

                <div className="mt-2 badge">ACI: {(shownACI !== null ? shownACI : (calculateACI ? calculateACI() : '—'))}</div>
                <div className="mt-3 text-sm text-gray-600">Quick actions: <button className="btn-ghost ml-2">Compare</button> <button className="btn-primary ml-2">Export</button></div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts & Interpretation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="col-span-1 md:col-span-2 feature-card p-4 card-animate">
            <div className="card-header">
              <h4 className="text-sm font-semibold flex items-center gap-2"><BarChartIcon size={16}/> Yield Distribution</h4>
              <div className="ml-auto text-xs meta-line">Values in kg/ha</div>
            </div>
            <div className=" chart-reveal" style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yieldChartData} margin={{ left: 0, right: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="6 6" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ReTooltip formatter={(v) => `${Math.round(v)} kg/ha`} />
                  <Bar dataKey="value" fill="#10B981" animationDuration={800} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-gray-600">Median: {Math.round(simulationResult?.yield_range?.avg||0)} kg/ha</div>
          </div>

          <div className="col-span-1 feature-card p-4 card-animate">
            <div className="card-header">
              <h4 className="text-sm font-semibold flex items-center gap-2"><PieIcon size={16}/> Risk Contribution</h4>
              <div className="ml-auto text-xs meta-line">Top contributors</div>
            </div>
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={riskBreakdownData} dataKey="value" nameKey="name" innerRadius={30} outerRadius={64} paddingAngle={3} animationDuration={900} startAngle={90} endAngle={450}>
                    {(riskBreakdownData||[]).map((entry, idx) => (
                      <Cell key={`c-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <ReTooltip formatter={(v, name) => `${name}: ${v}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-gray-600">
              {(riskBreakdownData||[]).map((r,i)=> (
                <div key={i} className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded" style={{background: CHART_COLORS[i%CHART_COLORS.length]}}></span><span>{r.name}</span></div>
                  <div className="text-gray-600">{r.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Analysis, Limiting Factors, Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="col-span-1 md:col-span-2 blob-card p-4 card-animate">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><Activity size={16}/> Analysis & Limiting Factors</h4>
            <div className="text-sm text-gray-700">Top limiting factors:</div>
            <ul className="mt-2 space-y-2">
              {limitingFactors.map((f,i)=> <li key={i} className="limiting-factor">{i+1}. {f}</li>)}
            </ul>
                        {weatherData && (
              <div className="mt-4 text-sm text-gray-600">
                <strong>Weather context:</strong>{' '}
                Temp {weatherData.temp}°C • Rainfall {weatherData.rainfall}mm •
                Humidity {weatherData.humidity}%
              </div>
            )}

            <div className="mt-4 text-sm text-gray-600">Detailed diagnostics and factor-specific penalties are available in the backend explainability report.</div>
          </div>

          <div className="col-span-1 blob-card p-4 card-animate">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><Info size={16}/> Practical Recommendations</h4>
            <ul className="recommend-list mt-2 text-sm">
              {recommendations.map((r,i)=> <li key={i}>{r}</li>)}
            </ul>
          </div>
        </div>

        {/* Potential Impact */}
        {dynamicMitigation && (
          <div className="feature-card p-4 card-animate mb-6">
            <div className="card-header">
              <h4 className="text-sm font-semibold">Potential Impact</h4>
              <div className="ml-auto text-xs meta-line">What-if preview</div>
            </div>
            <div className="text-sm text-gray-700">Applying <strong>{dynamicMitigation.name}</strong> could raise success to <strong>{Math.round(dynamicMitigation.newSuccess*100)}%</strong> (ACI {dynamicMitigation.newACI}).</div>
            <div className="mt-3 flex items-center gap-3">
              <div className="mt-3 flex gap-2 flex-wrap">
  {['Irrigation', 'CropDiversification', 'SoilAmendment', 'AdaptiveTiming'].map(opt => (
    <button
      key={opt}
      onClick={() => handleMitigationSelect(opt)}
      className={`btn-ghost ${
        mitigationChoice === opt ? 'ring-2 ring-green-300' : ''
      }`}
    >
      {opt}
    </button>
  ))}
</div>

              <button className="btn-primary" onClick={() => setShowMitigationPreview(!showMitigationPreview)}>{showMitigationPreview ? 'Hide Preview' : 'Preview Mitigation'}</button>
              <button className="btn-ghost" onClick={() => { setAppliedMitigation(dynamicMitigation); setSimulationHistory([{
                
                crop: selectedCrop,
                terrain: terrainType,
                location: `${simulationResult?.latitude||''}, ${simulationResult?.longitude||''}`,
                success: dynamicMitigation.newSuccess,
                yield: simulationResult?.expected_yield || 0,
                risk: simulationResult?.risk_level,
                timestamp: new Date().toLocaleTimeString(),
                preview: true
              }, ...simulationHistory].slice(0, 10)); }}>Apply (local)</button>
              <button
  className="btn-primary mt-3"
  onClick={applyMitigationPreview}
  disabled={!mitigationChoice}
>
  Calculate Preview
</button>
{mitigationPreview && (
  <div className="mt-3 text-sm text-gray-700">
    <div>New Success: {Math.round(mitigationPreview.newSuccess * 100)}%</div>
    <div>New ACI: {mitigationPreview.newACI}</div>
    <div>New Yield: {mitigationPreview.newYield} kg/ha</div>
  </div>
)}

              {appliedMitigation && (
              <div className="text-xs text-gray-500 mt-2">
                Applied mitigation: {appliedMitigation.name}
              </div>
            )}

            </div>
          </div>
        )}

        {/* Yield range & history */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="blob-card p-4 card-animate">
            <h4 className="text-sm font-semibold mb-2">Yield Range</h4>
            <div className="text-sm text-gray-700">Min: {Math.round(simulationResult?.yield_range?.min||0)} kg/ha</div>
            <div className="text-sm text-gray-700">Avg: {Math.round(simulationResult?.yield_range?.avg||0)} kg/ha</div>
            <div className="text-sm text-gray-700">Max: {Math.round(simulationResult?.yield_range?.max||0)} kg/ha</div>
            <div className="yield-track mt-3"><div className="yield-progress" style={{width: `${yieldProgressPct}%`}}></div></div>
          </div>

          <div className="feature-card p-4 card-animate">
            <div className="flex items-center justify-between card-header">
              <h4 className="text-sm font-semibold">Recent Simulation History</h4>
              <div className="flex items-center gap-2">
                <button className="btn-ghost" onClick={() => {
                  // Export CSV
                  const rows = (simulationHistory||[]).map(s => ({crop: s.crop, terrain: s.terrain, location: s.location, success: Math.round(s.success*100), yield: Math.round(s.yield), timestamp: s.timestamp }));
                  const csv = [Object.keys(rows[0]||{}).join(',')].concat(rows.map(r => Object.values(r).join(','))).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = 'simulation_history.csv'; a.click(); URL.revokeObjectURL(url);
                }}>Export CSV</button>
                <button
                  className="btn-ghost"
                  onClick={() => setSelectedHistoryIndex(null)}
                >
                  Clear
                </button>

              </div>
            </div>
            {(!simulationHistory || !simulationHistory.length) && <div className="text-sm text-gray-500">No recent runs</div>}
            {(simulationHistory||[]).map((h,i)=> (
              <div key={i} className={`flex items-center justify-between py-2 border-b last:border-b-0 ${selectedHistoryIndex===i? 'ring-2 ring-green-200 rounded-md':''}`} onClick={() => {
  setSelectedHistoryIndex(i);
  toggleCompare(i);
}}
 style={{cursor:'pointer'}}>
                <div>
                  <div className="font-medium text-gray-800">{h.crop} • {h.terrain} {h.preview ? <span className="text-xs text-green-600 ml-2">(preview)</span> : null}</div>
                  <div className="text-xs text-gray-500">{h.location} • {h.timestamp}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{Math.round(h.success*100)}%</div>
                  <div className="text-xs text-gray-500">{Math.round(h.yield)} kg/ha</div>
                </div>
              </div>
            ))}
                      {comparison && (
            <div className="mt-3 text-sm text-gray-700">
              <strong>Comparison vs {comparison.other.crop}</strong>
              <div>Δ Success: {comparison.deltaSuccess}%</div>
              <div>Δ Yield: {comparison.deltaYield} kg/ha</div>
            </div>
          )}

            {selectedHistoryIndex !== null && simulationHistory[selectedHistoryIndex] && (
              <div className="mt-3 text-sm text-gray-700">
                <div><strong>Comparing to:</strong> {simulationHistory[selectedHistoryIndex].crop} • {simulationHistory[selectedHistoryIndex].terrain}</div>
                <div className="mt-2">Delta Success: {Math.round(((simulationResult?.success_probability||0) - (simulationHistory[selectedHistoryIndex].success||0)) * 100)}%</div>
              </div>
            )}
          </div>
        </div>

        {/* Run Another Simulation CTA */}
        <div className="mt-4">
          <button onClick={runSimulation} disabled={loading || !selectedCrop} className="w-full btn-simulate bg-green-600 text-white shadow">Run Another Simulation</button>
        </div>
      </div>
    </div>
  );
};

export default RightResults;
