import { useState, useEffect } from "react";
import { SCENE_W, SCENE_H, VB_X, VB_Y } from "./grid.ts";

const SVG_STYLE: React.CSSProperties = {
  position: "absolute", top: 0, left: 0, pointerEvents: "none",
};
const VB = `${VB_X} ${VB_Y} ${SCENE_W} ${SCENE_H}`;

export function Floor() {
  // Floor diamond matches wall bottom edges (2:1 isometric ratio):
  // back=(120,40), left=(-260,230), right=(500,230), front=(120,420)
  const backX = 120, backY = 40;
  const rowDx = -47.5, rowDy = 23.75;
  const colDx = 47.5, colDy = 23.75;
  const N = 10;

  const tiles = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const bx = backX + r * rowDx + c * colDx;
      const by = backY + r * rowDy + c * colDy;
      const light = (r + c) % 2 === 0;
      tiles.push(
        <path
          key={`${r}-${c}`}
          d={`M${bx} ${by} L${bx + rowDx} ${by + rowDy} L${bx + rowDx + colDx} ${by + rowDy + colDy} L${bx + colDx} ${by + colDy} Z`}
          fill={light ? "var(--floor-light)" : "var(--floor-dark)"}
          stroke="var(--floor-stroke)"
          strokeWidth="0.5"
        />
      );
    }
  }
  return (
    <svg style={SVG_STYLE} width={SCENE_W} height={SCENE_H} viewBox={VB} overflow="visible">
      {tiles}
    </svg>
  );
}

export function Walls() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const hourAngle = (hours + minutes / 60) * 30; // 360/12 = 30° per hour
  const minuteAngle = minutes * 6; // 360/60 = 6° per minute
  const R = 24; // clock radius
  const r = R * 0.83; // face radius

  // Hand endpoints (angle 0 = 12 o'clock, clockwise)
  const hLen = r * 0.55;
  const mLen = r * 0.78;
  const hx = hLen * Math.sin((hourAngle * Math.PI) / 180);
  const hy = -hLen * Math.cos((hourAngle * Math.PI) / 180);
  const mx = mLen * Math.sin((minuteAngle * Math.PI) / 180);
  const my = -mLen * Math.cos((minuteAngle * Math.PI) / 180);

  return (
    <svg style={SVG_STYLE} width={SCENE_W} height={SCENE_H} viewBox={VB} overflow="visible">
      {/* Left wall (2:1 iso ratio) */}
      <path d="M-355 277.5 L-355 37.5 L120 -200 L120 40 Z" fill="var(--wall-left)" stroke="var(--wall-stroke)" strokeWidth="0.5" />
      {/* Right wall (2:1 iso ratio) */}
      <path d="M120 -200 L120 40 L595 277.5 L595 37.5 Z" fill="var(--wall-right)" stroke="var(--wall-stroke)" strokeWidth="0.5" />
      {/* Whiteboard on left wall */}
      <path d="M-100 30 L40 -40 L40 -110 L-100 -40 Z" fill="var(--whiteboard-outer)" stroke="var(--wall-stroke)" strokeWidth="0.8" />
      <path d="M-90 25 L30 -40 L30 -100 L-90 -35 Z" fill="var(--whiteboard-inner)" />
      <path d="M-70 -10 L-20 -35" stroke="rgba(80,184,108,0.2)" strokeWidth="0.8" fill="none" />
      <path d="M-60 0 L0 -30" stroke="rgba(126,184,255,0.15)" strokeWidth="0.8" fill="none" />
      <path d="M-50 10 L10 -20" stroke="rgba(245,166,35,0.15)" strokeWidth="0.6" fill="none" />
      {/* Clock on right wall (skewed to match 2:1 wall angle ~27°) */}
      <g transform="translate(310,-50) skewY(27)">
        <circle cx="0" cy="0" r={R} fill="var(--wall-decor)" stroke="var(--wall-decor-stroke)" strokeWidth="1" />
        <circle cx="0" cy="0" r={r} fill="var(--wall-decor-inner)" />
        {/* Hour ticks */}
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * 30 * Math.PI) / 180;
          const x1 = (r - 2) * Math.sin(a);
          const y1 = -(r - 2) * Math.cos(a);
          const x2 = (r - 5) * Math.sin(a);
          const y2 = -(r - 5) * Math.cos(a);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--wall-decor-stroke)" strokeWidth={i % 3 === 0 ? 1.2 : 0.6} />;
        })}
        {/* Hour hand */}
        <line x1="0" y1="0" x2={hx} y2={hy} stroke="var(--clock-hand)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Minute hand */}
        <line x1="0" y1="0" x2={mx} y2={my} stroke="var(--clock-hand)" strokeWidth="1" strokeLinecap="round" />
        {/* Center dot */}
        <circle cx="0" cy="0" r="1.5" fill="var(--clock-hand)" />
      </g>
      {/* Poster on right wall */}
      <rect x="400" y="-90" width="50" height="65" rx="2" fill="var(--wall-decor)" stroke="var(--border-subtle)" strokeWidth="0.5" transform="skewY(27)" />
    </svg>
  );
}
