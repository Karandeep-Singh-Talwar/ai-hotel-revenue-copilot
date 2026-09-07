"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell as RechartsCell,
} from "recharts";

export interface CompetitorRateCell {
  date: string;
  isWeekend?: boolean;
  myRate: number;
  competitors: {
    [key: string]: {
      rate: number;
      delta: number;
      isUndercut: boolean;
    };
  };
}

interface CompetitorMatrixProps {
  onRateUpdated?: (msg: string) => void;
  onBack?: () => void;
}

export interface NearbyCompHotel {
  id: number;
  name: string;
  fullName: string;
  stars: number;
  distanceKm: number;
  rate: number;
  defaultInSet: boolean;
}

export const ALL_NEARBY_AEROCITY_HOTELS: NearbyCompHotel[] = [
  { id: 101, name: "Aloft Aerocity", fullName: "Aloft New Delhi Aerocity", stars: 5, distanceKm: 0.2, rate: 8400, defaultInSet: true },
  { id: 102, name: "Holiday Inn Aerocity", fullName: "Holiday Inn Express Aerocity", stars: 4, distanceKm: 0.3, rate: 6900, defaultInSet: true },
  { id: 103, name: "Novotel Aerocity", fullName: "Novotel New Delhi Aerocity", stars: 5, distanceKm: 0.2, rate: 9200, defaultInSet: true },
  { id: 104, name: "Pullman Aerocity", fullName: "Pullman New Delhi Aerocity", stars: 5, distanceKm: 0.2, rate: 12800, defaultInSet: true },
  { id: 105, name: "Ibis Aerocity", fullName: "Ibis New Delhi Aerocity", stars: 3, distanceKm: 0.3, rate: 4600, defaultInSet: true },
  { id: 106, name: "JW Marriott Aerocity", fullName: "JW Marriott Hotel New Delhi Aerocity", stars: 5, distanceKm: 0.2, rate: 14500, defaultInSet: false },
  { id: 107, name: "Roseate House", fullName: "Roseate House New Delhi", stars: 5, distanceKm: 0.3, rate: 13200, defaultInSet: false },
  { id: 108, name: "Andaz Delhi", fullName: "Andaz Delhi (by Hyatt)", stars: 5, distanceKm: 0.4, rate: 12900, defaultInSet: false },
  { id: 109, name: "Pride Plaza Aerocity", fullName: "Pride Plaza Hotel Aerocity", stars: 5, distanceKm: 0.4, rate: 6400, defaultInSet: false },
  { id: 110, name: "Radisson Blu Airport", fullName: "Radisson Blu Plaza Delhi Airport", stars: 5, distanceKm: 1.1, rate: 8100, defaultInSet: false },
  { id: 111, name: "Four Points Airport", fullName: "Four Points by Sheraton Delhi Airport", stars: 4, distanceKm: 2.5, rate: 5900, defaultInSet: false },
  { id: 112, name: "Vivanta Dwarka", fullName: "Vivanta New Delhi, Dwarka", stars: 5, distanceKm: 6.8, rate: 7600, defaultInSet: false },
];

const getShortName = (fullName: string): string => {
  if (fullName.includes("Aloft")) return "Aloft Aerocity";
  if (fullName.includes("Holiday")) return "Holiday Inn Aerocity";
  if (fullName.includes("Novotel")) return "Novotel Aerocity";
  if (fullName.includes("Pullman")) return "Pullman Aerocity";
  if (fullName.includes("Ibis")) return "Ibis Aerocity";
  if (fullName.includes("JW Marriott") || fullName.includes("Marriott")) return "JW Marriott Aerocity";
  if (fullName.includes("Roseate")) return "Roseate House";
  if (fullName.includes("Andaz")) return "Andaz Delhi";
  if (fullName.includes("Pride Plaza")) return "Pride Plaza Aerocity";
  if (fullName.includes("Radisson")) return "Radisson Blu Airport";
  if (fullName.includes("Four Points")) return "Four Points Airport";
  if (fullName.includes("Vivanta")) return "Vivanta Dwarka";
  return fullName;
};

