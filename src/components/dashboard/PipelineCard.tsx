'use client';

import { useState } from 'react';

export type RingType = 'ring1' | 'ring2' | 'ring3' | 'ring4' | 'total';

const STAGE_TOOLTIPS: Record<string, string> = {
  Indents: 'Total indents created — on-time vs delayed (>12H)',
  Confirmed: 'Current confirmed trips — >12H pending vs total',
  Loading: 'Trips at loading stage — >24H delayed vs untracked',
  Intransit: 'Trips in transit — >12H delay vs untracked',
  Unloading: 'Trips at unloading stage — >24H delayed vs untracked',
  Delivered: 'Delivered trips — on-time vs untracked',
  Available: 'Driver availability — available, available >24H, unavailable vs active',
  Driver: 'Total drivers registered on the platform',
  Pod: 'POD status — pending, approved vs received',
};

interface CircleItem {
  count: number;
  percent?: number;
  label: string;
  borderColor: string;
  bgColor: string;
  ringType: RingType;
}

interface CircleProps extends CircleItem {
  isSelected?: boolean;
  onClick?: () => void;
}

function Circle({ count, percent, label, borderColor, bgColor, isSelected, onClick }: CircleProps) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 focus:outline-none">
      <div
        className="w-[68px] h-[68px] rounded-full flex flex-col items-center justify-center transition-all"
        style={{
          border: `1px solid ${borderColor}`,
          backgroundColor: isSelected ? bgColor : 'transparent',
        }}
      >
        <span className="text-base font-bold text-gray-800 leading-none">{count}</span>
        {percent !== undefined && (
          <span
            className="text-[10px] font-medium mt-0.5 leading-none"
            style={{ color: borderColor }}
          >
            {percent}%
          </span>
        )}
      </div>
      <span
        className="text-[11px] leading-tight text-center"
        style={{ color: isSelected ? borderColor : '#9ca3af', fontWeight: isSelected ? 600 : 400 }}
      >
        {label}
      </span>
    </button>
  );
}

export interface PipelineCardProps {
  title: string;
  circles: CircleItem[];
  showExport?: boolean;
  isActive?: boolean;
  selectedRing?: RingType | null;
  allRingsSelected?: boolean;
  onCardClick?: () => void;
  onRingClick?: (ring: RingType) => void;
  onExport?: () => void;
  loading?: boolean;
}

export function PipelineCard({
  title,
  circles,
  showExport,
  isActive,
  selectedRing,
  allRingsSelected,
  onCardClick,
  onRingClick,
  onExport,
  loading,
}: PipelineCardProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);

  if (loading) {
    return (
      <div
        className="flex-shrink-0 bg-white p-5 border-r border-gray-100 animate-pulse"
        style={{ minWidth: 220 }}
      >
        <div className="h-3.5 bg-gray-100 rounded w-2/3 mb-5" />
        <div className="flex items-center gap-4">
          <div className="w-[68px] h-[68px] bg-gray-100 rounded-full" />
          <div className="w-[68px] h-[68px] bg-gray-100 rounded-full" />
          <div className="w-[68px] h-[68px] bg-gray-100 rounded-full" />
        </div>
      </div>
    );
  }

  const tooltipText = STAGE_TOOLTIPS[title] || `${title} stage metrics`;

  return (
    <div
      className="flex-shrink-0 bg-white p-5 border-r border-gray-100 cursor-pointer select-none relative"
      style={{ minWidth: `${circles.length * 88 + 40}px` }}
      onClick={onCardClick}
    >
      {/* Active bottom indicator */}
      {isActive && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500" />}

      {/* Title row */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-700">{title}</p>
          {showExport && (
            <button
              className="w-6 h-6 rounded flex items-center justify-center bg-green-500 hover:bg-green-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onExport?.();
              }}
              title="Export"
            >
              <svg
                className="w-3.5 h-3.5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Info tooltip */}
        <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            className="w-5 h-5 rounded-full bg-gray-800 text-white text-[10px] flex items-center justify-center font-bold leading-none focus:outline-none hover:bg-gray-700 transition-colors"
            onMouseEnter={() => setTooltipVisible(true)}
            onMouseLeave={() => setTooltipVisible(false)}
            onClick={() => setTooltipVisible((v) => !v)}
          >
            i
          </button>
          {tooltipVisible && (
            <div className="absolute right-0 top-7 z-50 w-56 rounded-lg bg-gray-900 text-white text-xs px-3 py-2 shadow-xl leading-relaxed pointer-events-none">
              {tooltipText}
              <div className="absolute -top-1.5 right-2 w-3 h-3 bg-gray-900 rotate-45" />
            </div>
          )}
        </div>
      </div>

      {/* Circles */}
      <div className="flex items-center gap-4 flex-wrap" onClick={(e) => e.stopPropagation()}>
        {circles.map((circle) => (
          <Circle
            key={circle.ringType}
            {...circle}
            isSelected={isActive && (allRingsSelected || selectedRing === circle.ringType)}
            onClick={() => onRingClick?.(circle.ringType)}
          />
        ))}
      </div>
    </div>
  );
}
