"use client";

import { useState, useMemo, useEffect } from "react";
import axios from "axios";
import MapWrapper from "../components/MapWrapper";

interface AnalysisResult {
  currentMedian: number;
  baseline: number;
  shiftPct: number;
  action: "RAISE" | "DROP" | "HOLD";
  reason: string;
  alertMsg: string;
  event: string | null;
  compData: { name: string; price: number }[];
  logicSteps: string[];
}

interface Hotel {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export default function Dashboard() {
  const [config, setConfig] = useState({
    hotelName: "Taj Mahal New Delhi",
    competitors: "The Oberoi, The Claridges",
    whatsapp: "+919876543210",
  });
  
  const [pmsData, setPmsData] = useState({ occupancy: 65 });
  const [logs, setLogs] = useState("System ready. Awaiting telemetry...");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // Map State
  const [showMap, setShowMap] = useState(false);
  const [radiusKm, setRadiusKm] = useState(3.0);
  
  const [mapState, setMapState] = useState<{
    isLoading: boolean;
    targetLocation: [number, number] | null;
    nearbyHotels: Hotel[];
    error: string | null;
  }>({
    isLoading: false,
    targetLocation: null,
    nearbyHotels: [],
    error: null
  });

  const selectedComps = useMemo(() => {
    return config.competitors.split(",").map(s => s.trim()).filter(Boolean);
  }, [config.competitors]);

  const toggleCompetitor = (name: string) => {
    let newComps;
    if (selectedComps.includes(name)) {
      newComps = selectedComps.filter(c => c !== name);
    } else {
      newComps = [...selectedComps, name];
    }
    setConfig({ ...config, competitors: newComps.join(", ") });
  };