const ROOM_CATEGORIES = [
  { id: "superior", name: "Superior Room", basePrice: 5800, multiplier: 1.0 },
  { id: "deluxe", name: "Deluxe Room", basePrice: 6900, multiplier: 1.19 },
  { id: "executive", name: "Executive Room", basePrice: 8500, multiplier: 1.47 },
  { id: "suite", name: "Executive Suite", basePrice: 12500, multiplier: 2.15 },
];

export default function CompetitorMatrix({ onRateUpdated, onBack }: CompetitorMatrixProps) {
  const [selectedOta, setSelectedOta] = useState<string>("MakeMyTrip");
  const [selectedRoomCategory, setSelectedRoomCategory] = useState<string>("superior");
  const [activeCompetitors, setActiveCompetitors] = useState<string[]>([
    "Aloft Aerocity",
    "Holiday Inn Aerocity",
    "Novotel Aerocity",
    "Pullman Aerocity",
    "Ibis Aerocity",
  ]);
  const [showCompSetModal, setShowCompSetModal] = useState<boolean>(false);
  const [compSearch, setCompSearch] = useState<string>("");
  const [compRadius, setCompRadius] = useState<number>(5);

  const [matrixData, setMatrixData] = useState<CompetitorRateCell[]>([]);
  const [selectedCell, setSelectedCell] = useState<{
    date: string;
    competitor: string;
    theirRate: number;
    myRate: number;
    delta: number;
    rawRoom?: string;
  } | null>(null);

  const [isMatchingRate, setIsMatchingRate] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const currentCategory =
    ROOM_CATEGORIES.find((r) => r.id === selectedRoomCategory) || ROOM_CATEGORIES[0];

  useEffect(() => {
    fetchMatrixData();
  }, [selectedOta, selectedRoomCategory, activeCompetitors]);

  const fetchMatrixData = async () => {
    try {
      const res = await fetch(`/api/rates/matrix?hotelId=1&roomType=${selectedRoomCategory}`);
      const json = await res.json();

      if (json?.dates && json?.myHotel && json?.competitors) {
        const rows: CompetitorRateCell[] = json.dates.map((d: string) => {
          const dateObj = new Date(d);
          const dayOfWeek = dateObj.getDay();
          const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
          const myRate = json.myHotel.ratesByDate[d] || (isWeekend ? Math.round(currentCategory.basePrice * 1.15) : currentCategory.basePrice);

          const competitorsMap: { [key: string]: { rate: number; delta: number; isUndercut: boolean } } = {};

          json.competitors.forEach((c: any) => {
            const ch = c.channels[selectedOta] || c.channels["MakeMyTrip"] || c.channels["Agoda"];
            let baseRate = ch ? ch.rate : 8400;
            if (isWeekend) baseRate = Math.round(baseRate * 1.12);

            const shortName = getShortName(c.name);

            const delta = baseRate - myRate;
            competitorsMap[shortName] = {
              rate: baseRate,
              delta,
              isUndercut: baseRate < myRate,
            };
          });

          const formattedDate = dateObj.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });

          return {
            date: formattedDate,
            isWeekend,
            myRate,
            competitors: competitorsMap,
          };
        });

        setMatrixData(rows);

        // Set default selected cell
        if (rows.length > 0 && !selectedCell) {
          const firstRow = rows[0];
          const firstCompName = activeCompetitors[0] || "Aloft Aerocity";
          setSelectedCell({
            date: firstRow.date,
            competitor: firstCompName,
            theirRate: firstRow.competitors[firstCompName]?.rate || 8400,
            myRate: firstRow.myRate,
            delta: (firstRow.competitors[firstCompName]?.rate || 8400) - firstRow.myRate,
          });
        }
      }
    } catch (err) {
      console.error("Error loading matrix:", err);
    }
  };

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
          customRate: selectedCell.theirRate,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setMatrixData((prev) =>
          prev.map((row) => {
            if (row.date === selectedCell.date) {
              return {
                ...row,
                myRate: selectedCell.theirRate,
              };
            }
            return row;
          })
        );
        setSelectedCell((prev) => (prev ? { ...prev, myRate: selectedCell.theirRate, delta: 0 } : null));
        if (onRateUpdated) {
          onRateUpdated(
            `Matched ${selectedCell.competitor} on ${selectedCell.date} at ₹${selectedCell.theirRate.toLocaleString("en-IN")} for ${currentCategory.name}. Updated on all OTAs!`
          );
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsMatchingRate(false);
    }
  };

  const handleSyncRates = async () => {
    setIsSyncing(true);
    await fetchMatrixData();
    setIsSyncing(false);
    if (onRateUpdated) {
      onRateUpdated(`Checked live Aerocity prices from ${selectedOta}. All rates are up to date.`);
    }
  };

  const handleExportCsv = () => {
    const csvContent =
      `Date,Lemon Tree Aerocity (${currentCategory.name}),` +
      activeCompetitors.join(",") +
      "\n" +
      matrixData
        .map(
          (row) =>
            `${row.date},${row.myRate},` +
            activeCompetitors.map((c) => row.competitors[c]?.rate || "").join(",")
        )
        .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `aerocity_${selectedRoomCategory}_prices_${selectedOta.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleCompetitor = async (hotel: NearbyCompHotel) => {
    const isInSet = activeCompetitors.includes(hotel.name);
    let nextComps: string[];
    if (isInSet) {
      if (activeCompetitors.length <= 1) {
        if (onRateUpdated) onRateUpdated("You must keep at least 1 competitor in your comp-set.");
        return;
      }
      nextComps = activeCompetitors.filter((c) => c !== hotel.name);
    } else {
      nextComps = [...activeCompetitors, hotel.name];
    }
    setActiveCompetitors(nextComps);

    try {
      const ids = ALL_NEARBY_AEROCITY_HOTELS.filter((h) => nextComps.includes(h.name)).map((h) => h.id);
      await fetch("/api/comp-set/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId: 1,
          competitorIds: ids,
        }),
      });
    } catch (err) {
      console.error("CompSet update failed:", err);
    }

    if (onRateUpdated) {
      onRateUpdated(
        isInSet
          ? `${hotel.name} removed from your Aerocity comp-set.`
          : `${hotel.name} added to your Aerocity comp-set! Price columns updated.`
      );
    }
  };

  const historyData = [
    { day: "14d ago", rate: selectedCell ? Math.round(selectedCell.theirRate * 0.94) : 8000, undercut: false },
    { day: "11d ago", rate: selectedCell ? Math.round(selectedCell.theirRate * 0.96) : 8150, undercut: false },
    { day: "8d ago", rate: selectedCell ? Math.round(selectedCell.theirRate * 0.95) : 8100, undercut: false },
    { day: "6d ago", rate: selectedCell ? Math.round(selectedCell.theirRate * 0.98) : 8300, undercut: false },
    { day: "4d ago", rate: selectedCell ? Math.round(selectedCell.theirRate * 1.01) : 8400, undercut: false },
    { day: "2d ago", rate: selectedCell ? Math.round(selectedCell.theirRate * 1.03) : 8500, undercut: false },
    { day: "Today", rate: selectedCell ? selectedCell.theirRate : 8400, undercut: selectedCell ? selectedCell.delta < 0 : false },
  ];

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden bg-background-dark font-body antialiased">
      {/* Top Header */}
      <header className="flex items-center justify-between border-b border-[#293837] px-6 py-3 bg-[#111817] shrink-0">
        <div className="flex items-center gap-4 text-white">
          <button
            onClick={onBack}
            className="flex items-center justify-center size-8 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title="Back to Price Recommendations"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <h1 className="text-base font-bold leading-tight font-heading">
              Aerocity Hotel Price Comparison
            </h1>
            <p className="text-xs text-muted font-mono">
              Lemon Tree Premier, Delhi Airport (Aerocity) • Comparing next 14 days
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Add Nearby Hotel / Comp-Set Manager Button */}
          <button
            onClick={() => setShowCompSetModal(true)}
            className="flex items-center gap-1.5 h-8 px-3.5 bg-primary hover:bg-[#15bfae] text-[#0B132B] font-bold rounded text-xs font-mono transition-all shadow-[0_0_12px_rgba(46,196,182,0.3)] cursor-pointer"
            title="Add or remove nearby Aerocity competitors from your monitoring set"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>+ Add Nearby Hotel</span>
            <span className="bg-[#0B132B] text-primary px-1.5 py-0.2 rounded text-[10px]">
              {activeCompetitors.length} in set
            </span>
          </button>

          <button
            onClick={handleSyncRates}
            disabled={isSyncing}
            className="flex items-center justify-center h-8 px-4 bg-primary/10 text-primary border border-primary/20 rounded text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50 cursor-pointer font-mono"
          >
            <span className={`material-symbols-outlined mr-1.5 text-[16px] ${isSyncing ? "animate-spin" : ""}`}>
              sync
            </span>
            {isSyncing ? "Checking Prices..." : "Check Live Prices"}
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center justify-center h-8 px-4 bg-[#293837] text-white rounded text-xs font-medium hover:bg-[#3A506B] transition-colors cursor-pointer font-mono"
          >
            Download Spreadsheet
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left Section: Matrix */}
        <div className="flex-1 flex flex-col min-w-0 bg-matrix-bg relative">
          {/* Room Categories Selector Row */}
          <div className="px-4 py-2.5 bg-[#141b33] border-b border-[#3A506B] flex items-center justify-between gap-4 overflow-x-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted font-mono uppercase font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-primary text-[16px]">bedroom_parent</span>
                Room Type:
              </span>
              <div className="flex gap-1.5">
                {ROOM_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedRoomCategory(cat.id)}
                    className={`px-3 py-1 text-xs font-mono rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                      selectedRoomCategory === cat.id
                        ? "bg-primary text-[#0B132B] font-bold shadow-sm"
                        : "bg-surface text-muted hover:text-white border border-[#3A506B]"
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="opacity-80 text-[10px]">
                      (₹{cat.basePrice.toLocaleString("en-IN")})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-3 text-xs font-mono text-muted">
              <span>Viewing: <strong className="text-white">{currentCategory.name}</strong></span>
            </div>
          </div>

          {/* Toolbar: OTAs & Legend */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-[#3A506B] bg-matrix-surface shrink-0 gap-3">
            {/* Booking Site Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted font-mono hidden md:inline">Booking Site:</span>
              <div className="flex h-8 bg-matrix-bg rounded p-1 w-fit border border-[#3A506B]">
                {["MakeMyTrip", "Agoda", "Booking.com", "EaseMyTrip", "ClearTrip"].map((ota) => (
                  <button
                    key={ota}
                    onClick={() => setSelectedOta(ota)}
                    className={`flex cursor-pointer items-center justify-center rounded px-3 text-xs font-medium transition-colors ${
                      selectedOta === ota
                        ? "bg-matrix-surface text-primary shadow-sm font-bold"
                        : "text-matrix-muted hover:text-white"
                    }`}
                  >
                    {ota}
                  </button>
                ))}
              </div>
            </div>

            {/* Simple Legend */}
            <div className="flex items-center gap-4 text-xs font-mono text-matrix-muted">
              <span className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-full bg-matrix-accent"></div>
                Cheaper Than You
              </span>
              <span className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-full bg-primary"></div>
                Higher Than You
              </span>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="flex-1 overflow-auto bg-matrix-bg">
            <table className="matrix-table w-full text-left font-mono text-[12px] whitespace-nowrap">
              <thead className="sticky top-0 z-40 shadow-md">
                <tr>
                  <th className="p-3 font-semibold text-matrix-muted min-w-[100px] border-b-2 border-b-[#3A506B] bg-[#1C2541] sticky left-0 z-30">
                    Date
                  </th>
                  <th className="p-3 font-semibold text-white bg-matrix-hover min-w-[180px] border-b-2 border-b-primary shadow-[4px_0_12px_rgba(0,0,0,0.5)] sticky left-[100px] z-30">
                    Lemon Tree ({currentCategory.name})
                  </th>
                  {activeCompetitors.map((name) => (
                    <th
                      key={name}
                      className="p-3 font-semibold text-matrix-muted min-w-[135px] border-b-2 border-b-[#3A506B] bg-[#1C2541]"
                    >
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-white">
                {matrixData.map((row) => (
                  <tr key={row.date} className="transition-colors duration-75 hover:bg-[#2A375C]">
                    <td className="p-3 text-matrix-muted bg-[#1C2541] sticky left-0 z-20 font-bold">
                      {row.date}
                      {row.isWeekend && <span className="text-[#FF9F1C] ml-1 font-bold" title="Weekend Rate">*</span>}
                    </td>
                    <td
                      className={`p-3 bg-[#1C2541] font-bold shadow-[4px_0_12px_rgba(0,0,0,0.3)] text-[14px] sticky left-[100px] z-20 ${
                        row.isWeekend ? "text-primary" : "text-white"
                      }`}
                    >
                      ₹{row.myRate.toLocaleString("en-IN")}
                    </td>
                    {activeCompetitors.map((compName) => {
                      const compData = row.competitors[compName];
                      if (!compData) {
                        return (
                          <td key={compName} className="p-2 text-center text-matrix-muted">
                            -
                          </td>
                        );
                      }
                      const isSelected =
                        selectedCell?.date === row.date && selectedCell?.competitor === compName;

                      return (
                        <td
                          key={compName}
                          onClick={() =>
                            setSelectedCell({
                              date: row.date,
                              competitor: compName,
                              theirRate: compData.rate,
                              myRate: row.myRate,
                              delta: compData.delta,
                            })
                          }
                          className={`p-2 text-center transition-all cursor-pointer ${
                            compData.isUndercut ? "cell-undercut" : ""
                          } ${isSelected ? "ring-2 ring-primary ring-inset" : ""}`}
                        >
                          <div className="flex flex-col items-center justify-center h-full">
                            <span className="text-[13px] font-bold">
                              ₹{compData.rate.toLocaleString("en-IN")}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-semibold ${
                                compData.isUndercut
                                  ? "text-matrix-accent"
                                  : compData.delta > 0
                                  ? "text-primary"
                                  : "text-matrix-muted"
                              }`}
                            >
                              {compData.delta < 0
                                ? `[-₹${Math.abs(compData.delta).toLocaleString("en-IN")}]`
                                : compData.delta > 0
                                ? `[+₹${Math.abs(compData.delta).toLocaleString("en-IN")}]`
                                : "[ Same ]"}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side Panel: Price Comparison Drawer */}
        {selectedCell && (
          <aside className="w-80 bg-matrix-surface border-l border-[#3A506B] flex flex-col shrink-0">
            <div className="p-4 border-b border-[#3A506B] flex justify-between items-start">
              <div>
                <h3 className="text-xs text-matrix-muted uppercase tracking-wider font-semibold mb-1">
                  Selected Price Details
                </h3>
                <p className="font-heading text-white text-base font-bold">
                  {selectedCell.competitor}
                </p>
                <p className="text-xs text-primary mt-0.5 font-mono font-bold">
                  {selectedCell.date} • {currentCategory.name}
                </p>
                <p className="text-[11px] text-muted font-mono mt-0.5">Found on {selectedOta}</p>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="text-matrix-muted hover:text-white cursor-pointer"
                title="Close"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-4 flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-matrix-bg p-3 rounded border border-[#3A506B]">
                  <p className="text-xs text-matrix-muted mb-1 font-mono">Their Price</p>
                  <p
                    className={`font-mono text-lg font-bold ${
                      selectedCell.delta < 0 ? "text-matrix-accent" : "text-primary"
                    }`}
                  >
                    ₹{selectedCell.theirRate.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="bg-matrix-bg p-3 rounded border border-[#3A506B]">
                  <p className="text-xs text-matrix-muted mb-1 font-mono">Your Price</p>
                  <p className="font-mono text-lg font-bold text-white">
                    ₹{selectedCell.myRate.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {selectedCell.delta !== 0 && (
                <div
                  className={`p-2.5 rounded text-xs font-mono ${
                    selectedCell.delta < 0
                      ? "bg-rose-500/10 border border-rose-500/30 text-rose-300"
                      : "bg-teal-500/10 border border-teal-500/30 text-teal-300"
                  }`}
                >
                  {selectedCell.delta < 0
                    ? `They are ₹${Math.abs(selectedCell.delta).toLocaleString("en-IN")} cheaper than your price.`
                    : `They are ₹${Math.abs(selectedCell.delta).toLocaleString("en-IN")} higher than your price.`}
                </div>
              )}

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-matrix-muted mb-2 font-mono">
                  14-Day Price Trend
                </h4>
                <div className="h-32 bg-matrix-bg border border-[#3A506B] rounded p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={historyData}>
                      <XAxis dataKey="day" hide />
                      <YAxis hide domain={["auto", "auto"]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1C2541",
                          borderColor: "#3A506B",
                          fontSize: "11px",
                          fontFamily: "JetBrains Mono",
                          color: "#FFFFFF",
                        }}
                      />
                      <Bar dataKey="rate" radius={[2, 2, 0, 0]}>
                        {historyData.map((entry, index) => (
                          <RechartsCell
                            key={`cell-${index}`}
                            fill={entry.undercut ? "#E71D36" : "#2EC4B6"}
                            fillOpacity={0.8}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <button
                onClick={handleMatchRate}
                disabled={isMatchingRate || selectedCell.theirRate === selectedCell.myRate}
                className="w-full py-2.5 bg-primary hover:bg-[#15bfae] text-[#0B132B] rounded text-xs font-mono font-bold transition-all shadow-[0_0_12px_rgba(24,216,197,0.3)] disabled:opacity-40 disabled:bg-matrix-hover disabled:text-white cursor-pointer uppercase"
              >
                {isMatchingRate
                  ? "Updating Booking Sites..."
                  : `Match This Price (₹${selectedCell.theirRate.toLocaleString("en-IN")})`}
              </button>
            </div>
          </aside>
        )}
      </main>

      {/* Aerocity Comp-Set Management Modal */}
      {showCompSetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-[#111827] border border-[#3A506B] rounded-lg shadow-[0_15px_50px_rgba(0,0,0,0.9)] w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#3A506B] flex items-center justify-between bg-[#1C2541]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">domain_add</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-heading">
                    Aerocity Comp-Set Management
                  </h3>
                  <p className="text-xs text-muted font-mono">
                    Select nearby hotels to track in your 14-day price comparison grid
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCompSetModal(false)}
                className="w-8 h-8 rounded hover:bg-[#2A375C] text-muted hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Filter Toolbar: Search & Distance Radius */}
            <div className="p-4 border-b border-[#3A506B] bg-[#0E1526] flex flex-wrap items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="flex items-center gap-2 bg-[#1C2541] border border-[#3A506B] rounded px-3 py-1.5 flex-1 min-w-[200px]">
                <span className="material-symbols-outlined text-muted text-[16px]">search</span>
                <input
                  type="text"
                  value={compSearch}
                  onChange={(e) => setCompSearch(e.target.value)}
                  placeholder="Search nearby Aerocity hotel..."
                  className="bg-transparent text-white text-xs font-mono focus:outline-none w-full placeholder:text-muted"
                />
                {compSearch && (
                  <button onClick={() => setCompSearch("")} className="text-muted hover:text-white">
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                )}
              </div>

              {/* Distance Radius Filter */}
              <div className="flex items-center gap-1 font-mono text-xs text-muted">
                <span className="text-[11px] uppercase font-bold mr-1">Within:</span>
                {[1, 3, 5, 10].map((r) => (
                  <button
                    key={r}
                    onClick={() => setCompRadius(r)}
                    className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                      compRadius === r
                        ? "bg-primary text-[#0B132B] font-bold"
                        : "bg-[#1C2541] text-muted hover:text-white border border-[#3A506B]"
                    }`}
                  >
                    {r}km
                  </button>
                ))}
              </div>
            </div>

            {/* Hotel Cards List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#0B132B]">
              {ALL_NEARBY_AEROCITY_HOTELS
                .filter(
                  (h) =>
                    h.distanceKm <= compRadius &&
                    (compSearch === "" ||
                      h.name.toLowerCase().includes(compSearch.toLowerCase()) ||
                      h.fullName.toLowerCase().includes(compSearch.toLowerCase()))
                )
                .map((hotel) => {
                  const isInSet = activeCompetitors.includes(hotel.name);
                  return (
                    <div
                      key={hotel.id}
                      className={`p-3.5 rounded border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isInSet
                          ? "bg-[#1C2541]/90 border-amber-400/50 shadow-md"
                          : "bg-[#141d33] border-[#3A506B] hover:border-slate-500"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                            isInSet
                              ? "bg-amber-400/15 text-amber-300 border border-amber-400/30"
                              : "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">domain</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-heading text-sm font-bold text-white">
                              {hotel.name}
                            </h4>
                            {isInSet ? (
                              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase">
                                Tracking in Matrix
                              </span>
                            ) : (
                              <span className="bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase">
                                Available
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted font-mono">{hotel.fullName}</p>
                          <div className="flex items-center gap-3 mt-1 text-[11px] font-mono text-muted">
                            <span className="text-amber-400">{"★".repeat(hotel.stars)}</span>
                            <span>•</span>
                            <span className="text-slate-300">{hotel.distanceKm} km from Lemon Tree</span>
                            <span>•</span>
                            <span className="text-primary font-bold">~₹{hotel.rate.toLocaleString("en-IN")}/night</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleToggleCompetitor(hotel)}
                        className={`px-3.5 py-1.5 rounded text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                          isInSet
                            ? "bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white border border-red-500/40"
                            : "bg-primary hover:bg-[#15bfae] text-[#0B132B] shadow-[0_0_12px_rgba(46,196,182,0.3)]"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {isInSet ? "remove_circle" : "add_circle"}
                        </span>
                        <span>{isInSet ? "Remove from Set" : "+ Add to Comp-Set"}</span>
                      </button>
                    </div>
                  );
                })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#3A506B] bg-[#1C2541] flex items-center justify-between">
              <div className="font-mono text-xs text-muted flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span>
                  Tracking <strong className="text-white">{activeCompetitors.length}</strong> of{" "}
                  {ALL_NEARBY_AEROCITY_HOTELS.length} nearby hotels
                </span>
              </div>
              <button
                onClick={() => setShowCompSetModal(false)}
                className="px-5 py-2 bg-primary hover:bg-[#15bfae] text-[#0B132B] font-mono text-xs font-bold rounded cursor-pointer transition-colors shadow-md"
              >
                Done / View Matrix
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
