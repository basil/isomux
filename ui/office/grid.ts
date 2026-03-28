// Isometric grid layout for 8 desks (2 columns x 4 rows)

export const DESK_SLOTS = [
  { row: 0, col: 0 },
  { row: 0, col: 1 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
  { row: 2, col: 0 },
  { row: 2, col: 1 },
  { row: 3, col: 0 },
  { row: 3, col: 1 },
];

export function isoXY(row: number, col: number) {
  // 2:1 isometric ratio matching walls and floor tiles.
  // 2.5 floor tiles per desk step: (100, 50).
  // Offset centers grid on the floor diamond.
  return {
    x: (col - row) * 100 + 120,
    y: (col + row) * 50 + 50,
  };
}
