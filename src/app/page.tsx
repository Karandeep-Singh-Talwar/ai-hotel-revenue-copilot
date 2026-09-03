"use client";

import { useState, useEffect } from "react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("analysis");
  const [config, setConfig] = useState({
    hotelName: "Taj Mahal New Delhi",
    competitors: "Oberoi, Leela Palace, ITC Maurya",
    whatsapp: "+919876543210",
  });
  
  const [pmsData, setPmsData] = useState({
    occupancy: 65,
    adr: 15000,
  });

  const [logs, setLogs] = useState("System ready. Configure your hotel and PMS data, then run analysis.");
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
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
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <nav className="bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold tracking-tight">AI Hotel Revenue Copilot</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar / Configuration */}
          <div className="w-full md:w-1/3 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4 text-slate-800 border-b pb-2">Hotel Configuration</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Hotel</label>
                  <input 
                    type="text" 
                    value={config.hotelName}
                    onChange={(e) => setConfig({...config, hotelName: e.target.value})}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Competitor Set (CSV)</label>
                  <textarea 
                    value={config.competitors}
                    onChange={(e) => setConfig({...config, competitors: e.target.value})}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Recipient</label>
                  <input 
                    type="text" 
                    value={config.whatsapp}
                    onChange={(e) => setConfig({...config, whatsapp: e.target.value})}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4 text-slate-800 border-b pb-2">PMS Integration (Mock)</h2>
              <p className="text-xs text-gray-500 mb-4">In production, this automatically syncs via API or CSV upload from SiteMinder/Opera.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Occupancy: {pmsData.occupancy}%</label>
                  <input 
                    type="range" 
                    min="0" max="100"
                    value={pmsData.occupancy}
                    onChange={(e) => setPmsData({...pmsData, occupancy: parseInt(e.target.value)})}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Empty</span>
                    <span>Sold Out</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Action Area */}
          <div className="w-full md:w-2/3 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center min-h-[200px] text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Run AI Market Intelligence</h2>
              <p className="text-gray-600 mb-6 max-w-lg">
                The agent will fetch live market rates, query local event impacts, and cross-reference your {pmsData.occupancy}% PMS occupancy to formulate a WhatsApp pricing recommendation.
              </p>
              
              <button 
                onClick={runAnalysis}
                disabled={loading}
                className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-all flex items-center ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                )}
                {loading ? 'Analyzing Market...' : 'Generate AI Recommendation'}
              </button>
            </div>

            {/* Terminal Window */}
            <div className="bg-slate-900 rounded-xl shadow-lg overflow-hidden border border-slate-700">
              <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-xs text-slate-400 font-mono">system.log</span>
              </div>
              <div className="p-4 h-96 overflow-y-auto">
                <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">{logs}</pre>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
