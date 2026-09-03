"use client";

import { useState } from "react";

export default function Dashboard() {
  const [config, setConfig] = useState({
    hotelName: "Taj Mahal New Delhi",
    competitors: "Oberoi, Leela Palace, ITC Maurya",
    whatsapp: "+919876543210",
  });
  
  const [pmsData, setPmsData] = useState({ occupancy: 65, adr: 15000 });
  const [logs, setLogs] = useState("System ready. Configure your hotel and PMS data, then run analysis.");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setResult(null);
    setLogs("Connecting to Engine...\nScraping OTA Competitors (DuckDuckGo HTML Bypass)...\nQuerying Local Events...\nExtracting PMS Context...\n");
    
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
        setLogs((prev) => prev + "\nError: " + data.message);
      }
    } catch (err) {
      setLogs((prev) => prev + "\nNetwork Error: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800">Revenue Copilot</h1>
            </div>
            <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Demo Environment
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN - CONFIG */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  Setup
                </h2>
              </div>
              <div className="p-5 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Target Hotel</label>
                  <input type="text" value={config.hotelName} onChange={(e) => setConfig({...config, hotelName: e.target.value})} className="w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border transition-colors"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Competitors (Comma separated)</label>
                  <textarea value={config.competitors} onChange={(e) => setConfig({...config, competitors: e.target.value})} className="w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border transition-colors" rows={2}/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">WhatsApp Recipient</label>
                  <input type="text" value={config.whatsapp} onChange={(e) => setConfig({...config, whatsapp: e.target.value})} className="w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border transition-colors"/>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                  PMS Context
                </h2>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{pmsData.occupancy}%</span>
              </div>
              <div className="p-5">
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">Simulate your hotel's internal occupancy. The AI changes its strategy based on how full you are.</p>
                <input type="range" min="0" max="100" value={pmsData.occupancy} onChange={(e) => setPmsData({...pmsData, occupancy: parseInt(e.target.value)})} className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"/>
                <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                  <span>0% (Empty)</span>
                  <span>100% (Full)</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={runAnalysis}
              disabled={loading}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center ${loading ? 'opacity-80 cursor-not-allowed' : 'hover:-translate-y-0.5 hover:shadow-lg'}`}
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              )}
              {loading ? 'Analyzing Market...' : 'Run Intelligence'}
            </button>
          </div>

          {/* RIGHT COLUMN - RESULTS */}
          <div className="lg:col-span-8 space-y-6">
            {!result && !loading && (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 h-[400px] flex flex-col items-center justify-center text-slate-400">
                <svg className="w-16 h-16 mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                <p className="text-sm font-medium">No analysis run yet.</p>
                <p className="text-xs mt-1">Configure your parameters and click Run Intelligence.</p>
              </div>
            )}

            {loading && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 h-[400px] flex flex-col items-center justify-center space-y-6">
                <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-slate-700">AI is scraping live OTAs...</p>
                  <p className="text-sm text-slate-500 mt-1">Bypassing firewalls and calculating anomalies.</p>
                </div>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Highlight Card */}
                <div className={`rounded-2xl p-6 shadow-sm border ${
                  result.action === 'RAISE' ? 'bg-green-50 border-green-200' :
                  result.action === 'DROP' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`text-sm font-bold uppercase tracking-wider mb-1 ${
                        result.action === 'RAISE' ? 'text-green-700' : result.action === 'DROP' ? 'text-red-700' : 'text-slate-600'
                      }`}>Recommendation</p>
                      <h3 className={`text-4xl font-extrabold mb-3 ${
                        result.action === 'RAISE' ? 'text-green-900' : result.action === 'DROP' ? 'text-red-900' : 'text-slate-900'
                      }`}>{result.action} RATE</h3>
                      <p className={`text-lg font-medium leading-relaxed ${
                        result.action === 'RAISE' ? 'text-green-800' : result.action === 'DROP' ? 'text-red-800' : 'text-slate-700'
                      }`}>{result.reason}</p>
                    </div>
                  </div>
                </div>

                {/* Grid Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Market Median</p>
                    <p className="text-2xl font-bold text-slate-900">₹{result.currentMedian.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Price Shift</p>
                    <p className={`text-2xl font-bold ${result.shiftPct > 0 ? 'text-green-600' : result.shiftPct < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                      {result.shiftPct > 0 ? '+' : ''}{result.shiftPct.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Local Event</p>
                    <p className="text-sm font-bold text-slate-900 mt-1 line-clamp-2">{result.event || "No major events"}</p>
                  </div>
                </div>

                {/* WhatsApp Preview */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-[#075E54] px-4 py-3 flex items-center">
                    <svg className="w-5 h-5 text-white mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    <span className="text-white font-medium text-sm">WhatsApp Preview</span>
                  </div>
                  <div className="bg-[#E5DDD5] p-6 relative">
                    {/* Background pattern mock */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
                    <div className="bg-white rounded-lg rounded-tl-none p-4 shadow-sm relative z-10 max-w-lg">
                      <pre className="text-sm text-slate-800 font-sans whitespace-pre-wrap">{result.alertMsg}</pre>
                      <div className="text-right mt-1">
                        <span className="text-[10px] text-slate-400">Now</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* System Logs */}
            <div className="bg-slate-900 rounded-2xl shadow-sm overflow-hidden border border-slate-800 mt-6">
              <div className="bg-slate-800 px-5 py-3 border-b border-slate-700 flex items-center justify-between">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-xs text-slate-400 font-mono tracking-wider">system.log</span>
              </div>
              <div className="p-5 h-48 overflow-y-auto">
                <pre className="text-emerald-400 font-mono text-xs whitespace-pre-wrap leading-relaxed">{logs}</pre>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
