"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

export interface CompetitorChannelData {
  rate: number;
  rawRoom: string;
}

export interface Competitor {
  id: number;
  name: string;
  starRating: number;
  reviewScore: number;
  channels: {
    Agoda: CompetitorChannelData;
    "Booking.com": CompetitorChannelData;
    MakeMyTrip: CompetitorChannelData;
  };
  history14Days: Array<{
    day: string;
    competitorRate: number;
    myRate: number;
  }>;
}

export interface SelectedCellDetails {
  competitor: Competitor;
  channel: "Agoda" | "Booking.com" | "MakeMyTrip";
  competitorRate: number;
  myRate: number;
  rawRoom: string;
}

interface CompetitorMatrixProps {
  onRateUpdated?: (msg: string) => void;
}

export default function CompetitorMatrix({ onRateUpdated }: CompetitorMatrixProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    myHotel: { name: string; standardRate: number };
    competitors: Competitor[];
    channels: Array<"Agoda" | "Booking.com" | "MakeMyTrip">;
  } | null>(null);

  const [selectedCell, setSelectedCell] = useState<SelectedCellDetails | null>(null);
  const [isMatchingRate, setIsMatchingRate] = useState(false);
  const [activeChannelFilter, setActiveChannelFilter] = useState<string>("All");

  useEffect(() => {
    fetchMatrixData();
  }, []);

  const fetchMatrixData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rates/matrix?hotelId=1");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load rate matrix:", err);
    } finally {
      setLoading(false);
    }
  };

  const myRate = data?.myHotel.standardRate || 7200;

  const handleMatchRate = async () => {
    if (!selectedCell) return;
    setIsMatchingRate(true);
    try {
      const res = await fetch("/api/recommendations/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendationId: 1,
          hotelId: 1,
          customRate: selectedCell.competitorRate,
        }),
      });
      const result = await res.json();
      if (result.success) {
        if (onRateUpdated) {
          onRateUpdated(
            `Matched ${selectedCell.competitor.name} at ₹${selectedCell.competitorRate.toLocaleString("en-IN")} via eZee Centrix.`
          );
        }
        // Update local state
        if (data) {
          setData({
            ...data,
            myHotel: {
              ...data.myHotel,
              standardRate: selectedCell.competitorRate,
            },
          });
        }
        setSelectedCell((prev) =>
          prev ? { ...prev, myRate: selectedCell.competitorRate } : null
        );
      }
    } catch (err) {
      console.error("Error matching competitor rate:", err);
    } finally {
      setIsMatchingRate(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm animate-pulse flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
        <p className="text-xs text-gray-500 font-medium">Loading Multi-Channel Competitor Matrix...</p>
      </div>
    );
  }

  if (!data) return null;

  const channels: Array<"Agoda" | "Booking.com" | "MakeMyTrip"> =
    activeChannelFilter === "All"
      ? ["Agoda", "Booking.com", "MakeMyTrip"]
      : [activeChannelFilter as "Agoda" | "Booking.com" | "MakeMyTrip"];

  return (
    <div className="relative bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header & Controls */}
      <div className="px-6 py-5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-gray-50 to-white">
        <div>
          <div className="flex items-center space-x-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <h2 className="text-base font-semibold text-gray-900 tracking-tight">
              Live Competitor Rate Matrix
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
              Your Rate: ₹{myRate.toLocaleString("en-IN")}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time OTA price surveillance. Click any cell to inspect 14-day history and execute rate actions.
          </p>
        </div>

        {/* Channel Filter Badges */}
        <div className="flex items-center space-x-1.5 bg-gray-100 p-1 rounded-lg border border-gray-200 text-xs">
          {["All", "Agoda", "Booking.com", "MakeMyTrip"].map((ch) => (
            <button
              key={ch}
              onClick={() => setActiveChannelFilter(ch)}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                activeChannelFilter === ch
                  ? "bg-white text-black shadow-xs font-semibold"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-2.5 bg-gray-50/70 border-b border-gray-200 flex items-center justify-between text-[11px] text-gray-600">
        <div className="flex items-center space-x-6">
          <span className="flex items-center">
            <span className="w-3 h-3 rounded-xs bg-red-100 border border-red-300 mr-1.5"></span>
            <strong className="font-semibold text-red-800">Red:</strong>
            <span className="ml-1 text-red-700">Competitor Undercutting (Below Your Rate)</span>
          </span>
          <span className="flex items-center">
            <span className="w-3 h-3 rounded-xs bg-emerald-100 border border-emerald-300 mr-1.5"></span>
            <strong className="font-semibold text-emerald-800">Green:</strong>
            <span className="ml-1 text-emerald-700">Competitor Higher (Compression / Premium Yield)</span>
          </span>
        </div>
        <span className="text-gray-400 font-mono text-[10px]">Auto-refreshed via Scout Scraper</span>
      </div>

      {/* Rate Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50 text-[11px] uppercase tracking-wider font-semibold text-gray-500">
              <th className="py-3.5 px-6">Competitor Property</th>
              <th className="py-3.5 px-4">Rating</th>
              {channels.map((ch) => (
                <th key={ch} className="py-3.5 px-4 text-right">
                  {ch}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.competitors.map((comp) => (
              <tr key={comp.id} className="hover:bg-gray-50/70 transition-colors">
                <td className="py-4 px-6 font-medium text-gray-900">
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">{comp.name}</span>
                    <span className="text-[11px] text-gray-400 font-mono">
                      Comp ID #{comp.id} • Verified OTA Listing
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    ★ {comp.starRating} ({comp.reviewScore})
                  </span>
                </td>
                {channels.map((ch) => {
                  const channelInfo = comp.channels[ch];
                  const rate = channelInfo?.rate || 0;
                  const isUndercut = rate < myRate;
                  const isHigher = rate > myRate;
                  const delta = rate - myRate;
                  const deltaPct = ((delta / myRate) * 100).toFixed(1);

                  return (
                    <td key={ch} className="py-3 px-4 text-right">
                      <button
                        onClick={() =>
                          setSelectedCell({
                            competitor: comp,
                            channel: ch,
                            competitorRate: rate,
                            myRate,
                            rawRoom: channelInfo?.rawRoom || "Standard Room",
                          })
                        }
                        className={`w-full text-right p-2.5 rounded-lg border transition-all duration-150 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-black ${
                          isUndercut
                            ? "bg-red-50/80 border-red-200 hover:bg-red-100 hover:border-red-300"
                            : isHigher
                            ? "bg-emerald-50/80 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300"
                            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex flex-col items-end">
                          <span
                            className={`font-mono font-bold text-sm ${
                              isUndercut
                                ? "text-red-700"
                                : isHigher
                                ? "text-emerald-700"
                                : "text-gray-800"
                            }`}
                          >
                            ₹{rate.toLocaleString("en-IN")}
                          </span>
                          <span
                            className={`text-[10px] font-medium mt-0.5 ${
                              isUndercut
                                ? "text-red-600"
                                : isHigher
                                ? "text-emerald-600"
                                : "text-gray-500"
                            }`}
                          >
                            {delta > 0 ? `+₹${delta.toLocaleString("en-IN")} (+${deltaPct}%)` : `₹${delta.toLocaleString("en-IN")} (${deltaPct}%)`}
                          </span>
                        </div>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SLIDE-OUT ANALYSIS PANEL / DRAWER */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between border-l border-gray-200 animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                  Price Gap Analysis & Telemetry
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-0.5">
                  {selectedCell.competitor.name}
                </h3>
                <span className="text-xs text-gray-500">
                  Channel: <strong className="text-black">{selectedCell.channel}</strong>
                </span>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Rate Comparison Card */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <span className="text-[11px] uppercase font-bold text-gray-500">Your Current Rate</span>
                  <p className="text-2xl font-bold font-mono text-gray-900 mt-1">
                    ₹{selectedCell.myRate.toLocaleString("en-IN")}
                  </p>
                  <span className="text-[11px] text-gray-400">The Claridges (BAR)</span>
                </div>
                <div
                  className={`p-4 rounded-xl border ${
                    selectedCell.competitorRate < selectedCell.myRate
                      ? "bg-red-50 border-red-200"
                      : "bg-emerald-50 border-emerald-200"
                  }`}
                >
                  <span
                    className={`text-[11px] uppercase font-bold ${
                      selectedCell.competitorRate < selectedCell.myRate
                        ? "text-red-700"
                        : "text-emerald-700"
                    }`}
                  >
                    Competitor Rate
                  </span>
                  <p
                    className={`text-2xl font-bold font-mono mt-1 ${
                      selectedCell.competitorRate < selectedCell.myRate
                        ? "text-red-800"
                        : "text-emerald-800"
                    }`}
                  >
                    ₹{selectedCell.competitorRate.toLocaleString("en-IN")}
                  </p>
                  <span
                    className={`text-[11px] font-semibold ${
                      selectedCell.competitorRate < selectedCell.myRate
                        ? "text-red-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {selectedCell.competitorRate < selectedCell.myRate
                      ? `Undercutting by ₹${(selectedCell.myRate - selectedCell.competitorRate).toLocaleString("en-IN")}`
                      : `Premium: +₹${(selectedCell.competitorRate - selectedCell.myRate).toLocaleString("en-IN")}`}
                  </span>
                </div>
              </div>

              {/* Scraped OTA Listing Info */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-2">
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                  Raw OTA Scraped Listing Title
                </span>
                <p className="text-xs font-mono text-gray-800 bg-gray-50 p-2.5 rounded border border-gray-200">
                  {selectedCell.rawRoom}
                </p>
                <div className="flex justify-between text-xs text-gray-500 pt-1">
                  <span>Guest Rating: <strong>{selectedCell.competitor.reviewScore}/10</strong></span>
                  <span>Classification: <strong>5-Star Luxury</strong></span>
                </div>
              </div>

              {/* 14-DAY PRICE HISTORY LINE CHART (RECHARTS) */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold text-gray-700 tracking-wider">
                    14-Day Price History Trajectory
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">Recharts Telemetry</span>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedCell.competitor.history14Days} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="day" stroke="#9ca3af" fontSize={10} tickLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} domain={["auto", "auto"]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#000",
                          borderRadius: "8px",
                          color: "#fff",
                          fontSize: "11px",
                          border: "none",
                        }}
                        formatter={(val: unknown) => [`₹${Number(val).toLocaleString("en-IN")}`, ""]}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                      <Line
                        type="monotone"
                        dataKey="competitorRate"
                        name={selectedCell.competitor.name}
                        stroke="#dc2626"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="myRate"
                        name="Your Hotel (Claridges)"
                        stroke="#059669"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={{ r: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between space-x-4">
              <button
                onClick={() => setSelectedCell(null)}
                className="px-4 py-2.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={handleMatchRate}
                disabled={isMatchingRate}
                className="flex-1 bg-black text-white text-xs font-semibold py-2.5 px-4 rounded-lg shadow-sm hover:bg-gray-800 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isMatchingRate ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Syncing Channel Manager...</span>
                  </>
                ) : (
                  <>
                    <span>⚡ Match Competitor Rate (₹{selectedCell.competitorRate.toLocaleString("en-IN")})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
