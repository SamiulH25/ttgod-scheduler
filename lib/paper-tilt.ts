/** Stable slight rotation per id so papers look hand-placed on the wall */
export function tiltFromId(id: string, maxDeg = 2.2): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  const t = (h % 1000) / 1000;
  return (t - 0.5) * 2 * maxDeg;
}

export function paperTiltStyle(id: string, maxDeg?: number): React.CSSProperties {
  return { "--paper-tilt": `${tiltFromId(id, maxDeg)}deg` } as React.CSSProperties;
}
