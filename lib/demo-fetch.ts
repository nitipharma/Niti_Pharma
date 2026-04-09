/** Artificial delay for demo API calls (400–800ms). */
export function demoDelay(): Promise<void> {
  const ms = 400 + Math.random() * 400
  return new Promise((resolve) => setTimeout(resolve, ms))
}
