'use client';

import React, { useState, useRef } from 'react';
import { TimelineDataPoint } from '@/types/rotation';

interface OptimalityChartProps {
  timeline: TimelineDataPoint[];
  onSelectCycle?: (cycleIndex: number) => void;
  selectedCycleIndex?: number | null;
}

export const OptimalityChart: React.FC<OptimalityChartProps> = ({
  timeline,
  onSelectCycle,
  selectedCycleIndex
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<TimelineDataPoint | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);

  if (!timeline || timeline.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-eso-card border border-eso-border rounded-xl text-slate-400 text-sm">
        No timeline data.
      </div>
    );
  }

  // Chart dimensions
  const height = 280;
  const padding = { top: 20, right: 30, bottom: 40, left: 45 };
  const chartWidth = 900;
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const maxTime = timeline[timeline.length - 1].timeSec || 1;

  // Coordinate scales
  const getX = (timeSec: number) => padding.left + (timeSec / maxTime) * innerWidth;
  const getY = (score: number) => padding.top + innerHeight - (score / 100) * innerHeight;

  // Zone thresholds (Y coordinates)
  const y100 = getY(100);
  const y90 = getY(90);
  const y75 = getY(75);
  const y50 = getY(50);
  const y25 = getY(25);
  const y0 = getY(0);

  // Generate SVG path for line
  const points = timeline.map(pt => `${getX(pt.timeSec)},${getY(pt.score)}`).join(' ');

  // Generate SVG area fill path
  const areaPath = `M ${getX(timeline[0].timeSec)},${y0} ` +
    timeline.map(pt => `L ${getX(pt.timeSec)},${getY(pt.score)}`).join(' ') +
    ` L ${getX(timeline[timeline.length - 1].timeSec)},${y0} Z`;

  // Time grid ticks (5-6 intervals)
  const tickCount = 6;
  const timeTicks = Array.from({ length: tickCount + 1 }, (_, i) => {
    const t = Math.round((i / tickCount) * maxTime);
    const m = Math.floor(t / 60);
    const s = t % 60;
    return {
      timeSec: t,
      label: `${m}:${s.toString().padStart(2, '0')}`
    };
  });

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const scaleX = chartWidth / rect.width;
    const svgX = clientX * scaleX;

    const clampedSvgX = Math.max(padding.left, Math.min(padding.left + innerWidth, svgX));
    const timeAtX = ((clampedSvgX - padding.left) / innerWidth) * maxTime;

    let closest = timeline[0];
    let minDiff = Math.abs(timeline[0].timeSec - timeAtX);
    for (const pt of timeline) {
      const diff = Math.abs(pt.timeSec - timeAtX);
      if (diff < minDiff) {
        minDiff = diff;
        closest = pt;
      }
    }

    setHoveredPoint(closest);
    setHoverX(getX(closest.timeSec));
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setHoverX(null);
  };

  const handleClick = () => {
    if (hoveredPoint && hoveredPoint.cycleIndex && onSelectCycle) {
      onSelectCycle(hoveredPoint.cycleIndex);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/20';
    if (score >= 75) return 'text-yellow-400 border-yellow-500/40 bg-yellow-500/20';
    if (score >= 50) return 'text-orange-400 border-orange-500/40 bg-orange-500/20';
    if (score >= 25) return 'text-red-400 border-red-500/40 bg-red-500/20';
    return 'text-rose-300 border-rose-800/50 bg-rose-950/80';
  };

  return (
    <div className="bg-eso-card border border-eso-border rounded-xl p-5 shadow-lg relative select-none">
      {/* Chart Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-semibold text-white tracking-wide">
          Rotation Timeline
        </h3>

        {/* 5-Zone Legend */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            90-100%
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-yellow-950/40 border border-yellow-500/30 text-yellow-400">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            75-90%
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-orange-950/40 border border-orange-500/30 text-orange-400">
            <span className="w-2 h-2 rounded-full bg-orange-400" />
            50-75%
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-950/40 border border-red-500/30 text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            25-50%
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-950/80 border border-rose-800/40 text-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-900" />
            0-25%
          </span>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div ref={containerRef} className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${chartWidth} ${height}`}
          className="w-full h-auto cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        >
          <defs>
            <linearGradient id="optGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
              <stop offset="30%" stopColor="#eab308" stopOpacity="0.3" />
              <stop offset="60%" stopColor="#f97316" stopOpacity="0.2" />
              <stop offset="85%" stopColor="#ef4444" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#881337" stopOpacity="0.1" />
            </linearGradient>

            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="25%" stopColor="#facc15" />
              <stop offset="60%" stopColor="#fb923c" />
              <stop offset="85%" stopColor="#f87171" />
              <stop offset="100%" stopColor="#fda4af" />
            </linearGradient>
          </defs>

          {/* Background Zone Bands */}
          <rect x={padding.left} y={y100} width={innerWidth} height={y90 - y100} fill="#10b981" fillOpacity="0.10" />
          <rect x={padding.left} y={y90} width={innerWidth} height={y75 - y90} fill="#eab308" fillOpacity="0.08" />
          <rect x={padding.left} y={y75} width={innerWidth} height={y50 - y75} fill="#f97316" fillOpacity="0.07" />
          <rect x={padding.left} y={y50} width={innerWidth} height={y25 - y50} fill="#ef4444" fillOpacity="0.08" />
          <rect x={padding.left} y={y25} width={innerWidth} height={y0 - y25} fill="#881337" fillOpacity="0.15" />

          {/* Horizontal Grid lines & Y-axis labels */}
          {[100, 90, 75, 50, 25, 0].map(score => {
            const y = getY(score);
            return (
              <g key={score}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + innerWidth}
                  y2={y}
                  stroke={score === 90 || score === 75 || score === 50 || score === 25 ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)'}
                  strokeDasharray={score === 90 || score === 75 || score === 50 || score === 25 ? '4 4' : undefined}
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-slate-500 text-[10px] font-mono"
                >
                  {score}%
                </text>
              </g>
            );
          })}

          {/* Vertical Time Grid lines & X-axis labels */}
          {timeTicks.map(t => {
            const x = getX(t.timeSec);
            return (
              <g key={t.timeSec}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + innerHeight}
                  stroke="rgba(255,255,255,0.05)"
                />
                <text
                  x={x}
                  y={height - 12}
                  textAnchor="middle"
                  className="fill-slate-500 text-[10px] font-mono"
                >
                  {t.label}
                </text>
              </g>
            );
          })}

          {/* Optimality Area Fill */}
          <path d={areaPath} fill="url(#optGradient)" />

          {/* Optimality Continuous Curve */}
          <polyline
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {/* Interactive Crosshair Scrubber */}
          {hoverX !== null && hoveredPoint && (
            <g>
              <line
                x1={hoverX}
                y1={padding.top}
                x2={hoverX}
                y2={padding.top + innerHeight}
                stroke="#fbbf24"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <circle
                cx={hoverX}
                cy={getY(hoveredPoint.score)}
                r="5"
                fill="#fbbf24"
                stroke="#1a1c23"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Floating Tooltip */}
        {hoveredPoint && hoverX !== null && (
          <div
            className="absolute top-2 pointer-events-none z-20 bg-slate-900/95 border border-eso-border/80 rounded-lg p-3 shadow-2xl backdrop-blur-md text-xs w-60 transition-all"
            style={{
              left: `${Math.min(75, Math.max(15, (hoverX / chartWidth) * 100))}%`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5 mb-2">
              <span className="font-mono text-slate-300 font-semibold">
                ⏱ {hoveredPoint.formattedTime}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${getScoreColor(hoveredPoint.score)}`}
              >
                {hoveredPoint.score}%
              </span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div>
                <span className="text-slate-400">Pattern: </span>
                <span className="font-semibold text-eso-goldLight">
                  {hoveredPoint.activePattern}
                </span>
              </div>

              {hoveredPoint.recentCasts && hoveredPoint.recentCasts.length > 0 && (
                <div>
                  <span className="text-slate-400">Casts: </span>
                  <span className="text-slate-200">
                    {hoveredPoint.recentCasts.join(' → ')}
                  </span>
                </div>
              )}

              {hoveredPoint.idleTimeSec !== undefined && (
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>Cycle Idle:</span>
                  <span className={`font-mono font-semibold ${hoveredPoint.idleTimeSec > 1.5 ? 'text-orange-400' : 'text-emerald-400'}`}>
                    {hoveredPoint.idleTimeSec}s
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
