/** In-app route transitions: snappy by default; set NEXT_PUBLIC_PLAYFUL_NAV=1 for full motion */

export function isSnappyNav(): boolean {
  return process.env.NEXT_PUBLIC_PLAYFUL_NAV !== "1";
}
