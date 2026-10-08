import React from 'react';
import type { UpcomingPattern } from './upcoming-patterns';

interface IllustrationProps {
  readonly pattern: UpcomingPattern;
  readonly size?: number;
  readonly showGuideLines?: boolean;
}

// Generate points for regular N-pointed star polygon
function createStarPoints(
  cx: number,
  cy: number,
  points: number,
  outerR: number,
  innerR: number,
  rotDeg = -90,
): string {
  const rot = (rotDeg * Math.PI) / 180;
  const coords: string[] = [];
  const step = (Math.PI * 2) / points;
  for (let i = 0; i < points; i++) {
    const aOuter = rot + i * step;
    const aInner = rot + (i + 0.5) * step;
    coords.push(
      `${(cx + outerR * Math.cos(aOuter)).toFixed(2)},${(cy + outerR * Math.sin(aOuter)).toFixed(2)}`,
    );
    coords.push(
      `${(cx + innerR * Math.cos(aInner)).toFixed(2)},${(cy + innerR * Math.sin(aInner)).toFixed(2)}`,
    );
  }
  return 'M ' + coords.join(' L ') + ' Z';
}

// Generate points for regular N-sided polygon
function createPolygonPoints(
  cx: number,
  cy: number,
  sides: number,
  radius: number,
  rotDeg = -90,
): string {
  const rot = (rotDeg * Math.PI) / 180;
  const coords: string[] = [];
  const step = (Math.PI * 2) / sides;
  for (let i = 0; i < sides; i++) {
    const a = rot + i * step;
    coords.push(
      `${(cx + radius * Math.cos(a)).toFixed(2)},${(cy + radius * Math.sin(a)).toFixed(2)}`,
    );
  }
  return 'M ' + coords.join(' L ') + ' Z';
}

// Palette color mappings for distinct regional styles
function getPaletteForStyle(style: string) {
  if (style.includes('Mamluk')) {
    return {
      starFill: 'rgba(240, 184, 50, 0.22)',
      starStroke: '#f0b832',
      accentStroke: '#38bdf8',
      satelliteFill: 'rgba(29, 92, 124, 0.45)',
      satelliteStroke: '#e09f22',
      strapStroke: '#f6f0e1',
      frameStroke: 'rgba(240, 184, 50, 0.4)',
    };
  }
  if (style.includes('Timurid') || style.includes('Persian')) {
    return {
      starFill: 'rgba(232, 197, 71, 0.25)',
      starStroke: '#e8c547',
      accentStroke: '#2aa198',
      satelliteFill: 'rgba(42, 161, 152, 0.35)',
      satelliteStroke: '#1e6f9f',
      strapStroke: '#f6f0e1',
      frameStroke: 'rgba(42, 161, 152, 0.4)',
    };
  }
  if (style.includes('Nasrid') || style.includes('Andalusi')) {
    return {
      starFill: 'rgba(201, 162, 39, 0.25)',
      starStroke: '#c9a227',
      accentStroke: '#1f7f86',
      satelliteFill: 'rgba(43, 79, 143, 0.35)',
      satelliteStroke: '#a5652b',
      strapStroke: '#f1ece1',
      frameStroke: 'rgba(201, 162, 39, 0.4)',
    };
  }
  if (style.includes('Mughal')) {
    return {
      starFill: 'rgba(224, 176, 74, 0.25)',
      starStroke: '#e0b04a',
      accentStroke: '#b5452f',
      satelliteFill: 'rgba(46, 107, 94, 0.35)',
      satelliteStroke: '#e0b04a',
      strapStroke: '#f4e6cf',
      frameStroke: 'rgba(181, 69, 47, 0.4)',
    };
  }
  if (style.includes('Ottoman')) {
    return {
      starFill: 'rgba(45, 95, 168, 0.3)',
      starStroke: '#2aa198',
      accentStroke: '#e8c547',
      satelliteFill: 'rgba(27, 53, 102, 0.45)',
      satelliteStroke: '#e8c547',
      strapStroke: '#f5f7fa',
      frameStroke: 'rgba(42, 161, 152, 0.4)',
    };
  }
  // Marinid / Fès zellige default
  return {
    starFill: 'rgba(201, 162, 39, 0.28)',
    starStroke: '#f0b832',
    accentStroke: '#2f7d4f',
    satelliteFill: 'rgba(29, 92, 124, 0.4)',
    satelliteStroke: '#c9a227',
    strapStroke: '#f2ead8',
    frameStroke: 'rgba(240, 184, 50, 0.4)',
  };
}

