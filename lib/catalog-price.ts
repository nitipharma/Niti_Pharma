/** Deterministic demo unit price when catalog JSON has no price field. */
export function defaultUnitPriceForProduct(productId: string): number {
  let h = 0
  for (let i = 0; i < productId.length; i++) {
    h = Math.imul(31, h) + productId.charCodeAt(i)
  }
  const x = Math.abs(h) % 50000
  return Math.round((5 + x / 1000) * 100) / 100
}
