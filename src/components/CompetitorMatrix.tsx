"use client";

import React, { useState } from "react";
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

const DEFAULT_ROWS: CompetitorRateCell[] = [
  {
    date: "Oct 24",
    isWeekend: false,
    myRate: 145,
    competitors: {
      "The Grand": { rate: 135, delta: -10, isUndercut: true },
      "Boutique Inn": { rate: 150, delta: 5, isUndercut: false },
      "City Suites": { rate: 140, delta: -5, isUndercut: true },
      "Ocean View": { rate: 145, delta: 0, isUndercut: false },
      "Metro Hotel": { rate: 160, delta: 15, isUndercut: false },
    },
  },
  {
    date: "Oct 25",
    isWeekend: false,
    myRate: 145,
    competitors: {
      "The Grand": { rate: 155, delta: 10, isUndercut: false },
      "Boutique Inn": { rate: 150, delta: 5, isUndercut: false },
      "City Suites": { rate: 130, delta: -15, isUndercut: true },
      "Ocean View": { rate: 140, delta: -5, isUndercut: true },
      "Metro Hotel": { rate: 160, delta: 15, isUndercut: false },
    },
  },
  {
    date: "Oct 26",
    isWeekend: true,
    myRate: 185,
    competitors: {
      "The Grand": { rate: 170, delta: -15, isUndercut: true },
      "Boutique Inn": { rate: 180, delta: -5, isUndercut: true },
      "City Suites": { rate: 175, delta: -10, isUndercut: true },
      "Ocean View": { rate: 190, delta: 5, isUndercut: false },
      "Metro Hotel": { rate: 195, delta: 10, isUndercut: false },
    },
  },
  {
    date: "Oct 27",
    isWeekend: true,
    myRate: 185,
    competitors: {
      "The Grand": { rate: 165, delta: -20, isUndercut: true },
      "Boutique Inn": { rate: 185, delta: 0, isUndercut: false },
      "City Suites": { rate: 170, delta: -15, isUndercut: true },
      "Ocean View": { rate: 195, delta: 10, isUndercut: false },
      "Metro Hotel": { rate: 200, delta: 15, isUndercut: false },
    },
  },
  {
    date: "Oct 28",
    isWeekend: false,
    myRate: 145,
    competitors: {
      "The Grand": { rate: 140, delta: -5, isUndercut: true },
      "Boutique Inn": { rate: 148, delta: 3, isUndercut: false },
      "City Suites": { rate: 145, delta: 0, isUndercut: false },
      "Ocean View": { rate: 152, delta: 7, isUndercut: false },
      "Metro Hotel": { rate: 158, delta: 13, isUndercut: false },
    },
  },
  {
    date: "Oct 29",
    isWeekend: false,
    myRate: 145,
    competitors: {
      "The Grand": { rate: 142, delta: -3, isUndercut: true },
      "Boutique Inn": { rate: 155, delta: 10, isUndercut: false },
      "City Suites": { rate: 138, delta: -7, isUndercut: true },
      "Ocean View": { rate: 145, delta: 0, isUndercut: false },
      "Metro Hotel": { rate: 162, delta: 17, isUndercut: false },
    },
  },
  {
    date: "Oct 30",
    isWeekend: false,
    myRate: 150,
    competitors: {
      "The Grand": { rate: 148, delta: -2, isUndercut: true },
      "Boutique Inn": { rate: 152, delta: 2, isUndercut: false },
      "City Suites": { rate: 145, delta: -5, isUndercut: true },
      "Ocean View": { rate: 160, delta: 10, isUndercut: false },
      "Metro Hotel": { rate: 165, delta: 15, isUndercut: false },
    },
  },
];

const COMPETITOR_NAMES = [
  "The Grand",
  "Boutique Inn",
  "City Suites",
  "Ocean View",
  "Metro Hotel",
];

