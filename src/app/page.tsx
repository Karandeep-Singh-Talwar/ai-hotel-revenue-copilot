"use client";

import { useState } from "react";

// Define the shape of our API result to satisfy TypeScript instead of using 'any'
interface AnalysisResult {
  currentMedian: number;
  baseline: number;
  shiftPct: number;
  action: "RAISE" | "DROP" | "HOLD";
  reason: string;
  alertMsg: string;
  event: string | null;
}

export default function Dashboard() {
  const [config, setConfig] = useState({
    hotelName: "Taj Mahal New Delhi",
    competitors: "Oberoi, Leela Palace, ITC Maurya",
    whatsapp: "+919876543210",
  });
  
  const [pmsData, setPmsData] = useState({ occupancy: 65 });
  const [logs, setLogs] = useState("System ready. Awaiting telemetry...");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setResult(null);
    setLogs("[SYS] Initializing Revenue Intelligence Core...\n[SYS] Bypassing OTA Bot Managers...\n[SYS] Aggregating Competitor Set Pricing...\n[SYS] Ingesting PMS Context...\n");
    
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelName: config.hotelName,
          competitors: config.competitors.split(",").map((s) => s.trim()),
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
          <a href="#" className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md">
            <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            Comp Sets
          </a>
          <a href="#" className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md">
            <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            Settings
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
                <p className="text-sm text-gray-500 mt-1">Real-time OTA price scraping and anomaly detection.</p>
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
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Monitored Comp Set</label>
                      <textarea value={config.competitors} onChange={(e) => setConfig({...config, competitors: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded text-sm px-3 py-2 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all resize-none" rows={2}/>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Alert Dispatch (WhatsApp)</label>
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

                {/* LOGS TERMINAL */}
                <div className="bg-[#0A0A0A] rounded-lg shadow-sm border border-gray-800 overflow-hidden">
                  <div className="bg-[#111] px-4 py-2.5 border-b border-gray-800 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Execution Trace</span>
                    <span className="w-2 h-2 rounded-full bg-green-500 opacity-50"></span>
                  </div>
                  <div className="p-4 h-40 overflow-y-auto font-mono text-[11px] leading-relaxed text-gray-300">
                    <pre className="whitespace-pre-wrap">{logs}</pre>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
