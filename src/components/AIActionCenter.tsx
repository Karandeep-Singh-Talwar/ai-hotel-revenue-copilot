"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface PaceCurvePoint {
  daysOut: string;
  currentVelocity: number;
  optimizedCurve: number;
  currentOcc: number;
  optimizedOcc: number;
}

export interface RecommendationData {
  id: number;
  hotelId: number;
  hotelName: string;
  headline: string;
  stayDate: string;
  currentRate: number;
  recommendedRate: number;
  rateDelta: number;
  rateDeltaPct: number;
  modelConfidence: number;
  projectedRevparLiftPct: number;
  status: string;
  explanationText: string;
  eventContext: {
    name: string;
    venue: string;
    distance: string;
    attendance: number;
  };
  paceCurve: PaceCurvePoint[];
}

interface AIActionCenterProps {
  onSyncSuccess?: (msg: string) => void;
  externalRecommendation?: RecommendationData | null;
}

export default function AIActionCenter({
  onSyncSuccess,
  externalRecommendation,
}: AIActionCenterProps) {
  const [data, setData] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    if (externalRecommendation) {
      setData(externalRecommendation);
      setIsApproved(false);
      setLoading(false);
    } else {
      fetchLatestRecommendation();
    }
  }, [externalRecommendation]);

  const fetchLatestRecommendation = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recommendations/latest?hotelId=1");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load recommendation:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRate = async () => {
    if (!data || isSyncing) return;
    setIsSyncing(true);

    try {
      const res = await fetch("/api/recommendations/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendationId: data.id,
          hotelId: data.hotelId,
          customRate: data.recommendedRate,
        }),
      });
      const resData = await res.json();

      if (resData.success) {
        setIsApproved(true);
        if (onSyncSuccess) {
          onSyncSuccess(
            `Rate of ₹${Number(data.recommendedRate).toLocaleString("en-IN")} published live across Agoda, Booking.com, and MakeMyTrip via eZee Centrix!`
          );
        }
      }
    } catch (err) {
      console.error("Rate update error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm animate-pulse flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
        <p className="text-xs text-gray-500 font-medium">Running Econometric Optimization Curves...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden flex flex-col">
      {/* 1. HERO BANNER */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white p-6 sm:p-8 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                AI REVENUE DIRECTIVE
              </span>
              <span className="text-xs font-mono text-gray-400">
                Target Date: <strong className="text-white">{data.stayDate}</strong>
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-300 font-medium">Model Confidence:</span>
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-white/10 text-emerald-300 border border-white/10">
                {(data.modelConfidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>{data.headline}</span>
            </h1>
            <p className="text-sm text-gray-300 mt-2 leading-relaxed max-w-4xl">
              {data.explanationText}
            </p>
          </div>
        </div>
      </div>

      {/* 2. RATE COMPARISON & REVPAR LIFT STATISTIC */}
      <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-gray-100 bg-gray-50/50">
        {/* Current Rate */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] uppercase font-bold text-gray-400 tracking-wider">
              Current Standard Rate
            </span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-3xl font-extrabold font-mono text-gray-900">
                ₹{data.currentRate.toLocaleString("en-IN")}
              </span>
              <span className="text-xs text-gray-400 font-medium">/ night</span>
            </div>
          </div>
          <span className="text-[11px] text-gray-500 mt-3 flex items-center">
            <span className="w-2 h-2 rounded-full bg-gray-400 mr-1.5"></span>
            Baseline Best Available Rate (BAR)
          </span>
        </div>

        {/* Suggested Optimal Rate */}
        <div className="bg-emerald-50/60 p-5 rounded-xl border border-emerald-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-2 right-2">
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
              Algorithmic Target
            </span>
          </div>
          <div>
            <span className="text-[11px] uppercase font-bold text-emerald-800 tracking-wider">
              Suggested Optimal Rate
            </span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-3xl font-extrabold font-mono text-emerald-950">
                ₹{data.recommendedRate.toLocaleString("en-IN")}
              </span>
              <span className="text-xs text-emerald-800 font-medium">/ night</span>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 mt-3 flex items-center">
            <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            +₹{data.rateDelta.toLocaleString("en-IN")} (+{data.rateDeltaPct}%) Premium
          </span>
        </div>

        {/* Projected RevPAR Lift */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] uppercase font-bold text-gray-400 tracking-wider">
              Projected RevPAR Lift
            </span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-3xl font-extrabold font-mono text-blue-600">
                +{data.projectedRevparLiftPct}%
              </span>
              <span className="text-xs text-blue-600 font-medium">yield surge</span>
            </div>
          </div>
          <span className="text-[11px] text-gray-500 mt-3 flex items-center">
            <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>
            Kaplan-Meier unconstrained demand model
          </span>
        </div>
      </div>

      {/* 3. COMPARATIVE PACE VELOCITY CHART (RECHARTS) */}
      <div className="p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">
              Booking Pace Velocity: Current Trajectory vs. Optimized Booking Curve
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Visualizes room pickup speed (% occupancy velocity) across lead times leading up to check-in.
            </p>
          </div>
          <div className="flex items-center space-x-4 text-xs">
            <span className="flex items-center text-gray-600">
              <span className="w-3 h-3 rounded-xs bg-gray-400 mr-1.5"></span>
              Current Trajectory
            </span>
            <span className="flex items-center text-emerald-700 font-semibold">
              <span className="w-3 h-3 rounded-xs bg-emerald-500 mr-1.5"></span>
              Optimized Curve (Surge Strategy)
            </span>
          </div>
        </div>

        <div className="h-64 w-full bg-gray-50/40 rounded-xl p-3 border border-gray-200/60">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.paceCurve} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="currentPace" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="optimizedPace" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="daysOut" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 100]} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "12px",
                  border: "none",
                }}
                formatter={(value: unknown, name: unknown) => [
                  `${String(value)}% Occupancy Velocity`,
                  String(name) === "currentVelocity" ? "Current Trajectory" : "Optimized Curve",
                ]}
              />
              <Area
                type="monotone"
                dataKey="currentVelocity"
                stroke="#64748b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#currentPace)"
              />
              <Area
                type="monotone"
                dataKey="optimizedCurve"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#optimizedPace)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. GLOWING GREEN UPDATE RATE ACTION BAR */}
      <div className="px-6 py-5 sm:px-8 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 text-xs text-gray-500">
          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>
            Executes Neon PL/pgSQL Stored Procedure <code className="font-mono text-gray-700 bg-gray-200 px-1 py-0.5 rounded text-[10px]">approve_recommendation({data.id})</code> and updates Channel Manager live.
          </span>
        </div>

        <button
          onClick={handleUpdateRate}
          disabled={isSyncing || isApproved}
          className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm tracking-tight transition-all duration-200 flex items-center justify-center space-x-2.5 cursor-pointer shadow-lg ${
            isApproved
              ? "bg-emerald-600 text-white cursor-default shadow-emerald-500/20"
              : isSyncing
              ? "bg-emerald-500 text-white opacity-80 cursor-wait"
              : "bg-[#10B981] hover:bg-[#059669] text-white shadow-emerald-500/40 hover:shadow-emerald-500/60 hover:-translate-y-0.5 active:translate-y-0"
          }`}
          style={
            !isApproved && !isSyncing
              ? {
                  boxShadow: "0 0 25px rgba(16, 185, 129, 0.55), 0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }
              : {}
          }
        >
          {isApproved ? (
            <>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
              <span>Rates Live Across OTAs</span>
            </>
          ) : isSyncing ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Executing OTA Sync Pipeline...</span>
            </>
          ) : (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
              <span>Update Rate to ₹{data.recommendedRate.toLocaleString("en-IN")}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
