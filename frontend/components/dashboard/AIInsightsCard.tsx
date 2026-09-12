"use client";

import React, { useEffect, useState } from "react";
import {
  Sparkles,
  RefreshCw,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Wrench,
  Flame,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";
import { VehicleInsightResponse } from "../../lib/api/types";
import { explainVehicle } from "../../lib/api/copilot";
import { getVehicleTriage, resolveLiveTriage, triageLabel } from "../../lib/triage";

interface AIInsightsCardProps {
  vehicle: any;
  livePredictions: {
    soc?: number;
    soh?: number;
    rul?: number;
    mileage?: number;
  };
  onUrgencyChange?: (urgency: "CRITICAL" | "WARNING" | "NOMINAL") => void;
}

export const AIInsightsCard: React.FC<AIInsightsCardProps> = ({
  vehicle,
  livePredictions,
  onUrgencyChange,
}) => {
  const [insight, setInsight] = useState<VehicleInsightResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchInsight = async (force: boolean = false) => {
    const targetVehicleId = vehicle?.id;
    if (!targetVehicleId) return;
    if (force) setIsRefreshing(true);
    else setLoading(true);

    try {
      const data = await explainVehicle(
        targetVehicleId,
        vehicle,
        livePredictions,
        force
      );
      if (vehicle?.id === targetVehicleId) {
        setInsight(data);
        if (onUrgencyChange) {
          const resolved = resolveLiveTriage(
            data?.urgency ?? null,
            livePredictions?.soh ?? vehicle?.soh,
            livePredictions?.soc ?? vehicle?.soc,
            vehicle?.battery_temp,
            vehicle?.status
          );
          onUrgencyChange(resolved);
        }
      }
    } catch (e) {
      console.error("[AIInsightsCard] Failed to fetch diagnostic:", e);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsight(false);
  }, [vehicle?.id, livePredictions?.soh, livePredictions?.soc]);

  if (loading && !insight) {
    return (
      <div className="tech-surface p-5 animate-pulse space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" />
        </div>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4/5" />
      </div>
    );
  }

  if (!insight) return null;

  const resolvedTriage = resolveLiveTriage(
    insight.urgency,
    livePredictions?.soh ?? vehicle?.soh,
    livePredictions?.soc ?? vehicle?.soc,
    vehicle?.battery_temp,
    vehicle?.status
  );
  const isCritical = resolvedTriage === "CRITICAL";
  const isWarning = resolvedTriage === "WARNING";

  return (
    <div className="tech-surface p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b hairline-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap font-sans">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Powertrain Diagnostic Telematics
              </span>
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-semibold border font-sans ${
                  isCritical
                    ? "bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400"
                    : isWarning
                    ? "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400"
                    : "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {triageLabel(resolvedTriage)}
              </span>
              {vehicle?.status &&
                triageLabel(getVehicleTriage(vehicle)) !== triageLabel(resolvedTriage) && (
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded font-sans">
                    Registry: {triageLabel(getVehicleTriage(vehicle))} → Escalated
                  </span>
                )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-sans">
              Live chassis telemetry evaluation and automated diagnostic synthesis
            </p>
          </div>
        </div>

        {/* Diagnostic Refresh Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchInsight(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border hairline-border bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-sans font-semibold text-slate-700 dark:text-slate-300 transition-all disabled:opacity-50 active:scale-95 shadow-xs cursor-pointer"
            title="Re-run Diagnostic Analysis"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-cyan-500" : ""}`}
            />
            <span>{isRefreshing ? "Evaluating..." : "Re-evaluate"}</span>
          </button>
        </div>
      </div>

      {/* Main Analysis Sections */}
      <div className="space-y-3 font-sans">
        {/* 1. Executive Summary */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border hairline-border space-y-1.5">
          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-xs uppercase tracking-wide">
            {isCritical ? (
              <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0" />
            ) : isWarning ? (
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            )}
            <span>Executive Health Summary</span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 font-sans leading-relaxed text-xs sm:text-sm">
            {insight.summary}
          </p>
        </div>

        {/* 2. Why is it performing in this manner? */}
        <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border hairline-border space-y-1.5">
          <div className="text-xs uppercase tracking-wide text-cyan-600 dark:text-cyan-400 font-bold flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4" />
            <span>Electrochemical Rationale</span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 font-sans leading-relaxed text-xs sm:text-sm">
            {insight.why_performing_this_way}
          </p>
        </div>

        {/* 3. Dual Columns: Contributing Factors & Prescriptive Directives */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* Root Causes */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border hairline-border space-y-2.5">
            <div className="font-bold text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
              <Flame className="w-4 h-4" />
              <span>Contributing Telemetry Factors</span>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-sans">
              {insight.root_causes.map((rc, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold shrink-0 mt-0.5">•</span>
                  <span className="leading-relaxed">{rc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Prescriptive Actions */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border hairline-border space-y-2.5">
            <div className="font-bold text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
              <Wrench className="w-4 h-4" />
              <span>Prescriptive Action Directives</span>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-sans">
              {insight.prescriptive_actions.map((act, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                  <span className="leading-relaxed">{act}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsightsCard;
