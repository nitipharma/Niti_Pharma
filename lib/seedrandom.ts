/** Deterministic pseudo-random from string seed (pure JS, no deps). */

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Seeded RNG for `${dateISO}-${recordId}` style seeds. */
export function seededRandom(seedStr: string): () => number {
  return mulberry32(hashString(seedStr))
}

export function seededInt(seedStr: string, min: number, max: number): number {
  const r = seededRandom(seedStr)()
  return Math.floor(min + r * (max - min + 1))
}

export function seededFloat(seedStr: string, min: number, max: number): number {
  return min + seededRandom(seedStr)() * (max - min)
}