export default function CompetitorMatrix({ onRateUpdated, onBack }: CompetitorMatrixProps) {
  const [selectedOta, setSelectedOta] = useState<string>("Agoda");
  const [matrixData, setMatrixData] = useState<CompetitorRateCell[]>(DEFAULT_ROWS);
  const [selectedCell, setSelectedCell] = useState<{
    date: string;
    competitor: string;
    theirRate: number;
    myRate: number;
    delta: number;
  } | null>({
    date: "Oct 24",
    competitor: "The Grand",
    theirRate: 135,
    myRate: 145,
    delta: -10,
  });

  const [isMatchingRate, setIsMatchingRate] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // 14-day history mock data for selected competitor
  const historyData = [
    { day: "D-13", rate: 130, undercut: true },
    { day: "D-11", rate: 132, undercut: true },
    { day: "D-9", rate: 135, undercut: true },
    { day: "D-7", rate: 140, undercut: true },
    { day: "D-5", rate: 145, undercut: false },
    { day: "D-3", rate: 150, undercut: false },
    { day: "D-1", rate: 135, undercut: true },
  ];

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
        // Update local matrix state
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
            `Matched rate for ${selectedCell.date} at $${selectedCell.theirRate} across OTAs.`
          );
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsMatchingRate(false);
    }
  };

  const handleSyncRates = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      if (onRateUpdated) {
        onRateUpdated("All OTA rates synced successfully with Neon Database.");
      }
    }, 1200);
  };

  const handleExportCsv = () => {
    const csvContent =
      "Date,My Hotel," +
      COMPETITOR_NAMES.join(",") +
      "\n" +
      matrixData
        .map(
          (row) =>
            `${row.date},${row.myRate},` +
            COMPETITOR_NAMES.map((c) => row.competitors[c]?.rate || "").join(",")
        )
        .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `competitor_matrix_${selectedOta.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden bg-background-dark font-body antialiased">
      {/* Minimal Header (Back-to-Main Exception matching Stitch) */}
      <header className="flex items-center justify-between border-b border-[#293837] px-6 py-3 bg-[#111817] shrink-0">
        <div className="flex items-center gap-4 text-white">
          <button
            onClick={onBack}
            className="flex items-center justify-center size-8 rounded-full hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="size-4 text-primary">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <h1 className="text-lg font-bold leading-tight">Competitor Matrix</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSyncRates}
            disabled={isSyncing}
            className="flex items-center justify-center h-8 px-4 bg-primary/10 text-primary border border-primary/20 rounded text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            <span className={`material-symbols-outlined mr-2 text-[18px] ${isSyncing ? "animate-spin" : ""}`}>
              sync
            </span>
            {isSyncing ? "Syncing..." : "Sync Rates"}
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center justify-center h-8 px-4 bg-[#293837] text-white rounded text-sm font-medium hover:bg-[#3A506B] transition-colors"
          >
            Export CSV
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left Section: Matrix */}
        <div className="flex-1 flex flex-col min-w-0 bg-matrix-bg relative">
          {/* Toolbar */}
          <div className="flex items-center justify-between p-4 border-b border-[#3A506B] bg-matrix-surface shrink-0">
            {/* OTA Filters */}
            <div className="flex h-8 bg-matrix-bg rounded p-1 w-fit border border-[#3A506B]">
              {["Agoda", "MakeMyTrip", "EaseMyTrip", "ClearTrip"].map((ota) => (
                <button
                  key={ota}
                  onClick={() => setSelectedOta(ota)}
                  className={`flex cursor-pointer items-center justify-center rounded px-3 text-sm font-medium transition-colors ${
                    selectedOta === ota
                      ? "bg-matrix-surface text-primary shadow-sm"
                      : "text-matrix-muted hover:text-white"
                  }`}
                >
                  {ota}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-matrix-muted">
              <span className="flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-matrix-accent"></div>
                Undercutting
              </span>
              <span className="flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-primary"></div>
                Higher Rate
              </span>
            </div>
          </div>

          {/* Matrix Table Container */}
          <div className="flex-1 overflow-auto bg-matrix-bg">
            <table className="matrix-table w-full text-left font-mono text-[12px] whitespace-nowrap">
              <thead className="sticky top-0 z-40 shadow-md">
                <tr>
                  <th className="p-3 font-semibold text-matrix-muted min-w-[100px] border-b-2 border-b-[#3A506B] bg-[#1C2541] sticky left-0 z-30">
                    Date
                  </th>
                  <th className="p-3 font-semibold text-white bg-matrix-hover min-w-[120px] border-b-2 border-b-primary shadow-[4px_0_12px_rgba(0,0,0,0.5)] sticky left-[100px] z-30">
                    My Hotel
                  </th>
                  {COMPETITOR_NAMES.map((name) => (
                    <th
                      key={name}
                      className="p-3 font-semibold text-matrix-muted min-w-[120px] border-b-2 border-b-[#3A506B] bg-[#1C2541]"
                    >
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-white">
                {matrixData.map((row) => (
                  <tr key={row.date} className="transition-colors duration-75 hover:bg-[#2A375C]">
                    <td className="p-3 text-matrix-muted bg-[#1C2541] sticky left-0 z-20">
                      {row.date}
                      {row.isWeekend && <span className="text-[#FF9F1C] ml-1">*</span>}
                    </td>
                    <td
                      className={`p-3 bg-[#1C2541] font-bold shadow-[4px_0_12px_rgba(0,0,0,0.3)] text-[14px] sticky left-[100px] z-20 ${
                        row.isWeekend ? "text-primary" : "text-white"
                      }`}
                    >
                      ${row.myRate}
                    </td>
                    {COMPETITOR_NAMES.map((compName) => {
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
                            <span className="text-[14px] font-bold">${compData.rate}</span>
                            <span
                              className={`text-[10px] font-mono ${
                                compData.isUndercut
                                  ? "text-matrix-accent"
                                  : compData.delta > 0
                                  ? "text-primary"
                                  : "text-matrix-muted"
                              }`}
                            >
                              {compData.delta < 0
                                ? `[-$${Math.abs(compData.delta)}]`
                                : compData.delta > 0
                                ? `[+$${Math.abs(compData.delta).toString().padStart(2, "0")}]`
                                : "[ $00]"}
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

        {/* Right Side Panel: Price History & Cell Details (matching Stitch) */}
        {selectedCell && (
          <aside className="w-80 bg-matrix-surface border-l border-[#3A506B] flex flex-col shrink-0">
            <div className="p-4 border-b border-[#3A506B] flex justify-between items-start">
              <div>
                <h3 className="text-xs text-matrix-muted uppercase tracking-wider font-semibold mb-1">
                  Cell Details
                </h3>
                <p className="font-mono text-white text-sm font-bold">
                  {selectedCell.date} • {selectedCell.competitor}
                </p>
                <p className="text-xs text-primary mt-1 font-mono">{selectedOta}</p>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="text-matrix-muted hover:text-white"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-4 flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-matrix-bg p-3 rounded border border-[#3A506B]">
                  <p className="text-xs text-matrix-muted mb-1 font-mono">Their Rate</p>
                  <p className="font-mono text-xl font-bold text-matrix-accent">
                    ${selectedCell.theirRate}
                  </p>
                </div>
                <div className="bg-matrix-bg p-3 rounded border border-[#3A506B]">
                  <p className="text-xs text-matrix-muted mb-1 font-mono">My Rate</p>
                  <p className="font-mono text-xl font-bold text-white">${selectedCell.myRate}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-matrix-muted mb-3 font-mono">
                  14-Day Price History
                </h4>
                {/* Recharts High-contrast chart */}
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
                        }}
                      />
                      <Bar dataKey="rate" radius={[2, 2, 0, 0]}>
                        {historyData.map((entry, index) => (
                          <RechartsCell
                            key={`cell-${index}`}
                            fill={entry.undercut ? "#E71D36" : "#2EC4B6"}
                            fillOpacity={entry.undercut ? 0.7 : 0.8}
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
                className="w-full py-2.5 bg-matrix-hover border border-[#3A506B] hover:bg-[#3A506B] text-white rounded text-sm font-mono font-bold transition-all disabled:opacity-40"
              >
                {isMatchingRate ? "Syncing..." : "Match Competitor Rate"}
              </button>
            </div>
          </aside>
        )}
      </main>
    </div>
  );
}
