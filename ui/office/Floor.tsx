export function Floor() {
  // Floor diamond matches wall bottom edges (2:1 isometric ratio):
  // back=(120,40), left=(-200,200), right=(440,200), front=(120,360)
  const backX = 120, backY = 40;
  const rowDx = -40, rowDy = 20;   // toward left corner, 2:1 ratio
  const colDx = 40, colDy = 20;    // toward right corner, 2:1 ratio
  const N = 8;

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
          fill={light ? "#181e2e" : "#151b28"}
          stroke="rgba(255,255,255,0.018)"
          strokeWidth="0.5"
        />
      );
    }
  }
  return (
    <svg
      style={{ position: "absolute", left: "50%", top: "52%", transform: "translate(-50%,-50%)", pointerEvents: "none" }}
      width="900"
      height="600"
      viewBox="-360 -60 900 600"
      overflow="visible"
    >
      {tiles}
    </svg>
  );
}

export function Walls() {
  return (
    <svg
      style={{ position: "absolute", left: "50%", top: "52%", transform: "translate(-50%,-50%)", pointerEvents: "none" }}
      width="900"
      height="600"
      viewBox="-360 -60 900 600"
      overflow="visible"
    >
      {/* Left wall (2:1 iso ratio) */}
      <path d="M-200 200 L-200 -40 L120 -200 L120 40 Z" fill="#111825" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
      {/* Right wall (2:1 iso ratio) */}
      <path d="M120 -200 L120 40 L440 200 L440 -40 Z" fill="#0f1520" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
      {/* Whiteboard on left wall */}
      <path d="M-100 30 L40 -40 L40 -110 L-100 -40 Z" fill="#1a2236" stroke="rgba(255,255,255,0.05)" strokeWidth="0.8" />
      <path d="M-90 25 L30 -40 L30 -100 L-90 -35 Z" fill="#1e2840" />
      <path d="M-70 -10 L-20 -35" stroke="rgba(80,184,108,0.2)" strokeWidth="0.8" fill="none" />
      <path d="M-60 0 L0 -30" stroke="rgba(126,184,255,0.15)" strokeWidth="0.8" fill="none" />
      <path d="M-50 10 L10 -20" stroke="rgba(245,166,35,0.15)" strokeWidth="0.6" fill="none" />
      {/* Clock on right wall (skewed to match 2:1 wall angle ~27°) */}
      <g transform="translate(310,-90) skewY(27)">
        <circle cx="0" cy="0" r="18" fill="#1a2236" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
        <circle cx="0" cy="0" r="15" fill="#151d2c" />
        <line x1="0" y1="0" x2="0" y2="-10" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        <line x1="0" y1="0" x2="8" y2="4" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
      </g>
      {/* Poster on right wall */}
      <rect x="360" y="-120" width="50" height="65" rx="2" fill="#1a2236" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" transform="skewY(27)" />
    </svg>
  );
}
