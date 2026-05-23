/** Stable slight rotation per id so papers look hand-placed on the wall */
export function tiltFromId(id: string, maxDeg = 2.2): number {
  return tiltFromIdWithSalt(id, 0, maxDeg);
}

/** Bulletin stickies use a wider spread so the board feels organic */
export function bulletinTiltFromId(id: string): number {
  return tiltFromIdWithSalt(id, 17, 4.5);
}

function tiltFromIdWithSalt(id: string, salt: number, maxDeg: number): number {
  let h = salt;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  const t = (h % 1000) / 1000;
  return (t - 0.5) * 2 * maxDeg;
}
