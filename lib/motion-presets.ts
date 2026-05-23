/** Shared Motion transitions — keep playful UI consistent */

export const easeOut = [0.22, 1, 0.36, 1] as const;

export const springBouncy = {
  type: "spring" as const,
  stiffness: 420,
  damping: 22,
  mass: 0.8,
};

export const springSnappy = {
  type: "spring" as const,
  stiffness: 520,
  damping: 32,
};

export const springPage = {
  type: "spring" as const,
  stiffness: 380,
  damping: 30,
  mass: 0.9,
};

/** Single overshoot — use with two-value keyframes only */
export const stampPop = {
  type: "spring" as const,
  stiffness: 680,
  damping: 18,
};

/** Multi-step stamp (scale/rotate arrays) — springs support at most two keyframes */
export const stampPopKeyframes = {
  duration: 0.4,
  ease: easeOut,
  times: [0, 0.28, 0.62, 1],
};

export const popIn = {
  duration: 0.38,
  ease: easeOut,
};