  // Dynamically load real hotel data when map is toggled
  useEffect(() => {
    if (!showMap || !config.hotelName) return;

    let isMounted = true;
    
    const fetchGeoData = async () => {
      setMapState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        // 1. Geocode the target hotel using internal proxy
        const geocodeUrl = `/api/geo?q=${encodeURIComponent(config.hotelName)}`;
        const geocodeRes = await axios.get(geocodeUrl);
        
        if (!geocodeRes.data || geocodeRes.data.length === 0) {
          throw new Error("Could not find location. Try adding the city name.");
        }
        
        const lat = parseFloat(geocodeRes.data[0].lat);
        const lon = parseFloat(geocodeRes.data[0].lon);
        const center: [number, number] = [lat, lon];
        
        // 2. Fetch nearby hotels using internal proxy (radius in meters)
        const searchRadiusMeters = 10000; 
        
        const overpassUrl = `/api/hotels`;
        const overpassRes = await axios.post(overpassUrl, {
          lat, 
          lon, 
          radius: searchRadiusMeters
        });
        
        interface OverpassNode {
          id: number;
          lat: number;
          lon: number;
          tags?: { name?: string };
        }
        
        const nodes: OverpassNode[] = overpassRes.data.elements;
        const hotels: Hotel[] = nodes
          .filter((n: OverpassNode) => n.tags && n.tags.name)
          .map((n: OverpassNode) => ({
            id: n.id.toString(),
            name: n.tags?.name || "Unknown Property",
            lat: n.lat,
            lng: n.lon
          }));
          
        if (isMounted) {
          setMapState({
            isLoading: false,
            targetLocation: center,
            nearbyHotels: hotels,
            error: null
          });
        }
      } catch (err) {
        if (isMounted) {
          setMapState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: err instanceof Error ? err.message : "Map loading failed" 
          }));
        }
      }
    };
    
    // Add a slight debounce to prevent spamming the free APIs if user types fast
    const timer = setTimeout(() => {
      fetchGeoData();
    }, 1000);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [showMap, config.hotelName]);

  const runAnalysis = async () => {
    setLoading(true);
    setResult(null);
    setLogs("[SYS] Initializing Revenue Intelligence Core...\n[SYS] Geospatial Analysis active...\n[SYS] Bypassing OTA Bot Managers...\n[SYS] Aggregating Competitor Set Pricing...\n[SYS] Ingesting PMS Context...\n");
    
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelName: config.hotelName,
          competitors: selectedComps,
          whatsapp: config.whatsapp,
          pmsData: pmsData,
        }),
      });
      
      const data = await res.json();
      if (data.status === "success") {
        setLogs((prev) => prev + "\n" + data.logs);
        if (data.result) setResult(data.result);
      } else {
        setLogs((prev) => prev + "\n[ERR] " + data.message);
      }
    } catch (err) {
      setLogs((prev) => prev + "\n[ERR] Network Exception: " + (err instanceof Error ? err.message : String(err)));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827] font-sans selection:bg-black selection:text-white flex">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="h-14 flex items-center px-6 border-b border-gray-200">
          <div className="w-4 h-4 bg-black rounded-sm mr-2"></div>
          <span className="font-semibold text-sm tracking-tight">RevOps Intel</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          <a href="#" className="flex items-center px-3 py-2 text-sm font-medium bg-gray-100 text-black rounded-md">
            <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            Market Signals
          </a>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* HEADER */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <div className="flex items-center text-sm text-gray-500">
            <span>Platform</span>
            <span className="mx-2">/</span>
            <span className="font-medium text-gray-900">Intelligence Terminal</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
              Systems Operational
            </span>
          </div>
        </header>

        {/* DASHBOARD BODY */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Revenue Signal Analysis</h1>
                <p className="text-sm text-gray-500 mt-1">Real-time OTA price scraping, geospatial fact-checking, and anomaly detection.</p>
              </div>
              <button 
                onClick={runAnalysis}
                disabled={loading}
                className={`bg-black text-white text-sm font-medium px-5 py-2.5 rounded shadow-sm flex items-center transition-all ${loading ? 'opacity-70 cursor-wait' : 'hover:bg-gray-800 hover:shadow'}`}
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                )}
                {loading ? 'Executing Scan...' : 'Execute Analysis'}
              </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* LEFT COL: CONFIGURATION */}
              <div className="xl:col-span-1 space-y-6">
                
                {/* CONFIG CARD */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="px-5 py-4 border-b border-gray-200">
                    <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Property Configuration</h2>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Target Property</label>
                      <input type="text" value={config.hotelName} onChange={(e) => setConfig({...config, hotelName: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded text-sm px-3 py-2 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"/>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Monitored Comp Set</label>
                        <button onClick={() => setShowMap(!showMap)} className="text-[10px] uppercase font-bold text-blue-600 hover:text-blue-800 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          {showMap ? "Hide Geo-Map" : "Geo-Discover"}
                        </button>
                      </div>
                      <textarea value={config.competitors} onChange={(e) => setConfig({...config, competitors: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded text-sm px-3 py-2 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all resize-none" rows={2}/>
                    </div>

                    {/* MAP WRAPPER MODULE */}
                    {showMap && (
                      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md animate-in fade-in duration-300">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">Radius Limit: {radiusKm} km</label>
                          <input type="range" min="1" max="10" step="0.5" value={radiusKm} onChange={(e) => setRadiusKm(parseFloat(e.target.value))} className="w-1/2 accent-black h-1 bg-gray-200 rounded appearance-none cursor-pointer"/>
                        </div>
                        <div className="h-48 w-full relative bg-gray-100 rounded overflow-hidden">
                          {mapState.isLoading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 z-10 bg-gray-100">
                              <svg className="animate-spin h-5 w-5 mb-2" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                              <span className="text-[10px] uppercase font-bold tracking-widest">Geocoding Location...</span>
                            </div>
                          ) : mapState.error ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 z-10 bg-red-50 p-4 text-center">
                              <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                              <span className="text-[10px] uppercase font-bold">{mapState.error}</span>
                            </div>
                          ) : mapState.targetLocation && (
                            <MapWrapper 
                              targetLocation={mapState.targetLocation}
                              radiusKm={radiusKm}
                              nearbyHotels={mapState.nearbyHotels}
                              selectedCompetitors={selectedComps}
                              onToggleCompetitor={toggleCompetitor}
                            />
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2 text-center">
                          {mapState.nearbyHotels.length > 0 ? `Found ${mapState.nearbyHotels.length} real properties nearby.` : "Click markers to add/remove competitors within the radius."}
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 mt-4">Alert Dispatch (WhatsApp)</label>
                      <input type="text" value={config.whatsapp} onChange={(e) => setConfig({...config, whatsapp: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded text-sm px-3 py-2 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-mono"/>
                    </div>
                  </div>
                </div>

                {/* PMS CARD */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Internal Telemetry (PMS)</h2>
                    <span className="font-mono text-xs font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-600 border border-gray-200">{pmsData.occupancy}% OCC</span>
                  </div>
                  <div className="p-5">
                    <p className="text-[13px] text-gray-500 mb-4 leading-relaxed">Adjust current property occupancy. The decision engine weights this metric against market fluctuations.</p>
                    <input type="range" min="0" max="100" value={pmsData.occupancy} onChange={(e) => setPmsData({...pmsData, occupancy: parseInt(e.target.value)})} className="w-full accent-black h-1 bg-gray-200 rounded appearance-none cursor-pointer"/>
                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-gray-400 mt-3">
                      <span>Critically Low (0%)</span>
                      <span>Capacity (100%)</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* RIGHT COL: OUTPUTS */}
              <div className="xl:col-span-2 space-y-6">
                
                {/* RESULTS AREA */}
                {result && !loading ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* PRIMARY SIGNAL */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex">
                      <div className={`w-2 ${
                        result.action === 'RAISE' ? 'bg-black' : 
                        result.action === 'DROP' ? 'bg-red-600' : 'bg-gray-400'
                      }`}></div>
                      <div className="p-6 flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Algorithmic Directive</span>
                          <span className="text-xs text-gray-400 font-mono">{new Date().toISOString().split('T')[0]}</span>
                        </div>
                        <div className="flex items-baseline space-x-4 mb-2">
                          <h2 className="text-3xl font-bold tracking-tight">{result.action} RATE</h2>
                          <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${
                            result.action === 'RAISE' ? 'bg-black text-white border-black' : 
                            result.action === 'DROP' ? 'bg-red-50 text-red-700 border-red-200' : 
                            'bg-gray-100 text-gray-700 border-gray-200'
                          }`}>
                            Confidence: High
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">{result.reason}</p>
                      </div>
                    </div>

                    {/* METRICS GRID */}
                    <div className="grid grid-cols-3 gap-6">
                      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Comp Set Median</p>
                        <p className="text-2xl font-semibold tracking-tight">₹{result.currentMedian.toLocaleString()}</p>
                        <p className="text-[11px] text-gray-400 mt-2 font-mono">baseline: ₹{result.baseline.toLocaleString()}</p>
                      </div>
                      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Market Variance</p>
                        <p className={`text-2xl font-semibold tracking-tight ${result.shiftPct > 0 ? 'text-black' : result.shiftPct < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                          {result.shiftPct > 0 ? '+' : ''}{result.shiftPct.toFixed(2)}%
                        </p>
                        <p className="text-[11px] text-gray-400 mt-2 font-mono">vs 14-day trailing avg</p>
                      </div>
                      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
                        <div>
                          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Demand Drivers</p>
                          <p className="text-sm font-medium text-gray-800 line-clamp-2">{result.event || "Standard Demand"}</p>
                        </div>
                        {result.event && (
                          <span className="inline-block mt-2 text-[10px] uppercase font-bold text-white bg-black px-1.5 py-0.5 rounded w-max">Active Event</span>
                        )}
                      </div>
                    </div>

                    {/* EXPLAINABILITY: FACT CHECK & REASONING */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* FACT CHECK */}
                      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
                          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Fact Check: Data Sources</h2>
                        </div>
                        <div className="p-5">
                          <p className="text-xs text-gray-500 mb-4">Prices extracted from OTA snippets via DuckDuckGo standard search:</p>
                          <ul className="space-y-3">
                            {result.compData.map((comp, idx) => (
                              <li key={idx} className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                                <span className="text-sm font-medium text-gray-700">{comp.name}</span>
                                <span className="text-sm font-mono font-bold text-gray-900">₹{comp.price.toLocaleString()}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* REASONING ENGINE */}
                      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
                          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Decision Matrix / Reasoning</h2>
                        </div>
                        <div className="p-5">
                          <ul className="space-y-3 relative before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-gray-200">
                            {result.logicSteps.map((step, idx) => (
                              <li key={idx} className="relative pl-6 text-sm text-gray-600">
                                <span className={`absolute left-0 top-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border bg-white ${idx === result.logicSteps.length - 1 ? 'border-black text-black' : 'border-gray-300 text-gray-500'}`}>
                                  {idx + 1}
                                </span>
                                <span className={`block pl-2 pt-0.5 leading-snug ${idx === result.logicSteps.length - 1 ? 'font-semibold text-gray-900' : ''}`}>
                                  {step}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* LOGS TERMINAL */}
                    <div className="bg-[#0A0A0A] rounded-lg shadow-sm border border-gray-800 overflow-hidden mt-6">
                      <div className="bg-[#111] px-4 py-2.5 border-b border-gray-800 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Execution Trace</span>
                        <span className="w-2 h-2 rounded-full bg-green-500 opacity-50"></span>
                      </div>
                      <div className="p-4 h-40 overflow-y-auto font-mono text-[11px] leading-relaxed text-gray-300">
                        <pre className="whitespace-pre-wrap">{logs}</pre>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 border-dashed h-64 flex flex-col items-center justify-center text-gray-400">
                    {loading ? (
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>
                        <p className="text-sm font-medium text-gray-600">Processing market intelligence...</p>
                      </div>
                    ) : (
                      <>
                        <svg className="w-8 h-8 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        <p className="text-sm font-medium text-gray-500">System Standby</p>
                        <p className="text-xs text-gray-400 mt-1">Configure property and execute analysis to view signals.</p>
                      </>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
