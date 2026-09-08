import { createFileRoute, Link } from "@tanstack/react-router";
import React from "react";
import { Shield, Activity } from "lucide-react";
import { SignalRadarMap } from "@/components/trace/SignalRadarMap";

export const Route = createFileRoute("/map")({
  component: LiveSignalMapPage,
});

export function LiveSignalMapPage() {
  return (
    <div className="min-h-screen bg-[#07090e] text-[#f1f5f9] font-sans antialiased selection:bg-amber-500 selection:text-black">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0c1017]/90 backdrop-blur-md px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-white font-extrabold tracking-tight text-lg hover:opacity-90 transition-opacity"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 text-black font-black text-sm shadow-md shadow-amber-500/20">
              TR
            </span>
            <span className="font-display tracking-wider text-base uppercase">
              TRACE <span className="text-xs font-mono font-normal text-amber-400/90 ml-1">v2.4</span>
            </span>
          </Link>
          <span className="hidden sm:inline-block h-4 w-[1px] bg-white/20" />
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            CAD 1091 & 14566 LIVE
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/support"
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            Victim Support Portal
          </Link>
          <Link
            to="/staff/queue"
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-colors shadow-sm"
          >
            <Activity className="w-3.5 h-3.5" />
            Staff Triage Queue
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SignalRadarMap />
      </main>
    </div>
  );
}
