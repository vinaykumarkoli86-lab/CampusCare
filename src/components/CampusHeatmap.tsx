import { useState } from 'react';
import { AlertTriangle, Building2, CheckCircle2, MapPin, ArrowUpRight } from 'lucide-react';
import type { HeatmapZoneStat } from '../types';

interface CampusHeatmapProps {
  zones: HeatmapZoneStat[];
  selectedLocation?: string;
  onSelectLocation?: (location: string) => void;
  compact?: boolean;
}

export function CampusHeatmap({
  zones,
  selectedLocation,
  onSelectLocation,
  compact = false,
}: CampusHeatmapProps) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const activeZoneName = selectedLocation && selectedLocation !== 'All'
    ? selectedLocation
    : hoveredZone || zones.slice().sort((a, b) => b.intensity - a.intensity)[0]?.location;

  const activeZone = zones.find((z) => z.location === activeZoneName) || zones[0];

  const getIntensityTone = (zone: HeatmapZoneStat) => {
    if (zone.urgentCount > 0 || zone.intensity >= 65) {
      return {
        ring: 'border-rose-400/80 bg-rose-500/25 text-rose-100',
        glow: 'rgba(244, 63, 94, 0.34)',
        bar: 'bg-rose-400',
        label: 'Critical Load',
      };
    }
    if (zone.openCount > 0 || zone.intensity >= 30) {
      return {
        ring: 'border-sky-400/80 bg-sky-500/25 text-sky-100',
        glow: 'rgba(56, 189, 248, 0.3)',
        bar: 'bg-sky-400',
        label: 'Active Queue',
      };
    }
    return {
      ring: 'border-emerald-400/70 bg-emerald-500/20 text-emerald-100',
      glow: 'rgba(16, 185, 129, 0.22)',
      bar: 'bg-emerald-400',
      label: 'Nominal',
    };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      <div className="lg:col-span-8 relative rounded-xl overflow-hidden border border-slate-800/80 bg-[#070d1f] min-h-[340px] sm:min-h-[400px]">
        {!imgError ? (
          <img
            src="/src/assets/images/campus_aerial_map_1794640020352.jpg"
            alt="Campus architectural blueprint map showing issue intensity across buildings"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="absolute inset-0 w-full h-full object-cover opacity-55"
          />
        ) : (
          <div className="absolute inset-0 campus-grid-bg bg-gradient-to-br from-[#070e24] via-[#0a1430] to-[#060b18]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#050914]/90 via-[#050914]/35 to-[#050914]/50 pointer-events-none" />

        {/* Map Legend */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-800/70 bg-[#060b18]/75 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
            <MapPin className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
            <span>Campus Spatial Issue Heatmap</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-400/80 border border-rose-300" />
              Urgent / High Density
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-400/80 border border-sky-300" />
              Open Issues
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400/80 border border-emerald-300" />
              Cleared
            </span>
          </div>
        </div>

        {/* Interactive Zone Nodes */}
        <div className={`relative w-full ${compact ? 'h-[300px]' : 'h-[360px] sm:h-[390px]'}`}>
          {zones.map((zone) => {
            const tone = getIntensityTone(zone);
            const isSelected = activeZone?.location === zone.location;
            const haloSize = Math.max(48, Math.min(108, 42 + zone.intensity * 0.65));

            return (
              <button
                key={zone.location}
                type="button"
                onMouseEnter={() => setHoveredZone(zone.location)}
                onFocus={() => setHoveredZone(zone.location)}
                onClick={() => onSelectLocation?.(zone.location)}
                style={{
                  left: `${zone.x}%`,
                  top: `${zone.y}%`,
                }}
                className="group absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded-lg"
                aria-label={`${zone.location}: ${zone.openCount} open complaints, ${zone.urgentCount} urgent`}
              >
                {/* Radial heat halo */}
                <span
                  aria-hidden="true"
                  style={{
                    width: `${haloSize}px`,
                    height: `${haloSize}px`,
                    background: `radial-gradient(circle, ${tone.glow} 0%, transparent 72%)`,
                  }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-transform duration-200 group-hover:scale-110"
                />
                {/* Crisp Zone Marker */}
                <span
                  className={`relative z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium backdrop-blur-md transition-all duration-150 whitespace-nowrap ${
                    tone.ring
                  } ${
                    isSelected
                      ? 'ring-2 ring-white/70 scale-105 shadow-lg'
                      : 'hover:scale-105'
                  }`}
                >
                  <span className="font-mono-data text-[11px] font-semibold">{zone.code}</span>
                  <span className="text-white/50">·</span>
                  <span className="font-mono-data tabular-nums">{zone.openCount} open</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Zone Telemetry & Breakdown Side Panel */}
      <div className="lg:col-span-4 glass-surface rounded-xl p-5 flex flex-col justify-between gap-4">
        {activeZone ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div>
                <p className="text-xs text-slate-400 font-mono-data">
                  {activeZone.code} · {activeZone.sector}
                </p>
                <h4 className="text-base font-semibold text-white mt-0.5">
                  {activeZone.location}
                </h4>
              </div>
              <Building2 className="w-5 h-5 text-sky-400 shrink-0" aria-hidden="true" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800/80">
                <p className="text-xs text-slate-400">Open</p>
                <p className="text-xl font-semibold text-white font-mono-data tabular-nums mt-0.5">
                  {activeZone.openCount}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800/80">
                <p className="text-xs text-slate-400">Urgent</p>
                <p className="text-xl font-semibold text-rose-300 font-mono-data tabular-nums mt-0.5">
                  {activeZone.urgentCount}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800/80">
                <p className="text-xs text-slate-400">Resolved</p>
                <p className="text-xl font-semibold text-emerald-300 font-mono-data tabular-nums mt-0.5">
                  {activeZone.resolvedCount}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Zone Issue Load</span>
                <span className="font-mono-data tabular-nums text-slate-200">
                  {activeZone.intensity}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800/90 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    getIntensityTone(activeZone).bar
                  }`}
                  style={{ width: `${Math.max(6, activeZone.intensity)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 text-slate-300">
              <span className="text-slate-400">Primary Category</span>
              <span className="font-medium text-slate-100">{activeZone.topCategory}</span>
            </div>

            {activeZone.urgentCount > 0 ? (
              <div className="flex items-center gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/25 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Requires immediate engineering triage</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>No urgent safety escalations in this zone</span>
              </div>
            )}
          </div>
        ) : null}

        {/* Quick Zone Selector List */}
        <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
          <p className="text-xs font-medium text-slate-400 mb-2">All Campus Zones</p>
          <div className="grid grid-cols-2 gap-1.5">
            {zones.map((z) => (
              <button
                key={z.location}
                type="button"
                onClick={() => {
                  setHoveredZone(z.location);
                  onSelectLocation?.(z.location);
                }}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors text-left ${
                  activeZone?.location === z.location
                    ? 'bg-sky-500/15 text-sky-200 border border-sky-500/35'
                    : 'bg-slate-900/50 text-slate-300 border border-slate-800/60 hover:border-slate-700'
                }`}
              >
                <span className="truncate pr-1">{z.code}</span>
                <span className="font-mono-data tabular-nums text-[11px] text-slate-400">
                  {z.totalCount}
                </span>
              </button>
            ))}
          </div>

          {onSelectLocation && selectedLocation && selectedLocation !== 'All' && (
            <button
              type="button"
              onClick={() => onSelectLocation('All')}
              className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-300 hover:text-sky-200 bg-sky-500/10 border border-sky-500/25 rounded-lg transition-colors"
            >
              <span>Show All Campus Zones</span>
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