export function UpcomingIllustration({
  pattern,
  size = 220,
  showGuideLines = true,
}: IllustrationProps) {
  const { fold, style, id } = pattern;
  const pal = getPaletteForStyle(style);

  // Radii configurations depending on fold
  let rOuter = 52;
  let rInner = 28;
  let rSatellite = 75;
  let rRing = 90;

  if (fold === 6) {
    rOuter = 54;
    rInner = 31.18; // regular hexagram
    rSatellite = 80;
    rRing = 95;
  } else if (fold === 8) {
    rOuter = 52;
    rInner = 27.5;
    rSatellite = 76;
    rRing = 92;
  } else if (fold === 10) {
    rOuter = 52;
    rInner = 26.5;
    rSatellite = 75;
    rRing = 92;
  } else if (fold === 12) {
    rOuter = 54;
    rInner = 27.0;
    rSatellite = 78;
    rRing = 94;
  } else if (fold === 16) {
    rOuter = 55;
    rInner = 32.0;
    rSatellite = 77;
    rRing = 95;
  }

  // Generate radial guide lines
  const guideLines: React.ReactNode[] = [];
  if (showGuideLines) {
    const numLines = fold * 2;
    for (let i = 0; i < numLines; i++) {
      const angle = (i * Math.PI) / fold;
      const x2 = Math.cos(angle) * rRing;
      const y2 = Math.sin(angle) * rRing;
      guideLines.push(
        <line
          key={`guide-${i}`}
          x1={0}
          y1={0}
          x2={x2.toFixed(1)}
          y2={y2.toFixed(1)}
          stroke={i % 2 === 0 ? 'rgba(56, 189, 248, 0.22)' : 'rgba(240, 184, 50, 0.15)'}
          strokeWidth="0.8"
          strokeDasharray={i % 2 === 0 ? '2,3' : '1,3'}
        />,
      );
    }
  }

  // Radiating satellites or petals
  const satellites: React.ReactNode[] = [];
  const satelliteCount = fold;
  for (let i = 0; i < satelliteCount; i++) {
    const angle = (i * 2 * Math.PI) / satelliteCount - Math.PI / 2;
    const nextAngle = ((i + 1) * 2 * Math.PI) / satelliteCount - Math.PI / 2;
    const midAngle = angle + Math.PI / satelliteCount;

    const tipX = Math.cos(angle) * rOuter;
    const tipY = Math.sin(angle) * rOuter;
    const nextTipX = Math.cos(nextAngle) * rOuter;
    const nextTipY = Math.sin(nextAngle) * rOuter;

    const satTipX = Math.cos(midAngle) * rSatellite;
    const satTipY = Math.sin(midAngle) * rSatellite;

    // Petal / kite between adjacent star tips
    const kitePath = `M ${tipX.toFixed(2)},${tipY.toFixed(2)} L ${satTipX.toFixed(2)},${satTipY.toFixed(2)} L ${nextTipX.toFixed(2)},${nextTipY.toFixed(2)} Z`;

    satellites.push(
      <path
        key={`sat-${i}`}
        d={kitePath}
        fill={pal.satelliteFill}
        stroke={pal.satelliteStroke}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />,
    );

    // Outer secondary rosette or dart for specific complex patterns
    if (fold === 10 || fold === 12 || fold === 16) {
      const outerRingX = Math.cos(angle) * (rSatellite + 12);
      const outerRingY = Math.sin(angle) * (rSatellite + 12);
      satellites.push(
        <circle
          key={`orb-${i}`}
          cx={outerRingX.toFixed(2)}
          cy={outerRingY.toFixed(2)}
          r="2.2"
          fill={pal.starStroke}
          opacity="0.8"
        />,
      );
    }
  }

  // Tile frame boundary based on lattice type
  let tileBoundary: React.ReactNode = null;
  if (fold === 6 || id.includes('hex')) {
    // Hexagonal honeycomb boundary
    tileBoundary = (
      <path
        d={createPolygonPoints(0, 0, 6, 102, 0)}
        fill="none"
        stroke={pal.frameStroke}
        strokeWidth="1.6"
        strokeDasharray="4,4"
      />
    );
  } else if (fold === 10 || id === 'darb-e-imam-decagram') {
    // Rectangular repeating boundary
    tileBoundary = (
      <rect
        x="-80"
        y="-105"
        width="160"
        height="210"
        rx="3"
        fill="none"
        stroke={pal.frameStroke}
        strokeWidth="1.5"
        strokeDasharray="5,3"
      />
    );
  } else {
    // Square repeating boundary
    tileBoundary = (
      <rect
        x="-95"
        y="-95"
        width="190"
        height="190"
        rx="3"
        fill="none"
        stroke={pal.frameStroke}
        strokeWidth="1.5"
        strokeDasharray="4,4"
      />
    );
  }

  return (
    <div className="upcoming-illustration-wrap" style={{ width: size, height: size }}>
      <svg
        viewBox="-120 -120 240 240"
        className="upcoming-illustration-svg"
        role="img"
        aria-label={`Geometric diagram of ${pattern.title}`}
      >
        <defs>
          <radialGradient id={`glow-${pattern.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f0b832" stopOpacity="0.18" />
            <stop offset="60%" stopColor="#1e6f9f" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#070f1e" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`starGrad-${pattern.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={pal.starStroke} stopOpacity="0.4" />
            <stop offset="100%" stopColor={pal.satelliteStroke} stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* Structural architectural background */}
        <rect
          x="-118"
          y="-118"
          width="236"
          height="236"
          rx="12"
          fill="#0a1526"
          stroke="rgba(240, 184, 50, 0.16)"
          strokeWidth="1"
        />

        {/* Ambient radial glow */}
        <circle cx="0" cy="0" r="105" fill={`url(#glow-${pattern.id})`} />

        {/* Compass guideline circles */}
        {showGuideLines && (
          <g className="svg-guide-circles" opacity="0.6">
            <circle
              cx="0"
              cy="0"
              r={rOuter}
              fill="none"
              stroke="rgba(240, 184, 50, 0.28)"
              strokeWidth="0.8"
            />
            <circle
              cx="0"
              cy="0"
              r={rInner}
              fill="none"
              stroke="rgba(56, 189, 248, 0.2)"
              strokeWidth="0.8"
              strokeDasharray="2,2"
            />
            <circle
              cx="0"
              cy="0"
              r={rSatellite}
              fill="none"
              stroke="rgba(240, 184, 50, 0.2)"
              strokeWidth="0.8"
              strokeDasharray="3,3"
            />
          </g>
        )}

        {/* Radial compass guidelines */}
        {guideLines}

        {/* Outer tile lattice frame */}
        {tileBoundary}

        {/* Surrounding satellite petals / kites */}
        <g className="svg-satellites">{satellites}</g>

        {/* Secondary inner star / core rosette */}
        {(fold === 12 || fold === 16 || fold === 10) && (
          <path
            d={createStarPoints(0, 0, fold, rInner * 1.05, rInner * 0.55)}
            fill="rgba(240, 184, 50, 0.25)"
            stroke={pal.strapStroke}
            strokeWidth="0.9"
            strokeLinejoin="round"
          />
        )}

        {/* Central master star rosette */}
        <path
          d={createStarPoints(0, 0, fold, rOuter, rInner)}
          fill={`url(#starGrad-${pattern.id})`}
          stroke={pal.starStroke}
          strokeWidth="1.8"
          strokeLinejoin="round"
          className="svg-master-star"
        />

        {/* Center compass pivot point */}
        <circle cx="0" cy="0" r="2.8" fill={pal.starStroke} />
        <circle cx="0" cy="0" r="1.2" fill="#070f1e" />

        {/* Corner architectural registration ticks */}
        <path
          d="M -110,-104 L -110,-110 L -104,-110 M 110,-104 L 110,-110 L 104,-110 M -110,104 L -110,110 L -104,110 M 110,104 L 110,110 L 104,110"
          stroke="rgba(240, 184, 50, 0.35)"
          strokeWidth="1.2"
          fill="none"
        />
      </svg>
    </div>
  );
}
